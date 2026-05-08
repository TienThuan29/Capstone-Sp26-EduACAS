import '../../../../core/network/api_network.dart';
import '../../../../core/storage/token_storage.dart';

class StudentDashboardOverview {
  final String classId;
  final String className;
  final double averageScore;
  final double classAverage;
  final int myRank;
  final int totalStudents;
  final double percentile;
  final String trend;
  final int totalExams;
  final int submittedExams;
  final double submissionRate;
  final int totalWarnings;
  final int unreadWarnings;

  StudentDashboardOverview({
    required this.classId,
    required this.className,
    required this.averageScore,
    required this.classAverage,
    required this.myRank,
    required this.totalStudents,
    required this.percentile,
    required this.trend,
    required this.totalExams,
    required this.submittedExams,
    required this.submissionRate,
    required this.totalWarnings,
    required this.unreadWarnings,
  });

  factory StudentDashboardOverview.fromJson(Map<String, dynamic> json) {
    return StudentDashboardOverview(
      classId: json['classId'] ?? '',
      className: json['className'] ?? '',
      averageScore: (json['averageScore'] ?? 0).toDouble(),
      classAverage: (json['classAverage'] ?? 0).toDouble(),
      myRank: json['myRank'] ?? 0,
      totalStudents: json['totalStudents'] ?? 0,
      percentile: (json['percentile'] ?? 0).toDouble(),
      trend: json['trend'] ?? 'stable',
      totalExams: json['totalExams'] ?? 0,
      submittedExams: json['submittedExams'] ?? 0,
      submissionRate: (json['submissionRate'] ?? 0).toDouble(),
      totalWarnings: json['totalWarnings'] ?? 0,
      unreadWarnings: json['unreadWarnings'] ?? 0,
    );
  }
}

class StudentExamScore {
  final String examId;
  final String examName;
  final String mode;
  final double totalMark;
  final double score;
  final double classAverage;
  final String status;
  final DateTime? submittedAt;
  final int version;
  final int rank;

  StudentExamScore({
    required this.examId,
    required this.examName,
    required this.mode,
    required this.totalMark,
    required this.score,
    required this.classAverage,
    required this.status,
    this.submittedAt,
    required this.version,
    required this.rank,
  });

  factory StudentExamScore.fromJson(Map<String, dynamic> json) {
    return StudentExamScore(
      examId: json['examId'] ?? '',
      examName: json['examName'] ?? '',
      mode: json['mode'] ?? '',
      totalMark: (json['totalMark'] ?? 0).toDouble(),
      score: (json['score'] ?? 0).toDouble(),
      classAverage: (json['classAverage'] ?? 0).toDouble(),
      status: json['status'] ?? '',
      submittedAt: json['submittedAt'] != null ? DateTime.parse(json['submittedAt']) : null,
      version: json['version'] ?? 1,
      rank: json['rank'] ?? 0,
    );
  }
}

class StudentWarning {
  final String warningId;
  final String className;
  final int warningLevel;
  final String reason;
  final DateTime createdAt;
  final bool isRead;
  final double? scoreAtTime;

  StudentWarning({
    required this.warningId,
    required this.className,
    required this.warningLevel,
    required this.reason,
    required this.createdAt,
    required this.isRead,
    this.scoreAtTime,
  });

  factory StudentWarning.fromJson(Map<String, dynamic> json) {
    return StudentWarning(
      warningId: json['warningId'] ?? '',
      className: json['className'] ?? '',
      warningLevel: json['warningLevel'] ?? 1,
      reason: json['reason'] ?? '',
      createdAt: DateTime.parse(json['createdAt'] ?? DateTime.now().toIso8601String()),
      isRead: json['isRead'] ?? false,
      scoreAtTime: json['scoreAtTime']?.toDouble(),
    );
  }
}

class StudentScoreTrend {
  final String examId;
  final String examName;
  final double score;
  final DateTime submittedAt;

  StudentScoreTrend({
    required this.examId,
    required this.examName,
    required this.score,
    required this.submittedAt,
  });

  factory StudentScoreTrend.fromJson(Map<String, dynamic> json) {
    return StudentScoreTrend(
      examId: json['examId'] ?? '',
      examName: json['examName'] ?? '',
      score: (json['score'] ?? 0).toDouble(),
      submittedAt: DateTime.parse(json['submittedAt'] ?? DateTime.now().toIso8601String()),
    );
  }
}

class StudentSubmissionStats {
  final String classId;
  final String className;
  final int totalExams;
  final int submittedExams;
  final double submissionRate;
  final DateTime? latestSubmissionTime;
  final bool isLate;

  StudentSubmissionStats({
    required this.classId,
    required this.className,
    required this.totalExams,
    required this.submittedExams,
    required this.submissionRate,
    this.latestSubmissionTime,
    required this.isLate,
  });

  factory StudentSubmissionStats.fromJson(Map<String, dynamic> json) {
    return StudentSubmissionStats(
      classId: json['classId'] ?? '',
      className: json['className'] ?? '',
      totalExams: json['totalExams'] ?? 0,
      submittedExams: json['submittedExams'] ?? 0,
      submissionRate: (json['submissionRate'] ?? 0).toDouble(),
      latestSubmissionTime: json['latestSubmissionTime'] != null ? DateTime.parse(json['latestSubmissionTime']) : null,
      isLate: json['isLate'] ?? false,
    );
  }
}

class StudentDashboardData {
  final StudentDashboardOverview overview;
  final List<StudentExamScore> examScores;
  final List<StudentWarning> warnings;
  final List<StudentScoreTrend> scoreTrend;
  final StudentSubmissionStats? submissionStats;

  StudentDashboardData({
    required this.overview,
    required this.examScores,
    required this.warnings,
    required this.scoreTrend,
    this.submissionStats,
  });
}

class StudentDashboardService {
  static Future<StudentDashboardData> getStudentDashboardData(String classroomId) async {
    try {
      final token = await TokenStorage.getAccessToken();
      final userId = await TokenStorage.getUserId();
      if (token == null || userId == null) throw 'Authentication information missing';

      final queryParams = {'studentId': userId};

      final results = await Future.wait([
        ApiNetwork.getWithAuth(
          endpoint: ApiConfig.studentDashboardOverviewEndpoint(classroomId),
          token: token,
          queryParameters: queryParams,
        ),
        ApiNetwork.getWithAuth(
          endpoint: ApiConfig.studentDashboardExamScoresEndpoint(classroomId),
          token: token,
          queryParameters: queryParams,
        ),
        ApiNetwork.getWithAuth(
          endpoint: ApiConfig.studentDashboardWarningsEndpoint(classroomId),
          token: token,
          queryParameters: {...queryParams, 'limit': '5'},
        ),
        ApiNetwork.getWithAuth(
          endpoint: ApiConfig.studentDashboardScoreTrendEndpoint(classroomId),
          token: token,
          queryParameters: queryParams,
        ),
        ApiNetwork.getWithAuth(
          endpoint: ApiConfig.studentDashboardSubmissionStatsEndpoint(classroomId),
          token: token,
          queryParameters: queryParams,
        ),
      ]);

      return StudentDashboardData(
        overview: StudentDashboardOverview.fromJson(results[0]['dataResponse'] ?? {}),
        examScores: (results[1]['dataResponse'] as List? ?? [])
            .map((e) => StudentExamScore.fromJson(e))
            .toList(),
        warnings: (results[2]['dataResponse'] as List? ?? [])
            .map((e) => StudentWarning.fromJson(e))
            .toList(),
        scoreTrend: (results[3]['dataResponse'] as List? ?? [])
            .map((e) => StudentScoreTrend.fromJson(e))
            .toList(),
        submissionStats: results[4]['dataResponse'] != null 
            ? StudentSubmissionStats.fromJson(results[4]['dataResponse']) 
            : null,
      );
    } catch (e) {
      throw 'Failed to load student dashboard: $e';
    }
  }
}

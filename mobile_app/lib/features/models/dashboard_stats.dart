class DashboardOverview {
  final int totalStudents;
  final double classAverage;
  final int atRiskCount;
  final double atRiskPercentage;
  final int totalWarnings;
  final int newWarningsToday;

  DashboardOverview({
    required this.totalStudents,
    required this.classAverage,
    required this.atRiskCount,
    required this.atRiskPercentage,
    required this.totalWarnings,
    required this.newWarningsToday,
  });

  factory DashboardOverview.empty() {
    return DashboardOverview(
      totalStudents: 0,
      classAverage: 0,
      atRiskCount: 0,
      atRiskPercentage: 0,
      totalWarnings: 0,
      newWarningsToday: 0,
    );
  }

  factory DashboardOverview.fromJson(Map<String, dynamic> json) {
    return DashboardOverview(
      totalStudents: json['totalStudents'] ?? 0,
      classAverage: (json['classAverage'] ?? 0).toDouble(),
      atRiskCount: json['atRiskCount'] ?? 0,
      atRiskPercentage: (json['atRiskPercentage'] ?? 0).toDouble(),
      totalWarnings: json['totalWarnings'] ?? 0,
      newWarningsToday: json['newWarningsToday'] ?? 0,
    );
  }
}

class ScoreDistribution {
  final String range;
  final int count;
  final double percentage;

  ScoreDistribution({
    required this.range,
    required this.count,
    required this.percentage,
  });

  factory ScoreDistribution.fromJson(Map<String, dynamic> json) {
    return ScoreDistribution(
      range: json['range'] ?? '',
      count: json['count'] ?? 0,
      percentage: (json['percentage'] ?? 0).toDouble(),
    );
  }
}

class AtRiskStudent {
  final String studentId;
  final String studentName;
  final String? avatarUrl;
  final double averageScore;
  final int warningLevel;
  final String trend;

  AtRiskStudent({
    required this.studentId,
    required this.studentName,
    this.avatarUrl,
    required this.averageScore,
    required this.warningLevel,
    required this.trend,
  });

  factory AtRiskStudent.fromJson(Map<String, dynamic> json) {
    return AtRiskStudent(
      studentId: json['studentId'] ?? '',
      studentName: json['studentName'] ?? '',
      avatarUrl: json['avatarUrl'],
      averageScore: (json['averageScore'] ?? 0).toDouble(),
      warningLevel: json['warningLevel'] ?? 0,
      trend: json['trend'] ?? 'stable',
    );
  }
}

class RecentWarning {
  final String warningId;
  final String studentName;
  final String className;
  final int warningLevel;
  final String message;
  final DateTime createdAt;
  final bool isRead;

  RecentWarning({
    required this.warningId,
    required this.studentName,
    required this.className,
    required this.warningLevel,
    required this.message,
    required this.createdAt,
    required this.isRead,
  });

  factory RecentWarning.fromJson(Map<String, dynamic> json) {
    return RecentWarning(
      warningId: json['warningId'] ?? '',
      studentName: json['studentName'] ?? '',
      className: json['className'] ?? '',
      warningLevel: json['warningLevel'] ?? 0,
      message: json['message'] ?? '',
      createdAt: DateTime.parse(json['createdAt'] ?? DateTime.now().toIso8601String()),
      isRead: json['isRead'] ?? false,
    );
  }
}

class ExamScoreStatistics {
  final String examId;
  final String examName;
  final String mode;
  final double totalMark;
  final double averageScore;
  final double highestScore;
  final double lowestScore;
  final double medianScore;
  final int totalSubmissions;
  final int totalStudents;
  final double submissionRate;
  final double passRate;
  final List<ScoreDistribution> scoreDistribution;

  ExamScoreStatistics({
    required this.examId,
    required this.examName,
    required this.mode,
    required this.totalMark,
    required this.averageScore,
    required this.highestScore,
    required this.lowestScore,
    required this.medianScore,
    required this.totalSubmissions,
    required this.totalStudents,
    required this.submissionRate,
    required this.passRate,
    required this.scoreDistribution,
  });

  factory ExamScoreStatistics.fromJson(Map<String, dynamic> json) {
    return ExamScoreStatistics(
      examId: json['examId'] ?? '',
      examName: json['examName'] ?? '',
      mode: json['mode'] ?? '',
      totalMark: (json['totalMark'] ?? 0).toDouble(),
      averageScore: (json['averageScore'] ?? 0).toDouble(),
      highestScore: (json['highestScore'] ?? 0).toDouble(),
      lowestScore: (json['lowestScore'] ?? 0).toDouble(),
      medianScore: (json['medianScore'] ?? 0).toDouble(),
      totalSubmissions: json['totalSubmissions'] ?? 0,
      totalStudents: json['totalStudents'] ?? 0,
      submissionRate: (json['submissionRate'] ?? 0).toDouble(),
      passRate: (json['passRate'] ?? 0).toDouble(),
      scoreDistribution: (json['scoreDistribution'] as List? ?? [])
          .map((e) => ScoreDistribution.fromJson(e))
          .toList(),
    );
  }
}

class QuizScoreStatistics {
  final String quizId;
  final String classroomQuizId;
  final String quizTitle;
  final double averageScore;
  final double highestScore;
  final double lowestScore;
  final double medianScore;
  final int totalSubmissions;
  final int totalStudents;
  final int totalAttempts;
  final double submissionRate;
  final double passRate;
  final List<ScoreDistribution> scoreDistribution;

  QuizScoreStatistics({
    required this.quizId,
    required this.classroomQuizId,
    required this.quizTitle,
    required this.averageScore,
    required this.highestScore,
    required this.lowestScore,
    required this.medianScore,
    required this.totalSubmissions,
    required this.totalStudents,
    required this.totalAttempts,
    required this.submissionRate,
    required this.passRate,
    required this.scoreDistribution,
  });

  factory QuizScoreStatistics.fromJson(Map<String, dynamic> json) {
    return QuizScoreStatistics(
      quizId: json['quizId'] ?? '',
      classroomQuizId: json['classroomQuizId'] ?? '',
      quizTitle: json['quizTitle'] ?? '',
      averageScore: (json['averageScore'] ?? 0).toDouble(),
      highestScore: (json['highestScore'] ?? 0).toDouble(),
      lowestScore: (json['lowestScore'] ?? 0).toDouble(),
      medianScore: (json['medianScore'] ?? 0).toDouble(),
      totalSubmissions: json['totalSubmissions'] ?? 0,
      totalStudents: json['totalStudents'] ?? 0,
      totalAttempts: json['totalAttempts'] ?? 0,
      submissionRate: (json['submissionRate'] ?? 0).toDouble(),
      passRate: (json['passRate'] ?? 0).toDouble(),
      scoreDistribution: (json['scoreDistribution'] as List? ?? [])
          .map((e) => ScoreDistribution.fromJson(e))
          .toList(),
    );
  }
}

class ClassroomDashboardData {
  final DashboardOverview overview;
  final List<ScoreDistribution> scoreDistribution;
  final List<AtRiskStudent> atRiskStudents;
  final List<RecentWarning> recentWarnings;
  final List<ExamScoreStatistics> examStatistics;
  final List<QuizScoreStatistics> quizStatistics;

  ClassroomDashboardData({
    required this.overview,
    required this.scoreDistribution,
    required this.atRiskStudents,
    required this.recentWarnings,
    required this.examStatistics,
    required this.quizStatistics,
  });
}

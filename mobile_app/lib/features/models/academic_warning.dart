// Lightweight warning item returned by the student-dashboard/warnings list endpoint.
class StudentWarning {
  final String warningId;
  final String className;
  final int warningLevel;
  final String reason;
  final String message;
  final DateTime? createdAt;
  final bool isRead;
  final double? scoreAtTime;

  const StudentWarning({
    required this.warningId,
    required this.className,
    required this.warningLevel,
    required this.reason,
    required this.message,
    this.createdAt,
    required this.isRead,
    this.scoreAtTime,
  });

  factory StudentWarning.fromJson(Map<String, dynamic> json) {
    return StudentWarning(
      warningId: json['warningId'] ?? '',
      className: json['className'] ?? '',
      warningLevel: json['warningLevel'] ?? 1,
      reason: json['reason'] ?? '',
      message: json['message'] ?? '',
      createdAt:
          json['createdAt'] != null ? DateTime.tryParse(json['createdAt']) : null,
      isRead: json['isRead'] ?? false,
      scoreAtTime: json['scoreAtTime'] != null
          ? (json['scoreAtTime'] as num).toDouble()
          : null,
    );
  }

  StudentWarning copyWith({bool? isRead}) {
    return StudentWarning(
      warningId: warningId,
      className: className,
      warningLevel: warningLevel,
      reason: reason,
      message: message,
      createdAt: createdAt,
      isRead: isRead ?? this.isRead,
      scoreAtTime: scoreAtTime,
    );
  }
}

// Full warning detail returned by the /academic-warnings/{id} endpoint.
class WarningDetail {
  final String id;
  final String classroomId;
  final String studentId;
  final int warningLevel;
  final String triggerType;
  final DateTime sentDate;
  final DateTime createdDate;
  final DateTime updatedDate;
  final bool isRead;
  final WarningInvolvedExams? involvedExams;
  final Map<String, WarningAnalysisEntry> llmAnalysis;
  final Map<String, WarningAnalysisEntry> lecturerAnalysis;

  const WarningDetail({
    required this.id,
    required this.classroomId,
    required this.studentId,
    required this.warningLevel,
    required this.triggerType,
    required this.sentDate,
    required this.createdDate,
    required this.updatedDate,
    required this.isRead,
    this.involvedExams,
    this.llmAnalysis = const {},
    this.lecturerAnalysis = const {},
  });

  factory WarningDetail.fromJson(Map<String, dynamic> json) {
    return WarningDetail(
      id: json['id'] ?? '',
      classroomId: json['classroomId'] ?? '',
      studentId: json['studentId'] ?? '',
      warningLevel: json['warningLevel'] ?? 1,
      triggerType: json['triggerType'] ?? '',
      sentDate:
          DateTime.tryParse(json['sentDate'] ?? '') ?? DateTime.now(),
      createdDate:
          DateTime.tryParse(json['createdDate'] ?? '') ?? DateTime.now(),
      updatedDate:
          DateTime.tryParse(json['updatedDate'] ?? '') ?? DateTime.now(),
      isRead: json['isRead'] ?? false,
      involvedExams: json['involvedExams'] != null
          ? WarningInvolvedExams.fromJson(json['involvedExams'])
          : null,
      llmAnalysis: _parseAnalysisMap(json['llmAnalysis']),
      lecturerAnalysis: _parseAnalysisMap(json['lecturerAnalysis']),
    );
  }

  static Map<String, WarningAnalysisEntry> _parseAnalysisMap(dynamic raw) {
    if (raw == null) return {};
    if (raw is! Map) return {};
    return (raw as Map<String, dynamic>).map(
      (key, value) => MapEntry(key, WarningAnalysisEntry.fromJson(value)),
    );
  }
}

class WarningInvolvedExams {
  // Backend sends examScores as Dictionary<string, float> (examId -> score).
  // We convert to a list for easier UI rendering.
  final List<WarningExamScore> examScores;
  final double averageScore;

  const WarningInvolvedExams({
    required this.examScores,
    required this.averageScore,
  });

  factory WarningInvolvedExams.fromJson(Map<String, dynamic> json) {
    final rawScores = json['examScores'] as Map<String, dynamic>? ?? {};
    return WarningInvolvedExams(
      examScores: rawScores.entries.map((e) {
        return WarningExamScore(
          examId: e.key,
          score: (e.value as num).toDouble(),
        );
      }).toList(),
      averageScore: (json['averageScore'] ?? 0).toDouble(),
    );
  }
}

class WarningExamScore {
  final String examId;
  final String examName;
  final double score;
  final double maxScore;
  final DateTime? examDate;

  const WarningExamScore({
    required this.examId,
    this.examName = '',
    required this.score,
    this.maxScore = 10,
    this.examDate,
  });
}

class WarningAnalysisEntry {
  final String submissionId;
  final String analysis;
  final String recommendation;

  const WarningAnalysisEntry({
    required this.submissionId,
    required this.analysis,
    required this.recommendation,
  });

  factory WarningAnalysisEntry.fromJson(Map<String, dynamic> json) {
    return WarningAnalysisEntry(
      submissionId: json['submissionId'] ?? '',
      analysis: json['analysis'] ?? '',
      recommendation: json['recomendation'] ?? json['recommendation'] ?? '',
    );
  }
}

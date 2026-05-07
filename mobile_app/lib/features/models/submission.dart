class Submission {
  final String id;
  final String studentId;
  final String examId;
  final String problemId;
  final String? problemTitle;
  final int version;
  final double? finalScore;
  final String status;
  final DateTime? submittedDate;
  final Map<String, dynamic> rawData;

  const Submission({
    required this.id,
    required this.studentId,
    required this.examId,
    required this.problemId,
    required this.problemTitle,
    required this.version,
    required this.finalScore,
    required this.status,
    required this.submittedDate,
    this.rawData = const {},
  });

  factory Submission.fromJson(Map<String, dynamic> json) {
    return Submission(
      id: (json['id'] ?? '').toString(),
      studentId: (json['studentId'] ?? '').toString(),
      examId: (json['examId'] ?? '').toString(),
      problemId: (json['problemId'] ?? '').toString(),
      problemTitle: _extractProblemTitle(json),
      version: (json['version'] as num?)?.toInt() ?? 1,
      finalScore: (json['finalScore'] as num?)?.toDouble(),
      status: (json['status'] ?? '').toString(),
      submittedDate: DateTime.tryParse((json['submittedDate'] ?? '').toString())?.toUtc(),
      rawData: Map<String, dynamic>.from(json),
    );
  }

  static String? _extractProblemTitle(Map<String, dynamic> json) {
    final direct = json['problemTitle']?.toString();
    if (direct != null && direct.trim().isNotEmpty) {
      return direct.trim();
    }

    final nested = json['problem'];
    if (nested is Map<String, dynamic>) {
      final title = nested['title']?.toString();
      if (title != null && title.trim().isNotEmpty) {
        return title.trim();
      }
    }

    return null;
  }
}

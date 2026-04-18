class Subject {
  final String id;
  final String subjectCode;
  final String subjectName;
  final bool isDeleted;

  Subject({
    required this.id,
    required this.subjectCode,
    required this.subjectName,
    required this.isDeleted,
  });

  factory Subject.fromJson(Map<String, dynamic> json) {
    return Subject(
      id: json['id'] ?? '',
      subjectCode: json['subjectCode'] ?? '',
      subjectName: json['subjectName'] ?? '',
      isDeleted: json['isDeleted'] == true,
    );
  }
}

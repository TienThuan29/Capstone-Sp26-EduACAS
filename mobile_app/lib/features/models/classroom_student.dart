class ClassroomStudentResponse {
  final String studentId;
  final String fullname;
  final String email;
  final String? roleNumber;
  final bool isJoining;

  const ClassroomStudentResponse({
    required this.studentId,
    required this.fullname,
    required this.email,
    this.roleNumber,
    required this.isJoining,
  });

  factory ClassroomStudentResponse.fromJson(Map<String, dynamic> json) {
    // Backend might return student object nested or fields directly
    final student = json['student'] as Map<String, dynamic>?;
    
    return ClassroomStudentResponse(
      studentId: (student?['id'] ?? json['studentId'] ?? '').toString(),
      fullname: (student?['fullname'] ?? json['fullname'] ?? '').toString(),
      email: (student?['email'] ?? json['email'] ?? '').toString(),
      roleNumber: (student?['roleNumber'] ?? json['roleNumber'])?.toString(),
      isJoining: json['isJoining'] ?? true,
    );
  }
}

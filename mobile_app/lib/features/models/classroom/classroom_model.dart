class EnrollmentInfo {
  final bool isJoining;
  final DateTime? joinedDate;
  final DateTime? movedOutDate;

  EnrollmentInfo({
    required this.isJoining,
    this.joinedDate,
    this.movedOutDate,
  });

  factory EnrollmentInfo.fromJson(Map<String, dynamic> json) {
    return EnrollmentInfo(
      isJoining: json['isJoining'] ?? false,
      joinedDate: json['joinedDate'] != null
          ? DateTime.tryParse(json['joinedDate'])
          : null,
      movedOutDate: json['movedOutDate'] != null
          ? DateTime.tryParse(json['movedOutDate'])
          : null,
    );
  }
}

class SubjectLite {
  final String id;
  final String subjectName;

  SubjectLite({required this.id, required this.subjectName});

  factory SubjectLite.fromJson(Map<String, dynamic> json) {
    return SubjectLite(
      id: json['subjectId'] ?? '',
      subjectName: json['subjectName'] ?? '',
    );
  }
}

class LecturerLite {
  final String id;
  final String fullname;
  final String email;
  final String avatarUrl;

  LecturerLite({
    required this.id,
    required this.fullname,
    required this.email,
    required this.avatarUrl,
  });

  factory LecturerLite.fromJson(Map<String, dynamic> json) {
    return LecturerLite(
      id: json['id'] ?? '',
      fullname: json['fullname'] ?? '',
      email: json['email'] ?? '',
      avatarUrl: json['avatarUrl'] ?? '',
    );
  }
}

class ClassroomModel {
  final String id;
  final String classCode;
  final String className;
  final LecturerLite lecturer;
  final SubjectLite subject;
  final String semesterName;
  final String enrolKey;
  final DateTime createdDate;
  final DateTime? updatedDate;
  final DateTime endDate;
  final bool isDeleted;
  final int maxSlot;
  final EnrollmentInfo enrollment;

  ClassroomModel({
    required this.id,
    required this.classCode,
    required this.className,
    required this.lecturer,
    required this.subject,
    required this.semesterName,
    required this.enrolKey,
    required this.createdDate,
    this.updatedDate,
    required this.endDate,
    required this.isDeleted,
    required this.maxSlot,
    required this.enrollment,
  });

  factory ClassroomModel.fromJson(Map<String, dynamic> json) {
    return ClassroomModel(
      id: json['id'] ?? '',
      classCode: json['classCode'] ?? '',
      className: json['className'] ?? '',
      lecturer: LecturerLite.fromJson(json['lecturer'] ?? {}),
      subject: SubjectLite.fromJson(json['subject'] ?? {}),
      semesterName: json['semesterName'] ?? '',
      enrolKey: json['enrolKey'] ?? '',
      createdDate: DateTime.tryParse(json['createdDate'] ?? '') ?? DateTime.now(),
      updatedDate: json['updatedDate'] != null
          ? DateTime.tryParse(json['updatedDate'])
          : null,
      endDate: DateTime.tryParse(json['endDate'] ?? '') ?? DateTime.now(),
      isDeleted: json['isDeleted'] ?? false,
      maxSlot: json['maxSlot'] ?? 0,
      enrollment: EnrollmentInfo.fromJson(json['enrollment'] ?? {}),
    );
  }
}

class PagedClassrooms {
  final List<ClassroomModel> items;
  final int totalCount;
  final int pageIndex;
  final int pageSize;
  final int totalPages;
  final bool hasPreviousPage;
  final bool hasNextPage;

  PagedClassrooms({
    required this.items,
    required this.totalCount,
    required this.pageIndex,
    required this.pageSize,
    required this.totalPages,
    required this.hasPreviousPage,
    required this.hasNextPage,
  });

  factory PagedClassrooms.fromJson(Map<String, dynamic> json) {
    final rawItems = json['items'] as List<dynamic>? ?? [];
    return PagedClassrooms(
      items: rawItems
          .map((item) => ClassroomModel.fromJson(item as Map<String, dynamic>))
          .toList(),
      totalCount: json['totalCount'] ?? 0,
      pageIndex: json['pageIndex'] ?? 1,
      pageSize: json['pageSize'] ?? 10,
      totalPages: json['totalPages'] ?? 0,
      hasPreviousPage: json['hasPreviousPage'] ?? false,
      hasNextPage: json['hasNextPage'] ?? false,
    );
  }
}

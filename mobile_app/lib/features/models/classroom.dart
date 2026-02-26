class Classroom {
  final String id;
  final String className;
  final String classCode;
  final String? subjectId;
  final String? subjectName;
  final String lecturerId;
  final String? lecturerName;
  final String? lecturerEmail;
  final String? semesterName;
  final String? enrolKey;
  final int? maxSlot;
  final bool? isDeleted;
  final String? createdDate;
  final String? updatedDate;
  final String? endDate;

  Classroom({
    required this.id,
    required this.className,
    required this.classCode,
    this.subjectId,
    this.subjectName,
    required this.lecturerId,
    this.lecturerName,
    this.lecturerEmail,
    this.semesterName,
    this.enrolKey,
    this.maxSlot,
    this.isDeleted,
    this.createdDate,
    this.updatedDate,
    this.endDate,
  });

  factory Classroom.fromJson(Map<String, dynamic> json) {
    // Backend returns nested 'lecturer' and 'subject' objects
    final lecturer = json['lecturer'] as Map<String, dynamic>?;
    final subject = json['subject'] as Map<String, dynamic>?;

    return Classroom(
      id: json['id'] ?? '',
      className: json['className'] ?? '',
      classCode: json['classCode'] ?? '',
      subjectId: subject?['subjectId'] ?? json['subjectId'],
      subjectName: subject?['subjectName'] ?? json['subjectName'],
      lecturerId: lecturer?['id'] ?? json['lecturerId'] ?? '',
      lecturerName: lecturer?['fullname'] ?? json['lecturerName'],
      lecturerEmail: lecturer?['email'] ?? json['lecturerEmail'],
      semesterName: json['semesterName'],
      enrolKey: json['enrolKey'],
      maxSlot: json['maxSlot'],
      isDeleted: json['isDeleted'],
      createdDate: json['createdDate'],
      updatedDate: json['updatedDate'],
      endDate: json['endDate'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'className': className,
      'classCode': classCode,
      'subjectId': subjectId,
      'subjectName': subjectName,
      'lecturerId': lecturerId,
      'lecturerName': lecturerName,
      'lecturerEmail': lecturerEmail,
      'semesterName': semesterName,
      'enrolKey': enrolKey,
      'maxSlot': maxSlot,
      'isDeleted': isDeleted,
      'createdDate': createdDate,
      'updatedDate': updatedDate,
      'endDate': endDate,
    };
  }
}

class ClassroomLite {
  final String id;
  final String className;

  ClassroomLite({
    required this.id,
    required this.className,
  });

  factory ClassroomLite.fromJson(Map<String, dynamic> json) {
    return ClassroomLite(
      id: json['id'] ?? '',
      className: json['className'] ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'className': className,
    };
  }
}

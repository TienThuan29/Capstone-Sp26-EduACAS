class Classroom {
  final String id;
  final String className;
  final String classCode;
  final String? subjectId;
  final String? subjectName;
  final String lecturerId;
  final String? lecturerName;
  final String? lecturerEmail;
  final int? totalStudents;
  final bool? isDeleted;
  final String? createdDate;
  final String? updatedDate;

  Classroom({
    required this.id,
    required this.className,
    required this.classCode,
    this.subjectId,
    this.subjectName,
    required this.lecturerId,
    this.lecturerName,
    this.lecturerEmail,
    this.totalStudents,
    this.isDeleted,
    this.createdDate,
    this.updatedDate,
  });

  factory Classroom.fromJson(Map<String, dynamic> json) {
    return Classroom(
      id: json['id'] ?? '',
      className: json['className'] ?? '',
      classCode: json['classCode'] ?? '',
      subjectId: json['subjectId'],
      subjectName: json['subjectName'],
      lecturerId: json['lecturerId'] ?? '',
      lecturerName: json['lecturerName'],
      lecturerEmail: json['lecturerEmail'],
      totalStudents: json['totalStudents'],
      isDeleted: json['isDeleted'],
      createdDate: json['createdDate'],
      updatedDate: json['updatedDate'],
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
      'totalStudents': totalStudents,
      'isDeleted': isDeleted,
      'createdDate': createdDate,
      'updatedDate': updatedDate,
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

class Material {
  final String id;
  final String lecturerId;
  final String classroomId;
  final String filename;
  final String fileUrl;
  final String description;
  final bool isDeleted;
  final String createdDate;

  Material({
    required this.id,
    required this.lecturerId,
    required this.classroomId,
    required this.filename,
    required this.fileUrl,
    required this.description,
    required this.isDeleted,
    required this.createdDate,
  });

  factory Material.fromJson(Map<String, dynamic> json) {
    return Material(
      id: json['id'] ?? '',
      lecturerId: json['lecturerId'] ?? '',
      classroomId: json['classroomId'] ?? '',
      filename: json['filename'] ?? '',
      fileUrl: json['fileUrl'] ?? '',
      description: json['description'] ?? '',
      isDeleted: json['isDeleted'] ?? false,
      createdDate: json['createdDate'] ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'lecturerId': lecturerId,
      'classroomId': classroomId,
      'filename': filename,
      'fileUrl': fileUrl,
      'description': description,
      'isDeleted': isDeleted,
      'createdDate': createdDate,
    };
  }
}

class ApiResponse<T> {
  final bool success;
  final String message;
  final T? dataResponse;

  ApiResponse({
    required this.success,
    required this.message,
    this.dataResponse,
  });

  factory ApiResponse.fromJson(
    Map<String, dynamic> json,
    T Function(dynamic)? fromJsonT,
  ) {
    return ApiResponse(
      success: json['success'] ?? false,
      message: json['message'] ?? '',
      dataResponse: fromJsonT != null && json['dataResponse'] != null
          ? fromJsonT(json['dataResponse'])
          : null,
    );
  }
}

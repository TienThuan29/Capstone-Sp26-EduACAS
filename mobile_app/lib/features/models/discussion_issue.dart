class DiscussionIssue {
  final String id;
  final String classroomId;
  final String title;
  final String authorId;
  final String authorName;
  final String content;
  final List<String> imagesName;
  final List<String> filesName;
  final bool isDeleted;
  final DateTime createdDate;
  final DateTime updatedDate;
  final int commentCount;

  DiscussionIssue({
    required this.id,
    required this.classroomId,
    required this.title,
    required this.authorId,
    this.authorName = '',
    required this.content,
    this.imagesName = const [],
    this.filesName = const [],
    this.isDeleted = false,
    required this.createdDate,
    required this.updatedDate,
    this.commentCount = 0,
  });

  factory DiscussionIssue.fromJson(Map<String, dynamic> json) {
    return DiscussionIssue(
      id: json['id'] ?? '',
      classroomId: json['classroomId'] ?? '',
      title: json['title'] ?? '',
      authorId: json['authorId'] ?? '',
      authorName: json['authorName'] ?? '',
      content: json['content'] ?? '',
      imagesName: List<String>.from(json['imagesName'] ?? []),
      filesName: List<String>.from(json['filesName'] ?? []),
      isDeleted: json['isDeleted'] ?? false,
      createdDate:
          DateTime.tryParse(json['createdDate'] ?? '') ?? DateTime.now(),
      updatedDate:
          DateTime.tryParse(json['updatedDate'] ?? '') ?? DateTime.now(),
      commentCount: json['commentCount'] ?? 0,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'classroomId': classroomId,
        'title': title,
        'authorId': authorId,
        'content': content,
        'imagesName': imagesName,
        'filesName': filesName,
      };
}

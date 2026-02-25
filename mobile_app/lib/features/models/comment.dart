class Comment {
  final String id;
  final String discussionIssueId;
  final String authorId;
  final String authorName;
  final String content;
  final List<String> imagesName;
  final List<String> filesName;
  final bool isDeleted;
  final DateTime createdDate;
  final DateTime updatedDate;

  Comment({
    required this.id,
    required this.discussionIssueId,
    required this.authorId,
    this.authorName = '',
    required this.content,
    this.imagesName = const [],
    this.filesName = const [],
    this.isDeleted = false,
    required this.createdDate,
    required this.updatedDate,
  });

  factory Comment.fromJson(Map<String, dynamic> json) {
    return Comment(
      id: json['id'] ?? '',
      discussionIssueId: json['discussionIssueId'] ?? '',
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
    );
  }
}

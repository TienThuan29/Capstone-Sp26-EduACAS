import 'package:mobile/features/models/author_display.dart';

class Comment {
  final String id;
  final String issueId;
  final String authorId;
  final AuthorDisplay? authorDisplay;
  final String content;
  final List<String> attachments;
  final int upVoteCount;
  final List<Comment> replies;
  final bool isDeleted;
  final DateTime createdDate;
  final DateTime updatedDate;

  Comment({
    required this.id,
    this.issueId = '',
    required this.authorId,
    this.authorDisplay,
    required this.content,
    this.attachments = const [],
    this.upVoteCount = 0,
    this.replies = const [],
    this.isDeleted = false,
    required this.createdDate,
    required this.updatedDate,
  });

  /// Display name: use authorDisplay.fullName if available, fallback to authorId
  String get displayName => authorDisplay?.fullName ?? authorId;

  factory Comment.fromJson(Map<String, dynamic> json) {
    return Comment(
      id: json['id'] ?? '',
      issueId: json['issueId'] ?? '',
      authorId: json['authorId'] ?? '',
      authorDisplay: json['authorDisplay'] != null
          ? AuthorDisplay.fromJson(json['authorDisplay'])
          : null,
      content: json['content'] ?? '',
      attachments: List<String>.from(json['attachments'] ?? []),
      upVoteCount: json['upVoteCount'] ?? 0,
      replies: (json['replies'] as List<dynamic>?)
              ?.map((r) => Comment.fromJson(r as Map<String, dynamic>))
              .toList() ??
          [],
      isDeleted: json['isDeleted'] ?? false,
      createdDate:
          DateTime.tryParse(json['createdDate'] ?? '') ?? DateTime.now(),
      updatedDate:
          DateTime.tryParse(json['updatedDate'] ?? '') ?? DateTime.now(),
    );
  }
}

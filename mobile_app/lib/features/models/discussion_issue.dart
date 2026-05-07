import 'package:mobile/features/models/author_display.dart';
import 'package:mobile/features/models/comment.dart';

// ──────────────────────────────────────────────
//  Enums
// ──────────────────────────────────────────────

enum DiscussionIssueStatus { OPEN, CLOSED }

DiscussionIssueStatus _parseStatus(dynamic value) {
  if (value == null) return DiscussionIssueStatus.OPEN;
  final str = value.toString().toUpperCase();
  if (str == 'CLOSED' || str == '1') return DiscussionIssueStatus.CLOSED;
  return DiscussionIssueStatus.OPEN;
}

// ──────────────────────────────────────────────
//  List item (paged list from GET /discussion-issues)
// ──────────────────────────────────────────────

class DiscussionIssueListItem {
  final String id;
  final String title;
  final String authorId;
  final AuthorDisplay? authorDisplay;
  final int viewCount;
  final int commentCount;
  final DateTime createdDate;
  final DiscussionIssueStatus status;
  final List<String> tags;
  final String? refProblemId;
  final String? refProblemTitle;

  DiscussionIssueListItem({
    required this.id,
    required this.title,
    required this.authorId,
    this.authorDisplay,
    this.viewCount = 0,
    this.commentCount = 0,
    required this.createdDate,
    this.status = DiscussionIssueStatus.OPEN,
    this.tags = const [],
    this.refProblemId,
    this.refProblemTitle,
  });

  /// Display name: use authorDisplay.fullName if available, fallback to authorId
  String get displayName => authorDisplay?.fullName ?? authorId;

  factory DiscussionIssueListItem.fromJson(Map<String, dynamic> json) {
    return DiscussionIssueListItem(
      id: json['id'] ?? '',
      title: json['title'] ?? '',
      authorId: json['authorId'] ?? '',
      authorDisplay: json['authorDisplay'] != null
          ? AuthorDisplay.fromJson(json['authorDisplay'])
          : null,
      viewCount: json['viewCount'] ?? 0,
      commentCount: json['commentCount'] ?? 0,
      createdDate:
          DateTime.tryParse(json['createdDate'] ?? '') ?? DateTime.now(),
      status: _parseStatus(json['status']),
      tags: List<String>.from(json['tags'] ?? []),
      refProblemId: json['refProblemId'],
      refProblemTitle: json['refProblemTitle'],
    );
  }
}

// ──────────────────────────────────────────────
//  Paged result wrapper
// ──────────────────────────────────────────────

class PagedDiscussionIssues {
  final List<DiscussionIssueListItem> items;
  final int totalCount;
  final int pageIndex;
  final int pageSize;
  final int totalPages;
  final bool hasPreviousPage;
  final bool hasNextPage;

  PagedDiscussionIssues({
    this.items = const [],
    this.totalCount = 0,
    this.pageIndex = 1,
    this.pageSize = 10,
    this.totalPages = 0,
    this.hasPreviousPage = false,
    this.hasNextPage = false,
  });

  factory PagedDiscussionIssues.fromJson(Map<String, dynamic> json) {
    return PagedDiscussionIssues(
      items: (json['items'] as List<dynamic>?)
              ?.map((e) =>
                  DiscussionIssueListItem.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      totalCount: json['totalCount'] ?? 0,
      pageIndex: json['pageIndex'] ?? 1,
      pageSize: json['pageSize'] ?? 10,
      totalPages: json['totalPages'] ?? 0,
      hasPreviousPage: json['hasPreviousPage'] ?? false,
      hasNextPage: json['hasNextPage'] ?? false,
    );
  }
}

// ──────────────────────────────────────────────
//  Full detail (GET /discussion-issues/{id})
// ──────────────────────────────────────────────

class DiscussionIssue {
  final String id;
  final String classroomId;
  final String title;
  final String authorId;
  final AuthorDisplay? authorDisplay;
  final String content;
  final List<String> attachments;
  final String refProblemId;
  final _RefProblemInfo? refProblem;
  final DiscussionIssueStatus status;
  final int viewCount;
  final List<Comment> comments;
  final bool isDeleted;
  final DateTime createdDate;
  final DateTime updatedDate;
  final List<String> tags;

  DiscussionIssue({
    required this.id,
    required this.classroomId,
    required this.title,
    required this.authorId,
    this.authorDisplay,
    required this.content,
    this.attachments = const [],
    this.refProblemId = '',
    this.refProblem,
    this.status = DiscussionIssueStatus.OPEN,
    this.viewCount = 0,
    this.comments = const [],
    this.isDeleted = false,
    required this.createdDate,
    required this.updatedDate,
    this.tags = const [],
  });

  /// Display name: use authorDisplay.fullName if available, fallback to authorId
  String get displayName => authorDisplay?.fullName ?? authorId;

  /// Comment count from embedded comments list (including all replies)
  int get commentCount =>
      comments.fold(0, (sum, c) => sum + c.totalRecursiveCount);

  factory DiscussionIssue.fromJson(Map<String, dynamic> json) {
    return DiscussionIssue(
      id: json['id'] ?? '',
      classroomId: json['classroomId'] ?? '',
      title: json['title'] ?? '',
      authorId: json['authorId'] ?? '',
      authorDisplay: json['authorDisplay'] != null
          ? AuthorDisplay.fromJson(json['authorDisplay'])
          : null,
      content: json['content'] ?? '',
      attachments: List<String>.from(json['attachments'] ?? []),
      refProblemId: json['refProblemId'] ?? '',
      refProblem: json['refProblem'] != null
          ? _RefProblemInfo.fromJson(json['refProblem'])
          : null,
      status: _parseStatus(json['status']),
      viewCount: json['viewCount'] ?? 0,
      comments: (json['comments'] as List<dynamic>?)
              ?.map((c) => Comment.fromJson(c as Map<String, dynamic>))
              .toList() ??
          [],
      isDeleted: json['isDeleted'] ?? false,
      createdDate:
          DateTime.tryParse(json['createdDate'] ?? '') ?? DateTime.now(),
      updatedDate:
          DateTime.tryParse(json['updatedDate'] ?? '') ?? DateTime.now(),
      tags: List<String>.from(json['tags'] ?? []),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'classroomId': classroomId,
        'title': title,
        'authorId': authorId,
        'content': content,
        'attachments': attachments,
        'refProblemId': refProblemId,
      };
}

/// Lightweight ref problem info embedded in discussion issue detail
class _RefProblemInfo {
  final String id;
  final String title;
  final dynamic difficulty; // number (0/1/2) or string (EASY/MEDIUM/HARD)

  _RefProblemInfo({
    required this.id,
    required this.title,
    this.difficulty,
  });

  factory _RefProblemInfo.fromJson(Map<String, dynamic> json) {
    return _RefProblemInfo(
      id: json['id'] ?? '',
      title: json['title'] ?? '',
      difficulty: json['difficulty'],
    );
  }
}

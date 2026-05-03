import 'package:flutter/material.dart';
import 'package:mobile/core/configs/api_config.dart';
import 'package:mobile/core/network/api_network.dart';
import 'package:mobile/core/storage/token_storage.dart';
import 'package:mobile/features/models/discussion_issue.dart';

// ──────────────────────────────────────────────
//  Discussion Issue Service  (matches web app)
// ──────────────────────────────────────────────

class DiscussionIssueService {
  /// GET paged list by classroomId (query-param based, same as web)
  static Future<PagedDiscussionIssues> getPagedByClassroom(
    String classroomId, {
    int pageIndex = 1,
    int pageSize = 10,
  }) async {
    try {
      final token = await TokenStorage.getAccessToken();
      if (token == null) throw Exception('No access token found');

      final response = await ApiNetwork.getWithAuth(
        endpoint: ApiConfig.discussionIssuesBaseEndpoint,
        token: token,
        queryParameters: {
          'classroomId': classroomId,
          'pageIndex': pageIndex.toString(),
          'pageSize': pageSize.toString(),
        },
      );

      if (response['success'] == true && response['dataResponse'] != null) {
        return PagedDiscussionIssues.fromJson(
            response['dataResponse'] as Map<String, dynamic>);
      }

      return PagedDiscussionIssues();
    } catch (e) {
      debugPrint('Failed to get paged discussion issues: $e');
      throw Exception('Failed to load discussion issues: $e');
    }
  }

  /// GET count of issues for a classroom
  static Future<int> getCountByClassroom(String classroomId) async {
    try {
      final token = await TokenStorage.getAccessToken();
      if (token == null) throw Exception('No access token found');

      final response = await ApiNetwork.getWithAuth(
        endpoint: ApiConfig.discussionIssueCountEndpoint,
        token: token,
        queryParameters: {'classroomId': classroomId},
      );

      if (response['success'] == true && response['dataResponse'] != null) {
        return response['dataResponse'] as int;
      }

      return 0;
    } catch (e) {
      debugPrint('Failed to get discussion count: $e');
      throw Exception('Failed to get discussion count: $e');
    }
  }

  /// GET single issue by ID (returns full detail with embedded comments)
  static Future<DiscussionIssue?> getById(String issueId) async {
    try {
      final token = await TokenStorage.getAccessToken();
      if (token == null) throw Exception('No access token found');

      final response = await ApiNetwork.getWithAuth(
        endpoint: ApiConfig.discussionIssueByIdEndpoint(issueId),
        token: token,
      );

      if (response['success'] == true && response['dataResponse'] != null) {
        return DiscussionIssue.fromJson(
            response['dataResponse'] as Map<String, dynamic>);
      }

      return null;
    } catch (e) {
      debugPrint('Failed to get discussion issue: $e');
      throw Exception('Failed to load discussion issue: $e');
    }
  }

  /// POST create a new discussion issue
  static Future<DiscussionIssue?> create({
    required String classroomId,
    required String authorId,
    required String title,
    required String content,
    String? refProblemId,
  }) async {
    try {
      final token = await TokenStorage.getAccessToken();
      if (token == null) throw Exception('No access token found');

      final body = <String, dynamic>{
        'classroomId': classroomId,
        'authorId': authorId,
        'title': title,
        'content': content,
      };
      if (refProblemId != null && refProblemId.isNotEmpty) {
        body['refProblemId'] = refProblemId;
      }

      final response = await ApiNetwork.postWithAuth(
        endpoint: ApiConfig.discussionIssuesBaseEndpoint,
        token: token,
        body: body,
      );

      if (response['success'] == true && response['dataResponse'] != null) {
        return DiscussionIssue.fromJson(
            response['dataResponse'] as Map<String, dynamic>);
      }

      return null;
    } catch (e) {
      debugPrint('Failed to create discussion issue: $e');
      throw Exception('Failed to create discussion issue: $e');
    }
  }

  /// PUT update an existing discussion issue
  static Future<DiscussionIssue?> update({
    required String issueId,
    required String title,
    required String content,
    String? refProblemId,
  }) async {
    try {
      final token = await TokenStorage.getAccessToken();
      if (token == null) throw Exception('No access token found');

      final body = <String, dynamic>{
        'title': title,
        'content': content,
      };
      if (refProblemId != null && refProblemId.isNotEmpty) {
        body['refProblemId'] = refProblemId;
      }

      final response = await ApiNetwork.putWithAuth(
        endpoint: ApiConfig.discussionIssueByIdEndpoint(issueId),
        token: token,
        body: body,
      );

      if (response['success'] == true && response['dataResponse'] != null) {
        return DiscussionIssue.fromJson(
            response['dataResponse'] as Map<String, dynamic>);
      }

      return null;
    } catch (e) {
      debugPrint('Failed to update discussion issue: $e');
      throw Exception('Failed to update discussion issue: $e');
    }
  }

  /// PATCH change status (OPEN / CLOSED) — lecturer/admin only
  static Future<DiscussionIssue?> changeStatus({
    required String issueId,
    required DiscussionIssueStatus status,
  }) async {
    try {
      final token = await TokenStorage.getAccessToken();
      if (token == null) throw Exception('No access token found');

      final response = await ApiNetwork.patchWithAuth(
        endpoint: ApiConfig.changeDiscussionStatusEndpoint(issueId),
        token: token,
        body: {
          'issueId': issueId,
          'status': status == DiscussionIssueStatus.CLOSED ? 1 : 0,
        },
      );

      if (response['success'] == true && response['dataResponse'] != null) {
        return DiscussionIssue.fromJson(
            response['dataResponse'] as Map<String, dynamic>);
      }

      return null;
    } catch (e) {
      debugPrint('Failed to change discussion status: $e');
      throw Exception('Failed to change discussion status: $e');
    }
  }

  /// PATCH soft-delete a discussion issue
  static Future<bool> softDelete(String issueId) async {
    try {
      final token = await TokenStorage.getAccessToken();
      if (token == null) throw Exception('No access token found');

      final response = await ApiNetwork.patchWithAuth(
        endpoint: ApiConfig.softDeleteDiscussionIssueEndpoint(issueId),
        token: token,
      );

      return response['success'] == true;
    } catch (e) {
      debugPrint('Failed to soft delete discussion issue: $e');
      throw Exception('Failed to delete discussion issue: $e');
    }
  }
}

// ──────────────────────────────────────────────
//  Comment Service  (matches web app)
// ──────────────────────────────────────────────

class CommentService {
  /// POST write a top-level comment. Returns updated issue with comments.
  static Future<DiscussionIssue?> writeComment({
    required String issueId,
    required String authorId,
    required String content,
  }) async {
    try {
      final token = await TokenStorage.getAccessToken();
      if (token == null) throw Exception('No access token found');

      final response = await ApiNetwork.postWithAuth(
        endpoint: ApiConfig.writeCommentEndpoint,
        token: token,
        body: {
          'issueId': issueId,
          'authorId': authorId,
          'content': content,
        },
      );

      if (response['success'] == true && response['dataResponse'] != null) {
        return DiscussionIssue.fromJson(
            response['dataResponse'] as Map<String, dynamic>);
      }

      return null;
    } catch (e) {
      debugPrint('Failed to write comment: $e');
      throw Exception('Failed to add comment: $e');
    }
  }

  /// POST reply to a comment. Returns updated issue with comments.
  static Future<DiscussionIssue?> replyComment({
    required String issueId,
    required String parentCommentId,
    required String authorId,
    required String content,
  }) async {
    try {
      final token = await TokenStorage.getAccessToken();
      if (token == null) throw Exception('No access token found');

      final response = await ApiNetwork.postWithAuth(
        endpoint: ApiConfig.replyCommentEndpoint,
        token: token,
        body: {
          'issueId': issueId,
          'parentCommentId': parentCommentId,
          'authorId': authorId,
          'content': content,
        },
      );

      if (response['success'] == true && response['dataResponse'] != null) {
        return DiscussionIssue.fromJson(
            response['dataResponse'] as Map<String, dynamic>);
      }

      return null;
    } catch (e) {
      debugPrint('Failed to reply to comment: $e');
      throw Exception('Failed to reply to comment: $e');
    }
  }

  /// POST upvote a comment. Returns updated issue with comments.
  static Future<DiscussionIssue?> upvoteComment({
    required String issueId,
    required String commentId,
  }) async {
    try {
      final token = await TokenStorage.getAccessToken();
      if (token == null) throw Exception('No access token found');

      final response = await ApiNetwork.postWithAuth(
        endpoint: ApiConfig.upvoteCommentEndpoint,
        token: token,
        body: {
          'issueId': issueId,
          'commentId': commentId,
        },
      );

      if (response['success'] == true && response['dataResponse'] != null) {
        return DiscussionIssue.fromJson(
            response['dataResponse'] as Map<String, dynamic>);
      }

      return null;
    } catch (e) {
      debugPrint('Failed to upvote comment: $e');
      throw Exception('Failed to upvote comment: $e');
    }
  }

  /// PUT update a comment. Returns updated issue with comments.
  static Future<DiscussionIssue?> updateComment({
    required String commentId,
    required String content,
  }) async {
    try {
      final token = await TokenStorage.getAccessToken();
      if (token == null) throw Exception('No access token found');

      final response = await ApiNetwork.putWithAuth(
        endpoint: ApiConfig.updateCommentEndpoint(commentId),
        token: token,
        body: {'content': content},
      );

      if (response['success'] == true && response['dataResponse'] != null) {
        return DiscussionIssue.fromJson(
            response['dataResponse'] as Map<String, dynamic>);
      }

      return null;
    } catch (e) {
      debugPrint('Failed to update comment: $e');
      throw Exception('Failed to update comment: $e');
    }
  }

  /// PATCH soft-delete a comment. Returns updated issue with comments.
  static Future<DiscussionIssue?> softDeleteComment({
    required String commentId,
  }) async {
    try {
      final token = await TokenStorage.getAccessToken();
      if (token == null) throw Exception('No access token found');

      final response = await ApiNetwork.patchWithAuth(
        endpoint: ApiConfig.softDeleteCommentEndpoint(commentId),
        token: token,
      );

      if (response['success'] == true && response['dataResponse'] != null) {
        return DiscussionIssue.fromJson(
            response['dataResponse'] as Map<String, dynamic>);
      }

      return null;
    } catch (e) {
      debugPrint('Failed to delete comment: $e');
      throw Exception('Failed to delete comment: $e');
    }
  }
}

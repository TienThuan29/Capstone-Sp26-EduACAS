import 'package:flutter/material.dart';
import 'package:mobile/core/configs/api_config.dart';
import 'package:mobile/core/network/api_network.dart';
import 'package:mobile/core/storage/token_storage.dart';

class DiscussionIssueService {
  /// Get all discussion issues for a classroom
  static Future<List<Map<String, dynamic>>> getByClassroomId(
    String classroomId,
  ) async {
    try {
      final token = await TokenStorage.getAccessToken();
      if (token == null) throw Exception('No access token found');

      final response = await ApiNetwork.getWithAuth(
        endpoint: ApiConfig.discussionIssuesByClassroomEndpoint(classroomId),
        token: token,
      );

      if (response['success'] == true && response['dataResponse'] != null) {
        final List<dynamic> data = response['dataResponse'];
        return data.cast<Map<String, dynamic>>();
      }

      return [];
    } catch (e) {
      debugPrint('Failed to get discussion issues: $e');
      throw Exception('Failed to load discussion issues: $e');
    }
  }

  /// Get a single discussion issue by ID
  static Future<Map<String, dynamic>?> getById(String issueId) async {
    try {
      final token = await TokenStorage.getAccessToken();
      if (token == null) throw Exception('No access token found');

      final response = await ApiNetwork.getWithAuth(
        endpoint: ApiConfig.discussionIssueByIdEndpoint(issueId),
        token: token,
      );

      if (response['success'] == true && response['dataResponse'] != null) {
        return response['dataResponse'] as Map<String, dynamic>;
      }

      return null;
    } catch (e) {
      debugPrint('Failed to get discussion issue: $e');
      throw Exception('Failed to load discussion issue: $e');
    }
  }

  /// Create a new discussion issue
  static Future<Map<String, dynamic>?> create({
    required String classroomId,
    required String title,
    required String authorId,
    required String authorName,
    required String content,
    List<String> imagesName = const [],
    List<String> filesName = const [],
  }) async {
    try {
      final token = await TokenStorage.getAccessToken();
      if (token == null) throw Exception('No access token found');

      final response = await ApiNetwork.postWithAuth(
        endpoint: ApiConfig.createDiscussionIssueEndpoint,
        token: token,
        body: {
          'classroomId': classroomId,
          'title': title,
          'authorId': authorId,
          'authorName': authorName,
          'content': content,
          'imagesName': imagesName,
          'filesName': filesName,
        },
      );

      if (response['success'] == true && response['dataResponse'] != null) {
        return response['dataResponse'] as Map<String, dynamic>;
      }

      return null;
    } catch (e) {
      debugPrint('Failed to create discussion issue: $e');
      throw Exception('Failed to create discussion issue: $e');
    }
  }

  /// Update an existing discussion issue
  static Future<Map<String, dynamic>?> update({
    required String issueId,
    required String title,
    required String content,
    List<String> imagesName = const [],
    List<String> filesName = const [],
  }) async {
    try {
      final token = await TokenStorage.getAccessToken();
      if (token == null) throw Exception('No access token found');

      final response = await ApiNetwork.putWithAuth(
        endpoint: ApiConfig.discussionIssueByIdEndpoint(issueId),
        token: token,
        body: {
          'title': title,
          'content': content,
          'imagesName': imagesName,
          'filesName': filesName,
        },
      );

      if (response['success'] == true && response['dataResponse'] != null) {
        return response['dataResponse'] as Map<String, dynamic>;
      }

      return null;
    } catch (e) {
      debugPrint('Failed to update discussion issue: $e');
      throw Exception('Failed to update discussion issue: $e');
    }
  }

  /// Delete (hard delete) a discussion issue
  static Future<bool> delete(String issueId) async {
    try {
      final token = await TokenStorage.getAccessToken();
      if (token == null) throw Exception('No access token found');

      final response = await ApiNetwork.deleteWithAuth(
        endpoint: ApiConfig.discussionIssueByIdEndpoint(issueId),
        token: token,
      );

      return response['success'] == true;
    } catch (e) {
      debugPrint('Failed to delete discussion issue: $e');
      throw Exception('Failed to delete discussion issue: $e');
    }
  }
}

class CommentService {
  /// Get all comments for a discussion issue
  static Future<List<Map<String, dynamic>>> getByDiscussionIssueId(
    String discussionIssueId,
  ) async {
    try {
      final token = await TokenStorage.getAccessToken();
      if (token == null) throw Exception('No access token found');

      final response = await ApiNetwork.getWithAuth(
        endpoint: ApiConfig.commentsByDiscussionIssueEndpoint(discussionIssueId),
        token: token,
      );

      if (response['success'] == true && response['dataResponse'] != null) {
        final List<dynamic> data = response['dataResponse'];
        return data.cast<Map<String, dynamic>>();
      }

      return [];
    } catch (e) {
      debugPrint('Failed to get comments: $e');
      throw Exception('Failed to load comments: $e');
    }
  }

  /// Create a new comment
  static Future<Map<String, dynamic>?> create({
    required String discussionIssueId,
    required String authorId,
    required String authorName,
    required String content,
    List<String> imagesName = const [],
    List<String> filesName = const [],
  }) async {
    try {
      final token = await TokenStorage.getAccessToken();
      if (token == null) throw Exception('No access token found');

      final response = await ApiNetwork.postWithAuth(
        endpoint: ApiConfig.createCommentEndpoint,
        token: token,
        body: {
          'discussionIssueId': discussionIssueId,
          'authorId': authorId,
          'authorName': authorName,
          'content': content,
          'imagesName': imagesName,
          'filesName': filesName,
        },
      );

      if (response['success'] == true && response['dataResponse'] != null) {
        return response['dataResponse'] as Map<String, dynamic>;
      }

      return null;
    } catch (e) {
      debugPrint('Failed to create comment: $e');
      throw Exception('Failed to create comment: $e');
    }
  }

  /// Update a comment
  static Future<Map<String, dynamic>?> update({
    required String commentId,
    required String content,
    List<String> imagesName = const [],
    List<String> filesName = const [],
  }) async {
    try {
      final token = await TokenStorage.getAccessToken();
      if (token == null) throw Exception('No access token found');

      final response = await ApiNetwork.putWithAuth(
        endpoint: ApiConfig.commentByIdEndpoint(commentId),
        token: token,
        body: {
          'content': content,
          'imagesName': imagesName,
          'filesName': filesName,
        },
      );

      if (response['success'] == true && response['dataResponse'] != null) {
        return response['dataResponse'] as Map<String, dynamic>;
      }

      return null;
    } catch (e) {
      debugPrint('Failed to update comment: $e');
      throw Exception('Failed to update comment: $e');
    }
  }

  /// Delete a comment
  static Future<bool> delete(String commentId) async {
    try {
      final token = await TokenStorage.getAccessToken();
      if (token == null) throw Exception('No access token found');

      final response = await ApiNetwork.deleteWithAuth(
        endpoint: ApiConfig.commentByIdEndpoint(commentId),
        token: token,
      );

      return response['success'] == true;
    } catch (e) {
      debugPrint('Failed to delete comment: $e');
      throw Exception('Failed to delete comment: $e');
    }
  }
}

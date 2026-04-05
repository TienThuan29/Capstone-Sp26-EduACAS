import 'package:flutter/material.dart';
import 'package:mobile/core/configs/api_config.dart';
import 'package:mobile/core/network/api_network.dart';
import 'package:mobile/core/storage/token_storage.dart';
import 'package:mobile/features/models/quiz.dart';

class PagedQuizResult {
  final List<Quiz> items;
  final int totalCount;
  final int pageIndex;
  final int pageSize;
  final int totalPages;

  PagedQuizResult({
    required this.items,
    required this.totalCount,
    required this.pageIndex,
    required this.pageSize,
    required this.totalPages,
  });
}

class QuizService {
  static Future<PagedQuizResult> getQuizzesPaged({
    int pageIndex = 1,
    int pageSize = 10,
    bool includeDeleted = false,
    String? searchTerm,
    String? subjectId,
  }) async {
    try {
      final token = await TokenStorage.getAccessToken();
      if (token == null) throw Exception('No access token found');

      final params = <String, String>{
        'pageIndex': pageIndex.toString(),
        'pageSize': pageSize.toString(),
        'includeDeleted': includeDeleted.toString(),
      };

      if (searchTerm != null && searchTerm.trim().isNotEmpty) {
        params['searchTerm'] = searchTerm.trim();
      }

      if (subjectId != null && subjectId.trim().isNotEmpty) {
        params['subjectId'] = subjectId;
      }

      final response = await ApiNetwork.getWithAuth(
        endpoint: ApiConfig.quizzesPagedEndpoint,
        token: token,
        queryParameters: params,
      );

      final data = response['dataResponse'];
      if (response['success'] == true && data is Map<String, dynamic>) {
        final items = (data['items'] as List<dynamic>? ?? [])
            .map((item) => Quiz.fromJson(item as Map<String, dynamic>))
            .toList();

        return PagedQuizResult(
          items: items,
          totalCount: data['totalCount'] ?? 0,
          pageIndex: data['pageIndex'] ?? 1,
          pageSize: data['pageSize'] ?? pageSize,
          totalPages: data['totalPages'] ?? 0,
        );
      }

      return PagedQuizResult(
        items: const [],
        totalCount: 0,
        pageIndex: 1,
        pageSize: pageSize,
        totalPages: 0,
      );
    } catch (e) {
      debugPrint('Failed to load quizzes: $e');
      throw Exception('Failed to load quizzes: $e');
    }
  }

  static Future<Quiz?> getQuizById(String id) async {
    try {
      final token = await TokenStorage.getAccessToken();
      if (token == null) throw Exception('No access token found');

      final response = await ApiNetwork.getWithAuth(
        endpoint: ApiConfig.quizByIdEndpoint(id),
        token: token,
      );

      if (response['success'] == true && response['dataResponse'] is Map<String, dynamic>) {
        return Quiz.fromJson(response['dataResponse'] as Map<String, dynamic>);
      }

      return null;
    } catch (e) {
      debugPrint('Failed to load quiz detail: $e');
      throw Exception('Failed to load quiz detail: $e');
    }
  }

  static Future<void> createQuiz({
    required String subjectId,
    required String title,
    required int duration,
    required String createdBy,
  }) async {
    try {
      final token = await TokenStorage.getAccessToken();
      if (token == null) throw Exception('No access token found');

      final response = await ApiNetwork.postWithAuth(
        endpoint: ApiConfig.quizzesEndpoint,
        token: token,
        body: {
          'subjectId': subjectId,
          'title': title,
          'duration': duration,
          'createdBy': createdBy,
        },
      );

      if (response['success'] != true) {
        throw Exception(response['message'] ?? 'Create quiz failed');
      }
    } catch (e) {
      debugPrint('Failed to create quiz: $e');
      throw Exception('Failed to create quiz: $e');
    }
  }

  static Future<void> updateQuiz({
    required String quizId,
    required String title,
    required int duration,
  }) async {
    try {
      final token = await TokenStorage.getAccessToken();
      if (token == null) throw Exception('No access token found');

      final response = await ApiNetwork.putWithAuth(
        endpoint: ApiConfig.quizByIdEndpoint(quizId),
        token: token,
        body: {
          'title': title,
          'duration': duration,
        },
      );

      if (response['success'] != true) {
        throw Exception(response['message'] ?? 'Update quiz failed');
      }
    } catch (e) {
      debugPrint('Failed to update quiz: $e');
      throw Exception('Failed to update quiz: $e');
    }
  }

  static Future<void> softDeleteQuiz(String quizId) async {
    try {
      final token = await TokenStorage.getAccessToken();
      if (token == null) throw Exception('No access token found');

      final response = await ApiNetwork.patchWithAuth(
        endpoint: ApiConfig.softDeleteQuizEndpoint(quizId),
        token: token,
      );

      if (response['success'] != true) {
        throw Exception(response['message'] ?? 'Soft delete quiz failed');
      }
    } catch (e) {
      debugPrint('Failed to soft delete quiz: $e');
      throw Exception('Failed to soft delete quiz: $e');
    }
  }

  static Future<void> restoreQuiz(String quizId) async {
    try {
      final token = await TokenStorage.getAccessToken();
      if (token == null) throw Exception('No access token found');

      final response = await ApiNetwork.patchWithAuth(
        endpoint: ApiConfig.restoreQuizEndpoint(quizId),
        token: token,
      );

      if (response['success'] != true) {
        throw Exception(response['message'] ?? 'Restore quiz failed');
      }
    } catch (e) {
      debugPrint('Failed to restore quiz: $e');
      throw Exception('Failed to restore quiz: $e');
    }
  }

  static Future<void> assignQuestions({
    required String quizId,
    required List<AssignQuizQuestionPayload> questions,
  }) async {
    try {
      final token = await TokenStorage.getAccessToken();
      if (token == null) throw Exception('No access token found');

      final response = await ApiNetwork.putWithAuth(
        endpoint: ApiConfig.assignQuizQuestionsEndpoint(quizId),
        token: token,
        body: {
          'questions': questions.map((item) => item.toJson()).toList(),
        },
      );

      if (response['success'] != true) {
        throw Exception(response['message'] ?? 'Assign questions failed');
      }
    } catch (e) {
      debugPrint('Failed to assign questions: $e');
      throw Exception('Failed to assign questions: $e');
    }
  }
}

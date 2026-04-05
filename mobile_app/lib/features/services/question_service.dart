import 'package:flutter/material.dart';
import 'package:mobile/core/configs/api_config.dart';
import 'package:mobile/core/network/api_network.dart';
import 'package:mobile/core/storage/token_storage.dart';
import 'package:mobile/features/models/question.dart';

class PagedQuestionResult {
  final List<Question> items;
  final int totalCount;
  final int pageIndex;
  final int pageSize;
  final int totalPages;

  PagedQuestionResult({
    required this.items,
    required this.totalCount,
    required this.pageIndex,
    required this.pageSize,
    required this.totalPages,
  });
}

class QuestionService {
  static Future<PagedQuestionResult> getQuestionsPaged({
    int pageIndex = 1,
    int pageSize = 10,
    bool includeDeleted = false,
    String? searchTerm,
    QuestionType? type,
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

      if (type != null) {
        params['type'] = questionTypeToApiValue(type);
      }

      final response = await ApiNetwork.getWithAuth(
        endpoint: ApiConfig.questionsPagedEndpoint,
        token: token,
        queryParameters: params,
      );

      final data = response['dataResponse'];
      if (response['success'] == true && data is Map<String, dynamic>) {
        final items = (data['items'] as List<dynamic>? ?? [])
            .map((item) => Question.fromJson(item as Map<String, dynamic>))
            .toList();

        return PagedQuestionResult(
          items: items,
          totalCount: data['totalCount'] ?? 0,
          pageIndex: data['pageIndex'] ?? 1,
          pageSize: data['pageSize'] ?? pageSize,
          totalPages: data['totalPages'] ?? 0,
        );
      }

      return PagedQuestionResult(
        items: const [],
        totalCount: 0,
        pageIndex: 1,
        pageSize: pageSize,
        totalPages: 0,
      );
    } catch (e) {
      debugPrint('Failed to load questions: $e');
      throw Exception('Failed to load questions: $e');
    }
  }

  static Future<Question?> getQuestionById(String id) async {
    try {
      final token = await TokenStorage.getAccessToken();
      if (token == null) throw Exception('No access token found');

      final response = await ApiNetwork.getWithAuth(
        endpoint: ApiConfig.questionByIdEndpoint(id),
        token: token,
      );

      if (response['success'] == true && response['dataResponse'] is Map<String, dynamic>) {
        return Question.fromJson(response['dataResponse'] as Map<String, dynamic>);
      }
      return null;
    } catch (e) {
      debugPrint('Failed to get question by id: $e');
      throw Exception('Failed to load question: $e');
    }
  }

  static Future<void> createQuestion({
    required String content,
    required QuestionType type,
    required String createdBy,
    String? imageUrl,
    List<AnswerOption> answerOptions = const [],
    String? textAnswer,
  }) async {
    try {
      final token = await TokenStorage.getAccessToken();
      if (token == null) throw Exception('No access token found');

      final response = await ApiNetwork.postWithAuth(
        endpoint: ApiConfig.questionsEndpoint,
        token: token,
        body: {
          'content': content,
          'imageUrl': imageUrl,
          'type': questionTypeToApiValue(type),
          'createdBy': createdBy,
          'answerOptions': answerOptions.map((e) => e.toCreateJson()).toList(),
          'textAnswer': textAnswer,
        },
      );

      if (response['success'] != true) {
        throw Exception(response['message'] ?? 'Create question failed');
      }
    } catch (e) {
      debugPrint('Failed to create question: $e');
      throw Exception('Failed to create question: $e');
    }
  }

  static Future<void> updateQuestion({
    required String questionId,
    required String content,
    required QuestionType type,
    String? imageUrl,
    List<AnswerOption> answerOptions = const [],
    String? textAnswer,
  }) async {
    try {
      final token = await TokenStorage.getAccessToken();
      if (token == null) throw Exception('No access token found');

      final response = await ApiNetwork.putWithAuth(
        endpoint: ApiConfig.questionByIdEndpoint(questionId),
        token: token,
        body: {
          'content': content,
          'imageUrl': imageUrl,
          'type': questionTypeToApiValue(type),
          'answerOptions': answerOptions.map((e) => e.toCreateJson()).toList(),
          'textAnswer': textAnswer,
        },
      );

      if (response['success'] != true) {
        throw Exception(response['message'] ?? 'Update question failed');
      }
    } catch (e) {
      debugPrint('Failed to update question: $e');
      throw Exception('Failed to update question: $e');
    }
  }

  static Future<void> softDeleteQuestion(String questionId) async {
    try {
      final token = await TokenStorage.getAccessToken();
      if (token == null) throw Exception('No access token found');

      final response = await ApiNetwork.patchWithAuth(
        endpoint: ApiConfig.softDeleteQuestionEndpoint(questionId),
        token: token,
      );

      if (response['success'] != true) {
        throw Exception(response['message'] ?? 'Soft delete question failed');
      }
    } catch (e) {
      debugPrint('Failed to soft delete question: $e');
      throw Exception('Failed to soft delete question: $e');
    }
  }

  static Future<void> restoreQuestion(String questionId) async {
    try {
      final token = await TokenStorage.getAccessToken();
      if (token == null) throw Exception('No access token found');

      final response = await ApiNetwork.patchWithAuth(
        endpoint: ApiConfig.restoreQuestionEndpoint(questionId),
        token: token,
      );

      if (response['success'] != true) {
        throw Exception(response['message'] ?? 'Restore question failed');
      }
    } catch (e) {
      debugPrint('Failed to restore question: $e');
      throw Exception('Failed to restore question: $e');
    }
  }
}

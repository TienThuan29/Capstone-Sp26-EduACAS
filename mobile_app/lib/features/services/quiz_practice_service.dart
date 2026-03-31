import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:mobile/core/configs/api_config.dart';
import 'package:mobile/core/network/api_network.dart';
import 'package:mobile/core/storage/token_storage.dart';
import 'package:mobile/features/models/quiz_practice.dart';

class QuizPracticeService {
  static String _friendlyError(Object error, {String fallback = 'Request failed'}) {
    final raw = error.toString().replaceFirst('Exception: ', '');
    final jsonStart = raw.indexOf('{');
    final jsonEnd = raw.lastIndexOf('}');

    if (jsonStart >= 0 && jsonEnd > jsonStart) {
      final body = raw.substring(jsonStart, jsonEnd + 1);
      try {
        final parsed = jsonDecode(body);
        if (parsed is Map<String, dynamic>) {
          final message = parsed['message'];
          if (message is String && message.trim().isNotEmpty) {
            return message.trim();
          }
        }
      } catch (_) {
        // Keep fallback behavior when payload is not valid JSON.
      }
    }

    return raw.isEmpty ? fallback : raw;
  }

  static Future<String> _token() async {
    final token = await TokenStorage.getAccessToken();
    if (token == null || token.isEmpty) {
      throw Exception('No access token found');
    }
    return token;
  }

  static Future<List<ClassroomQuiz>> getClassroomQuizzes(String classroomId) async {
    try {
      final token = await _token();
      final response = await ApiNetwork.getWithAuth(
        endpoint: ApiConfig.classroomQuizzesByClassroomEndpoint(classroomId),
        token: token,
      );

      if (response['success'] == true && response['dataResponse'] != null) {
        final data = response['dataResponse'] as List<dynamic>;
        return data
            .map((e) => ClassroomQuiz.fromJson(e as Map<String, dynamic>))
            .toList();
      }

      return [];
    } catch (e) {
      debugPrint('Failed to get classroom quizzes: $e');
      throw Exception('Failed to load quizzes: $e');
    }
  }

  static Future<QuizDetail?> getQuizById(String quizId) async {
    try {
      final token = await _token();
      final response = await ApiNetwork.getWithAuth(
        endpoint: ApiConfig.quizzesByIdEndpoint(quizId),
        token: token,
      );

      if (response['success'] == true && response['dataResponse'] != null) {
        return QuizDetail.fromJson(response['dataResponse'] as Map<String, dynamic>);
      }

      return null;
    } catch (e) {
      debugPrint('Failed to get quiz detail: $e');
      throw Exception('Failed to load quiz detail: $e');
    }
  }

  static Future<QuestionDetail?> getQuestionById(String questionId) async {
    try {
      final token = await _token();
      final response = await ApiNetwork.getWithAuth(
        endpoint: ApiConfig.questionByIdEndpoint(questionId),
        token: token,
      );

      if (response['success'] == true && response['dataResponse'] != null) {
        return QuestionDetail.fromJson(response['dataResponse'] as Map<String, dynamic>);
      }

      return null;
    } catch (e) {
      debugPrint('Failed to get question detail: $e');
      throw Exception('Failed to load question detail: $e');
    }
  }

  static Future<QuizAttemptInfo> startAttempt({
    required String classroomQuizId,
    required String studentId,
  }) async {
    try {
      final token = await _token();
      final response = await ApiNetwork.postWithAuth(
        endpoint: ApiConfig.quizAttemptStartEndpoint(),
        token: token,
        body: {
          'classroomQuizId': classroomQuizId,
          'studentId': studentId,
        },
      );

      if (response['success'] == true && response['dataResponse'] != null) {
        return QuizAttemptInfo.fromJson(response['dataResponse'] as Map<String, dynamic>);
      }

      throw Exception(response['message'] ?? 'Cannot start quiz attempt');
    } catch (e) {
      debugPrint('Failed to start quiz attempt: $e');
      throw Exception(_friendlyError(e, fallback: 'Failed to start quiz attempt'));
    }
  }

  static Future<void> updateAnswer({
    required String attemptId,
    required String questionId,
    required String selectedOptionId,
  }) async {
    try {
      final token = await _token();
      await ApiNetwork.postWithAuth(
        endpoint: ApiConfig.quizAttemptAnswerEndpoint(attemptId),
        token: token,
        body: {
          'questionId': questionId,
          'selectedOptionId': selectedOptionId,
        },
      );
    } catch (e) {
      debugPrint('Failed to update answer: $e');
      throw Exception('Failed to update answer: $e');
    }
  }

  static Future<QuizAttemptInfo> submitAttempt(String attemptId) async {
    try {
      final token = await _token();
      final response = await ApiNetwork.postWithAuth(
        endpoint: ApiConfig.quizAttemptSubmitEndpoint(attemptId),
        token: token,
        body: {},
      );

      if (response['success'] == true && response['dataResponse'] != null) {
        return QuizAttemptInfo.fromJson(response['dataResponse'] as Map<String, dynamic>);
      }

      throw Exception(response['message'] ?? 'Cannot submit quiz');
    } catch (e) {
      debugPrint('Failed to submit quiz attempt: $e');
      throw Exception(_friendlyError(e, fallback: 'Failed to submit quiz attempt'));
    }
  }

  static Future<QuizAttemptInfo?> getAttemptById(String attemptId) async {
    try {
      final token = await _token();
      final response = await ApiNetwork.getWithAuth(
        endpoint: ApiConfig.quizAttemptByIdEndpoint(attemptId),
        token: token,
      );

      if (response['success'] == true && response['dataResponse'] != null) {
        return QuizAttemptInfo.fromJson(response['dataResponse'] as Map<String, dynamic>);
      }

      return null;
    } catch (e) {
      debugPrint('Failed to get quiz attempt detail: $e');
      throw Exception('Failed to load quiz attempt detail: $e');
    }
  }

  static Future<List<QuizAttemptInfo>> getAttemptsByStudent(String studentId) async {
    try {
      final token = await _token();
      final response = await ApiNetwork.getWithAuth(
        endpoint: ApiConfig.quizAttemptsByStudentEndpoint(studentId),
        token: token,
      );

      if (response['success'] == true && response['dataResponse'] != null) {
        final data = response['dataResponse'] as List<dynamic>;
        return data
            .map((e) => QuizAttemptInfo.fromJson(e as Map<String, dynamic>))
            .toList();
      }

      return [];
    } catch (e) {
      debugPrint('Failed to get student quiz attempts: $e');
      throw Exception('Failed to load student quiz attempts: $e');
    }
  }

  static Future<List<StudentAnswerInfo>> getStudentAnswersByAttempt(String attemptId) async {
    try {
      final token = await _token();
      final response = await ApiNetwork.getWithAuth(
        endpoint: ApiConfig.studentAnswersByAttemptEndpoint(attemptId),
        token: token,
      );

      if (response['success'] == true && response['dataResponse'] != null) {
        final data = response['dataResponse'] as List<dynamic>;
        return data
            .map((e) => StudentAnswerInfo.fromJson(e as Map<String, dynamic>))
            .toList();
      }

      return [];
    } catch (e) {
      debugPrint('Failed to get student answers by attempt: $e');
      throw Exception('Failed to load student answers by attempt: $e');
    }
  }
}

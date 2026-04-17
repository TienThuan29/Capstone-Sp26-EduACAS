import 'package:flutter/material.dart';
import 'package:mobile/core/configs/api_config.dart';
import 'package:mobile/core/network/api_network.dart';
import 'package:mobile/core/storage/token_storage.dart';
import 'package:mobile/features/models/quiz_practice.dart';

class ClassroomQuizService {
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

      if (response['success'] == true && response['dataResponse'] is List<dynamic>) {
        final data = response['dataResponse'] as List<dynamic>;
        return data
            .map((e) => ClassroomQuiz.fromJson(e as Map<String, dynamic>))
            .toList();
      }

      return [];
    } catch (e) {
      debugPrint('Failed to get classroom quizzes: $e');
      throw Exception('Failed to load classroom quizzes: $e');
    }
  }

  static Future<ClassroomQuiz> createClassroomQuiz({
    required String classroomId,
    required String quizId,
    required DateTime startTimeUtc,
    required DateTime endTimeUtc,
    required int maxOfAttempts,
    String? passcode,
    required String createdBy,
    bool publishAfterCreate = true,
  }) async {
    try {
      final token = await _token();

      final createResponse = await ApiNetwork.postWithAuth(
        endpoint: ApiConfig.classroomQuizzesEndpoint,
        token: token,
        body: {
          'classroomId': classroomId,
          'quizId': quizId,
          'startTime': startTimeUtc.toIso8601String(),
          'endTime': endTimeUtc.toIso8601String(),
          'maxOfAttempts': maxOfAttempts,
          'passcode': (passcode == null || passcode.trim().isEmpty) ? null : passcode.trim(),
          'createdBy': createdBy,
        },
      );

      if (createResponse['success'] != true || createResponse['dataResponse'] == null) {
        throw Exception(createResponse['message'] ?? 'Create classroom quiz failed');
      }

      var created = ClassroomQuiz.fromJson(createResponse['dataResponse'] as Map<String, dynamic>);

      if (publishAfterCreate) {
        created = await updateClassroomQuiz(
          id: created.id,
          status: 1, // PUBLISHED
        );
      }

      return created;
    } catch (e) {
      debugPrint('Failed to create classroom quiz: $e');
      throw Exception('Failed to create classroom quiz: $e');
    }
  }

  static Future<ClassroomQuiz> updateClassroomQuiz({
    required String id,
    DateTime? startTimeUtc,
    DateTime? endTimeUtc,
    int? maxOfAttempts,
    String? passcode,
    int? status,
  }) async {
    try {
      final token = await _token();

      final body = <String, dynamic>{};
      if (startTimeUtc != null) {
        body['startTime'] = startTimeUtc.toIso8601String();
      }
      if (endTimeUtc != null) {
        body['endTime'] = endTimeUtc.toIso8601String();
      }
      if (maxOfAttempts != null) {
        body['maxOfAttempts'] = maxOfAttempts;
      }
      if (passcode != null) {
        body['passcode'] = passcode;
      }
      if (status != null) {
        body['status'] = status;
      }

      final response = await ApiNetwork.putWithAuth(
        endpoint: ApiConfig.classroomQuizByIdEndpoint(id),
        token: token,
        body: body,
      );

      if (response['success'] == true && response['dataResponse'] is Map<String, dynamic>) {
        return ClassroomQuiz.fromJson(response['dataResponse'] as Map<String, dynamic>);
      }

      throw Exception(response['message'] ?? 'Update classroom quiz failed');
    } catch (e) {
      debugPrint('Failed to update classroom quiz: $e');
      throw Exception('Failed to update classroom quiz: $e');
    }
  }

  static Future<void> softDeleteClassroomQuiz(String id) async {
    try {
      final token = await _token();
      final response = await ApiNetwork.patchWithAuth(
        endpoint: ApiConfig.softDeleteClassroomQuizEndpoint(id),
        token: token,
      );

      if (response['success'] != true) {
        throw Exception(response['message'] ?? 'Soft delete classroom quiz failed');
      }
    } catch (e) {
      debugPrint('Failed to soft delete classroom quiz: $e');
      throw Exception('Failed to soft delete classroom quiz: $e');
    }
  }
}

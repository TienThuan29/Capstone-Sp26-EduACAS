import 'package:flutter/material.dart';
import 'package:mobile/core/configs/api_config.dart';
import 'package:mobile/core/network/api_network.dart';
import 'package:mobile/core/storage/token_storage.dart';
import 'package:mobile/features/models/problem.dart';

class ProblemService {
  /// Get all problems created by a lecturer.
  static Future<List<ProblemBasic>> getByLecturerId(
    String lecturerId,
  ) async {
    try {
      final token = await TokenStorage.getAccessToken();
      if (token == null) throw Exception('No access token found');

      final response = await ApiNetwork.getWithAuth(
        endpoint: ApiConfig.problemsByLecturerEndpoint(lecturerId),
        token: token,
      );

      if (response['success'] == true && response['dataResponse'] != null) {
        final List<dynamic> data = response['dataResponse'];
        return data
            .map((e) => ProblemBasic.fromJson(e as Map<String, dynamic>))
            .toList();
      }

      return [];
    } catch (e) {
      debugPrint('Failed to get problems: $e');
      throw Exception('Failed to load problems: $e');
    }
  }

  /// Get full problem detail by id.
  static Future<Problem?> getById(String id) async {
    try {
      final token = await TokenStorage.getAccessToken();
      if (token == null) throw Exception('No access token found');

      final response = await ApiNetwork.getWithAuth(
        endpoint: ApiConfig.problemByIdEndpoint(id),
        token: token,
      );

      if (response['success'] == true && response['dataResponse'] != null) {
        return Problem.fromJson(
            response['dataResponse'] as Map<String, dynamic>);
      }

      return null;
    } catch (e) {
      debugPrint('Failed to get problem: $e');
      throw Exception('Failed to load problem: $e');
    }
  }

  /// Get problems from all examinations of a classroom (matches web app).
  static Future<List<ProblemBasic>> getProblemsFromExaminations(
    String classroomId,
  ) async {
    try {
      final token = await TokenStorage.getAccessToken();
      if (token == null) throw Exception('No access token found');

      final response = await ApiNetwork.getWithAuth(
        endpoint: ApiConfig.problemsFromExaminationsEndpoint(classroomId),
        token: token,
      );

      if (response['success'] == true && response['dataResponse'] != null) {
        final List<dynamic> data = response['dataResponse'];
        return data
            .map((e) => ProblemBasic.fromJson(e as Map<String, dynamic>))
            .toList();
      }

      return [];
    } catch (e) {
      debugPrint('Failed to get problems from examinations: $e');
      return [];
    }
  }
}

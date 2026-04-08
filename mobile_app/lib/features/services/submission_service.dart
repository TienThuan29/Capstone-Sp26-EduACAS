import 'package:flutter/material.dart';
import 'package:mobile/core/configs/api_config.dart';
import 'package:mobile/core/network/api_network.dart';
import 'package:mobile/core/storage/token_storage.dart';
import 'package:mobile/features/models/submission.dart';

class SubmissionService {
  static Future<List<Submission>> getSubmissionsByStudentId(String studentId) async {
    try {
      final token = await TokenStorage.getAccessToken();
      if (token == null || token.isEmpty) {
        throw Exception('No access token found');
      }

      final response = await ApiNetwork.getWithAuth(
        endpoint: ApiConfig.submissionsByStudentEndpoint(studentId),
        token: token,
      );

      if (response['success'] == true && response['dataResponse'] != null) {
        final data = response['dataResponse'] as List<dynamic>;
        return data
            .map((item) => Submission.fromJson(item as Map<String, dynamic>))
            .toList();
      }

      return [];
    } catch (e) {
      debugPrint('Failed to get submissions by student: $e');
      throw Exception('Failed to load student submissions: $e');
    }
  }
}

import 'package:flutter/material.dart';
import 'package:mobile/core/configs/api_config.dart';
import 'package:mobile/core/network/api_network.dart';
import 'package:mobile/core/storage/token_storage.dart';
import 'package:mobile/features/models/subject.dart';

class SubjectService {
  static Future<List<Subject>> getActiveSubjects() async {
    try {
      final token = await TokenStorage.getAccessToken();
      if (token == null) throw Exception('No access token found');

      final response = await ApiNetwork.getWithAuth(
        endpoint: ApiConfig.subjectsEndpoint,
        token: token,
      );

      if (response['success'] == true && response['dataResponse'] is List<dynamic>) {
        final data = response['dataResponse'] as List<dynamic>;
        return data
            .map((item) => Subject.fromJson(item as Map<String, dynamic>))
            .where((subject) => !subject.isDeleted)
            .toList();
      }

      return [];
    } catch (e) {
      debugPrint('Failed to load subjects: $e');
      throw Exception('Failed to load subjects: $e');
    }
  }
}

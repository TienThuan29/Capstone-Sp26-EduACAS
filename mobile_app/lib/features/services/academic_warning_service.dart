import 'package:flutter/foundation.dart';
import 'package:mobile/core/configs/api_config.dart';
import 'package:mobile/core/network/api_network.dart';
import 'package:mobile/core/storage/token_storage.dart';
import 'package:mobile/features/models/academic_warning.dart';

class AcademicWarningService {
  static Future<List<StudentWarning>> getByClassroom({
    required String classroomId,
    required String studentId,
    int limit = 50,
  }) async {
    final token = await TokenStorage.getAccessToken();
    if (token == null || token.isEmpty) return [];

    try {
      final response = await ApiNetwork.getWithAuth(
        endpoint: ApiConfig.studentDashboardWarningsEndpoint(classroomId),
        token: token,
        queryParameters: {
          'studentId': studentId,
          'limit': limit.toString(),
        },
      );

      if (response['success'] == true && response['dataResponse'] != null) {
        final List<dynamic> data = response['dataResponse'];
        return data
            .map((json) => StudentWarning.fromJson(json as Map<String, dynamic>))
            .toList();
      }
      return [];
    } catch (e) {
      debugPrint('Failed to fetch academic warnings: $e');
      return [];
    }
  }

  static Future<WarningDetail?> getById(String id) async {
    final token = await TokenStorage.getAccessToken();
    if (token == null || token.isEmpty) return null;

    try {
      final response = await ApiNetwork.getWithAuth(
        endpoint: ApiConfig.academicWarningByIdEndpoint(id),
        token: token,
      );

      if (response['success'] == true && response['dataResponse'] != null) {
        return WarningDetail.fromJson(
            response['dataResponse'] as Map<String, dynamic>);
      }
      return null;
    } catch (e) {
      debugPrint('Failed to fetch warning detail: $e');
      return null;
    }
  }
}

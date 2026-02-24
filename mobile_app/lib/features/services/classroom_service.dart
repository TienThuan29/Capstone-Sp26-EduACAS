import 'package:flutter/material.dart';
import 'package:mobile/core/configs/api_config.dart';
import 'package:mobile/core/network/api_network.dart';
import 'package:mobile/core/storage/token_storage.dart';
import 'package:mobile/features/models/classroom.dart';

class ClassroomService {
  // Get all classrooms for a lecturer
  static Future<List<Classroom>> getLecturerClassrooms() async {
    try {
      final token = await TokenStorage.getAccessToken();
      if (token == null) {
        throw Exception('No access token found');
      }

      final response = await ApiNetwork.getWithAuth(
        endpoint: ApiConfig.lecturerClassroomsEndpoint,
        token: token,
      );

      if (response['success'] == true && response['dataResponse'] != null) {
        final List<dynamic> classroomsData = response['dataResponse'];
        return classroomsData
            .map((json) => Classroom.fromJson(json as Map<String, dynamic>))
            .toList();
      }

      return [];
    } catch (e) {
      debugPrint('Failed to get lecturer classrooms: $e');
      throw Exception('Failed to load classrooms: $e');
    }
  }

  // Get classroom by ID
  static Future<Classroom?> getClassroomById(String classroomId) async {
    try {
      final token = await TokenStorage.getAccessToken();
      if (token == null) {
        throw Exception('No access token found');
      }

      final response = await ApiNetwork.getWithAuth(
        endpoint: ApiConfig.classroomByIdEndpoint(classroomId),
        token: token,
      );

      if (response['success'] == true && response['dataResponse'] != null) {
        return Classroom.fromJson(
          response['dataResponse'] as Map<String, dynamic>,
        );
      }

      return null;
    } catch (e) {
      debugPrint('Failed to get classroom by ID: $e');
      throw Exception('Failed to load classroom details: $e');
    }
  }
}

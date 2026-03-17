import 'package:flutter/material.dart';
import 'package:mobile/core/configs/api_config.dart';
import 'package:mobile/core/network/api_network.dart';
import 'package:mobile/core/storage/token_storage.dart';
import 'package:mobile/features/models/classroom.dart';
import 'package:mobile/features/models/classroom/classroom_model.dart' as paged_models;

class ClassroomService {
  static const String _classroomsEndpoint = '/api/v1/classrooms';
  static const String _enrollEndpoint = '/api/v1/class-enrollments/enroll';

  /// Fetch paginated classrooms, passing userId so the backend fills
  /// the [enrollment.isJoining] flag for the current student.
  static Future<paged_models.PagedClassrooms> getAllClassrooms({
    required String userId,
    int pageIndex = 1,
    int pageSize = 9,
  }) async {
    final token = await TokenStorage.getAccessToken();
    if (token == null || token.isEmpty) {
      throw Exception('No access token found');
    }

    final response = await ApiNetwork.getWithAuth(
      endpoint: _classroomsEndpoint,
      token: token,
      queryParameters: {
        'userId': userId,
        'pageIndex': pageIndex.toString(),
        'pageSize': pageSize.toString(),
      },
    );

    final data = response['dataResponse'];
    if (data == null) {
      return paged_models.PagedClassrooms(
        items: [],
        totalCount: 0,
        pageIndex: pageIndex,
        pageSize: pageSize,
        totalPages: 0,
        hasPreviousPage: false,
        hasNextPage: false,
      );
    }

    return paged_models.PagedClassrooms.fromJson(data as Map<String, dynamic>);
  }

  /// Enroll the current student into a classroom using [enrolKey].
  static Future<Map<String, dynamic>> enrollClassroom({
    required String classId,
    required String studentId,
    required String enrolKey,
  }) async {
    final token = await TokenStorage.getAccessToken();
    if (token == null || token.isEmpty) {
      throw Exception('No access token found');
    }

    final response = await ApiNetwork.postWithAuth(
      endpoint: _enrollEndpoint,
      token: token,
      body: {
        'classId': classId,
        'studentId': studentId,
        'enrolKey': enrolKey,
      },
    );

    return response;
  }

  // Get all classrooms for a lecturer
  static Future<List<Classroom>> getLecturerClassrooms() async {
    try {
      final token = await TokenStorage.getAccessToken();
      if (token == null) {
        throw Exception('No access token found');
      }

      final userId = await TokenStorage.getUserId();
      if (userId == null || userId.isEmpty) {
        throw Exception('No user ID found. Please log in again.');
      }

      final response = await ApiNetwork.getWithAuth(
        endpoint: ApiConfig.lecturerClassroomsEndpoint(userId),
        token: token,
        queryParameters: {
          'pageIndex': '1',
          'pageSize': '100',
        },
      );

      debugPrint('Lecturer classrooms response: $response');

      if (response['success'] == true && response['dataResponse'] != null) {
        final dataResponse = response['dataResponse'];
        // Backend returns PagedResult with 'items' list
        final List<dynamic> classroomsData = dataResponse['items'] ?? [];
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

  // Get all classrooms for a student
  static Future<List<Classroom>> getStudentClassrooms(String studentId) async {
    try {
      final token = await TokenStorage.getAccessToken();
      if (token == null) {
        throw Exception('No access token found');
      }

      final response = await ApiNetwork.getWithAuth(
        endpoint: ApiConfig.studentClassroomsEndpoint(studentId),
        token: token,
        queryParameters: {
          'pageIndex': '1',
          'pageSize': '100',
        },
      );

      debugPrint('Student classrooms response: $response');

      if (response['success'] == true && response['dataResponse'] != null) {
        final dataResponse = response['dataResponse'];
        List<dynamic> classroomsData;
        
        if (dataResponse is Map<String, dynamic>) {
          classroomsData = dataResponse['items'] ?? [];
        } else if (dataResponse is List) {
          classroomsData = dataResponse;
        } else {
          classroomsData = [];
        }
        
        return classroomsData
            .map((json) => Classroom.fromJson(json as Map<String, dynamic>))
            .toList();
      }

      return [];
    } catch (e) {
      debugPrint('Failed to get student classrooms: $e');
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

  // Search classrooms by keyword
  static Future<List<Classroom>> searchClassroomsByKeyword(String keyword) async {
    try {
      final token = await TokenStorage.getAccessToken();
      if (token == null) {
        throw Exception('No access token found');
      }

      final response = await ApiNetwork.postWithAuth(
        endpoint: '$_classroomsEndpoint/search',
        token: token,
        body: {'classCode': keyword},
      );

      if (response['success'] == true && response['dataResponse'] != null) {
        final List<dynamic> classroomsData = response['dataResponse'] is List ? response['dataResponse'] : [];
        return classroomsData.map((json) => Classroom.fromJson(json as Map<String, dynamic>)).toList();
      }

      return [];
    } catch (e) {
      debugPrint('Failed to search classrooms: $e');
      throw Exception('Failed to search classrooms: $e');
    }
  }
}

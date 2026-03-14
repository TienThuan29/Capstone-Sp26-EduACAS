import 'package:flutter/material.dart';
import 'package:mobile/core/configs/api_config.dart';
import 'package:mobile/core/network/api_network.dart';
import 'package:mobile/core/storage/token_storage.dart';
import 'package:mobile/features/models/examination.dart';

class ExaminationService {

  // Get all examinations
  static Future<List<Examination>> getAllExaminations() async {
    try {
      final token = await TokenStorage.getAccessToken();
      if (token == null) {
        throw Exception('No access token found');
      }

      final response = await ApiNetwork.getWithAuth(
        endpoint: ApiConfig.examinationsEndpoint,
        token: token,
      );

      if (response['success'] == true && response['dataResponse'] != null) {
        final List<dynamic> examinationsData = response['dataResponse'];
        return examinationsData
            .map((json) => Examination.fromJson(json as Map<String, dynamic>))
            .toList();
      }

      return [];
    } catch (e) {
      debugPrint('Failed to get examinations: $e');
      throw Exception('Failed to load examinations: $e');
    }
  }

  // Get examinations by class ID
  static Future<List<Examination>> getExaminationsByClassId(
    String classId,
  ) async {
    try {
      final token = await TokenStorage.getAccessToken();
      if (token == null) {
        throw Exception('No access token found');
      }

      final response = await ApiNetwork.getWithAuth(
        endpoint: ApiConfig.examinationsByClassEndpoint(classId),
        token: token,
      );

      if (response['success'] == true && response['dataResponse'] != null) {
        final List<dynamic> examinationsData = response['dataResponse'];
        return examinationsData
            .map((json) => Examination.fromJson(json as Map<String, dynamic>))
            .toList();
      }

      return [];
    } catch (e) {
      debugPrint('Failed to get examinations: $e');
      throw Exception('Failed to load examinations: $e');
    }
  }

  // Get examination by ID
  static Future<Examination?> getExaminationById(String examId) async {
    try {
      final token = await TokenStorage.getAccessToken();
      if (token == null) {
        throw Exception('No access token found');
      }

      final response = await ApiNetwork.getWithAuth(
        endpoint: ApiConfig.examinationByIdEndpoint(examId),
        token: token,
      );

      if (response['success'] == true && response['dataResponse'] != null) {
        return Examination.fromJson(
          response['dataResponse'] as Map<String, dynamic>,
        );
      }

      return null;
    } catch (e) {
      debugPrint('Failed to get examination by ID: $e');
      throw Exception('Failed to load examination details: $e');
    }
  }
}
import 'dart:convert';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:mobile/core/configs/api_config.dart';
import 'package:mobile/core/network/api_network.dart';
import 'package:mobile/core/storage/token_storage.dart';
import 'package:mobile/features/models/material.dart' as model;

class MaterialService {
  // Get all materials for a classroom
  static Future<List<model.Material>> getMaterialsByClassroom(
    String classroomId,
  ) async {
    try {
      final token = await TokenStorage.getAccessToken();
      if (token == null) {
        throw Exception('No access token found');
      }

      final response = await ApiNetwork.getWithAuth(
        endpoint: ApiConfig.materialsByClassroomEndpoint(classroomId),
        token: token,
      );

      if (response['success'] == true && response['dataResponse'] != null) {
        final List<dynamic> materialsData = response['dataResponse'];
        return materialsData
            .map((json) => model.Material.fromJson(json as Map<String, dynamic>))
            .toList();
      }

      return [];
    } catch (e) {
      debugPrint('Failed to get materials: $e');
      throw Exception('Failed to load materials: $e');
    }
  }

  // Create a new material (multipart/form-data)
  static Future<model.Material> createMaterial({
    required String classroomId,
    required String lecturerId,
    required File file,
    String description = '',
  }) async {
    try {
      final token = await TokenStorage.getAccessToken();
      if (token == null) {
        throw Exception('No access token found');
      }

      final uri = Uri.parse(
        '${ApiConfig.baseUrl}${ApiConfig.createMaterialEndpoint}',
      );

      final request = http.MultipartRequest('POST', uri)
        ..headers['Authorization'] = 'Bearer $token'
        ..headers['Accept'] = 'application/json'
        ..fields['ClassroomId'] = classroomId
        ..fields['LecturerId'] = lecturerId
        ..fields['Description'] = description
        ..files.add(
          await http.MultipartFile.fromPath(
            'File',
            file.path,
            filename: file.uri.pathSegments.isNotEmpty
                ? file.uri.pathSegments.last
                : 'upload_file',
          ),
        );

      final streamedResponse = await request.send().timeout(
        ApiConfig.requestTimeout,
        onTimeout: () {
          throw Exception(
            'Request timeout after ${ApiConfig.requestTimeout.inSeconds} seconds',
          );
        },
      );

      final responseBody = await streamedResponse.stream.bytesToString();
      final statusCode = streamedResponse.statusCode;

      if (statusCode < 200 || statusCode >= 300) {
        throw Exception('HTTP $statusCode: $responseBody');
      }

      final decoded = jsonDecode(responseBody);
      if (decoded is! Map<String, dynamic>) {
        throw Exception('Invalid response format from server');
      }

      if (decoded['success'] == true && decoded['dataResponse'] is Map) {
        return model.Material.fromJson(
          Map<String, dynamic>.from(decoded['dataResponse'] as Map),
        );
      }

      throw Exception(decoded['message'] ?? 'Failed to upload material');
    } catch (e) {
      debugPrint('Failed to create material: $e');
      throw Exception('Failed to upload material: $e');
    }
  }

  // Delete a material
  static Future<bool> deleteMaterial(String materialId) async {
    try {
      final token = await TokenStorage.getAccessToken();
      if (token == null) {
        throw Exception('No access token found');
      }

      final response = await ApiNetwork.deleteWithAuth(
        endpoint: ApiConfig.deleteMaterialEndpoint(materialId),
        token: token,
      );

      return response['success'] == true;
    } catch (e) {
      debugPrint('Failed to delete material: $e');
      throw Exception('Failed to delete material: $e');
    }
  }

  // Get private file URL
  static Future<String> getPrivateFileUrl(String filename) async {
    try {
      final token = await TokenStorage.getAccessToken();
      if (token == null) {
        throw Exception('No access token found');
      }

      final response = await ApiNetwork.getWithAuth(
        endpoint: ApiConfig.privateFileUrlEndpoint(filename),
        token: token,
      );

      if (response['success'] == true && response['dataResponse'] != null) {
        final dataResponse = response['dataResponse'];

        if (dataResponse is String && dataResponse.isNotEmpty) {
          return dataResponse;
        }

        if (dataResponse is Map<String, dynamic>) {
          final url = dataResponse['url'];
          if (url is String && url.isNotEmpty) {
            return url;
          }

          final fileUrl = dataResponse['fileUrl'];
          if (fileUrl is String && fileUrl.isNotEmpty) {
            return fileUrl;
          }
        }
      }

      throw Exception('Failed to get file URL');
    } catch (e) {
      debugPrint('Failed to get private file URL: $e');
      throw Exception('Failed to get file URL: $e');
    }
  }
}

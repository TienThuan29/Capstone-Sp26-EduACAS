import 'package:flutter/material.dart';
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
        return response['dataResponse'] as String;
      }

      throw Exception('Failed to get file URL');
    } catch (e) {
      debugPrint('Failed to get private file URL: $e');
      throw Exception('Failed to get file URL: $e');
    }
  }
}

import 'package:flutter/material.dart';
import 'package:mobile/core/configs/api_config.dart';
import 'package:mobile/core/network/api_network.dart';
import 'package:mobile/core/storage/token_storage.dart';
import 'package:mobile/features/models/discussion_issue.dart';
import 'package:mobile/features/services/discussion_service.dart';

class DiscussionProvider {
  bool isLoading = false;
  String? errorMessage;
  List<DiscussionIssue> discussions = [];
  String searchQuery = '';

  Future<void> fetchDiscussions(Function() onUpdate, {String? classId}) async {
    isLoading = true;
    errorMessage = null;
    onUpdate();

    try {
      if (classId != null) {
        final List<Map<String, dynamic>> rawData = await DiscussionIssueService.getByClassroomId(classId);
        discussions = rawData.map((json) => DiscussionIssue.fromJson(json)).toList();
      } else {
        // Fallback or generic fetch if needed
        final token = await TokenStorage.getAccessToken();
        if (token == null) throw Exception('No access token found');

        final response = await ApiNetwork.getWithAuth(
          endpoint: ApiConfig.createDiscussionIssueEndpoint,
          token: token,
        );

        if (response['success'] == true && response['dataResponse'] != null) {
          final List<dynamic> data = response['dataResponse'];
          discussions = data.map((json) => DiscussionIssue.fromJson(json as Map<String, dynamic>)).toList();
        } else {
          errorMessage = response['message'] ?? 'Failed to load discussions';
        }
      }
    } catch (e) {
      debugPrint('Failed to get discussions: $e');
      errorMessage = e.toString();
    } finally {
      isLoading = false;
      onUpdate();
    }
  }

  void updateSearchQuery(String query, Function() onUpdate) {
    searchQuery = query;
    onUpdate();
  }

  List<DiscussionIssue> getFilteredDiscussions() {
    if (searchQuery.isEmpty) return discussions;
    final query = searchQuery.toLowerCase().trim();
    return discussions.where((d) => d.title.toLowerCase().contains(query)).toList();
  }
}

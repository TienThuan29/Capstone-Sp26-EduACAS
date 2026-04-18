import 'package:flutter/material.dart';
import 'package:mobile/features/models/discussion_issue.dart';
import 'package:mobile/features/services/discussion_service.dart';

class DiscussionProvider {
  bool isLoading = false;
  String? errorMessage;
  List<DiscussionIssueListItem> discussions = [];
  String searchQuery = '';
  int totalCount = 0;

  Future<void> fetchDiscussions(Function() onUpdate, {String? classId}) async {
    isLoading = true;
    errorMessage = null;
    onUpdate();

    try {
      if (classId != null) {
        // Use the paged API (fetch first page with large page size for simplicity)
        final paged = await DiscussionIssueService.getPagedByClassroom(
          classId,
          pageIndex: 1,
          pageSize: 100,
        );
        discussions = paged.items;
        totalCount = paged.totalCount;
      } else {
        discussions = [];
        totalCount = 0;
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

  List<DiscussionIssueListItem> getFilteredDiscussions() {
    if (searchQuery.isEmpty) return discussions;
    final query = searchQuery.toLowerCase().trim();
    return discussions
        .where((d) => d.title.toLowerCase().contains(query))
        .toList();
  }
}

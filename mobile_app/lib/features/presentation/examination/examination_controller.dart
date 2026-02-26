import 'package:mobile/core/storage/token_storage.dart';
import 'package:mobile/features/models/examination/examination.dart';
import 'package:mobile/features/services/examination_service.dart';

class ExaminationController {
  bool isLoading = false;
  String? errorMessage;
  List<Examination> examinations = [];

  Future<void> fetchExaminations(Function() onUpdate) async {
    isLoading = true;
    errorMessage = null;
    onUpdate();

    try {
      final token = await TokenStorage.getAccessToken();
      if (token == null) {
        throw Exception('No access token found');
      }

      final response = await ExaminationService.getAllExaminations(token);

      if (response['success'] == true && response['dataResponse'] != null) {
        final List<dynamic> data = response['dataResponse'];
        examinations = data.map((json) => Examination.fromJson(json)).toList();
      } else {
        errorMessage = response['message'] ?? 'Failed to load examinations';
      }
    } catch (e) {
      errorMessage = e.toString();
    } finally {
      isLoading = false;
      onUpdate();
    }
  }

  String searchQuery = '';

  void updateSearchQuery(String query, Function() onUpdate) {
    searchQuery = query;
    onUpdate();
  }

  Map<String, List<Examination>> getGroupedExaminations() {
    final filtered = examinations.where((e) {
      final query = searchQuery.toLowerCase().trim();
      if (query.isEmpty) return true;
      return e.examName.toLowerCase().contains(query) ||
          e.classroom.className.toLowerCase().contains(query);
    }).toList();

    final pending = filtered.where((e) => e.status == 0).toList();
    final ongoing = filtered.where((e) => e.status == 1).toList();
    final completed = filtered.where((e) => e.status == 2).toList();

    final Map<String, List<Examination>> grouped = {};
    if (ongoing.isNotEmpty) grouped['Ongoing'] = ongoing;
    if (pending.isNotEmpty) grouped['Pending'] = pending;
    if (completed.isNotEmpty) grouped['Completed'] = completed;

    return grouped;
  }
}

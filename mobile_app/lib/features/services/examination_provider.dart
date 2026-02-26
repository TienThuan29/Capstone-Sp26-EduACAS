import 'package:mobile/features/models/examination.dart';
import 'package:mobile/features/services/examination_service.dart';

class ExaminationProvider {
  bool isLoading = false;
  String? errorMessage;
  List<Examination> examinations = [];
  String searchQuery = '';

  Future<void> fetchExaminations(Function() onUpdate, {String? classId}) async {
    isLoading = true;
    errorMessage = null;
    onUpdate();

    try {
      if (classId != null) {
        examinations = await ExaminationService.getExaminationsByClassId(classId);
      } else {
        examinations = await ExaminationService.getAllExaminations();
      }
    } catch (e) {
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

  Map<String, List<Examination>> getGroupedExaminations() {
    final filtered = examinations.where((e) {
      final query = searchQuery.toLowerCase().trim();
      if (query.isEmpty) return true;
      return e.examName.toLowerCase().contains(query) ||
          e.classroom.className.toLowerCase().contains(query);
    }).toList();

    final ongoing = filtered.where((e) => e.status == ExaminationStatus.ongoing).toList();
    final pending = filtered.where((e) => e.status == ExaminationStatus.pending).toList();
    final completed = filtered.where((e) => e.status == ExaminationStatus.completed).toList();

    final Map<String, List<Examination>> grouped = {};
    if (ongoing.isNotEmpty) grouped['Ongoing'] = ongoing;
    if (pending.isNotEmpty) grouped['Pending'] = pending;
    if (completed.isNotEmpty) grouped['Completed'] = completed;

    return grouped;
  }
}

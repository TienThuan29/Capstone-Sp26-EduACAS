import 'package:flutter/material.dart';
import 'package:mobile/core/theme/app_colors.dart';
import 'package:mobile/core/widgets/background.dart';
import 'package:mobile/features/models/examination.dart';
import 'package:mobile/features/presentation/examination/examination_detail_page.dart';
import 'package:mobile/features/services/examination_provider.dart';

class StudentExaminationsTab extends StatefulWidget {
  final String classroomId;

  const StudentExaminationsTab({
    super.key,
    required this.classroomId,
  });

  @override
  State<StudentExaminationsTab> createState() => _StudentExaminationsTabState();
}

class _StudentExaminationsTabState extends State<StudentExaminationsTab> {
  final _controller = ExaminationProvider();
  final _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadExaminations();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadExaminations() async {
    await _controller.fetchExaminations(
      () { if (mounted) setState(() {}); },
      classId: widget.classroomId,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        const GradientBackground(),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildStickyHeader(),
            _buildSearchBar(),
            Expanded(
              child: _controller.isLoading
                  ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
                  : _controller.errorMessage != null
                      ? _buildErrorState()
                      : _buildGroupedExaminationList(),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildStickyHeader() {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 24, 16, 8),
      child: Row(
        children: [
          Container(
            width: 8,
            height: 32,
            decoration: BoxDecoration(
              color: AppColors.primary,
              borderRadius: BorderRadius.circular(4),
            ),
          ),
          const SizedBox(width: 12),
          const Text(
            'Examinations',
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.w900,
              color: AppColors.textPrimary,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSearchBar() {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
      child: TextField(
        controller: _searchController,
        onChanged: (value) => _controller.updateSearchQuery(value, () => setState(() {})),
        decoration: InputDecoration(
          hintText: 'Search by exam name...',
          prefixIcon: const Icon(Icons.search, color: AppColors.textLight, size: 20),
          filled: true,
          fillColor: Colors.white,
          hoverColor: Colors.white,
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide(color: Colors.grey.withValues(alpha: 0.2)),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide(color: Colors.grey.withValues(alpha: 0.2)),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: AppColors.primary, width: 1.5),
          ),
          contentPadding: const EdgeInsets.symmetric(vertical: 0),
        ),
      ),
    );
  }

  Widget _buildGroupedExaminationList() {
    final groupedExams = _controller.getGroupedExaminations();

    if (groupedExams.isEmpty) {
      return _buildEmptyState();
    }

    return RefreshIndicator(
      onRefresh: _loadExaminations,
      color: AppColors.primary,
      child: ListView.builder(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 0),
        itemCount: _calculateTotalItems(groupedExams),
        itemBuilder: (context, index) {
          return _buildItemAt(index, groupedExams);
        },
      ),
    );
  }

  int _calculateTotalItems(Map<String, List<Examination>> grouped) {
    int count = 0;
    for (var list in grouped.values) {
      count += 1; // Header
      count += list.length;
    }
    return count;
  }

  Widget _buildItemAt(int index, Map<String, List<Examination>> grouped) {
    int currentIndex = 0;
    for (var entry in grouped.entries) {
      if (currentIndex == index) {
        return _buildSectionHeader(entry.key);
      }
      currentIndex++;

      if (index < currentIndex + entry.value.length) {
        final exam = entry.value[index - currentIndex];
        return _ExaminationCard(
          examination: exam,
          onTap: () => _navigateToExaminationDetail(exam),
        );
      }
      currentIndex += entry.value.length;
    }
    return const SizedBox.shrink();
  }

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(4, 20, 4, 12),
      child: Text(
        title.toUpperCase(),
        style: TextStyle(
          color: AppColors.textLight,
          fontSize: 11,
          fontWeight: FontWeight.w800,
          letterSpacing: 1.5,
        ),
      ),
    );
  }

  Widget _buildErrorState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 64, color: AppColors.error),
            const SizedBox(height: 16),
            Text(
              _controller.errorMessage ?? 'An error occurred',
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 16, color: Colors.grey),
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: _loadExaminations,
              child: const Text('Try Again'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.5),
              shape: BoxShape.circle,
            ),
            child: Icon(Icons.assignment_outlined, size: 64, color: Colors.grey[300]),
          ),
          const SizedBox(height: 16),
          Text(
            _controller.searchQuery.isEmpty 
                ? 'There are no examinations currently.'
                : 'No results for "${_controller.searchQuery}"',
            style: TextStyle(fontSize: 16, color: Colors.grey[600], fontWeight: FontWeight.w500),
          ),
        ],
      ),
    );
  }

  void _navigateToExaminationDetail(Examination exam) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => ExaminationDetailPage(
          examination: exam,
        ),
      ),
    );
  }
}

class _ExaminationCard extends StatelessWidget {
  final Examination examination;
  final VoidCallback onTap;

  const _ExaminationCard({
    required this.examination,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.withValues(alpha: 0.1)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Text(
                      examination.examName,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: AppColors.textPrimary,
                        height: 1.3,
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  _buildStatusBadge(examination.status),
                ],
              ),
              const SizedBox(height: 16),
              
              // Mode & Language Badges
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                   _buildTag(
                    text: examination.mode == ExaminationMode.examination ? 'EXAMINATION' : 'PRACTICAL',
                    color: Colors.blue,
                  ),
                  if (examination.programmingLanguage.name.isNotEmpty)
                    _buildTag(
                      text: examination.programmingLanguage.name,
                      color: Colors.purple,
                    ),
                  if (examination.isPublicResult)
                    _buildTag(
                      text: 'PUBLIC RESULT',
                      color: Colors.green,
                    ),
                ],
              ),
              
              const SizedBox(height: 16),
              if (examination.description.isNotEmpty) ...[
                Text(
                  examination.description,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(color: Colors.grey[600], fontSize: 13, height: 1.4),
                ),
                const SizedBox(height: 16),
              ],
              
              // Stats List (Web Style)
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.background,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Column(
                  children: [
                    _buildStatRow('Start', _formatDateTime(examination.startDatetime)),
                    const SizedBox(height: 6),
                    _buildStatRow('End', _formatDateTime(examination.endDatetime)),
                    const SizedBox(height: 6),
                    _buildStatRow('Duration', '${_calculateDuration(examination)} mins'),
                    const SizedBox(height: 6),
                    _buildStatRow('Total Mark', examination.totalMark.toString()),
                    const SizedBox(height: 6),
                    _buildStatRow('Problems', examination.problems.length.toString()),
                  ],
                ),
              ),
              
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton(
                  onPressed: onTap,
                  style: OutlinedButton.styleFrom(
                    side: BorderSide(color: Colors.grey.withValues(alpha: 0.3)),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    padding: const EdgeInsets.symmetric(vertical: 10),
                  ),
                  child: const Text(
                    'Details',
                    style: TextStyle(
                      color: AppColors.textPrimary,
                      fontWeight: FontWeight.bold,
                      fontSize: 14,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTag({required String text, required Color color}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        text,
        style: TextStyle(
          color: color,
          fontSize: 10,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }

  Widget _buildStatRow(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
        ),
        Text(
          value,
          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
        ),
      ],
    );
  }

  Widget _buildStatusBadge(ExaminationStatus status) {
    Color color;
    String label = status.name.toUpperCase();
    
    switch (status) {
      case ExaminationStatus.ongoing:
        color = Colors.green;
        label = 'ONGOING';
        break;
      case ExaminationStatus.pending:
        color = Colors.amber;
        label = 'UPCOMING';
        break;
      case ExaminationStatus.completed:
        color = Colors.grey;
        label = 'ENDED';
        break;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(100),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: color,
          fontSize: 9,
          fontWeight: FontWeight.w900,
        ),
      ),
    );
  }

  String _formatDateTime(String dateTimeStr) {
    if (dateTimeStr.isEmpty) return 'N/A';
    try {
      final dt = DateTime.parse(dateTimeStr);
      return '${dt.day}/${dt.month}/${dt.year} ${dt.hour}:${dt.minute.toString().padLeft(2, '0')}';
    } catch (e) {
      return dateTimeStr.split('T')[0];
    }
  }

  int _calculateDuration(Examination exam) {
    try {
      final start = DateTime.parse(exam.startDatetime);
      final end = DateTime.parse(exam.endDatetime);
      return end.difference(start).inMinutes;
    } catch (e) {
      return 0;
    }
  }
}


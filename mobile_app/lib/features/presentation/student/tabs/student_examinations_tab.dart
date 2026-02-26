import 'package:flutter/material.dart';
import 'package:mobile/core/theme/app_colors.dart';
import 'package:mobile/core/widgets/background.dart';
import 'package:mobile/features/models/examination.dart';
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
          children: [
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

  Widget _buildSearchBar() {
    return Container(
      padding: const EdgeInsets.fromLTRB(24, 16, 24, 8),
      child: TextField(
        controller: _searchController,
        onChanged: (value) => _controller.updateSearchQuery(value, () => setState(() {})),
        decoration: InputDecoration(
          hintText: 'Search examinations...',
          prefixIcon: const Icon(Icons.search, color: Colors.grey),
          filled: true,
          fillColor: Colors.white.withOpacity(0.8),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(15),
            borderSide: BorderSide.none,
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
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
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
          onTap: () => _showExaminationDetailModal(exam),
        );
      }
      currentIndex += entry.value.length;
    }
    return const SizedBox.shrink();
  }

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.only(top: 16, bottom: 8, left: 4),
      child: Text(
        title.toUpperCase(),
        style: TextStyle(
          color: Colors.grey[700],
          fontSize: 12,
          fontWeight: FontWeight.bold,
          letterSpacing: 1.2,
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
          Icon(Icons.assignment_outlined, size: 80, color: Colors.grey[300]),
          const SizedBox(height: 16),
          Text(
            _controller.searchQuery.isEmpty 
                ? 'No examinations for this class'
                : 'No results for "${_controller.searchQuery}"',
            style: TextStyle(fontSize: 18, color: Colors.grey[600]),
          ),
        ],
      ),
    );
  }

  void _showExaminationDetailModal(Examination exam) {
    showDialog(
      context: context,
      builder: (context) => _ExaminationDetailDialog(examination: exam),
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
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  _buildStatusBadge(examination.status),
                ],
              ),
              const SizedBox(height: 12),
              Text(
                examination.examName,
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Colors.black87,
                ),
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  const Icon(Icons.code, size: 14, color: Colors.grey),
                  const SizedBox(width: 4),
                  Text(
                    'Language: ${examination.programmingLanguage.name}',
                    style: const TextStyle(color: Colors.grey, fontSize: 12),
                  ),
                ],
              ),
              const SizedBox(height: 4),
              Row(
                children: [
                   const Icon(Icons.schedule, size: 14, color: Colors.grey),
                   const SizedBox(width: 4),
                   Text(
                     'Starts: ${_formatDateTime(examination.startDatetime)}',
                     style: const TextStyle(
                       color: Colors.grey,
                       fontSize: 12,
                     ),
                   ),
                ],
              ),
              const SizedBox(height: 12),
              const Divider(height: 1),
              const SizedBox(height: 12),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.star_outline, size: 14, color: Colors.orange),
                      const SizedBox(width: 4),
                      Text(
                        'Total Mark: ${examination.totalMark}',
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                  const Icon(Icons.arrow_forward_ios, size: 12, color: Colors.grey),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatusBadge(ExaminationStatus status) {
    Color color;
    String label = status.name.toUpperCase();
    
    switch (status) {
      case ExaminationStatus.ongoing:
        color = Colors.green;
        label = 'Ongoing';
        break;
      case ExaminationStatus.pending:
        color = Colors.orange;
        label = 'Pending';
        break;
      case ExaminationStatus.completed:
        color = Colors.grey;
        label = 'Completed';
        break;
      default:
        color = Colors.grey;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: color,
          fontSize: 10,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }

  String _formatDateTime(String dateTimeStr) {
    if (dateTimeStr.isEmpty) return 'N/A';
    try {
      final dt = DateTime.parse(dateTimeStr);
      return '${dt.day}/${dt.month} ${dt.hour}:${dt.minute.toString().padLeft(2, '0')}';
    } catch (e) {
      return dateTimeStr.split('T')[0];
    }
  }
}

class _ExaminationDetailDialog extends StatelessWidget {
  final Examination examination;

  const _ExaminationDetailDialog({required this.examination});

  @override
  Widget build(BuildContext context) {
    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      child: Container(
        constraints: const BoxConstraints(maxWidth: 500),
        padding: const EdgeInsets.all(24),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Examination Detail',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.primary),
                  ),
                  IconButton(onPressed: () => Navigator.pop(context), icon: const Icon(Icons.close)),
                ],
              ),
              const Divider(),
              const SizedBox(height: 16),
              _buildDetailRow(Icons.assignment, 'Name', examination.examName),
              _buildDetailRow(Icons.code, 'Language', examination.programmingLanguage.name),
              _buildDetailRow(Icons.star, 'Total Mark', '${examination.totalMark} pts'),
              _buildDetailRow(Icons.schedule, 'Start', _formatFullDateTime(examination.startDatetime)),
              _buildDetailRow(Icons.timer_off, 'End', _formatFullDateTime(examination.endDatetime)),
              _buildDetailRow(Icons.info_outline, 'Status', examination.getStatusText()),
              const SizedBox(height: 24),
              const Text('Points Breakdown', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
              const SizedBox(height: 12),
              ListView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: examination.examProblems.length,
                itemBuilder: (context, index) {
                  final problem = examination.examProblems[index];
                  return Padding(
                    padding: const EdgeInsets.symmetric(vertical: 4),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('Problem ${index + 1}', style: const TextStyle(color: Colors.black54)),
                        Text('${problem.mark} pts', style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.primary)),
                      ],
                    ),
                  );
                },
              ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () => Navigator.pop(context),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                  child: const Text('Got it', style: TextStyle(color: Colors.white)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildDetailRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          Icon(icon, size: 18, color: Colors.grey),
          const SizedBox(width: 12),
          Text('$label: ', style: const TextStyle(color: Colors.grey, fontSize: 14)),
          Expanded(child: Text(value, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14))),
        ],
      ),
    );
  }

  String _formatFullDateTime(String dateTimeStr) {
    if (dateTimeStr.isEmpty) return 'N/A';
    try {
      final dt = DateTime.parse(dateTimeStr);
      return '${dt.day}/${dt.month}/${dt.year} ${dt.hour}:${dt.minute.toString().padLeft(2, '0')}';
    } catch (e) {
      return dateTimeStr;
    }
  }
}

import 'package:flutter/material.dart';
import 'package:mobile/core/theme/app_colors.dart';
import 'package:mobile/features/models/examination.dart';
import 'package:mobile/features/services/examination_service.dart';
import 'package:mobile/features/presentation/lecturer/examination_detail_page.dart';

class AssignmentsTab extends StatefulWidget {
  final String classroomId;

  const AssignmentsTab({
    super.key,
    required this.classroomId,
  });

  @override
  State<AssignmentsTab> createState() => _AssignmentsTabState();
}

class _AssignmentsTabState extends State<AssignmentsTab> {
  List<Examination> _examinations = [];
  bool _isLoading = true;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _loadExaminations();
  }

  Future<void> _loadExaminations() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final examinations =
          await ExaminationService.getExaminationsByClassId(widget.classroomId);
      setState(() {
        _examinations = examinations;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _errorMessage = e.toString();
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(
        child: CircularProgressIndicator(),
      );
    }

    if (_errorMessage != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.error_outline,
              size: 64,
              color: AppColors.error,
            ),
            const SizedBox(height: 16),
            Text(
              'Error loading exercises',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 8),
            Text(
              _errorMessage!,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: AppColors.textSecondary,
                  ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            ElevatedButton.icon(
              onPressed: _loadExaminations,
              icon: const Icon(Icons.refresh),
              label: const Text('Retry'),
            ),
          ],
        ),
      );
    }

    if (_examinations.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.assignment_outlined,
              size: 64,
              color: AppColors.textSecondary,
            ),
            const SizedBox(height: 16),
            Text(
              'No exercises found',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 8),
            Text(
              'No exercises or assignments have been created yet',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: AppColors.textSecondary,
                  ),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadExaminations,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _examinations.length,
        itemBuilder: (context, index) {
          final examination = _examinations[index];
          return _buildExaminationCard(examination);
        },
      ),
    );
  }

  Widget _buildExaminationCard(Examination examination) {
    final now = DateTime.now();
    final startDate = DateTime.parse(examination.startDatetime);
    final endDate = DateTime.parse(examination.endDatetime);

    Color statusColor;
    String statusText;
    IconData statusIcon;

    if (now.isBefore(startDate)) {
      statusColor = AppColors.warning;
      statusText = 'Pending';
      statusIcon = Icons.schedule;
    } else if (now.isAfter(endDate)) {
      statusColor = AppColors.textSecondary;
      statusText = 'Completed';
      statusIcon = Icons.check_circle;
    } else {
      statusColor = AppColors.success;
      statusText = 'Ongoing';
      statusIcon = Icons.play_circle;
    }

    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      child: InkWell(
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => ExaminationDetailPage(
                examination: examination,
              ),
            ),
          );
        },
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: AppColors.primary.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Icon(
                      examination.mode == ExaminationMode.practical
                          ? Icons.code
                          : Icons.assignment,
                      color: AppColors.primary,
                      size: 24,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          examination.examName,
                          style:
                              Theme.of(context).textTheme.titleSmall?.copyWith(
                                    fontWeight: FontWeight.bold,
                                  ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 4),
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 8,
                                vertical: 2,
                              ),
                              decoration: BoxDecoration(
                                color: statusColor.withOpacity(0.2),
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(
                                    statusIcon,
                                    size: 12,
                                    color: statusColor,
                                  ),
                                  const SizedBox(width: 4),
                                  Text(
                                    statusText,
                                    style: TextStyle(
                                      color: statusColor,
                                      fontSize: 12,
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(width: 8),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 8,
                                vertical: 2,
                              ),
                              decoration: BoxDecoration(
                                color: AppColors.accent.withOpacity(0.2),
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: Text(
                                examination.getModeText(),
                                style: const TextStyle(
                                  color: AppColors.accent,
                                  fontSize: 12,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const Icon(
                    Icons.chevron_right,
                    color: AppColors.textSecondary,
                  ),
                ],
              ),
              const SizedBox(height: 12),
              const Divider(),
              const SizedBox(height: 8),
              Row(
                children: [
                  Icon(
                    Icons.calendar_today,
                    size: 14,
                    color: AppColors.textSecondary,
                  ),
                  const SizedBox(width: 6),
                  Text(
                    'Start: ${_formatDate(examination.startDatetime)}',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: AppColors.textSecondary,
                        ),
                  ),
                ],
              ),
              const SizedBox(height: 4),
              Row(
                children: [
                  Icon(
                    Icons.event,
                    size: 14,
                    color: AppColors.textSecondary,
                  ),
                  const SizedBox(width: 6),
                  Text(
                    'End: ${_formatDate(examination.endDatetime)}',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: AppColors.textSecondary,
                        ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  Icon(
                    Icons.code,
                    size: 14,
                    color: AppColors.textSecondary,
                  ),
                  const SizedBox(width: 6),
                  Text(
                    examination.programmingLanguage.name,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: AppColors.textSecondary,
                        ),
                  ),
                  const Spacer(),
                  Icon(
                    Icons.quiz,
                    size: 14,
                    color: AppColors.textSecondary,
                  ),
                  const SizedBox(width: 6),
                  Text(
                    '${examination.problems.length} problem${examination.problems.length > 1 ? 's' : ''}',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: AppColors.textSecondary,
                        ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _formatDate(String dateString) {
    try {
      final date = DateTime.parse(dateString);
      return '${date.day}/${date.month}/${date.year} ${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}';
    } catch (e) {
      return dateString;
    }
  }
}

import 'package:flutter/material.dart';
import 'package:mobile/core/theme/app_colors.dart';
import 'package:mobile/features/models/examination.dart';

class ExaminationDetailPage extends StatefulWidget {
  final Examination examination;

  const ExaminationDetailPage({
    super.key,
    required this.examination,
  });

  @override
  State<ExaminationDetailPage> createState() => _ExaminationDetailPageState();
}

class _ExaminationDetailPageState extends State<ExaminationDetailPage> {
  @override
  Widget build(BuildContext context) {
    final examination = widget.examination;
    final now = DateTime.now();
    final startDate = DateTime.parse(examination.startDatetime);
    final endDate = DateTime.parse(examination.endDatetime);

    String statusText;

    if (now.isBefore(startDate)) {
      statusText = 'Pending';
    } else if (now.isAfter(endDate)) {
      statusText = 'Completed';
    } else {
      statusText = 'Ongoing';
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Exercise Details'),
        elevation: 0,
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header with gradient background
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(20),
              decoration: const BoxDecoration(
                gradient: AppColors.primaryGradient,
                borderRadius: BorderRadius.only(
                  bottomLeft: Radius.circular(24),
                  bottomRight: Radius.circular(24),
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    examination.examName,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.2),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      statusText,
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ],
              ),
            ),

            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Basic Information Card
                  _buildInfoCard(
                    context,
                    title: 'Basic Information',
                    children: [
                      _buildInfoRow(
                        context,
                        icon: Icons.category,
                        label: 'Type',
                        value: examination.getModeText(),
                      ),
                      _buildInfoRow(
                        context,
                        icon: Icons.code,
                        label: 'Language',
                        value: examination.programmingLanguage.name,
                      ),
                      _buildInfoRow(
                        context,
                        icon: Icons.star,
                        label: 'Total Marks',
                        value: examination.totalMark.toString(),
                      ),
                      _buildInfoRow(
                        context,
                        icon: Icons.quiz,
                        label: 'Problems',
                        value: '${examination.problems.length}',
                      ),
                    ],
                  ),

                  const SizedBox(height: 16),

                  // Schedule Card
                  _buildInfoCard(
                    context,
                    title: 'Schedule',
                    children: [
                      _buildInfoRow(
                        context,
                        icon: Icons.calendar_today,
                        label: 'Start Date',
                        value: _formatDate(examination.startDatetime),
                      ),
                      _buildInfoRow(
                        context,
                        icon: Icons.event,
                        label: 'End Date',
                        value: _formatDate(examination.endDatetime),
                      ),
                    ],
                  ),

                  const SizedBox(height: 16),

                  // Description Card
                  if (examination.description.isNotEmpty)
                    _buildInfoCard(
                      context,
                      title: 'Description',
                      children: [
                        Text(
                          examination.description,
                          style: Theme.of(context).textTheme.bodyMedium,
                        ),
                      ],
                    ),

                  const SizedBox(height: 16),

                  // Problems List Card
                  _buildInfoCard(
                    context,
                    title: 'Problems (${examination.problems.length})',
                    children: examination.problems.isEmpty
                        ? [
                            const Center(
                              child: Padding(
                                padding: EdgeInsets.all(16),
                                child: Text('No problems available'),
                              ),
                            ),
                          ]
                        : examination.problems
                            .asMap()
                            .entries
                            .map((entry) {
                            final index = entry.key;
                            final problem = entry.value;
                            final examProblem = examination.examProblems
                                .firstWhere(
                              (ep) => ep.problemId == problem.id,
                              orElse: () => ExamProblem(
                                problemId: problem.id,
                                mark: 0,
                              ),
                            );

                            return _buildProblemCard(
                              context,
                              index: index + 1,
                              problem: problem,
                              mark: examProblem.mark,
                            );
                          }).toList(),
                  ),

                  const SizedBox(height: 16),

                  // Submission Button (Coming Soon)
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: () {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text(
                              'Submission list feature is coming soon',
                            ),
                          ),
                        );
                      },
                      icon: const Icon(Icons.list),
                      label: const Text('View Submissions'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoCard(
    BuildContext context, {
    required String title,
    required List<Widget> children,
  }) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              title,
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
            ),
            const SizedBox(height: 12),
            ...children,
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(
    BuildContext context, {
    required IconData icon,
    required String label,
    required String value,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          Icon(
            icon,
            size: 20,
            color: AppColors.textSecondary,
          ),
          const SizedBox(width: 12),
          Text(
            label,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: AppColors.textSecondary,
                ),
          ),
          const Spacer(),
          Text(
            value,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  fontWeight: FontWeight.w500,
                ),
          ),
        ],
      ),
    );
  }

  Widget _buildProblemCard(
    BuildContext context, {
    required int index,
    required Problem problem,
    required double mark,
  }) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(8),
        side: BorderSide(
          color: AppColors.primary.withValues(alpha: 0.2),
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(6),
                  decoration: BoxDecoration(
                    color: AppColors.primary.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    '#$index',
                    style: const TextStyle(
                      color: AppColors.primary,
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    problem.title,
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: AppColors.accent.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(
                    '${mark.toStringAsFixed(1)} pts',
                    style: const TextStyle(
                      color: AppColors.accent,
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                    ),
                  ),
                ),
              ],
            ),
            if (problem.content.isNotEmpty) ...[
              const SizedBox(height: 8),
              Text(
                problem.content,
                style: Theme.of(context).textTheme.bodySmall,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ],
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

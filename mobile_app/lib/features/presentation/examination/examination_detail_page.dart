import 'package:flutter/material.dart';
import 'package:mobile/core/theme/app_colors.dart';
import 'package:mobile/core/widgets/background.dart';
import 'package:mobile/features/models/examination.dart';
import 'package:mobile/features/services/problem_service.dart';
import 'package:mobile/features/models/problem.dart' as detail_model;

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
  List<Problem> _problems = [];
  bool _isLoadingProblems = false;

  @override
  void initState() {
    super.initState();
    _problems = List.from(widget.examination.problems);
    if (_problems.isEmpty && widget.examination.examProblems.isNotEmpty) {
      _fetchProblemDetails();
    }
  }

  Future<void> _fetchProblemDetails() async {
    setState(() {
      _isLoadingProblems = true;
    });

    try {
      final fetchedProblems = await Future.wait(
        widget.examination.examProblems.map((ep) => ProblemService.getById(ep.problemId)),
      );

      if (mounted) {
        setState(() {
          _problems = fetchedProblems
              .where((p) => p != null)
              .map((p) => Problem(
                    id: p!.id,
                    examId: widget.examination.id,
                    lecturerId: p.lecturerId,
                    title: p.title,
                    content: p.content,
                    difficulty: _mapDifficulty(p.difficulty),
                    testCases: p.testCases
                        .map((tc) => TestCase(
                              id: tc.id,
                              inputData: tc.inputData,
                              expectedOutput: tc.expectedOutput,
                              isPublic: tc.isPublic,
                              isCaseInsensitive: tc.isCaseInsensitive,
                              isRemovedSpace: tc.isRemovedSpace,
                            ))
                        .toList(),
                    createdDate: p.createdDate,
                    updatedDate: p.updatedDate,
                  ))
              .toList();
          _isLoadingProblems = false;
        });
      }
    } catch (e) {
      debugPrint('Error fetching problem details: $e');
      if (mounted) {
        setState(() {
          _isLoadingProblems = false;
        });
      }
    }
  }

  int _mapDifficulty(detail_model.Difficulty d) {
    switch (d) {
      case detail_model.Difficulty.easy:
        return 0;
      case detail_model.Difficulty.medium:
        return 1;
      case detail_model.Difficulty.hard:
        return 2;
    }
  }

  @override
  Widget build(BuildContext context) {
    final examination = widget.examination;

    return Scaffold(
      body: Stack(
        children: [
          const GradientBackground(),
          SafeArea(
            child: Column(
              children: [
                _buildHeader(context, examination),
                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const SizedBox(height: 8),
                        _buildHighlightsSection(examination),
                        const SizedBox(height: 20),
                        _buildInfoSection(examination),
                        const SizedBox(height: 20),
                        if (examination.description.isNotEmpty) ...[
                          _buildDescriptionSection(examination),
                          const SizedBox(height: 20),
                        ],
                        _buildProblemsSection(examination),
                        const SizedBox(height: 32),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHeader(BuildContext context, Examination examination) {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              IconButton(
                onPressed: () => Navigator.pop(context),
                icon: const Icon(Icons.arrow_back_ios_new_rounded,
                    color: AppColors.primary, size: 20),
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(),
              ),
              const SizedBox(width: 16),
              Container(
                width: 40,
                height: 40,
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(Icons.assignment_rounded,
                    color: AppColors.primary, size: 20),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      examination.examName,
                      style: const TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.w900,
                        color: AppColors.textPrimary,
                        letterSpacing: -0.5,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const Text(
                      'Examination Detail',
                      style: TextStyle(
                        fontSize: 13,
                        color: AppColors.textSecondary,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildHighlightsSection(Examination examination) {
    return Row(
      children: [
        _buildHighlightCard(
          icon: Icons.code_rounded,
          label: 'Language',
          value: examination.programmingLanguage.name,
          color: Colors.blue,
        ),
        const SizedBox(width: 12),
        _buildHighlightCard(
          icon: Icons.workspace_premium_rounded,
          label: 'Total Mark',
          value: '${examination.totalMark} pts',
          color: Colors.amber,
        ),
        const SizedBox(width: 12),
        _buildStatusHighlight(examination.status),
      ],
    );
  }

  Widget _buildHighlightCard({
    required IconData icon,
    required String label,
    required String value,
    required Color color,
  }) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: color.withValues(alpha: 0.1),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, color: color, size: 20),
            const SizedBox(height: 8),
            Text(
              label,
              style: const TextStyle(
                  fontSize: 10,
                  color: AppColors.textLight,
                  fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 2),
            Text(
              value,
              style: const TextStyle(
                  fontSize: 13,
                  color: AppColors.textPrimary,
                  fontWeight: FontWeight.w900),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatusHighlight(ExaminationStatus status) {
    Color color;
    Color textColor = Colors.white;
    String label = status.name.toUpperCase();
    IconData icon = Icons.timer_outlined;

    switch (status) {
      case ExaminationStatus.ongoing:
        color = Colors.green;
        label = 'ONGOING';
        icon = Icons.play_circle_outline_rounded;
        break;
      case ExaminationStatus.pending:
        color = Colors.orange;
        label = 'UPCOMING';
        icon = Icons.schedule_rounded;
        break;
      case ExaminationStatus.completed:
        color = Colors.grey;
        label = 'ENDED';
        icon = Icons.event_available_rounded;
        break;
    }

    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: color.withValues(alpha: 0.2)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, color: color, size: 20),
            const SizedBox(height: 8),
            const Text(
              'Status',
              style: TextStyle(
                  fontSize: 10,
                  color: AppColors.textLight,
                  fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 2),
            Text(
              label,
              style: TextStyle(
                  fontSize: 12, color: color, fontWeight: FontWeight.w900),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoSection(Examination examination) {
    return _buildSectionCard(
      title: 'Timeline & Mode',
      icon: Icons.info_outline_rounded,
      child: Column(
        children: [
          _buildStatRow('Mode', examination.getModeText().toUpperCase()),
          const Divider(height: 24, color: Colors.black12),
          _buildStatRow('Start', _formatDateTime(examination.startDatetime)),
          const SizedBox(height: 12),
          _buildStatRow('End', _formatDateTime(examination.endDatetime)),
          const SizedBox(height: 12),
          _buildStatRow('Duration', '${_calculateDuration(examination)} mins'),
        ],
      ),
    );
  }

  Widget _buildDescriptionSection(Examination examination) {
    return _buildSectionCard(
      title: 'Description',
      icon: Icons.description_outlined,
      child: Text(
        examination.description,
        style: const TextStyle(color: AppColors.textSecondary, fontSize: 15, height: 1.5),
      ),
    );
  }

  Widget _buildProblemsSection(Examination examination) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 8),
          child: Row(
            children: [
              const Icon(Icons.quiz_outlined,
                  color: AppColors.textPrimary, size: 20),
              const SizedBox(width: 8),
              Text(
                'Problems (${examination.examProblems.length})',
                style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w800,
                    color: AppColors.textPrimary),
              ),
              if (_isLoadingProblems) ...[
                const SizedBox(width: 12),
                const SizedBox(
                  width: 14,
                  height: 14,
                  child: CircularProgressIndicator(strokeWidth: 2),
                ),
              ],
            ],
          ),
        ),
        const SizedBox(height: 8),
        ...examination.examProblems.asMap().entries.map((entry) {
          final index = entry.key;
          final examProblem = entry.value;

          // Try to find full problem detail if it exists in _problems
          final problemDetail = _problems.firstWhere(
            (p) => p.id == examProblem.problemId,
            orElse: () => Problem(
              id: examProblem.problemId,
              examId: examination.id,
              lecturerId: '',
              title: examProblem.title.isNotEmpty
                  ? examProblem.title
                  : 'Problem ${index + 1}',
              content: '',
              difficulty: 0,
              testCases: [],
              createdDate: '',
              updatedDate: '',
            ),
          );

          return _buildProblemCard(index + 1, problemDetail, examProblem.mark);
        }),
      ],
    );
  }

  Widget _buildProblemCard(int index, Problem problem, double mark) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
        border: Border.all(color: Colors.grey.withValues(alpha: 0.05)),
      ),
      child: Theme(
        data: Theme.of(context).copyWith(
          dividerColor: Colors.transparent,
          splashColor: AppColors.primary.withValues(alpha: 0.05),
          highlightColor: Colors.transparent,
        ),
        child: ExpansionTile(
          shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(20)),
          collapsedShape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(20)),
          backgroundColor: AppColors.background.withValues(alpha: 0.3),
          tilePadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          leading: Container(
            width: 40,
            height: 40,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  AppColors.primary,
                  AppColors.primary.withValues(alpha: 0.8)
                ],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(12),
              boxShadow: [
                BoxShadow(
                  color: AppColors.primary.withValues(alpha: 0.2),
                  blurRadius: 8,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Text(
              '$index',
              style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w900,
                  fontSize: 16),
            ),
          ),
          title: Text(
            problem.title,
            style: const TextStyle(
                fontWeight: FontWeight.w800,
                fontSize: 16,
                color: AppColors.textPrimary),
          ),
          trailing: Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            decoration: BoxDecoration(
              color: AppColors.accent.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Text(
              '${mark.toStringAsFixed(1)} pts',
              style: const TextStyle(
                  color: AppColors.accent,
                  fontWeight: FontWeight.w900,
                  fontSize: 11),
            ),
          ),
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Divider(height: 1),
                  const SizedBox(height: 16),
                  Text(
                    problem.content.isNotEmpty
                        ? problem.content
                        : 'No content available.',
                    style: const TextStyle(
                        color: AppColors.textSecondary,
                        height: 1.6,
                        fontSize: 14,
                        fontWeight: FontWeight.w500),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionCard(
      {required String title, required IconData icon, required Widget child}) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
        border: Border.all(color: Colors.grey.withValues(alpha: 0.05)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(icon, size: 18, color: AppColors.primary),
              ),
              const SizedBox(width: 12),
              Text(
                title,
                style: const TextStyle(
                    fontSize: 17,
                    fontWeight: FontWeight.w900,
                    color: AppColors.textPrimary,
                    letterSpacing: -0.3),
              ),
            ],
          ),
          const SizedBox(height: 20),
          child,
        ],
      ),
    );
  }

  Widget _buildStatRow(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: const TextStyle(color: AppColors.textLight, fontSize: 14)),
        Text(value, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14, color: AppColors.textPrimary)),
      ],
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

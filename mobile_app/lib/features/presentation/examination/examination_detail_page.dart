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
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        title: const Text(
          'Examination Detail',
          style: TextStyle(fontWeight: FontWeight.w900, color: AppColors.primary),
        ),
        backgroundColor: Colors.transparent,
        elevation: 0,
        iconTheme: const IconThemeData(color: AppColors.primary),
      ),
      body: Stack(
        children: [
          const GradientBackground(),
          SafeArea(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SizedBox(height: 10), // Small spacer for AppBar
                  _buildHeaderCard(examination),
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
    );
  }

  Widget _buildHeaderCard(Examination examination) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: AppColors.primaryGradient,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: AppColors.primary.withValues(alpha: 0.3),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  examination.examName,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 26,
                    fontWeight: FontWeight.w900,
                    height: 1.2,
                    letterSpacing: -0.5,
                  ),
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(6),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.2),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Icon(Icons.code_rounded,
                          color: Colors.white, size: 16),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      examination.programmingLanguage.name,
                      style: const TextStyle(
                          color: Colors.white,
                          fontSize: 15,
                          fontWeight: FontWeight.w600),
                    ),
                    const SizedBox(width: 20),
                    Container(
                      padding: const EdgeInsets.all(6),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.2),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Icon(Icons.workspace_premium_rounded,
                          color: Colors.white, size: 16),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      '${examination.totalMark} pts',
                      style: const TextStyle(
                          color: Colors.white,
                          fontSize: 15,
                          fontWeight: FontWeight.w800),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(width: 16),
          _buildStatusBadge(examination.status),
        ],
      ),
    );
  }

  Widget _buildStatusBadge(ExaminationStatus status) {
    Color color;
    Color textColor = Colors.white;
    String label = status.name.toUpperCase();
    
    switch (status) {
      case ExaminationStatus.ongoing:
        color = Colors.greenAccent;
        textColor = const Color(0xFF065F46); // Dark green for readability
        label = 'ONGOING';
        break;
      case ExaminationStatus.pending:
        color = Colors.orangeAccent;
        textColor = const Color(0xFF92400E); // Dark orange
        label = 'UPCOMING';
        break;
      case ExaminationStatus.completed:
        color = Colors.white.withValues(alpha: 0.3);
        textColor = Colors.white;
        label = 'ENDED';
        break;
    }

    return RotatedBox(
      quarterTurns: 1, // Vertical text
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
        decoration: BoxDecoration(
          color: color,
          borderRadius: BorderRadius.circular(100),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: textColor,
            fontSize: 10,
            fontWeight: FontWeight.w900,
            letterSpacing: 1,
          ),
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
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Theme(
        data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
        child: ExpansionTile(
          shape: const RoundedRectangleBorder(borderRadius: BorderRadius.all(Radius.circular(16))),
          collapsedShape: const RoundedRectangleBorder(borderRadius: BorderRadius.all(Radius.circular(16))),
          backgroundColor: AppColors.background,
          tilePadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
          leading: Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: AppColors.primary.withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: Text(
              '$index',
              style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.w900),
            ),
          ),
          title: Text(
            problem.title,
            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
          ),
          trailing: Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: AppColors.accent.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(
              '${mark.toStringAsFixed(1)} pts',
              style: const TextStyle(color: AppColors.accent, fontWeight: FontWeight.w900, fontSize: 12),
            ),
          ),
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Divider(),
                  const SizedBox(height: 8),
                  Text(
                    problem.content.isNotEmpty ? problem.content : 'No content available.',
                    style: const TextStyle(color: AppColors.textSecondary, height: 1.5),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionCard({required String title, required IconData icon, required Widget child}) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 15,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 20, color: AppColors.primary),
              const SizedBox(width: 8),
              Text(
                title,
                style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
              ),
            ],
          ),
          const SizedBox(height: 16),
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

import 'package:flutter/material.dart';
import 'package:flutter_markdown/flutter_markdown.dart';
import 'package:mobile/core/theme/app_colors.dart';
import 'package:mobile/core/widgets/background.dart';
import 'package:mobile/core/storage/token_storage.dart';
import 'package:mobile/features/models/academic_warning.dart';
import 'package:mobile/features/services/academic_warning_service.dart';

class StudentAcademicWarningTab extends StatefulWidget {
  final String classroomId;

  const StudentAcademicWarningTab({
    super.key,
    required this.classroomId,
  });

  @override
  State<StudentAcademicWarningTab> createState() => _StudentAcademicWarningTabState();
}

class _StudentAcademicWarningTabState extends State<StudentAcademicWarningTab>
    with SingleTickerProviderStateMixin {
  bool _isLoading = true;
  String? _error;
  List<StudentWarning> _allWarnings = [];
  int _selectedFilter = 0;
  late TabController _filterController;

  @override
  void initState() {
    super.initState();
    _filterController = TabController(length: 3, initialIndex: 0, vsync: this);
    _loadData();
  }

  @override
  void dispose() {
    _filterController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final studentId = await TokenStorage.getUserId();
      if (studentId == null || studentId.isEmpty) {
        throw Exception('Unable to identify student account');
      }

      final warnings = await AcademicWarningService.getByClassroom(
        classroomId: widget.classroomId,
        studentId: studentId,
      );

      if (!mounted) return;
      setState(() {
        _allWarnings = warnings;
        _isLoading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString().replaceFirst('Exception: ', '');
        _isLoading = false;
      });
    }
  }

  List<StudentWarning> get _filteredWarnings {
    switch (_selectedFilter) {
      case 1:
        return _allWarnings.where((w) => !w.isRead).toList();
      case 2:
        return _allWarnings.where((w) => w.isRead).toList();
      default:
        return _allWarnings;
    }
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
            Expanded(
              child: _isLoading
                  ? const Center(
                      child: CircularProgressIndicator(color: AppColors.primary))
                  : _error != null
                      ? _buildErrorState()
                      : _buildContent(),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildStickyHeader() {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 24, 16, 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 8,
                height: 32,
                decoration: BoxDecoration(
                  color: AppColors.warning,
                  borderRadius: BorderRadius.circular(4),
                ),
              ),
              const SizedBox(width: 12),
              const Icon(Icons.warning_amber_rounded,
                  color: AppColors.warning, size: 24),
              const SizedBox(width: 10),
              const Text(
                'Academic Warning',
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.w900,
                  color: AppColors.warning,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Container(
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.5),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.grey.withValues(alpha: 0.1)),
            ),
            child: TabBar(
              controller: _filterController,
              onTap: (index) => setState(() => _selectedFilter = index),
              indicator: BoxDecoration(
                borderRadius: BorderRadius.circular(10),
                color: AppColors.warning,
              ),
              labelColor: Colors.white,
              unselectedLabelColor: AppColors.textLight,
              labelStyle:
                  const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
              unselectedLabelStyle:
                  const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
              indicatorSize: TabBarIndicatorSize.tab,
              dividerColor: Colors.transparent,
              padding: const EdgeInsets.all(4),
              tabs: [
                _buildFilterTab('All', _allWarnings.length),
                _buildFilterTab(
                    'Unread', _allWarnings.where((w) => !w.isRead).length),
                _buildFilterTab(
                    'Read', _allWarnings.where((w) => w.isRead).length),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterTab(String label, int count) {
    return Tab(
      child: Row(
        mainAxisSize: MainAxisSize.min,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(label),
          if (count > 0) ...[
            const SizedBox(width: 4),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.25),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Text(
                '$count',
                style: const TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w900,
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildContent() {
    final warnings = _filteredWarnings;

    if (warnings.isEmpty) {
      return _buildEmptyState();
    }

    return RefreshIndicator(
      onRefresh: _loadData,
      color: AppColors.warning,
      child: ListView.builder(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
        itemCount: warnings.length,
        itemBuilder: (context, index) {
          return Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: GestureDetector(
              onTap: () => _showDetail(context, warnings[index]),
              child: _WarningCard(warning: warnings[index]),
            ),
          );
        },
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.5),
              shape: BoxShape.circle,
            ),
            child: Icon(Icons.check_circle_outline_rounded,
                size: 64, color: Colors.grey[300]),
          ),
          const SizedBox(height: 16),
          Text(
            _selectedFilter == 0
                ? 'No academic warnings yet.'
                : _selectedFilter == 1
                    ? 'All warnings have been read.'
                    : 'No read warnings.',
            style: TextStyle(
                fontSize: 16, color: Colors.grey[600], fontWeight: FontWeight.w500),
          ),
        ],
      ),
    );
  }

  Widget _buildErrorState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.error_outline, size: 48, color: AppColors.error),
            const SizedBox(height: 12),
            Text(_error!, textAlign: TextAlign.center),
            const SizedBox(height: 16),
            ElevatedButton(
                onPressed: _loadData, child: const Text('Try again')),
          ],
        ),
      ),
    );
  }

  void _showDetail(BuildContext context, StudentWarning warning) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => _WarningDetailSheet(
        warningId: warning.warningId,
        initialWarning: warning,
      ),
    );
  }
}

class _WarningCard extends StatelessWidget {
  final StudentWarning warning;

  const _WarningCard({required this.warning});

  @override
  Widget build(BuildContext context) {
    final isLevel2 = warning.warningLevel == 2;
    final levelColor = isLevel2 ? AppColors.error : AppColors.warning;
    final levelLabel = isLevel2 ? 'Critical' : 'Warning';

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.centerLeft,
                end: Alignment.centerRight,
                colors: [
                  levelColor.withValues(alpha: 0.08),
                  levelColor.withValues(alpha: 0.02),
                ],
              ),
              borderRadius: const BorderRadius.vertical(
                top: Radius.circular(16),
              ),
            ),
            child: Row(
              children: [
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: levelColor.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                      color: levelColor.withValues(alpha: 0.3),
                    ),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        isLevel2
                            ? Icons.error_rounded
                            : Icons.warning_amber_rounded,
                        size: 14,
                        color: levelColor,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        'Level ${warning.warningLevel} - $levelLabel',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w800,
                          color: levelColor,
                        ),
                      ),
                    ],
                  ),
                ),
                const Spacer(),
                if (!warning.isRead)
                  Container(
                    width: 8,
                    height: 8,
                    decoration: BoxDecoration(
                      color: levelColor,
                      shape: BoxShape.circle,
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
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: levelColor.withValues(alpha: 0.08),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Icon(
                        Icons.school_rounded,
                        color: levelColor,
                        size: 24,
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            _fmtDate(warning.createdAt),
                            style: const TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w700,
                              color: AppColors.textPrimary,
                            ),
                          ),
                          if (warning.reason.isNotEmpty) ...[
                            const SizedBox(height: 4),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 8, vertical: 2),
                              decoration: BoxDecoration(
                                color: AppColors.textLight.withValues(alpha: 0.08),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(
                                warning.reason,
                                style: const TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w600,
                                  color: AppColors.textLight,
                                ),
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                  ],
                ),
                if (warning.message.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: levelColor.withValues(alpha: 0.04),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: levelColor.withValues(alpha: 0.1),
                      ),
                    ),
                    child: Text(
                      warning.message,
                      style: const TextStyle(
                        fontSize: 13,
                        color: AppColors.textSecondary,
                        height: 1.5,
                      ),
                    ),
                  ),
                ],
                if (warning.scoreAtTime != null) ...[
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: levelColor.withValues(alpha: 0.04),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: levelColor.withValues(alpha: 0.1),
                      ),
                    ),
                    child: Row(
                      children: [
                        Icon(
                          Icons.analytics_rounded,
                          size: 18,
                          color: levelColor,
                        ),
                        const SizedBox(width: 8),
                        Text(
                          'Score at time: ',
                          style: TextStyle(
                            fontSize: 13,
                            color: AppColors.textSecondary,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        Text(
                          warning.scoreAtTime!.toStringAsFixed(1),
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w900,
                            color: levelColor,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _WarningDetailSheet extends StatefulWidget {
  final String warningId;
  final StudentWarning initialWarning;

  const _WarningDetailSheet({
    required this.warningId,
    required this.initialWarning,
  });

  @override
  State<_WarningDetailSheet> createState() => _WarningDetailSheetState();
}

class _WarningDetailSheetState extends State<_WarningDetailSheet> {
  WarningDetail? _detail;
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadDetail();
  }

  Future<void> _loadDetail() async {
    final detail = await AcademicWarningService.getById(widget.warningId);
    if (!mounted) return;
    setState(() {
      _detail = detail;
      _isLoading = false;
      _error = detail == null ? 'Unable to load warning details.' : null;
    });
  }

  @override
  Widget build(BuildContext context) {
    final isLevel2 = widget.initialWarning.warningLevel == 2;
    final levelColor = isLevel2 ? AppColors.error : AppColors.warning;

    return DraggableScrollableSheet(
      initialChildSize: 0.7,
      minChildSize: 0.4,
      maxChildSize: 0.95,
      builder: (context, scrollController) {
        return Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          ),
          child: Column(
            children: [
              Container(
                margin: const EdgeInsets.only(top: 12),
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.grey[300],
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              Expanded(
                child: _isLoading
                    ? const Center(child: CircularProgressIndicator())
                    : _error != null
                        ? Center(child: Text(_error!))
                        : _buildDetailContent(scrollController, levelColor),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildDetailContent(ScrollController scrollController, Color levelColor) {
    final detail = _detail!;
    final isLevel2 = widget.initialWarning.warningLevel == 2;

    return ListView(
      controller: scrollController,
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 40),
      children: [
        Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: levelColor.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Icon(
                Icons.warning_amber_rounded,
                color: levelColor,
                size: 28,
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    isLevel2 ? 'Critical Warning' : 'Academic Warning',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.w900,
                      color: levelColor,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Level ${widget.initialWarning.warningLevel} - Sent ${_fmtDate(widget.initialWarning.createdAt)}',
                    style: const TextStyle(
                      fontSize: 13,
                      color: AppColors.textLight,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: 20),
        _buildSection(
          'Trigger Reason',
          Icons.flag_rounded,
          levelColor,
          Text(
            widget.initialWarning.reason,
            style: const TextStyle(
              fontSize: 14,
              color: AppColors.textPrimary,
              height: 1.5,
            ),
          ),
        ),
        if (widget.initialWarning.message.isNotEmpty) ...[
          const SizedBox(height: 20),
          _buildSection(
            'Message',
            Icons.message_rounded,
            levelColor,
            Text(
              widget.initialWarning.message,
              style: const TextStyle(
                fontSize: 14,
                color: AppColors.textPrimary,
                height: 1.5,
              ),
            ),
          ),
        ],
        if (detail.involvedExams != null &&
            detail.involvedExams!.examScores.isNotEmpty) ...[
          const SizedBox(height: 20),
          _buildSection(
            'Involved Exams (${detail.involvedExams!.examScores.length})',
            Icons.assignment_rounded,
            levelColor,
            Column(
              children: [
                ...detail.involvedExams!.examScores.map((exam) {
                  return Container(
                    margin: const EdgeInsets.only(bottom: 10),
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: levelColor.withValues(alpha: 0.04),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: levelColor.withValues(alpha: 0.12),
                      ),
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          child: Text(
                            exam.examName.isNotEmpty ? exam.examName : exam.examId,
                            style: const TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w700,
                              color: AppColors.textPrimary,
                            ),
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: levelColor.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text(
                            '${exam.score.toStringAsFixed(1)} / ${exam.maxScore.toStringAsFixed(0)}',
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w800,
                              color: levelColor,
                            ),
                          ),
                        ),
                      ],
                    ),
                  );
                }),
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: levelColor.withValues(alpha: 0.06),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: levelColor.withValues(alpha: 0.2),
                    ),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.trending_down_rounded, size: 20, color: levelColor),
                      const SizedBox(width: 10),
                      Text(
                        'Average Score: ',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: levelColor,
                        ),
                      ),
                      Text(
                        detail.involvedExams!.averageScore.toStringAsFixed(1),
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.w900,
                          color: levelColor,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
        if (detail.llmAnalysis.isNotEmpty) ...[
          const SizedBox(height: 20),
          _buildSection(
            'AI Analysis',
            Icons.smart_toy_rounded,
            AppColors.info,
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: detail.llmAnalysis.entries.map((entry) {
                final analysis = entry.value;
                return Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: AppColors.info.withValues(alpha: 0.04),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: AppColors.info.withValues(alpha: 0.1),
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        analysis.submissionId.isNotEmpty
                            ? 'Submission ${analysis.submissionId}'
                            : 'Analysis',
                        style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                          color: AppColors.textPrimary,
                        ),
                      ),
                      if (analysis.analysis.isNotEmpty) ...[
                        const SizedBox(height: 8),
                        MarkdownBody(
                          data: analysis.analysis,
                          styleSheet: MarkdownStyleSheet(
                            p: const TextStyle(
                              fontSize: 13,
                              color: AppColors.textSecondary,
                              height: 1.5,
                            ),
                            code: TextStyle(
                              fontSize: 12,
                              color: AppColors.primary,
                              backgroundColor:
                                  AppColors.primary.withValues(alpha: 0.06),
                              fontFamily: 'monospace',
                            ),
                            codeblockDecoration: BoxDecoration(
                              color: AppColors.primary.withValues(alpha: 0.04),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            listBullet: const TextStyle(
                              fontSize: 13,
                              color: AppColors.textSecondary,
                            ),
                            h1: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.w900,
                              color: AppColors.textPrimary,
                            ),
                            h2: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w800,
                              color: AppColors.textPrimary,
                            ),
                            h3: const TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w700,
                              color: AppColors.textPrimary,
                            ),
                            blockquoteDecoration: BoxDecoration(
                              border: Border(
                                left: BorderSide(
                                  color: AppColors.primary.withValues(alpha: 0.3),
                                  width: 3,
                                ),
                              ),
                            ),
                            strong: const TextStyle(
                              fontWeight: FontWeight.w800,
                              color: AppColors.textPrimary,
                            ),
                            em: const TextStyle(
                              fontStyle: FontStyle.italic,
                              color: AppColors.textSecondary,
                            ),
                          ),
                        ),
                      ],
                      if (analysis.recommendation.isNotEmpty) ...[
                        const SizedBox(height: 8),
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: AppColors.success.withValues(alpha: 0.06),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Icon(Icons.lightbulb_outline_rounded,
                                  size: 16, color: AppColors.success),
                              const SizedBox(width: 8),
                              Expanded(
                                child: MarkdownBody(
                                  data: analysis.recommendation,
                                  styleSheet: MarkdownStyleSheet(
                                    p: const TextStyle(
                                      fontSize: 12,
                                      color: AppColors.success,
                                      fontWeight: FontWeight.w500,
                                      height: 1.4,
                                    ),
                                    strong: const TextStyle(
                                      fontWeight: FontWeight.w800,
                                      color: AppColors.success,
                                    ),
                                    em: const TextStyle(
                                      fontStyle: FontStyle.italic,
                                      color: AppColors.success,
                                    ),
                                    code: TextStyle(
                                      fontSize: 11,
                                      color: AppColors.success,
                                      backgroundColor:
                                          AppColors.success.withValues(alpha: 0.08),
                                      fontFamily: 'monospace',
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ],
                  ),
                );
              }).toList(),
            ),
          ),
        ],
        if (detail.lecturerAnalysis.isNotEmpty) ...[
          const SizedBox(height: 20),
          _buildSection(
            'Lecturer Notes',
            Icons.person_rounded,
            AppColors.primary,
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: detail.lecturerAnalysis.entries.map((entry) {
                final note = entry.value;
                return Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: AppColors.primary.withValues(alpha: 0.04),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: AppColors.primary.withValues(alpha: 0.1),
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        note.submissionId.isNotEmpty
                            ? 'Submission ${note.submissionId}'
                            : 'Note',
                        style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                          color: AppColors.textPrimary,
                        ),
                      ),
                      if (note.analysis.isNotEmpty) ...[
                        const SizedBox(height: 8),
                        MarkdownBody(
                          data: note.analysis,
                          styleSheet: MarkdownStyleSheet(
                            p: const TextStyle(
                              fontSize: 13,
                              color: AppColors.textSecondary,
                              height: 1.5,
                            ),
                            code: TextStyle(
                              fontSize: 12,
                              color: AppColors.primary,
                              backgroundColor:
                                  AppColors.primary.withValues(alpha: 0.06),
                              fontFamily: 'monospace',
                            ),
                            codeblockDecoration: BoxDecoration(
                              color: AppColors.primary.withValues(alpha: 0.04),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            strong: const TextStyle(
                              fontWeight: FontWeight.w800,
                              color: AppColors.textPrimary,
                            ),
                            em: const TextStyle(
                              fontStyle: FontStyle.italic,
                              color: AppColors.textSecondary,
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                );
              }).toList(),
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildSection(
      String title, IconData icon, Color color, Widget content) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(icon, size: 18, color: color),
            const SizedBox(width: 8),
            Text(
              title,
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w800,
                color: color,
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        content,
      ],
    );
  }
}

String _fmtDate(DateTime? dt) {
  if (dt == null) return 'Unknown date';
  final local = dt.toLocal();
  final day = local.day.toString().padLeft(2, '0');
  final month = local.month.toString().padLeft(2, '0');
  final year = local.year;
  return '$day/$month/$year';
}

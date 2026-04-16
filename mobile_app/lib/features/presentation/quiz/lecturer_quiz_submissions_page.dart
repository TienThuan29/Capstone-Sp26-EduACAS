import 'package:flutter/material.dart';
import 'package:mobile/core/theme/app_colors.dart';
import 'package:mobile/core/widgets/background.dart';
import 'package:mobile/features/models/quiz_practice.dart';
import 'package:mobile/features/services/quiz_practice_service.dart';

class LecturerQuizSubmissionsPage extends StatefulWidget {
  final ClassroomQuiz classroomQuiz;
  final String quizTitle;

  const LecturerQuizSubmissionsPage({
    super.key,
    required this.classroomQuiz,
    required this.quizTitle,
  });

  @override
  State<LecturerQuizSubmissionsPage> createState() => _LecturerQuizSubmissionsPageState();
}

class _LecturerQuizSubmissionsPageState extends State<LecturerQuizSubmissionsPage> {
  bool _isLoading = true;
  String? _error;

  int _studentPageIndex = 1;
  final int _studentPageSize = 10;

  int _totalAttempts = 0;
  List<QuizSubmissionInfo> _allSubmissions = [];
  List<_StudentSubmissionGroup> _students = [];

  int get _totalStudents => _students.length;
  int get _totalStudentPages {
    if (_students.isEmpty) return 1;
    return (_students.length / _studentPageSize).ceil();
  }

  List<_StudentSubmissionGroup> get _studentsOnCurrentPage {
    if (_students.isEmpty) return const [];
    final start = (_studentPageIndex - 1) * _studentPageSize;
    if (start >= _students.length) return const [];
    final end = (start + _studentPageSize) > _students.length
        ? _students.length
        : (start + _studentPageSize);
    return _students.sublist(start, end);
  }

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final submissions = <QuizSubmissionInfo>[];
      var pageIndex = 1;
      var totalPages = 1;
      const pageSize = 100;
      var guard = 0;

      do {
        final result = await QuizPracticeService.getQuizSubmissionsPaged(
          classroomQuizId: widget.classroomQuiz.id,
          pageIndex: pageIndex,
          pageSize: pageSize,
        );

        submissions.addAll(result.items);
        totalPages = result.totalPages <= 0 ? 1 : result.totalPages;
        pageIndex += 1;
        guard += 1;
      } while (pageIndex <= totalPages && guard <= 200);

      final grouped = <String, List<QuizSubmissionInfo>>{};
      for (final item in submissions) {
        grouped.putIfAbsent(item.studentId, () => <QuizSubmissionInfo>[]).add(item);
      }

      final students = grouped.entries.map((entry) {
        final attempts = List<QuizSubmissionInfo>.from(entry.value)
          ..sort((a, b) {
            final byAttempt = b.attemptNumber.compareTo(a.attemptNumber);
            if (byAttempt != 0) return byAttempt;
            return b.startTime.compareTo(a.startTime);
          });
        return _StudentSubmissionGroup(studentId: entry.key, attempts: attempts);
      }).toList()
        ..sort((a, b) => a.displayName.toLowerCase().compareTo(b.displayName.toLowerCase()));

      if (!mounted) return;
      setState(() {
        _allSubmissions = submissions;
        _students = students;
        _totalAttempts = submissions.length;
        _studentPageIndex = 1;
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          const GradientBackground(),
          SafeArea(
            child: Column(
              children: [
                _buildHeader(),
                Expanded(
                  child: _isLoading
                      ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
                      : _error != null
                          ? _buildErrorState()
                          : _buildBody(),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHeader() {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              IconButton(
                onPressed: () => Navigator.pop(context),
                icon: const Icon(Icons.arrow_back_ios_new_rounded, color: AppColors.primary, size: 20),
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
                child: const Icon(Icons.insights_rounded, color: AppColors.primary, size: 20),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Student Results',
                      style: TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.w900,
                        color: AppColors.textPrimary,
                        letterSpacing: -0.5,
                      ),
                    ),
                    Text(
                      widget.quizTitle,
                      style: const TextStyle(
                        fontSize: 13,
                        color: AppColors.textSecondary,
                        fontWeight: FontWeight.w600,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.78),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.grey.withValues(alpha: 0.12)),
            ),
            child: Row(
              children: [
                Text(
                  'Students: $_totalStudents',
                  style: const TextStyle(fontSize: 12.5, color: AppColors.textSecondary, fontWeight: FontWeight.w600),
                ),
                const Spacer(),
                Text(
                  'Attempts: $_totalAttempts',
                  style: const TextStyle(fontSize: 12.5, color: AppColors.textSecondary, fontWeight: FontWeight.w600),
                ),
                const SizedBox(width: 12),
                Text(
                  'Limit: ${widget.classroomQuiz.maxOfAttempts}',
                  style: const TextStyle(fontSize: 12.5, color: AppColors.textSecondary, fontWeight: FontWeight.w600),
                ),
              ],
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'Showing one row per student. Tap a row to see attempt history.',
            style: TextStyle(fontSize: 12, color: AppColors.textLight),
          ),
        ],
      ),
    );
  }

  Widget _buildBody() {
    if (_students.isEmpty) {
      return RefreshIndicator(
        onRefresh: _loadData,
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          children: const [
            SizedBox(height: 120),
            Center(
              child: Text(
                'No student submissions yet',
                style: TextStyle(color: AppColors.textLight),
              ),
            ),
          ],
        ),
      );
    }

    final items = _studentsOnCurrentPage;
    return RefreshIndicator(
      onRefresh: _loadData,
      child: ListView.builder(
        padding: const EdgeInsets.fromLTRB(16, 6, 16, 24),
        itemCount: items.length + 1,
        itemBuilder: (context, index) {
          if (index == items.length) {
            return _buildPagination();
          }

          final student = items[index];
          final latest = student.latestAttempt;
          final latestScoreText = latest.score == null ? '-' : latest.score!.toStringAsFixed(2);
          final bestScoreText = student.bestScore == null ? '-' : student.bestScore!.toStringAsFixed(2);

          return InkWell(
            onTap: () => _showStudentAttempts(student),
            borderRadius: BorderRadius.circular(14),
            child: Container(
              margin: const EdgeInsets.only(bottom: 10),
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: Colors.grey.withValues(alpha: 0.12)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          student.displayName,
                          style: const TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w800,
                            color: AppColors.textPrimary,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      _StatusChip(status: latest.status.toUpperCase()),
                    ],
                  ),
                  const SizedBox(height: 5),
                  if (student.studentEmail != null && student.studentEmail!.isNotEmpty)
                    Text(
                      student.studentEmail!,
                      style: const TextStyle(fontSize: 12, color: AppColors.textLight),
                    ),
                  const SizedBox(height: 6),
                  Text(
                    'Attempts: ${student.attempts.length} • Latest: #${latest.attemptNumber} • Best: $bestScoreText',
                    style: const TextStyle(fontSize: 13, color: AppColors.textSecondary, fontWeight: FontWeight.w600),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Latest score: $latestScoreText • ${_fmt(latest.startTime)}',
                    style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                  ),
                  const SizedBox(height: 6),
                  const Row(
                    children: [
                      Icon(Icons.touch_app_rounded, size: 14, color: AppColors.primary),
                      SizedBox(width: 5),
                      Text(
                        'Tap to view all attempts',
                        style: TextStyle(fontSize: 12, color: AppColors.primary, fontWeight: FontWeight.w600),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildPagination() {
    return Container(
      margin: const EdgeInsets.only(top: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.withValues(alpha: 0.12)),
      ),
      child: Row(
        children: [
          Text(
            'Page $_studentPageIndex/$_totalStudentPages',
            style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
          ),
          const Spacer(),
          IconButton(
            onPressed: _studentPageIndex > 1
                ? () {
                    setState(() => _studentPageIndex -= 1);
                  }
                : null,
            icon: const Icon(Icons.chevron_left_rounded),
          ),
          IconButton(
            onPressed: _studentPageIndex < _totalStudentPages
                ? () {
                    setState(() => _studentPageIndex += 1);
                  }
                : null,
            icon: const Icon(Icons.chevron_right_rounded),
          ),
        ],
      ),
    );
  }

  Future<void> _showStudentAttempts(_StudentSubmissionGroup student) async {
    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _StudentAttemptsSheet(
        student: student,
        formatDate: _fmt,
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
            const Icon(Icons.error_outline_rounded, size: 56, color: AppColors.error),
            const SizedBox(height: 10),
            Text(_error ?? 'Failed to load submissions', textAlign: TextAlign.center),
            const SizedBox(height: 12),
            ElevatedButton.icon(
              onPressed: _loadData,
              icon: const Icon(Icons.refresh_rounded),
              label: const Text('Retry'),
            ),
          ],
        ),
      ),
    );
  }

  String _fmt(DateTime dt) {
    final local = dt.toLocal();
    final day = local.day.toString().padLeft(2, '0');
    final month = local.month.toString().padLeft(2, '0');
    final year = local.year.toString();
    final hour = local.hour.toString().padLeft(2, '0');
    final minute = local.minute.toString().padLeft(2, '0');
    return '$day/$month/$year $hour:$minute';
  }
}

class _StudentSubmissionGroup {
  final String studentId;
  final List<QuizSubmissionInfo> attempts;

  const _StudentSubmissionGroup({
    required this.studentId,
    required this.attempts,
  });

  QuizSubmissionInfo get latestAttempt => attempts.first;

  String get displayName {
    final name = latestAttempt.studentName?.trim();
    if (name != null && name.isNotEmpty) return name;
    return 'Student $studentId';
  }

  String? get studentEmail {
    final email = latestAttempt.studentEmail?.trim();
    if (email == null || email.isEmpty) return null;
    return email;
  }

  double? get bestScore {
    final scored = attempts.where((e) => e.score != null).map((e) => e.score!).toList();
    if (scored.isEmpty) return null;
    scored.sort((a, b) => b.compareTo(a));
    return scored.first;
  }
}

class _StudentAttemptsSheet extends StatelessWidget {
  final _StudentSubmissionGroup student;
  final String Function(DateTime value) formatDate;

  const _StudentAttemptsSheet({
    required this.student,
    required this.formatDate,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: SafeArea(
        top: false,
        child: SizedBox(
          height: MediaQuery.of(context).size.height * 0.75,
          child: Column(
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 14, 16, 10),
                child: Row(
                  children: [
                    Expanded(
                      child: Text(
                        student.displayName,
                        style: const TextStyle(
                          fontSize: 19,
                          fontWeight: FontWeight.w900,
                          color: AppColors.textPrimary,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    IconButton(
                      onPressed: () => Navigator.pop(context),
                      icon: const Icon(Icons.close_rounded),
                    ),
                  ],
                ),
              ),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Row(
                  children: [
                    Text(
                      'Attempts: ${student.attempts.length}',
                      style: const TextStyle(fontSize: 12.5, color: AppColors.textSecondary),
                    ),
                    const Spacer(),
                    Text(
                      'Best: ${student.bestScore == null ? '-' : student.bestScore!.toStringAsFixed(2)}',
                      style: const TextStyle(fontSize: 12.5, color: AppColors.textSecondary),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 10),
              Expanded(
                child: ListView.builder(
                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 20),
                  itemCount: student.attempts.length,
                  itemBuilder: (context, index) {
                    final item = student.attempts[index];
                    final scoreText = item.score == null ? '-' : item.score!.toStringAsFixed(2);

                    return Container(
                      margin: const EdgeInsets.only(bottom: 10),
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppColors.background,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Colors.grey.withValues(alpha: 0.12)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Text(
                                'Attempt #${item.attemptNumber}',
                                style: const TextStyle(
                                  fontWeight: FontWeight.w800,
                                  color: AppColors.textPrimary,
                                ),
                              ),
                              const Spacer(),
                              _StatusChip(status: item.status.toUpperCase()),
                            ],
                          ),
                          const SizedBox(height: 6),
                          Text(
                            'Score: $scoreText',
                            style: const TextStyle(fontSize: 13, color: AppColors.textSecondary, fontWeight: FontWeight.w600),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Start: ${formatDate(item.startTime)}',
                            style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                          ),
                          Text(
                            'End: ${item.endTime == null ? '-' : formatDate(item.endTime!)}',
                            style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                          ),
                        ],
                      ),
                    );
                  },
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _StatusChip extends StatelessWidget {
  final String status;

  const _StatusChip({required this.status});

  @override
  Widget build(BuildContext context) {
    Color color;
    if (status == 'SUBMITTED') {
      color = AppColors.success;
    } else if (status == 'INPROGRESS') {
      color = Colors.orange;
    } else if (status == 'EXPIRED' || status == 'ABANDONED') {
      color = AppColors.error;
    } else {
      color = AppColors.textLight;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.14),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        status,
        style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: color),
      ),
    );
  }
}

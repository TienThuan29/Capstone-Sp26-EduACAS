import 'package:flutter/material.dart';
import 'package:mobile/core/storage/token_storage.dart';
import 'package:mobile/core/theme/app_colors.dart';
import 'package:mobile/core/widgets/background.dart';
import 'package:mobile/features/models/quiz_practice.dart';
import 'package:mobile/features/presentation/quiz/quiz_attempt_page.dart';
import 'package:mobile/features/presentation/quiz/quiz_review_page.dart';
import 'package:mobile/features/presentation/quiz/widgets/quiz_passcode_dialog.dart';
import 'package:mobile/features/services/quiz_practice_service.dart';

class StudentQuizzesTab extends StatefulWidget {
  final String classroomId;

  const StudentQuizzesTab({
    super.key,
    required this.classroomId,
  });

  @override
  State<StudentQuizzesTab> createState() => _StudentQuizzesTabState();
}

class _StudentQuizzesTabState extends State<StudentQuizzesTab> {
  bool _isLoading = true;
  String? _error;

  List<ClassroomQuiz> _classroomQuizzes = [];
  final Map<String, QuizDetail> _quizDetailsByQuizId = {};
  final Map<String, QuizAttemptInfo> _latestSubmittedAttemptByClassroomQuizId = {};
  final Map<String, int> _maxAttemptNoByClassroomQuizId = {};

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
      final allQuizzes = await QuizPracticeService.getClassroomQuizzes(widget.classroomId, includeDrafts: false);
      final userRole = await TokenStorage.getUserRole();
      
      final quizzes = allQuizzes.where((q) {
        // If lecturer is viewing, show all (including drafts)
        if (userRole?.toUpperCase() == 'LECTURER') return true;
        // If student is viewing, hide drafts
        return q.lifecycleStatus != ClassroomQuizLifecycle.draft;
      }).toList();

      final detailFutures = quizzes
          .map((q) async => MapEntry(q.quizId, await QuizPracticeService.getQuizById(q.quizId)))
          .toList();
      final loadedDetails = await Future.wait(detailFutures);

      final userId = await TokenStorage.getUserId();
      final attempts = (userId == null || userId.isEmpty)
          ? <QuizAttemptInfo>[]
          : await QuizPracticeService.getAttemptsByStudent(userId);

      final latestSubmitted = <String, QuizAttemptInfo>{};
      final maxAttemptNoByClassroomQuizId = <String, int>{};
      for (final attempt in attempts.where((a) => a.status.toUpperCase() == 'SUBMITTED')) {
        final current = latestSubmitted[attempt.classroomQuizId];
        if (current == null || attempt.startTime.isAfter(current.startTime)) {
          latestSubmitted[attempt.classroomQuizId] = attempt;
        }

        final currentMax = maxAttemptNoByClassroomQuizId[attempt.classroomQuizId] ?? 0;
        if (attempt.attemptNumber > currentMax) {
          maxAttemptNoByClassroomQuizId[attempt.classroomQuizId] = attempt.attemptNumber;
        }
      }

      if (!mounted) return;
      setState(() {
        _classroomQuizzes = quizzes;
        _quizDetailsByQuizId
          ..clear()
          ..addEntries(
            loadedDetails.where((entry) => entry.value != null).map((entry) => MapEntry(entry.key, entry.value!)),
          );
        _latestSubmittedAttemptByClassroomQuizId
          ..clear()
          ..addAll(latestSubmitted);
        _maxAttemptNoByClassroomQuizId
          ..clear()
          ..addAll(maxAttemptNoByClassroomQuizId);
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
    return Stack(
      children: [
        const GradientBackground(),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildStickyHeader(),
            Expanded(
              child: _isLoading
            ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
            : _error != null
                ? _buildErrorState()
                : _buildQuizList(),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildStickyHeader() {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 24, 16, 16),
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
          const Icon(Icons.quiz_outlined, color: AppColors.primary, size: 24),
          const SizedBox(width: 10),
          const Text(
            'Quizzes',
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.w900,
              color: AppColors.primary,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildQuizList() {
    if (_classroomQuizzes.isEmpty) {
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
              child: Icon(Icons.quiz_outlined, size: 64, color: Colors.grey[300]),
            ),
            const SizedBox(height: 16),
            Text(
              'No quizzes available yet.',
              style: TextStyle(fontSize: 16, color: Colors.grey[600], fontWeight: FontWeight.w500),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadData,
      child: ListView.builder(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
        itemCount: _classroomQuizzes.length,
        itemBuilder: (context, index) {
          final classroomQuiz = _classroomQuizzes[index];
          final quizDetail = _quizDetailsByQuizId[classroomQuiz.quizId];
          final latestAttempt = _latestSubmittedAttemptByClassroomQuizId[classroomQuiz.id];
          final usedAttempts = _maxAttemptNoByClassroomQuizId[classroomQuiz.id] ?? 0;

          return Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: _QuizCard(
              classroomQuiz: classroomQuiz,
              quizDetail: quizDetail,
              latestAttempt: latestAttempt,
              usedAttempts: usedAttempts,
              onStart: quizDetail == null
                  ? null
                  : () async {
                      final hasAccess = await showQuizPasscodeDialog(context, classroomQuiz);
                      if (!hasAccess || !mounted) return;

                      await Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => QuizAttemptPage(
                            classroomQuiz: classroomQuiz,
                            quizDetail: quizDetail,
                          ),
                        ),
                      );
                      if (mounted) {
                        _loadData();
                      }
                    },
              onReview: (quizDetail == null || latestAttempt == null)
                  ? null
                  : () async {
                      await Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => QuizReviewPage(
                            classroomQuiz: classroomQuiz,
                            quizDetail: quizDetail,
                            attemptId: latestAttempt.id,
                          ),
                        ),
                      );
                    },
            ),
          );
        },
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
            ElevatedButton(onPressed: _loadData, child: const Text('Try again')),
          ],
        ),
      ),
    );
  }
}

class _QuizCard extends StatelessWidget {
  final ClassroomQuiz classroomQuiz;
  final QuizDetail? quizDetail;
  final QuizAttemptInfo? latestAttempt;
  final int usedAttempts;
  final VoidCallback? onStart;
  final VoidCallback? onReview;

  const _QuizCard({
    required this.classroomQuiz,
    required this.quizDetail,
    required this.latestAttempt,
    required this.usedAttempts,
    required this.onStart,
    required this.onReview,
  });

  @override
  Widget build(BuildContext context) {
    final now = DateTime.now().toUtc();
    final isOngoing = classroomQuiz.status.toUpperCase() == 'ONGOING';
    final isClosed = now.isAfter(classroomQuiz.endTime) || classroomQuiz.status.toUpperCase() == 'CLOSED';
    final isNotStarted = now.isBefore(classroomQuiz.startTime);
    final hasReachedMaxAttempts = usedAttempts >= classroomQuiz.maxOfAttempts;

    final canStart = isOngoing && !isClosed && !isNotStarted && !hasReachedMaxAttempts;

    _QuizStatusInfo statusInfo;
    if (!isOngoing) {
      statusInfo = _QuizStatusInfo('Unavailable', AppColors.textLight, Colors.transparent, AppColors.textLight);
    } else if (isNotStarted) {
      statusInfo = _QuizStatusInfo('Upcoming', AppColors.info, AppColors.info.withValues(alpha: 0.1), AppColors.info);
    } else if (isClosed) {
      statusInfo = _QuizStatusInfo('Closed', AppColors.textLight, Colors.transparent, AppColors.textLight);
    } else if (hasReachedMaxAttempts) {
      statusInfo = _QuizStatusInfo('Max Reached', AppColors.warning, AppColors.warning.withValues(alpha: 0.1), AppColors.warning);
    } else {
      statusInfo = _QuizStatusInfo('Open', AppColors.success, AppColors.success.withValues(alpha: 0.1), AppColors.success);
    }

    String startLabel = 'Start Quiz';
    if (!isOngoing) {
      startLabel = 'Unavailable';
    } else if (isNotStarted) {
      startLabel = 'Not Started';
    } else if (isClosed) {
      startLabel = 'Closed';
    } else if (hasReachedMaxAttempts) {
      startLabel = 'No Attempts';
    }

    final title = quizDetail?.title ?? 'Quiz ${classroomQuiz.id.substring(0, classroomQuiz.id.length > 8 ? 8 : classroomQuiz.id.length)}';
    final duration = quizDetail?.duration ?? 0;
    final totalQuestions = quizDetail?.totalQuestions ?? 0;
    final attemptsLeft = classroomQuiz.maxOfAttempts - usedAttempts;

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 16,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      width: 48,
                      height: 48,
                      decoration: BoxDecoration(
                        gradient: AppColors.buttonGradient,
                        borderRadius: BorderRadius.circular(14),
                        boxShadow: [
                          BoxShadow(
                            color: AppColors.primary.withValues(alpha: 0.25),
                            blurRadius: 8,
                            offset: const Offset(0, 3),
                          ),
                        ],
                      ),
                      child: const Icon(Icons.quiz_outlined, color: Colors.white, size: 24),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w800,
                              color: AppColors.textPrimary,
                              height: 1.3,
                            ),
                          ),
                          const SizedBox(height: 6),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: statusInfo.bgColor,
                              borderRadius: BorderRadius.circular(20),
                              border: statusInfo.borderColor != Colors.transparent
                                  ? Border.all(color: statusInfo.borderColor.withValues(alpha: 0.3))
                                  : null,
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                if (statusInfo.dotColor != Colors.transparent)
                                  Container(
                                    width: 6,
                                    height: 6,
                                    margin: const EdgeInsets.only(right: 5),
                                    decoration: BoxDecoration(
                                      color: statusInfo.dotColor,
                                      shape: BoxShape.circle,
                                    ),
                                  ),
                                Text(
                                  statusInfo.label,
                                  style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w700,
                                    color: statusInfo.textColor,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Container(
                  decoration: BoxDecoration(
                    color: AppColors.primary.withValues(alpha: 0.05),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: AppColors.primary.withValues(alpha: 0.1)),
                  ),
                  child: _buildMetaSection(
                    duration: duration,
                    totalQuestions: totalQuestions,
                    attemptsLeft: attemptsLeft,
                    hasReachedMaxAttempts: hasReachedMaxAttempts,
                    isClosed: isClosed,
                  ),
                ),
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                    color: AppColors.primary.withValues(alpha: 0.05),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: AppColors.primary.withValues(alpha: 0.1)),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        Icons.calendar_today_rounded,
                        size: 15,
                        color: AppColors.primary,
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          '${_fmtDate(classroomQuiz.startTime)} - ${_fmtDate(classroomQuiz.endTime)}',
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                            color: AppColors.primary,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 14),
                Row(
                  children: [
                    if (onReview != null)
                      Expanded(
                        child: Container(
                          height: 42,
                          decoration: BoxDecoration(
                            color: Colors.transparent,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: AppColors.primary.withValues(alpha: 0.3),
                              width: 1.5,
                            ),
                          ),
                          child: Material(
                            color: Colors.transparent,
                            child: InkWell(
                              borderRadius: BorderRadius.circular(12),
                              onTap: onReview,
                              child: Center(
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Icon(
                                      Icons.history_rounded,
                                      size: 17,
                                      color: AppColors.primary,
                                    ),
                                    const SizedBox(width: 6),
                                    Text(
                                      'Review',
                                      style: TextStyle(
                                        fontSize: 14,
                                        fontWeight: FontWeight.w700,
                                        color: AppColors.primary,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                        ),
                      ),
                    if (onReview != null) const SizedBox(width: 10),
                    Expanded(
                      flex: onReview == null ? 1 : 1,
                      child: Container(
                        height: 42,
                        decoration: BoxDecoration(
                          gradient: canStart ? AppColors.buttonGradient : null,
                          color: canStart ? null : Colors.grey.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(12),
                          boxShadow: canStart
                              ? [
                                  BoxShadow(
                                    color: AppColors.primary.withValues(alpha: 0.3),
                                    blurRadius: 8,
                                    offset: const Offset(0, 3),
                                  ),
                                ]
                              : null,
                        ),
                        child: Material(
                          color: Colors.transparent,
                          child: InkWell(
                            borderRadius: BorderRadius.circular(12),
                            onTap: canStart ? onStart : null,
                            child: Center(
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(
                                    canStart ? Icons.play_arrow_rounded : Icons.lock_outline_rounded,
                                    size: 18,
                                    color: canStart ? Colors.white : Colors.grey[400],
                                  ),
                                  const SizedBox(width: 6),
                                  Text(
                                    startLabel,
                                    style: TextStyle(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w700,
                                      color: canStart ? Colors.white : Colors.grey[400],
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
                if (latestAttempt != null && latestAttempt!.finalScore != null) ...[
                  const SizedBox(height: 10),
                  _buildScoreSummary(latestAttempt!),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMetaSection({
    required int duration,
    required int totalQuestions,
    required int attemptsLeft,
    required bool hasReachedMaxAttempts,
    required bool isClosed,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 10),
      child: Row(
        children: [
          Expanded(
            child: _MetaInfoCard(
              icon: Icons.timer_rounded,
              label: 'Duration',
              value: duration > 0 ? '$duration min' : '-',
              color: AppColors.primary,
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: _MetaInfoCard(
              icon: Icons.help_outline_rounded,
              label: 'Questions',
              value: totalQuestions > 0 ? '$totalQuestions' : '-',
              color: AppColors.accent,
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: _MetaInfoCard(
              icon: Icons.repeat_rounded,
              label: 'Attempts',
              value: hasReachedMaxAttempts ? '0 left' : '$attemptsLeft left',
              color: hasReachedMaxAttempts ? AppColors.warning : AppColors.success,
              isWarning: hasReachedMaxAttempts,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildScoreSummary(QuizAttemptInfo attempt) {
    final score = attempt.finalScore ?? 0;
    final max = quizDetail?.totalQuestions.toDouble() ?? 100;
    final pct = max > 0 ? (score / max * 100).clamp(0.0, 100.0) : 0.0;
    final scoreColor = _getScoreColor(pct);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: scoreColor.withValues(alpha: 0.06),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: scoreColor.withValues(alpha: 0.2)),
      ),
      child: Row(
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: scoreColor.withValues(alpha: 0.12),
              shape: BoxShape.circle,
            ),
            child: Icon(
              Icons.check_circle_rounded,
              size: 18,
              color: scoreColor,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
          Row(
            children: [
                    Text(
                      'Attempt #${attempt.attemptNumber}',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w800,
                        color: scoreColor,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(
                        color: scoreColor.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        _formatScore(attempt.finalScore),
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w900,
                          color: scoreColor,
                        ),
                ),
              ),
            ],
          ),
                const SizedBox(height: 2),
            Text(
                  'Submitted ${_fmtFull(attempt.startTime)}',
                  style: TextStyle(
                    fontSize: 11,
                    color: AppColors.textLight,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Color _getScoreColor(double pct) {
    if (pct >= 85) return AppColors.success;
    if (pct >= 60) return AppColors.accent;
    if (pct >= 40) return AppColors.warning;
    return AppColors.error;
  }

  String _formatScore(double? score) {
    if (score == null) return '-';
    if ((score - score.roundToDouble()).abs() < 0.001) {
      return score.toStringAsFixed(0);
    }
    return score.toStringAsFixed(1);
  }

  String _fmtDate(DateTime dt) {
    final local = dt.toLocal();
    final day = local.day.toString().padLeft(2, '0');
    final month = local.month.toString().padLeft(2, '0');
    final hour = local.hour.toString().padLeft(2, '0');
    final minute = local.minute.toString().padLeft(2, '0');
    return '$day/$month $hour:$minute';
  }

  String _fmtFull(DateTime dt) {
    final local = dt.toLocal();
    final day = local.day.toString().padLeft(2, '0');
    final month = local.month.toString().padLeft(2, '0');
    final year = local.year;
    final hour = local.hour.toString().padLeft(2, '0');
    final minute = local.minute.toString().padLeft(2, '0');
    return '$day/$month/$year $hour:$minute';
  }
}

class _QuizStatusInfo {
  final String label;
  final Color textColor;
  final Color bgColor;
  final Color dotColor;
  final Color borderColor;

  _QuizStatusInfo(this.label, this.textColor, this.bgColor, this.dotColor)
      : borderColor = dotColor;
}

class _MetaInfoCard extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final Color color;
  final bool isWarning;

  const _MetaInfoCard({
    required this.icon,
    required this.label,
    required this.value,
    required this.color,
    this.isWarning = false,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Icon(icon, size: 20, color: color),
        const SizedBox(height: 4),
        Text(
          value,
          style: TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.w900,
            color: color,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          label,
          style: TextStyle(
            fontSize: 10,
            fontWeight: FontWeight.w600,
            color: AppColors.textLight,
          ),
        ),
      ],
    );
  }
}
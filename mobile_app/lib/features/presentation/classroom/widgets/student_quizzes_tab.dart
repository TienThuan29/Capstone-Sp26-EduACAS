import 'package:flutter/material.dart';
import 'package:mobile/core/storage/token_storage.dart';
import 'package:mobile/core/theme/app_colors.dart';
import 'package:mobile/core/widgets/background.dart';
import 'package:mobile/features/models/quiz_practice.dart';
import 'package:mobile/features/presentation/quiz/quiz_attempt_page.dart';
import 'package:mobile/features/presentation/quiz/quiz_review_page.dart';
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
      final quizzes = await QuizPracticeService.getClassroomQuizzes(widget.classroomId);

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
        _isLoading
            ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
            : _error != null
                ? _buildErrorState()
                : _buildQuizList(),
      ],
    );
  }

  Widget _buildQuizList() {
    if (_classroomQuizzes.isEmpty) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.quiz_outlined, size: 56, color: Colors.grey[300]),
            const SizedBox(height: 10),
            Text(
              'No quizzes available yet.',
              style: TextStyle(color: Colors.grey[600], fontSize: 15),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadData,
      child: ListView.builder(
        padding: const EdgeInsets.fromLTRB(16, 20, 16, 24),
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

    String startLabel = 'Start';
    if (!isOngoing) {
      startLabel = 'Unavailable';
    } else if (isNotStarted) {
      startLabel = 'Not started';
    } else if (isClosed) {
      startLabel = 'Closed';
    } else if (hasReachedMaxAttempts) {
      startLabel = 'No attempts left';
    }

    final title = quizDetail?.title ?? 'Quiz ${classroomQuiz.id.substring(0, classroomQuiz.id.length > 8 ? 8 : classroomQuiz.id.length)}';

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 12,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w800, color: AppColors.textPrimary),
          ),
          const SizedBox(height: 8),
          Text(
            'Duration: ${quizDetail?.duration ?? '-'} min • Questions: ${quizDetail?.totalQuestions ?? '-'}',
            style: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
          ),
          const SizedBox(height: 6),
          Text(
            'Window: ${_fmt(classroomQuiz.startTime)} - ${_fmt(classroomQuiz.endTime)}',
            style: const TextStyle(fontSize: 12, color: AppColors.textLight),
          ),
          const SizedBox(height: 4),
          Text(
            'Attempts: $usedAttempts/${classroomQuiz.maxOfAttempts}',
            style: TextStyle(
              fontSize: 12,
              color: hasReachedMaxAttempts ? AppColors.error : AppColors.textSecondary,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: onReview,
                  icon: const Icon(Icons.history_rounded),
                  label: const Text('Review'),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: canStart ? onStart : null,
                  icon: const Icon(Icons.play_arrow_rounded),
                  label: Text(startLabel),
                ),
              ),
            ],
          ),
          if (latestAttempt != null) ...[
            const SizedBox(height: 10),
            Text(
              'Last attempt: #${latestAttempt!.attemptNumber} • ${_fmt(latestAttempt!.startTime)}',
              style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
            ),
          ],
        ],
      ),
    );
  }

  String _fmt(DateTime dt) {
    final local = dt.toLocal();
    final day = local.day.toString().padLeft(2, '0');
    final month = local.month.toString().padLeft(2, '0');
    final hour = local.hour.toString().padLeft(2, '0');
    final minute = local.minute.toString().padLeft(2, '0');
    return '$day/$month $hour:$minute';
  }
}
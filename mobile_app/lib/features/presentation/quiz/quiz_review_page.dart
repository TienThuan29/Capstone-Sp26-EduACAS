import 'package:flutter/material.dart';
import 'package:mobile/core/theme/app_colors.dart';
import 'package:mobile/core/widgets/background.dart';
import 'package:mobile/features/models/quiz_practice.dart';
import 'package:mobile/features/presentation/quiz/quiz_attempt_page.dart';
import 'package:mobile/features/services/quiz_practice_service.dart';

class QuizReviewPage extends StatefulWidget {
  final ClassroomQuiz classroomQuiz;
  final QuizDetail quizDetail;
  final String attemptId;

  const QuizReviewPage({
    super.key,
    required this.classroomQuiz,
    required this.quizDetail,
    required this.attemptId,
  });

  @override
  State<QuizReviewPage> createState() => _QuizReviewPageState();
}

class _QuizReviewPageState extends State<QuizReviewPage> {
  bool _isLoading = true;
  String? _error;
  QuizAttemptInfo? _attempt;
  List<QuestionDetail> _questions = [];
  Map<String, StudentAnswerInfo> _answersByQuestionId = {};

  @override
  void initState() {
    super.initState();
    _loadReview();
  }

  String _normalizeQuestionType(String rawType) {
    return rawType.trim().toUpperCase();
  }

  String _questionTypeLabel(String rawType) {
    switch (_normalizeQuestionType(rawType)) {
      case 'MULTIPLE_CHOICE':
        return 'Multiple choice';
      case 'ESSAY':
        return 'Essay';
      case 'SINGLE_CHOICE':
      default:
        return 'Single choice';
    }
  }

  Future<void> _loadReview() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final attempt = await QuizPracticeService.getAttemptById(widget.attemptId);
      final answers = await QuizPracticeService.getStudentAnswersByAttempt(widget.attemptId);

      final sortedRefs = [...widget.quizDetail.questions]
        ..sort((a, b) => a.displayOrder.compareTo(b.displayOrder));

      final questionFutures = sortedRefs
          .map((ref) => QuizPracticeService.getQuestionById(ref.questionId))
          .toList();

      final loadedQuestions = await Future.wait(questionFutures);
      final questions = loadedQuestions.whereType<QuestionDetail>().toList();

      if (!mounted) return;

      setState(() {
        _attempt = attempt;
        _questions = questions;
        _answersByQuestionId = {
          for (final ans in answers) ans.questionId: ans,
        };
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
                _buildHeader(context),
                Expanded(child: _buildBody()),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHeader(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
      child: Row(
        children: [
          IconButton(
            onPressed: () => Navigator.pop(context),
            icon: const Icon(Icons.arrow_back_ios_new_rounded, color: AppColors.primary, size: 20),
            padding: EdgeInsets.zero,
            constraints: const BoxConstraints(),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  widget.quizDetail.title,
                  style: const TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w900,
                    color: AppColors.textPrimary,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const Text(
                  'Review Attempt',
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
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator(color: AppColors.primary));
    }

    if (_error != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.error_outline, color: AppColors.error, size: 48),
              const SizedBox(height: 12),
              Text(_error!, textAlign: TextAlign.center),
              const SizedBox(height: 16),
              ElevatedButton(onPressed: _loadReview, child: const Text('Try again')),
            ],
          ),
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadReview,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
        children: [
          _buildAttemptSummaryCard(),
          const SizedBox(height: 12),
          _buildRetakeSection(),
          const SizedBox(height: 16),
          ..._questions.asMap().entries.map((entry) {
            return Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: _buildQuestionReviewCard(entry.key + 1, entry.value),
            );
          }),
        ],
      ),
    );
  }

  Widget _buildAttemptSummaryCard() {
    final start = _attempt?.startTime;
    final end = _attempt?.endTime;

    String durationText = '-';
    if (start != null && end != null) {
      final duration = end.difference(start);
      final min = duration.inMinutes;
      final sec = duration.inSeconds % 60;
      durationText = '${min}m ${sec}s';
    }

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
          const Text(
            'Attempt Summary',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: AppColors.textPrimary),
          ),
          const SizedBox(height: 12),
          _summaryRow(Icons.timer_outlined, 'Duration', durationText),
          _summaryRow(Icons.flag_circle_outlined, 'Status', _attempt?.status ?? '-'),
          _summaryRow(Icons.format_list_numbered_outlined, 'Attempt #', '${_attempt?.attemptNumber ?? '-'}'),
        ],
      ),
    );
  }

  Widget _summaryRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Icon(icon, size: 18, color: AppColors.textSecondary),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              label,
              style: const TextStyle(fontSize: 14, color: AppColors.textSecondary),
            ),
          ),
          Text(
            value,
            style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: AppColors.textPrimary),
          ),
        ],
      ),
    );
  }

  Widget _buildRetakeSection() {
    final now = DateTime.now().toUtc();
    final isOngoing = widget.classroomQuiz.status.toUpperCase() == 'ONGOING';
    final inWindow = now.isAfter(widget.classroomQuiz.startTime) && now.isBefore(widget.classroomQuiz.endTime);
    final usedAttempts = _attempt?.attemptNumber ?? 0;
    final hasAttemptsLeft = usedAttempts < widget.classroomQuiz.maxOfAttempts;
    final canRetake = isOngoing && inWindow && hasAttemptsLeft;

    String helper = 'You can retake this quiz now.';
    if (!isOngoing) {
      helper = 'Quiz is not ongoing.';
    } else if (!inWindow) {
      helper = 'Quiz is outside its active time window.';
    } else if (!hasAttemptsLeft) {
      helper = 'No attempts left.';
    }

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Attempts: $usedAttempts/${widget.classroomQuiz.maxOfAttempts}',
            style: const TextStyle(
              fontSize: 13,
              color: AppColors.textSecondary,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            helper,
            style: TextStyle(
              fontSize: 13,
              color: canRetake ? AppColors.success : AppColors.error,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 10),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: canRetake
                  ? () {
                      Navigator.pushReplacement(
                        context,
                        MaterialPageRoute(
                          builder: (_) => QuizAttemptPage(
                            classroomQuiz: widget.classroomQuiz,
                            quizDetail: widget.quizDetail,
                          ),
                        ),
                      );
                    }
                  : null,
              icon: const Icon(Icons.refresh_rounded),
              label: const Text('Retake Quiz'),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildQuestionReviewCard(int index, QuestionDetail question) {
    final answer = _answersByQuestionId[question.id];
    final normalizedType = _normalizeQuestionType(question.type);

    String yourAnswerText = 'Not answered';
    if (answer != null) {
      if (normalizedType == 'ESSAY') {
        final text = answer.textAnswer?.trim() ?? '';
        yourAnswerText = text.isNotEmpty ? text : 'Not answered';
      } else if (normalizedType == 'MULTIPLE_CHOICE') {
        final selectedIds = (answer.answerOptionId ?? '')
            .split(',')
            .map((e) => e.trim())
            .where((e) => e.isNotEmpty)
            .toSet();
        final selectedContents = question.answerOptions
            .where((option) => selectedIds.contains(option.id))
            .map((option) => option.content)
            .toList();
        if (selectedContents.isNotEmpty) {
          yourAnswerText = selectedContents.join(', ');
        }
      } else {
        AnswerOptionDetail? selectedOption;
        for (final option in question.answerOptions) {
          if (option.id == answer.answerOptionId) {
            selectedOption = option;
            break;
          }
        }
        if (selectedOption != null) {
          yourAnswerText = selectedOption.content;
        }
      }
    }

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Question $index',
            style: const TextStyle(fontSize: 12, color: AppColors.textSecondary, fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 4),
          Text(
            _questionTypeLabel(question.type),
            style: const TextStyle(fontSize: 12, color: AppColors.textSecondary, fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 6),
          Text(
            question.content,
            style: const TextStyle(fontSize: 15, color: AppColors.textPrimary, fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 12),
          Text(
            'Your answer: $yourAnswerText',
            style: const TextStyle(fontSize: 14, color: AppColors.textSecondary),
          ),
          const SizedBox(height: 8),
          if (answer != null)
            Row(
              children: [
                Icon(
                  answer.isCorrect ? Icons.check_circle_rounded : Icons.cancel_rounded,
                  color: answer.isCorrect ? AppColors.success : AppColors.error,
                  size: 18,
                ),
                const SizedBox(width: 6),
                Text(
                  answer.isCorrect ? 'Correct' : 'Incorrect',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: answer.isCorrect ? AppColors.success : AppColors.error,
                  ),
                ),
              ],
            ),
        ],
      ),
    );
  }
}

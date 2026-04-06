import 'dart:async';

import 'package:flutter/material.dart';
import 'package:mobile/core/storage/token_storage.dart';
import 'package:mobile/core/theme/app_colors.dart';
import 'package:mobile/core/widgets/background.dart';
import 'package:mobile/features/models/quiz_practice.dart';
import 'package:mobile/features/presentation/quiz/quiz_review_page.dart';
import 'package:mobile/features/services/quiz_practice_service.dart';

class QuizAttemptPage extends StatefulWidget {
  final ClassroomQuiz classroomQuiz;
  final QuizDetail quizDetail;

  const QuizAttemptPage({
    super.key,
    required this.classroomQuiz,
    required this.quizDetail,
  });

  @override
  State<QuizAttemptPage> createState() => _QuizAttemptPageState();
}

class _QuizAttemptPageState extends State<QuizAttemptPage> {
  bool _isLoading = true;
  bool _isSubmitting = false;
  String? _error;

  QuizAttemptInfo? _attempt;
  List<QuestionDetail> _questions = [];
  final Map<String, String> _selectedOptionByQuestionId = {};
  int _currentIndex = 0;

  int _remainingSeconds = 0;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _bootstrap();
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  Future<void> _bootstrap() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final userId = await TokenStorage.getUserId();
      if (userId == null || userId.isEmpty) {
        throw Exception('Missing user id. Please login again.');
      }

      final attempt = await QuizPracticeService.startAttempt(
        classroomQuizId: widget.classroomQuiz.id,
        studentId: userId,
      );

      final refs = [...widget.quizDetail.questions]
        ..sort((a, b) => a.displayOrder.compareTo(b.displayOrder));

      final questionFutures = refs
          .map((ref) => QuizPracticeService.getQuestionById(ref.questionId))
          .toList();

      final loadedQuestions = await Future.wait(questionFutures);
      final questions = loadedQuestions.whereType<QuestionDetail>().toList();

      if (questions.isEmpty) {
        throw Exception('This quiz has no available questions.');
      }

      final nowUtc = DateTime.now().toUtc();
      final quizDurationSeconds = widget.quizDetail.duration * 60;
      final availableWindowSeconds = widget.classroomQuiz.endTime.difference(nowUtc).inSeconds;
      final countdown = quizDurationSeconds < availableWindowSeconds
          ? quizDurationSeconds
          : availableWindowSeconds;

      if (!mounted) return;
      setState(() {
        _attempt = attempt;
        _questions = questions;
        _remainingSeconds = countdown > 0 ? countdown : 0;
        _isLoading = false;
      });

      _startTimer();
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString().replaceFirst('Exception: ', '');
        _isLoading = false;
      });
    }
  }

  void _startTimer() {
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted || _isSubmitting) return;

      if (_remainingSeconds <= 0) {
        timer.cancel();
        _submit(isAutoSubmit: true);
        return;
      }

      setState(() {
        _remainingSeconds -= 1;
      });
    });
  }

  Future<void> _onSelectOption(QuestionDetail question, String optionId) async {
    setState(() {
      _selectedOptionByQuestionId[question.id] = optionId;
    });

    final attemptId = _attempt?.id;
    if (attemptId == null || attemptId.isEmpty) return;

    try {
      await QuizPracticeService.updateAnswer(
        attemptId: attemptId,
        questionId: question.id,
        selectedOptionId: optionId,
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Cannot save answer now: $e'),
          backgroundColor: AppColors.warning,
        ),
      );
    }
  }

  Future<void> _submit({bool isAutoSubmit = false}) async {
    final attemptId = _attempt?.id;
    if (_isSubmitting || attemptId == null || attemptId.isEmpty) return;

    setState(() {
      _isSubmitting = true;
    });

    try {
      final submitted = await QuizPracticeService.submitAttempt(attemptId);
      if (!mounted) return;

      if (isAutoSubmit) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Time is up. Quiz submitted automatically.'),
            backgroundColor: AppColors.warning,
          ),
        );
      }

      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (_) => QuizReviewPage(
            classroomQuiz: widget.classroomQuiz,
            quizDetail: widget.quizDetail,
            attemptId: submitted.id,
          ),
        ),
      );
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _isSubmitting = false;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Submit failed: $e'),
          backgroundColor: AppColors.error,
        ),
      );
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
                if (!_isLoading && _error == null) _buildFooterActions(),
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
            onPressed: _isSubmitting ? null : () => Navigator.pop(context),
            icon: const Icon(Icons.arrow_back_ios_new_rounded, color: AppColors.primary, size: 20),
            padding: EdgeInsets.zero,
            constraints: const BoxConstraints(),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              widget.quizDetail.title,
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w900,
                color: AppColors.textPrimary,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(
              _formatCountdown(_remainingSeconds),
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w800,
                color: AppColors.primary,
              ),
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
              ElevatedButton(onPressed: _bootstrap, child: const Text('Try again')),
            ],
          ),
        ),
      );
    }

    final question = _questions[_currentIndex];
    final selectedOptionId = _selectedOptionByQuestionId[question.id];

    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Question ${_currentIndex + 1} of ${_questions.length}',
            style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w700,
              color: AppColors.textSecondary,
            ),
          ),
          const SizedBox(height: 12),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
            ),
            child: Text(
              question.content,
              style: const TextStyle(
                fontSize: 16,
                color: AppColors.textPrimary,
                fontWeight: FontWeight.w700,
                height: 1.5,
              ),
            ),
          ),
          const SizedBox(height: 14),
          ...question.answerOptions.map((option) {
            return Container(
              margin: const EdgeInsets.only(bottom: 8),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: selectedOptionId == option.id
                      ? AppColors.primary
                      : Colors.grey.withValues(alpha: 0.25),
                ),
              ),
              child: RadioListTile<String>(
                value: option.id,
                groupValue: selectedOptionId,
                title: Text(option.content),
                onChanged: _isSubmitting
                    ? null
                    : (value) {
                        if (value != null) {
                          _onSelectOption(question, value);
                        }
                      },
              ),
            );
          }),
        ],
      ),
    );
  }

  Widget _buildFooterActions() {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 10, 16, 18),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.95),
        border: Border(top: BorderSide(color: Colors.grey.withValues(alpha: 0.2))),
      ),
      child: Row(
        children: [
          Expanded(
            child: OutlinedButton.icon(
              onPressed: _isSubmitting || _currentIndex == 0
                  ? null
                  : () {
                      setState(() {
                        _currentIndex -= 1;
                      });
                    },
              icon: const Icon(Icons.chevron_left_rounded),
              label: const Text('Prev'),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: ElevatedButton.icon(
              onPressed: _isSubmitting
                  ? null
                  : () {
                      if (_currentIndex < _questions.length - 1) {
                        setState(() {
                          _currentIndex += 1;
                        });
                      } else {
                        _submit();
                      }
                    },
              icon: Icon(_currentIndex < _questions.length - 1
                  ? Icons.chevron_right_rounded
                  : Icons.send_rounded),
              label: Text(_currentIndex < _questions.length - 1 ? 'Next' : 'Submit'),
            ),
          ),
        ],
      ),
    );
  }

  String _formatCountdown(int seconds) {
    final m = (seconds ~/ 60).toString().padLeft(2, '0');
    final s = (seconds % 60).toString().padLeft(2, '0');
    return '$m:$s';
  }
}

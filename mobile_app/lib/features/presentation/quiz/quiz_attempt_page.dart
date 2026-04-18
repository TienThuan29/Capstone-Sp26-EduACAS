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
  final Map<String, String> _selectedSingleOptionByQuestionId = {};
  final Map<String, Set<String>> _selectedMultiOptionsByQuestionId = {};
  final Map<String, TextEditingController> _essayControllerByQuestionId = {};
  final Map<String, Timer> _essayDebounceByQuestionId = {};
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
    for (final timer in _essayDebounceByQuestionId.values) {
      timer.cancel();
    }
    for (final controller in _essayControllerByQuestionId.values) {
      controller.dispose();
    }
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

      final attempts = await QuizPracticeService.getAttemptsByStudent(userId);
      final existingInProgress = attempts
          .where((attempt) =>
              attempt.classroomQuizId == widget.classroomQuiz.id &&
              _isInProgressAttempt(attempt))
          .toList()
        ..sort((a, b) => b.startTime.compareTo(a.startTime));

      final attempt = existingInProgress.isNotEmpty
          ? existingInProgress.first
          : await QuizPracticeService.startAttempt(
              classroomQuizId: widget.classroomQuiz.id,
              studentId: userId,
            );

      final enrichedAttempt = await QuizPracticeService.getAttemptById(attempt.id) ?? attempt;

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

      _restoreCachedAnswers(questions, enrichedAttempt.answers);

      final nowUtc = DateTime.now().toUtc();
      final countdown = _calculateRemainingSeconds(enrichedAttempt, nowUtc);

      if (!mounted) return;
      setState(() {
        _attempt = enrichedAttempt;
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

  bool _isInProgressAttempt(QuizAttemptInfo attempt) {
    return attempt.status.trim().toUpperCase() == 'INPROGRESS';
  }

  int _calculateRemainingSeconds(QuizAttemptInfo attempt, DateTime nowUtc) {
    if (attempt.endTime != null) {
      return attempt.endTime!.difference(nowUtc).inSeconds;
    }

    final quizDurationSeconds = widget.quizDetail.duration * 60;
    final availableWindowSeconds = widget.classroomQuiz.endTime.difference(nowUtc).inSeconds;
    return quizDurationSeconds < availableWindowSeconds
        ? quizDurationSeconds
        : availableWindowSeconds;
  }

  void _restoreCachedAnswers(List<QuestionDetail> questions, Map<String, String> answersByQuestionIdRaw) {
    _selectedSingleOptionByQuestionId.clear();
    _selectedMultiOptionsByQuestionId.clear();

    for (final timer in _essayDebounceByQuestionId.values) {
      timer.cancel();
    }
    _essayDebounceByQuestionId.clear();

    for (final controller in _essayControllerByQuestionId.values) {
      controller.dispose();
    }
    _essayControllerByQuestionId.clear();

    final answersByQuestionId = answersByQuestionIdRaw.map(
      (key, value) => MapEntry(key.trim().toLowerCase(), value),
    );

    for (final question in questions) {
      final raw = answersByQuestionId[question.id.toLowerCase()] ?? '';
      if (raw.trim().isEmpty) continue;

      final type = _normalizeQuestionType(question.type);
      if (type == 'ESSAY') {
        final controller = _essayControllerFor(question);
        controller.text = raw;
        continue;
      }

      if (type == 'MULTIPLE_CHOICE') {
        final selected = raw
            .split(',')
            .map((id) => id.trim())
            .where((id) => id.isNotEmpty)
            .toSet();
        _selectedMultiOptionsByQuestionId[question.id] = selected;
        continue;
      }

      final selectedSingle = raw.trim();
      if (selectedSingle.isNotEmpty) {
        _selectedSingleOptionByQuestionId[question.id] = selectedSingle;
      }
    }
  }

  Future<void> _flushPendingEssaySaves() async {
    final pendingQuestionIds = _essayDebounceByQuestionId.keys.toList();
    for (final questionId in pendingQuestionIds) {
      _essayDebounceByQuestionId[questionId]?.cancel();
      _essayDebounceByQuestionId.remove(questionId);

      final text = _essayControllerByQuestionId[questionId]?.text ?? '';
      await _saveAnswer(
        questionId: questionId,
        textAnswer: text,
      );
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

  Future<void> _saveAnswer({
    required String questionId,
    String? selectedOptionId,
    String? textAnswer,
  }) async {
    final attemptId = _attempt?.id;
    if (attemptId == null || attemptId.isEmpty) return;

    try {
      await QuizPracticeService.updateAnswer(
        attemptId: attemptId,
        questionId: questionId,
        selectedOptionId: selectedOptionId,
        textAnswer: textAnswer,
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

  Future<void> _onSelectSingleOption(QuestionDetail question, String optionId) async {
    setState(() {
      _selectedSingleOptionByQuestionId[question.id] = optionId;
    });

    await _saveAnswer(
      questionId: question.id,
      selectedOptionId: optionId,
    );
  }

  Future<void> _onToggleMultiOption(QuestionDetail question, String optionId, bool checked) async {
    final current = {...(_selectedMultiOptionsByQuestionId[question.id] ?? <String>{})};
    if (checked) {
      current.add(optionId);
    } else {
      current.remove(optionId);
    }

    final orderedSelected = question.answerOptions
        .where((option) => current.contains(option.id))
        .map((option) => option.id)
        .toList();
    final serialized = orderedSelected.join(',');

    setState(() {
      _selectedMultiOptionsByQuestionId[question.id] = current;
    });

    await _saveAnswer(
      questionId: question.id,
      selectedOptionId: serialized,
    );
  }

  TextEditingController _essayControllerFor(QuestionDetail question) {
    final existing = _essayControllerByQuestionId[question.id];
    if (existing != null) return existing;

    final created = TextEditingController();
    _essayControllerByQuestionId[question.id] = created;
    return created;
  }

  void _onEssayChanged(QuestionDetail question, String value) {
    _essayDebounceByQuestionId[question.id]?.cancel();
    _essayDebounceByQuestionId[question.id] = Timer(const Duration(milliseconds: 500), () {
      _saveAnswer(
        questionId: question.id,
        textAnswer: value,
      );
    });
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

  bool _isQuestionAnswered(QuestionDetail question) {
    final normalizedType = _normalizeQuestionType(question.type);
    if (normalizedType == 'ESSAY') {
      final text = _essayControllerByQuestionId[question.id]?.text ?? '';
      return text.trim().isNotEmpty;
    }

    if (normalizedType == 'MULTIPLE_CHOICE') {
      final selected = _selectedMultiOptionsByQuestionId[question.id];
      return selected != null && selected.isNotEmpty;
    }

    final single = _selectedSingleOptionByQuestionId[question.id];
    return single != null && single.trim().isNotEmpty;
  }

  void _openQuestionNavigator() {
    if (_questions.isEmpty) return;

    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (sheetContext) {
        return SafeArea(
          child: Container(
            decoration: const BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
            ),
            padding: const EdgeInsets.fromLTRB(16, 14, 16, 20),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Text(
                      'Choose question',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    const Spacer(),
                    Text(
                      '${_questions.where(_isQuestionAnswered).length}/${_questions.length} answered',
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Flexible(
                  child: GridView.builder(
                    shrinkWrap: true,
                    itemCount: _questions.length,
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 6,
                      mainAxisSpacing: 8,
                      crossAxisSpacing: 8,
                      childAspectRatio: 1,
                    ),
                    itemBuilder: (context, index) {
                      final question = _questions[index];
                      final isCurrent = _currentIndex == index;
                      final isAnswered = _isQuestionAnswered(question);

                      Color background;
                      Color textColor;
                      if (isCurrent) {
                        background = AppColors.primary;
                        textColor = Colors.white;
                      } else if (isAnswered) {
                        background = AppColors.success.withValues(alpha: 0.15);
                        textColor = AppColors.success;
                      } else {
                        background = Colors.grey.withValues(alpha: 0.12);
                        textColor = AppColors.textSecondary;
                      }

                      return InkWell(
                        borderRadius: BorderRadius.circular(10),
                        onTap: () {
                          setState(() {
                            _currentIndex = index;
                          });
                          Navigator.pop(sheetContext);
                        },
                        child: Container(
                          decoration: BoxDecoration(
                            color: background,
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(
                              color: isCurrent
                                  ? AppColors.primary
                                  : Colors.grey.withValues(alpha: 0.2),
                            ),
                          ),
                          alignment: Alignment.center,
                          child: Text(
                            '${index + 1}',
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w800,
                              color: textColor,
                            ),
                          ),
                        ),
                      );
                    },
                  ),
                ),
                const SizedBox(height: 10),
                Row(
                  children: [
                    _legendDot(color: AppColors.primary, label: 'Current'),
                    const SizedBox(width: 10),
                    _legendDot(color: AppColors.success, label: 'Answered'),
                    const SizedBox(width: 10),
                    _legendDot(color: Colors.grey, label: 'Unanswered'),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _legendDot({required Color color, required String label}) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 10,
          height: 10,
          decoration: BoxDecoration(
            color: color,
            borderRadius: BorderRadius.circular(999),
          ),
        ),
        const SizedBox(width: 4),
        Text(
          label,
          style: const TextStyle(
            fontSize: 12,
            color: AppColors.textSecondary,
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
    );
  }

  Widget _buildQuestionInput(QuestionDetail question) {
    final normalizedType = _normalizeQuestionType(question.type);

    if (normalizedType == 'ESSAY') {
      final controller = _essayControllerFor(question);
      return TextField(
        controller: controller,
        minLines: 5,
        maxLines: 10,
        enabled: !_isSubmitting,
        onChanged: (value) => _onEssayChanged(question, value),
        decoration: InputDecoration(
          hintText: 'Type your answer...',
          filled: true,
          fillColor: Colors.white,
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide(color: Colors.grey.withValues(alpha: 0.25)),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide(color: Colors.grey.withValues(alpha: 0.25)),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: AppColors.primary, width: 1.4),
          ),
        ),
      );
    }

    if (normalizedType == 'MULTIPLE_CHOICE') {
      final selected = _selectedMultiOptionsByQuestionId[question.id] ?? <String>{};
      return Column(
        children: question.answerOptions.map((option) {
          final checked = selected.contains(option.id);
          return Container(
            margin: const EdgeInsets.only(bottom: 8),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: checked ? AppColors.primary : Colors.grey.withValues(alpha: 0.25),
              ),
            ),
            child: CheckboxListTile(
              value: checked,
              title: Text(option.content),
              activeColor: AppColors.primary,
              controlAffinity: ListTileControlAffinity.leading,
              onChanged: _isSubmitting
                  ? null
                  : (value) {
                      _onToggleMultiOption(question, option.id, value == true);
                    },
            ),
          );
        }).toList(),
      );
    }

    final selectedOptionId = _selectedSingleOptionByQuestionId[question.id];
    return Column(
      children: question.answerOptions.map((option) {
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
                      _onSelectSingleOption(question, value);
                    }
                  },
          ),
        );
      }).toList(),
    );
  }

  Future<void> _submit({bool isAutoSubmit = false}) async {
    final attemptId = _attempt?.id;
    if (_isSubmitting || attemptId == null || attemptId.isEmpty) return;

    await _flushPendingEssaySaves();

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
            onPressed: _isSubmitting
                ? null
                : () async {
                    await _flushPendingEssaySaves();
                    if (!mounted) return;
                    Navigator.pop(context);
                  },
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
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(
                'Question ${_currentIndex + 1} of ${_questions.length}',
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textSecondary,
                ),
              ),
              const Spacer(),
              OutlinedButton.icon(
                onPressed: _isSubmitting ? null : _openQuestionNavigator,
                icon: const Icon(Icons.grid_view_rounded, size: 16),
                label: const Text('Questions'),
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                  visualDensity: VisualDensity.compact,
                ),
              ),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(999),
                  border: Border.all(color: Colors.grey.withValues(alpha: 0.2)),
                ),
                child: Text(
                  _questionTypeLabel(question.type),
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textSecondary,
                  ),
                ),
              ),
            ],
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
          _buildQuestionInput(question),
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

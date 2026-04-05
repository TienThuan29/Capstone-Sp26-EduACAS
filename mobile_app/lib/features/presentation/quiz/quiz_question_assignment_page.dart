import 'package:flutter/material.dart';
import 'package:mobile/core/theme/app_colors.dart';
import 'package:mobile/core/widgets/background.dart';
import 'package:mobile/features/models/question.dart';
import 'package:mobile/features/models/quiz.dart';
import 'package:mobile/features/services/question_service.dart';
import 'package:mobile/features/services/quiz_service.dart';

class QuizQuestionAssignmentPage extends StatefulWidget {
  final String quizId;
  final String quizTitle;

  const QuizQuestionAssignmentPage({
    super.key,
    required this.quizId,
    required this.quizTitle,
  });

  @override
  State<QuizQuestionAssignmentPage> createState() => _QuizQuestionAssignmentPageState();
}

class _QuizQuestionAssignmentPageState extends State<QuizQuestionAssignmentPage> {
  final TextEditingController _searchController = TextEditingController();

  bool _isLoading = true;
  bool _isSaving = false;
  String? _errorMessage;

  Quiz? _quiz;
  List<Question> _questions = [];
  final Map<String, _SelectedQuestionMeta> _selectedMap = {};

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final quiz = await QuizService.getQuizById(widget.quizId);
      final questionResult = await QuestionService.getQuestionsPaged(pageSize: 200);

      if (quiz == null) {
        throw Exception('Quiz not found');
      }

      _selectedMap.clear();
      for (final item in quiz.questions) {
        _selectedMap[item.questionId] = _SelectedQuestionMeta(
          marks: item.marks,
          displayOrder: item.displayOrder,
        );
      }

      if (!mounted) return;
      setState(() {
        _quiz = quiz;
        _questions = questionResult.items;
        _isLoading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _errorMessage = e.toString();
        _isLoading = false;
      });
    }
  }

  List<Question> get _filteredQuestions {
    final keyword = _searchController.text.trim().toLowerCase();
    if (keyword.isEmpty) return _questions;

    return _questions.where((item) => item.content.toLowerCase().contains(keyword)).toList();
  }

  int get _selectedCount => _selectedMap.length;

  void _toggleQuestion(Question question, bool isSelected) {
    setState(() {
      if (isSelected) {
        _selectedMap[question.id] = _SelectedQuestionMeta(
          marks: 1,
          displayOrder: _selectedMap.length + 1,
        );
      } else {
        _selectedMap.remove(question.id);
      }
    });
  }

  void _changeMarks(String questionId, int delta) {
    final current = _selectedMap[questionId];
    if (current == null) return;

    final nextMarks = (current.marks + delta).clamp(1, 100).toDouble();
    setState(() {
      _selectedMap[questionId] = current.copyWith(marks: nextMarks);
    });
  }

  void _changeOrder(String questionId, int delta) {
    final current = _selectedMap[questionId];
    if (current == null) return;

    final maxOrder = _selectedMap.length;
    final nextOrder = (current.displayOrder + delta).clamp(1, maxOrder);
    setState(() {
      _selectedMap[questionId] = current.copyWith(displayOrder: nextOrder);
    });
  }

  Future<void> _save() async {
    setState(() => _isSaving = true);

    try {
      final payload = _selectedMap.entries
          .map(
            (entry) => AssignQuizQuestionPayload(
              questionId: entry.key,
              marks: entry.value.marks,
              displayOrder: entry.value.displayOrder,
            ),
          )
          .toList()
        ..sort((a, b) => a.displayOrder.compareTo(b.displayOrder));

      await QuizService.assignQuestions(quizId: widget.quizId, questions: payload);

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Assigned questions successfully'),
          backgroundColor: AppColors.success,
        ),
      );
      Navigator.pop(context);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.toString()), backgroundColor: AppColors.error),
      );
    } finally {
      if (mounted) {
        setState(() => _isSaving = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.quizTitle),
        actions: [
          TextButton(
            onPressed: _isSaving || _isLoading ? null : _save,
            child: _isSaving
                ? const SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Text('Save', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
      body: Stack(
        children: [
          const GradientBackground(),
          Column(
            children: [
              _buildTopInfo(),
              _buildSearch(),
              Expanded(child: _buildBody()),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildTopInfo() {
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 16, 16, 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.withValues(alpha: 0.12)),
      ),
      child: Row(
        children: [
          const Icon(Icons.playlist_add_check_circle_rounded, color: AppColors.primary),
          const SizedBox(width: 8),
          Text(
            'Selected $_selectedCount question(s)',
            style: const TextStyle(
              color: AppColors.textPrimary,
              fontWeight: FontWeight.w700,
            ),
          ),
          const Spacer(),
          if (_quiz != null)
            Text(
              'Current: ${_quiz!.totalQuestions}',
              style: const TextStyle(color: AppColors.textLight, fontSize: 12),
            ),
        ],
      ),
    );
  }

  Widget _buildSearch() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
      child: TextField(
        controller: _searchController,
        onChanged: (_) => setState(() {}),
        decoration: InputDecoration(
          filled: true,
          fillColor: Colors.white,
          hintText: 'Search questions...',
          hintStyle: const TextStyle(fontSize: 13),
          prefixIcon: const Icon(Icons.search_rounded, size: 20),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide(color: Colors.grey.withValues(alpha: 0.2)),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide(color: Colors.grey.withValues(alpha: 0.2)),
          ),
          focusedBorder: const OutlineInputBorder(
            borderRadius: BorderRadius.all(Radius.circular(12)),
            borderSide: BorderSide(color: AppColors.primary, width: 1.5),
          ),
        ),
      ),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_errorMessage != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline_rounded, color: AppColors.error, size: 64),
              const SizedBox(height: 10),
              Text(_errorMessage!, textAlign: TextAlign.center),
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

    final data = _filteredQuestions;
    if (data.isEmpty) {
      return const Center(
        child: Text('No question found', style: TextStyle(color: AppColors.textLight)),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.fromLTRB(16, 4, 16, 24),
      itemCount: data.length,
      itemBuilder: (context, index) {
        final question = data[index];
        final selected = _selectedMap[question.id];

        return Container(
          margin: const EdgeInsets.only(bottom: 10),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: selected != null
                  ? AppColors.primary.withValues(alpha: 0.5)
                  : Colors.grey.withValues(alpha: 0.15),
            ),
          ),
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Checkbox(
                      value: selected != null,
                      onChanged: (value) => _toggleQuestion(question, value == true),
                    ),
                    Expanded(
                      child: Text(
                        question.content,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          fontWeight: FontWeight.w700,
                          color: AppColors.textPrimary,
                        ),
                      ),
                    ),
                  ],
                ),
                Padding(
                  padding: const EdgeInsets.only(left: 44),
                  child: Text(
                    questionTypeLabel(question.type),
                    style: const TextStyle(fontSize: 11, color: AppColors.textLight),
                  ),
                ),
                if (selected != null)
                  Padding(
                    padding: const EdgeInsets.only(left: 44, top: 10),
                    child: Row(
                      children: [
                        _buildAdjustButton(
                          label: 'Marks',
                          value: selected.marks.toStringAsFixed(0),
                          onMinus: () => _changeMarks(question.id, -1),
                          onPlus: () => _changeMarks(question.id, 1),
                        ),
                        const SizedBox(width: 12),
                        _buildAdjustButton(
                          label: 'Order',
                          value: selected.displayOrder.toString(),
                          onMinus: () => _changeOrder(question.id, -1),
                          onPlus: () => _changeOrder(question.id, 1),
                        ),
                      ],
                    ),
                  ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildAdjustButton({
    required String label,
    required String value,
    required VoidCallback onMinus,
    required VoidCallback onPlus,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: AppColors.background,
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        children: [
          Text(label, style: const TextStyle(fontSize: 11, color: AppColors.textSecondary)),
          IconButton(
            onPressed: onMinus,
            icon: const Icon(Icons.remove_rounded, size: 16),
            constraints: const BoxConstraints(minHeight: 24, minWidth: 24),
            padding: EdgeInsets.zero,
          ),
          Text(value, style: const TextStyle(fontWeight: FontWeight.w700)),
          IconButton(
            onPressed: onPlus,
            icon: const Icon(Icons.add_rounded, size: 16),
            constraints: const BoxConstraints(minHeight: 24, minWidth: 24),
            padding: EdgeInsets.zero,
          ),
        ],
      ),
    );
  }
}

class _SelectedQuestionMeta {
  final double marks;
  final int displayOrder;

  const _SelectedQuestionMeta({
    required this.marks,
    required this.displayOrder,
  });

  _SelectedQuestionMeta copyWith({double? marks, int? displayOrder}) {
    return _SelectedQuestionMeta(
      marks: marks ?? this.marks,
      displayOrder: displayOrder ?? this.displayOrder,
    );
  }
}

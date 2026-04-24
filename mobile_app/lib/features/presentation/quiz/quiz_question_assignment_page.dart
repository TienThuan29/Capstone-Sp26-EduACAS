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

  double get _totalMarks {
    final sum = _selectedMap.values.fold(0.0, (sum, item) => sum + item.marks);
    // Round to 2 decimal places to avoid floating point precision issues in UI
    return (sum * 100).roundToDouble() / 100.0;
  }

  void _distributeMarks() {
    if (_selectedMap.isEmpty) return;
    final each = 10.0 / _selectedMap.length;
    setState(() {
      for (final id in _selectedMap.keys) {
        _selectedMap[id] = _selectedMap[id]!.copyWith(marks: each);
      }
    });
  }

  void _changeMarks(String questionId, double delta) {
    final current = _selectedMap[questionId];
    if (current == null) return;

    final nextMarks = (current.marks + delta).clamp(0.0, 10.0);
    setState(() {
      _selectedMap[questionId] = current.copyWith(marks: nextMarks);
    });
  }

  void _setMarksExplicitly(String questionId, double value) {
    final current = _selectedMap[questionId];
    if (current == null) return;

    setState(() {
      _selectedMap[questionId] = current.copyWith(marks: value.clamp(0.0, 10.0));
    });
  }

  void _changeOrder(String questionId, int delta) {
    final currentMeta = _selectedMap[questionId];
    if (currentMeta == null) return;

    final targetOrder = (currentMeta.displayOrder + delta).clamp(1, _selectedMap.length);
    if (targetOrder == currentMeta.displayOrder) return;

    setState(() {
      // Find the question that currently has the targetOrder and swap them
      String? swapId;
      for (final entry in _selectedMap.entries) {
        if (entry.key != questionId && entry.value.displayOrder == targetOrder) {
          swapId = entry.key;
          break;
        }
      }

      if (swapId != null) {
        _selectedMap[swapId] = _selectedMap[swapId]!.copyWith(displayOrder: currentMeta.displayOrder);
      }
      _selectedMap[questionId] = currentMeta.copyWith(displayOrder: targetOrder);
    });
  }

  Future<void> _save() async {
    final total = _totalMarks;
    if (total != 10.0) {
      final confirmed = await showDialog<bool>(
        context: context,
        builder: (ctx) => AlertDialog(
          title: const Text('Invalid Total Marks'),
          content: Text('The total marks must be exactly 10. Current total is ${_formatMarks(total)}.\n\nWould you like to auto-distribute 10 points evenly across all selected questions?'),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('No, let me fix it')),
            TextButton(
              onPressed: () => Navigator.pop(ctx, true),
              child: const Text('Yes, distribute'),
              style: TextButton.styleFrom(foregroundColor: AppColors.primary),
            ),
          ],
        ),
      );

      if (confirmed == true) {
        _distributeMarks();
        return; // Don't save yet, let them see the changes
      } else {
        return;
      }
    }

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
    final total = _totalMarks;
    final isValid = total == 10.0;

    return Container(
      margin: const EdgeInsets.fromLTRB(16, 16, 16, 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isValid ? AppColors.success.withValues(alpha: 0.3) : Colors.grey.withValues(alpha: 0.12),
          width: isValid ? 1.5 : 1,
        ),
      ),
      child: Column(
        children: [
          Row(
            children: [
              Icon(
                Icons.playlist_add_check_circle_rounded,
                color: isValid ? AppColors.success : AppColors.primary,
              ),
              const SizedBox(width: 8),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '$_selectedCount question(s) selected',
                    style: const TextStyle(
                      color: AppColors.textPrimary,
                      fontWeight: FontWeight.w700,
                      fontSize: 13,
                    ),
                  ),
                  Text(
                    'Total Points: ${_formatMarks(total)} / 10',
                    style: TextStyle(
                      color: isValid ? AppColors.success : AppColors.error,
                      fontWeight: FontWeight.w800,
                      fontSize: 14,
                    ),
                  ),
                ],
              ),
              const Spacer(),
              if (_selectedCount > 0)
                ElevatedButton.icon(
                  onPressed: _distributeMarks,
                  icon: const Icon(Icons.balance_rounded, size: 14),
                  label: const Text('Split 10.0', style: TextStyle(fontSize: 11)),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary.withValues(alpha: 0.1),
                    foregroundColor: AppColors.primary,
                    elevation: 0,
                    padding: const EdgeInsets.symmetric(horizontal: 10),
                    minimumSize: const Size(0, 32),
                  ),
                ),
            ],
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
                        Expanded(
                          child: _AdjustableInput(
                            label: 'Marks',
                            value: selected.marks,
                            onChanged: (val) => _setMarksExplicitly(question.id, val),
                            onStep: (delta) => _changeMarks(question.id, delta),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _AdjustableInput(
                            label: 'Order',
                            value: selected.displayOrder.toDouble(),
                            isInteger: true,
                            onStep: (delta) => _changeOrder(question.id, delta.toInt()),
                          ),
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

  String _formatMarks(double marks) {
    // If it's effectively an integer
    if ((marks * 100).round() / 100 == marks.roundToDouble()) {
      return marks.round().toString();
    }
    
    // Show up to 2 decimal places, but remove trailing zeros
    String s = marks.toStringAsFixed(2);
    if (s.contains('.')) {
      s = s.replaceAll(RegExp(r'0+$'), ''); // Remove trailing zeros
      s = s.replaceAll(RegExp(r'\.$'), ''); // Remove trailing dot if any
    }
    return s;
  }
}

class _AdjustableInput extends StatefulWidget {
  final String label;
  final double value;
  final bool isInteger;
  final ValueChanged<double>? onChanged;
  final ValueChanged<double> onStep;

  const _AdjustableInput({
    required this.label,
    required this.value,
    this.isInteger = false,
    this.onChanged,
    required this.onStep,
  });

  @override
  State<_AdjustableInput> createState() => _AdjustableInputState();
}

class _AdjustableInputState extends State<_AdjustableInput> {
  late final TextEditingController _controller;
  late final FocusNode _focusNode;

  @override
  void initState() {
    super.initState();
    _controller = TextEditingController(text: _formatValue(widget.value));
    _focusNode = FocusNode();
  }

  @override
  void didUpdateWidget(covariant _AdjustableInput oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.value != widget.value && !_focusNode.hasFocus) {
      _controller.text = _formatValue(widget.value);
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  String _formatValue(double v) {
    if (widget.isInteger) return v.toInt().toString();
    
    // If it's effectively an integer
    if ((v * 100).round() / 100 == v.roundToDouble()) {
      return v.round().toString();
    }

    // Show up to 2 decimal places, but remove trailing zeros
    String s = v.toStringAsFixed(2);
    if (s.contains('.')) {
      s = s.replaceAll(RegExp(r'0+$'), ''); // Remove trailing zeros
      s = s.replaceAll(RegExp(r'\.$'), ''); // Remove trailing dot if any
    }
    return s;
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 4, bottom: 4),
          child: Text(
            widget.label,
            style: const TextStyle(fontSize: 10, color: AppColors.textSecondary, fontWeight: FontWeight.w700),
          ),
        ),
        Container(
          height: 36,
          decoration: BoxDecoration(
            color: AppColors.background,
            borderRadius: BorderRadius.circular(8),
          ),
          child: Row(
            children: [
              IconButton(
                onPressed: () => widget.onStep(widget.isInteger ? -1 : -0.5),
                icon: const Icon(Icons.remove_rounded, size: 14),
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
                visualDensity: VisualDensity.compact,
              ),
              Expanded(
                child: TextField(
                  controller: _controller,
                  focusNode: _focusNode,
                  enabled: widget.onChanged != null,
                  onChanged: (val) {
                    final normalized = val.replaceAll(',', '.');
                    final d = double.tryParse(normalized);
                    if (d != null) widget.onChanged!(d);
                  },
                  keyboardType: TextInputType.numberWithOptions(decimal: !widget.isInteger),
                  textAlign: TextAlign.center,
                  style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13),
                  decoration: const InputDecoration(
                    isDense: true,
                    contentPadding: EdgeInsets.zero,
                    border: InputBorder.none,
                  ),
                ),
              ),
              IconButton(
                onPressed: () => widget.onStep(widget.isInteger ? 1 : 0.5),
                icon: const Icon(Icons.add_rounded, size: 14),
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
                visualDensity: VisualDensity.compact,
              ),
            ],
          ),
        ),
      ],
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

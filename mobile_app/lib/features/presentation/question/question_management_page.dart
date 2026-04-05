import 'package:flutter/material.dart';
import 'package:mobile/core/storage/token_storage.dart';
import 'package:mobile/core/theme/app_colors.dart';
import 'package:mobile/core/widgets/background.dart';
import 'package:mobile/features/models/question.dart';
import 'package:mobile/features/services/question_service.dart';

class QuestionManagementPage extends StatefulWidget {
  final void Function(int index)? onNavigateMainTab;

  const QuestionManagementPage({super.key, this.onNavigateMainTab});

  @override
  State<QuestionManagementPage> createState() => _QuestionManagementPageState();
}

class _QuestionManagementPageState extends State<QuestionManagementPage> {
  final TextEditingController _searchController = TextEditingController();

  List<Question> _questions = [];
  bool _isLoading = true;
  String? _errorMessage;
  int _pageIndex = 1;
  final int _pageSize = 10;
  int _totalPages = 0;
  int _totalCount = 0;
  bool _includeDeleted = false;
  QuestionType? _typeFilter;

  @override
  void initState() {
    super.initState();
    _loadQuestions();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadQuestions() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final result = await QuestionService.getQuestionsPaged(
        pageIndex: _pageIndex,
        pageSize: _pageSize,
        includeDeleted: _includeDeleted,
        searchTerm: _searchController.text.trim(),
        type: _typeFilter,
      );
      if (!mounted) return;
      setState(() {
        _questions = result.items;
        _totalPages = result.totalPages;
        _totalCount = result.totalCount;
        _pageIndex = result.pageIndex;
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

  _QuestionTypeStyle _typeStyle(QuestionType type) {
    switch (type) {
      case QuestionType.singleChoice:
        return const _QuestionTypeStyle(
          bgColor: Color(0xFFE0E7FF),
          textColor: Color(0xFF1D4ED8),
          icon: Icons.radio_button_checked_rounded,
        );
      case QuestionType.multipleChoice:
        return const _QuestionTypeStyle(
          bgColor: Color(0xFFEDE9FE),
          textColor: Color(0xFF7C3AED),
          icon: Icons.checklist_rounded,
        );
      case QuestionType.essay:
        return const _QuestionTypeStyle(
          bgColor: Color(0xFFFFEDD5),
          textColor: Color(0xFFC2410C),
          icon: Icons.edit_note_rounded,
        );
    }
  }

  Future<void> _openCreateQuestionSheet({Question? question}) async {
    final result = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _CreateQuestionSheet(question: question),
    );

    if (result == true) {
      _loadQuestions();
    }
  }

  Future<void> _handleSoftDelete(Question question) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete question'),
        content: const Text('Soft delete this question?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Delete')),
        ],
      ),
    );

    if (confirmed != true) return;

    try {
      await QuestionService.softDeleteQuestion(question.id);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Question soft deleted'), backgroundColor: AppColors.success),
      );
      _loadQuestions();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.toString()), backgroundColor: AppColors.error),
      );
    }
  }

  Future<void> _handleRestore(Question question) async {
    try {
      await QuestionService.restoreQuestion(question.id);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Question restored'), backgroundColor: AppColors.success),
      );
      _loadQuestions();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.toString()), backgroundColor: AppColors.error),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          const GradientBackground(),
          Column(
            children: [
              _buildHeader(),
              _buildSearch(),
              Expanded(child: _buildBody()),
            ],
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _openCreateQuestionSheet,
        backgroundColor: AppColors.accent,
        icon: const Icon(Icons.add_rounded, color: Colors.white),
        label: const Text(
          'New Question',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
        ),
      ),
      bottomNavigationBar: _LecturerBottomNav(
        currentIndex: 0,
        onTap: (index) {
          widget.onNavigateMainTab?.call(index);
          Navigator.of(context).pop();
        },
      ),
    );
  }

  Widget _buildHeader() {
    return Container(
      padding: const EdgeInsets.fromLTRB(24, 60, 24, 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.info.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: const Icon(Icons.help_outline_rounded, color: AppColors.info, size: 28),
              ),
              const SizedBox(width: 16),
              const Expanded(
                child: Text(
                  'Question Bank',
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.w900,
                    color: AppColors.textPrimary,
                    letterSpacing: -0.5,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            'Manage questions for quiz creation ($_totalCount)',
            style: const TextStyle(
              fontSize: 13,
              color: AppColors.textLight,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSearch() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Column(
        children: [
          Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: Colors.grey.withValues(alpha: 0.1)),
            ),
            child: TextField(
              controller: _searchController,
              onSubmitted: (_) {
                setState(() => _pageIndex = 1);
                _loadQuestions();
              },
              decoration: InputDecoration(
                border: InputBorder.none,
                prefixIcon: const Icon(Icons.search_rounded, size: 20, color: AppColors.textLight),
                hintText: 'Search question content...',
                hintStyle: const TextStyle(fontSize: 13, color: AppColors.textLight),
                suffixIcon: IconButton(
                  onPressed: () {
                    setState(() => _pageIndex = 1);
                    _loadQuestions();
                  },
                  icon: const Icon(Icons.arrow_forward_rounded, size: 18),
                ),
              ),
            ),
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: DropdownButtonFormField<QuestionType?>(
                  initialValue: _typeFilter,
                  decoration: const InputDecoration(
                    labelText: 'Type',
                    filled: true,
                    fillColor: Colors.white,
                    border: OutlineInputBorder(),
                    isDense: true,
                  ),
                  items: [
                    const DropdownMenuItem<QuestionType?>(value: null, child: Text('All types')),
                    ...QuestionType.values.map(
                      (type) => DropdownMenuItem<QuestionType?>(
                        value: type,
                        child: Text(questionTypeLabel(type)),
                      ),
                    ),
                  ],
                  onChanged: (value) {
                    setState(() {
                      _typeFilter = value;
                      _pageIndex = 1;
                    });
                    _loadQuestions();
                  },
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: DropdownButtonFormField<bool>(
                  initialValue: _includeDeleted,
                  decoration: const InputDecoration(
                    labelText: 'Status',
                    filled: true,
                    fillColor: Colors.white,
                    border: OutlineInputBorder(),
                    isDense: true,
                  ),
                  items: const [
                    DropdownMenuItem<bool>(value: false, child: Text('Active only')),
                    DropdownMenuItem<bool>(value: true, child: Text('Include deleted')),
                  ],
                  onChanged: (value) {
                    setState(() {
                      _includeDeleted = value ?? false;
                      _pageIndex = 1;
                    });
                    _loadQuestions();
                  },
                ),
              ),
            ],
          ),
        ],
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
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline_rounded, size: 64, color: AppColors.error),
              const SizedBox(height: 12),
              const Text(
                'Error loading question bank',
                style: TextStyle(
                  fontSize: 16,
                  color: AppColors.textPrimary,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                _errorMessage!,
                textAlign: TextAlign.center,
                style: const TextStyle(color: AppColors.textLight),
              ),
              const SizedBox(height: 12),
              ElevatedButton.icon(
                onPressed: _loadQuestions,
                icon: const Icon(Icons.refresh_rounded),
                label: const Text('Retry'),
              ),
            ],
          ),
        ),
      );
    }

    if (_questions.isEmpty) {
      return const Center(
        child: Text(
          'No questions found',
          style: TextStyle(color: AppColors.textLight),
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadQuestions,
      child: ListView.builder(
        padding: const EdgeInsets.fromLTRB(24, 16, 24, 100),
        itemCount: _questions.length + 1,
        itemBuilder: (context, index) {
          if (index == _questions.length) {
            return _PaginationControls(
              pageIndex: _pageIndex,
              totalPages: _totalPages,
              pageSize: _pageSize,
              totalCount: _totalCount,
              onFirst: _pageIndex > 1
                  ? () {
                      setState(() => _pageIndex = 1);
                      _loadQuestions();
                    }
                  : null,
              onPrevious: _pageIndex > 1
                  ? () {
                      setState(() => _pageIndex -= 1);
                      _loadQuestions();
                    }
                  : null,
              onNext: (_totalPages > 0 && _pageIndex < _totalPages)
                  ? () {
                      setState(() => _pageIndex += 1);
                      _loadQuestions();
                    }
                  : null,
              onLast: (_totalPages > 0 && _pageIndex < _totalPages)
                  ? () {
                      setState(() => _pageIndex = _totalPages);
                      _loadQuestions();
                    }
                  : null,
            );
          }

          final question = _questions[index];
          final typeStyle = _typeStyle(question.type);

          return Container(
            margin: const EdgeInsets.only(bottom: 14),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.grey.withValues(alpha: 0.1)),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.03),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: typeStyle.bgColor,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(typeStyle.icon, size: 12, color: typeStyle.textColor),
                            const SizedBox(width: 4),
                            Text(
                              questionTypeLabel(question.type).toUpperCase(),
                              style: TextStyle(
                                color: typeStyle.textColor,
                                fontSize: 10,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                          ],
                        ),
                      ),
                      if (question.isDeleted) ...[
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: Colors.red.withValues(alpha: 0.12),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: const Text(
                            'DELETED',
                            style: TextStyle(
                              color: Colors.red,
                              fontSize: 10,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                        ),
                      ],
                      const Spacer(),
                      Text(
                        '${question.answerOptions.length} options',
                        style: const TextStyle(fontSize: 11, color: AppColors.textLight),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Text(
                    question.content,
                    style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w700,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  if (question.type == QuestionType.essay && (question.textAnswer ?? '').trim().isNotEmpty) ...[
                    const SizedBox(height: 10),
                    Text(
                      'Expected answer: ${question.textAnswer}',
                      style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                    ),
                  ],
                  const SizedBox(height: 10),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      if (!question.isDeleted)
                        TextButton.icon(
                          onPressed: () => _openCreateQuestionSheet(question: question),
                          icon: const Icon(Icons.edit_rounded, size: 16),
                          label: const Text('Edit'),
                        ),
                      const SizedBox(width: 8),
                      if (question.isDeleted)
                        TextButton.icon(
                          onPressed: () => _handleRestore(question),
                          icon: const Icon(Icons.restore_rounded, size: 16),
                          label: const Text('Restore'),
                        )
                      else
                        TextButton.icon(
                          onPressed: () => _handleSoftDelete(question),
                          icon: const Icon(Icons.delete_outline_rounded, size: 16),
                          label: const Text('Delete'),
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
}

class _CreateQuestionSheet extends StatefulWidget {
  final Question? question;

  const _CreateQuestionSheet({this.question});

  @override
  State<_CreateQuestionSheet> createState() => _CreateQuestionSheetState();
}

class _CreateQuestionSheetState extends State<_CreateQuestionSheet> {
  final _formKey = GlobalKey<FormState>();
  final _contentController = TextEditingController();
  final _imageUrlController = TextEditingController();
  final _textAnswerController = TextEditingController();

  QuestionType _type = QuestionType.singleChoice;
  bool _isSubmitting = false;
  final List<_OptionField> _options = [
    _OptionField(),
    _OptionField(),
  ];

  bool get _isEditMode => widget.question != null;

  @override
  void initState() {
    super.initState();
    final question = widget.question;
    if (question == null) return;

    _contentController.text = question.content;
    _imageUrlController.text = question.imageUrl ?? '';
    _textAnswerController.text = question.textAnswer ?? '';
    _type = question.type;
    _options.clear();
    if (question.type != QuestionType.essay) {
      if (question.answerOptions.isEmpty) {
        _options.addAll([_OptionField(), _OptionField()]);
      } else {
        for (final item in question.answerOptions) {
          _options.add(_OptionField(content: item.content, isCorrect: item.isCorrect));
        }
      }
    }
  }

  @override
  void dispose() {
    _contentController.dispose();
    _imageUrlController.dispose();
    _textAnswerController.dispose();
    for (final option in _options) {
      option.dispose();
    }
    super.dispose();
  }

  void _addOption() {
    setState(() => _options.add(_OptionField()));
  }

  void _removeOption(int index) {
    if (_options.length <= 2) return;
    final removed = _options.removeAt(index);
    removed.dispose();
    setState(() {});
  }

  String? _validateOptions() {
    if (_type == QuestionType.essay) return null;

    final hasEmpty = _options.any((item) => item.controller.text.trim().isEmpty);
    if (hasEmpty) return 'Answer option cannot be empty';

    final correctCount = _options.where((item) => item.isCorrect).length;
    if (_type == QuestionType.singleChoice && correctCount != 1) {
      return 'Single choice must have exactly one correct answer';
    }

    if (_type == QuestionType.multipleChoice && correctCount < 1) {
      return 'Multiple choice must have at least one correct answer';
    }

    return null;
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    final optionsError = _validateOptions();
    if (optionsError != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(optionsError), backgroundColor: AppColors.error),
      );
      return;
    }

    String? userId;
    if (!_isEditMode) {
      userId = await TokenStorage.getUserId();
      if (userId == null || userId.isEmpty) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Unable to identify current user'),
            backgroundColor: AppColors.error,
          ),
        );
        return;
      }
    }

    setState(() => _isSubmitting = true);

    try {
      final options = _type == QuestionType.essay
          ? const <AnswerOption>[]
          : _options
              .map(
                (option) => AnswerOption(
                  id: '',
                  questionId: '',
                  content: option.controller.text.trim(),
                  isCorrect: option.isCorrect,
                ),
              )
              .toList();

      if (_isEditMode) {
        await QuestionService.updateQuestion(
          questionId: widget.question!.id,
          content: _contentController.text.trim(),
          imageUrl: _imageUrlController.text.trim().isEmpty
              ? null
              : _imageUrlController.text.trim(),
          type: _type,
          answerOptions: options,
          textAnswer: _type == QuestionType.essay ? _textAnswerController.text.trim() : null,
        );
      } else {
        await QuestionService.createQuestion(
          content: _contentController.text.trim(),
          imageUrl: _imageUrlController.text.trim().isEmpty
              ? null
              : _imageUrlController.text.trim(),
          type: _type,
          createdBy: userId!,
          answerOptions: options,
          textAnswer: _type == QuestionType.essay ? _textAnswerController.text.trim() : null,
        );
      }

      if (!mounted) return;
      Navigator.pop(context, true);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.toString()), backgroundColor: AppColors.error),
      );
    } finally {
      if (mounted) {
        setState(() => _isSubmitting = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: SafeArea(
        top: false,
        child: Padding(
          padding: EdgeInsets.only(
            left: 20,
            right: 20,
            top: 16,
            bottom: MediaQuery.of(context).viewInsets.bottom + 16,
          ),
          child: SingleChildScrollView(
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Center(
                    child: Container(
                      width: 48,
                      height: 4,
                      decoration: BoxDecoration(
                        color: Colors.grey[300],
                        borderRadius: BorderRadius.circular(999),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    _isEditMode ? 'Edit Question' : 'Create Question',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.w900,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _contentController,
                    maxLines: 3,
                    decoration: const InputDecoration(
                      labelText: 'Question content *',
                      border: OutlineInputBorder(),
                    ),
                    validator: (value) {
                      if ((value ?? '').trim().isEmpty) {
                        return 'Question content is required';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _imageUrlController,
                    decoration: const InputDecoration(
                      labelText: 'Image URL (optional)',
                      border: OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<QuestionType>(
                    initialValue: _type,
                    decoration: const InputDecoration(
                      labelText: 'Question type *',
                      border: OutlineInputBorder(),
                    ),
                    items: QuestionType.values
                        .map(
                          (type) => DropdownMenuItem<QuestionType>(
                            value: type,
                            child: Text(questionTypeLabel(type)),
                          ),
                        )
                        .toList(),
                    onChanged: (value) {
                      if (value == null) return;
                      setState(() => _type = value);
                    },
                  ),
                  const SizedBox(height: 14),
                  if (_type == QuestionType.essay)
                    TextFormField(
                      controller: _textAnswerController,
                      maxLines: 3,
                      decoration: const InputDecoration(
                        labelText: 'Expected text answer *',
                        border: OutlineInputBorder(),
                      ),
                      validator: (value) {
                        if (_type != QuestionType.essay) return null;
                        if ((value ?? '').trim().isEmpty) {
                          return 'Expected text answer is required';
                        }
                        return null;
                      },
                    )
                  else
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Answer options',
                          style: TextStyle(
                            fontWeight: FontWeight.w700,
                            color: AppColors.textPrimary,
                          ),
                        ),
                        const SizedBox(height: 10),
                        ...List.generate(_options.length, (index) {
                          final option = _options[index];
                          return Padding(
                            padding: const EdgeInsets.only(bottom: 10),
                            child: Row(
                              children: [
                                Expanded(
                                  child: TextFormField(
                                    controller: option.controller,
                                    decoration: InputDecoration(
                                      labelText: 'Option ${index + 1}',
                                      border: const OutlineInputBorder(),
                                    ),
                                    validator: (value) {
                                      if (_type == QuestionType.essay) return null;
                                      if ((value ?? '').trim().isEmpty) {
                                        return 'Required';
                                      }
                                      return null;
                                    },
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Column(
                                  children: [
                                    Checkbox(
                                      value: option.isCorrect,
                                      onChanged: (value) {
                                        setState(() => option.isCorrect = value == true);
                                      },
                                    ),
                                    const Text('Correct', style: TextStyle(fontSize: 11)),
                                  ],
                                ),
                                IconButton(
                                  onPressed: () => _removeOption(index),
                                  icon: const Icon(Icons.remove_circle_outline_rounded),
                                ),
                              ],
                            ),
                          );
                        }),
                        Align(
                          alignment: Alignment.centerLeft,
                          child: TextButton.icon(
                            onPressed: _addOption,
                            icon: const Icon(Icons.add_rounded),
                            label: const Text('Add option'),
                          ),
                        ),
                      ],
                    ),
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: _isSubmitting ? null : _submit,
                      icon: _isSubmitting
                          ? const SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                            )
                          : const Icon(Icons.save_rounded),
                      label: Text(
                        _isSubmitting
                            ? (_isEditMode ? 'Updating...' : 'Creating...')
                            : (_isEditMode ? 'Update question' : 'Create question'),
                      ),
                      style: ElevatedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        backgroundColor: AppColors.primary,
                        foregroundColor: Colors.white,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _OptionField {
  final TextEditingController controller = TextEditingController();
  bool isCorrect = false;

  _OptionField({String content = '', this.isCorrect = false}) {
    controller.text = content;
  }

  void dispose() {
    controller.dispose();
  }
}

class _PaginationControls extends StatelessWidget {
  final int pageIndex;
  final int totalPages;
  final int pageSize;
  final int totalCount;
  final VoidCallback? onFirst;
  final VoidCallback? onPrevious;
  final VoidCallback? onNext;
  final VoidCallback? onLast;

  const _PaginationControls({
    required this.pageIndex,
    required this.totalPages,
    required this.pageSize,
    required this.totalCount,
    this.onFirst,
    this.onPrevious,
    this.onNext,
    this.onLast,
  });

  @override
  Widget build(BuildContext context) {
    final from = totalCount == 0 ? 0 : ((pageIndex - 1) * pageSize) + 1;
    final to = totalCount == 0 ? 0 : (pageIndex * pageSize > totalCount ? totalCount : pageIndex * pageSize);

    return Container(
      margin: const EdgeInsets.only(top: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.withValues(alpha: 0.1)),
      ),
      child: Row(
        children: [
          Expanded(
            child: Text(
              'Showing $from-$to of $totalCount',
              style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
            ),
          ),
          TextButton(onPressed: onFirst, child: const Text('First')),
          TextButton(onPressed: onPrevious, child: const Text('Prev')),
          Text(
            '${totalPages == 0 ? 0 : pageIndex}/$totalPages',
            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700),
          ),
          TextButton(onPressed: onNext, child: const Text('Next')),
          TextButton(onPressed: onLast, child: const Text('Last')),
        ],
      ),
    );
  }
}

class _QuestionTypeStyle {
  final Color bgColor;
  final Color textColor;
  final IconData icon;

  const _QuestionTypeStyle({
    required this.bgColor,
    required this.textColor,
    required this.icon,
  });
}

class _LecturerBottomNav extends StatelessWidget {
  final int currentIndex;
  final void Function(int index) onTap;

  const _LecturerBottomNav({required this.currentIndex, required this.onTap});

  @override
  Widget build(BuildContext context) {
    const items = <_BottomNavItem>[
      _BottomNavItem('Home', Icons.home_rounded, Icons.home_outlined),
      _BottomNavItem('Classrooms', Icons.class_rounded, Icons.class_outlined),
      _BottomNavItem('Profile', Icons.person_rounded, Icons.person_outline_rounded),
    ];

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.06),
            blurRadius: 12,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: List.generate(items.length, (i) {
              final item = items[i];
              final isSelected = currentIndex == i;
              return GestureDetector(
                onTap: () => onTap(i),
                behavior: HitTestBehavior.opaque,
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                  decoration: BoxDecoration(
                    color: isSelected
                        ? AppColors.primary.withValues(alpha: 0.1)
                        : Colors.transparent,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        isSelected ? item.activeIcon : item.icon,
                        size: 24,
                        color: isSelected ? AppColors.primary : AppColors.textLight,
                      ),
                      const SizedBox(height: 4),
                      Text(
                        item.label,
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                          color: isSelected ? AppColors.primary : AppColors.textLight,
                        ),
                      ),
                    ],
                  ),
                ),
              );
            }),
          ),
        ),
      ),
    );
  }
}

class _BottomNavItem {
  final String label;
  final IconData activeIcon;
  final IconData icon;

  const _BottomNavItem(this.label, this.activeIcon, this.icon);
}

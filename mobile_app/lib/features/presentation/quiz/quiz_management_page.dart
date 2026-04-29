import 'package:flutter/material.dart';
import 'package:mobile/core/storage/token_storage.dart';
import 'package:mobile/core/theme/app_colors.dart';
import 'package:mobile/core/widgets/background.dart';
import 'package:mobile/features/models/quiz.dart';
import 'package:mobile/features/models/subject.dart';
import 'package:mobile/features/presentation/quiz/quiz_question_assignment_page.dart';
import 'package:mobile/features/services/quiz_service.dart';
import 'package:mobile/features/services/subject_service.dart';

class QuizManagementPage extends StatefulWidget {
  final void Function(int index)? onNavigateMainTab;

  const QuizManagementPage({super.key, this.onNavigateMainTab});

  @override
  State<QuizManagementPage> createState() => _QuizManagementPageState();
}

class _QuizManagementPageState extends State<QuizManagementPage> {
  final TextEditingController _searchController = TextEditingController();

  List<Quiz> _quizzes = [];
  List<Subject> _subjects = [];
  bool _isLoading = true;
  String? _errorMessage;
  int _pageIndex = 1;
  final int _pageSize = 10;
  int _totalPages = 0;
  int _totalCount = 0;
  bool _includeDeleted = false;
  String? _subjectFilter;

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
      final quizResult = await QuizService.getQuizzesPaged(
        pageIndex: _pageIndex,
        pageSize: _pageSize,
        includeDeleted: _includeDeleted,
        searchTerm: _searchController.text.trim(),
        subjectId: _subjectFilter,
      );
      final subjects = await SubjectService.getActiveSubjects();

      if (!mounted) return;
      setState(() {
        _quizzes = quizResult.items;
        _subjects = subjects;
        _totalPages = quizResult.totalPages;
        _totalCount = quizResult.totalCount;
        _pageIndex = quizResult.pageIndex;
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

  Map<String, String> get _subjectMap {
    return {
      for (final item in _subjects) item.id: item.subjectName,
    };
  }

  Future<void> _openCreateQuizSheet({Quiz? quiz}) async {
    final created = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _CreateQuizSheet(subjects: _subjects, quiz: quiz),
    );

    if (created == true) {
      _loadData();
    }
  }

  void _openAssignmentPage(Quiz quiz) async {
    await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => QuizQuestionAssignmentPage(quizId: quiz.id, quizTitle: quiz.title),
      ),
    );

    _loadData();
  }

  Future<void> _handleSoftDelete(Quiz quiz) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete quiz'),
        content: const Text('Soft delete this quiz?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Delete')),
        ],
      ),
    );

    if (confirmed != true) return;

    try {
      await QuizService.softDeleteQuiz(quiz.id);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Quiz soft deleted'), backgroundColor: AppColors.success),
      );
      _loadData();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.toString()), backgroundColor: AppColors.error),
      );
    }
  }

  Future<void> _handleRestore(Quiz quiz) async {
    try {
      await QuizService.restoreQuiz(quiz.id);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Quiz restored'), backgroundColor: AppColors.success),
      );
      _loadData();
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
        onPressed: _subjects.isEmpty ? null : _openCreateQuizSheet,
        backgroundColor: AppColors.primary,
        icon: const Icon(Icons.add_rounded, color: Colors.white),
        label: const Text(
          'New Quiz',
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
                  color: AppColors.primary.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: const Icon(Icons.assignment_rounded, color: AppColors.primary, size: 28),
              ),
              const SizedBox(width: 16),
              const Expanded(
                child: Text(
                  'Quiz Bank',
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
            'Create quizzes and assign questions ($_totalCount)',
            style: const TextStyle(fontSize: 13, color: AppColors.textLight, fontWeight: FontWeight.w500),
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
                _loadData();
              },
              decoration: InputDecoration(
                border: InputBorder.none,
                prefixIcon: const Icon(Icons.search_rounded, color: AppColors.textLight, size: 20),
                hintText: 'Search by quiz title...',
                hintStyle: const TextStyle(fontSize: 13, color: AppColors.textLight),
                suffixIcon: IconButton(
                  onPressed: () {
                    setState(() => _pageIndex = 1);
                    _loadData();
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
                child: DropdownButtonFormField<String?>(
                  isExpanded: true,
                  initialValue: _subjectFilter,
                  decoration: const InputDecoration(
                    labelText: 'Subject',
                    filled: true,
                    fillColor: Colors.white,
                    border: OutlineInputBorder(),
                    isDense: true,
                  ),
                  items: [
                    const DropdownMenuItem<String?>(
                      value: null, 
                      child: Text('All subjects', overflow: TextOverflow.ellipsis)
                    ),
                    ..._subjects.map(
                      (subject) => DropdownMenuItem<String?>(
                        value: subject.id,
                        child: Text('${subject.subjectCode} - ${subject.subjectName}', overflow: TextOverflow.ellipsis),
                      ),
                    ),
                  ],
                  onChanged: (value) {
                    setState(() {
                      _subjectFilter = value;
                      _pageIndex = 1;
                    });
                    _loadData();
                  },
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: DropdownButtonFormField<bool>(
                  isExpanded: true,
                  initialValue: _includeDeleted,
                  decoration: const InputDecoration(
                    labelText: 'Status',
                    filled: true,
                    fillColor: Colors.white,
                    border: OutlineInputBorder(),
                    isDense: true,
                  ),
                  items: const [
                    DropdownMenuItem<bool>(
                      value: false, 
                      child: Text('Active only', overflow: TextOverflow.ellipsis)
                    ),
                    DropdownMenuItem<bool>(
                      value: true, 
                      child: Text('Include deleted', overflow: TextOverflow.ellipsis)
                    ),
                  ],
                  onChanged: (value) {
                    setState(() {
                      _includeDeleted = value ?? false;
                      _pageIndex = 1;
                    });
                    _loadData();
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
                'Error loading quiz bank',
                style: TextStyle(fontSize: 16, color: AppColors.textPrimary, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              Text(
                _errorMessage!,
                textAlign: TextAlign.center,
                style: const TextStyle(color: AppColors.textLight),
              ),
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

    if (_subjects.isEmpty) {
      return const Center(
        child: Text(
          'No active subjects available to create quiz',
          style: TextStyle(color: AppColors.textLight),
        ),
      );
    }

    if (_quizzes.isEmpty) {
      return const Center(
        child: Text('No quiz found', style: TextStyle(color: AppColors.textLight)),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadData,
      child: ListView.builder(
        padding: const EdgeInsets.fromLTRB(24, 16, 24, 100),
        itemCount: _quizzes.length + 1,
        itemBuilder: (context, index) {
          if (index == _quizzes.length) {
            return _PaginationControls(
              pageIndex: _pageIndex,
              totalPages: _totalPages,
              pageSize: _pageSize,
              totalCount: _totalCount,
              onFirst: _pageIndex > 1
                  ? () {
                      setState(() => _pageIndex = 1);
                      _loadData();
                    }
                  : null,
              onPrevious: _pageIndex > 1
                  ? () {
                      setState(() => _pageIndex -= 1);
                      _loadData();
                    }
                  : null,
              onNext: (_totalPages > 0 && _pageIndex < _totalPages)
                  ? () {
                      setState(() => _pageIndex += 1);
                      _loadData();
                    }
                  : null,
              onLast: (_totalPages > 0 && _pageIndex < _totalPages)
                  ? () {
                      setState(() => _pageIndex = _totalPages);
                      _loadData();
                    }
                  : null,
            );
          }

          final quiz = _quizzes[index];
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
            child: Material(
              color: Colors.transparent,
              child: InkWell(
                borderRadius: BorderRadius.circular(16),
                onTap: quiz.isDeleted ? null : () => _openAssignmentPage(quiz),
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    children: [
                      Row(
                        children: [
                          Container(
                            width: 44,
                            height: 44,
                            decoration: BoxDecoration(
                              color: AppColors.primary.withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: const Icon(Icons.quiz_rounded, color: AppColors.primary),
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Expanded(
                                      child: Text(
                                        quiz.title,
                                        style: const TextStyle(
                                          fontSize: 15,
                                          fontWeight: FontWeight.w700,
                                          color: AppColors.textPrimary,
                                        ),
                                      ),
                                    ),
                                    if (quiz.isDeleted)
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                        decoration: BoxDecoration(
                                          color: Colors.red.withValues(alpha: 0.1),
                                          borderRadius: BorderRadius.circular(8),
                                        ),
                                        child: const Text(
                                          'DELETED',
                                          style: TextStyle(
                                            fontSize: 10,
                                            color: Colors.red,
                                            fontWeight: FontWeight.w800,
                                          ),
                                        ),
                                      ),
                                  ],
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  _subjectMap[quiz.subjectId] ?? 'Unknown subject',
                                  style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  '${quiz.duration} mins • ${quiz.totalQuestions} question(s)',
                                  style: const TextStyle(fontSize: 11, color: AppColors.textLight),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 8),
                          const Icon(Icons.chevron_right_rounded, color: AppColors.textLight),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.end,
                        children: [
                          if (!quiz.isDeleted)
                            TextButton.icon(
                              onPressed: () => _openCreateQuizSheet(quiz: quiz),
                              icon: const Icon(Icons.edit_rounded, size: 16),
                              label: const Text('Edit'),
                            ),
                          const SizedBox(width: 8),
                          if (quiz.isDeleted)
                            TextButton.icon(
                              onPressed: () => _handleRestore(quiz),
                              icon: const Icon(Icons.restore_rounded, size: 16),
                              label: const Text('Restore'),
                            )
                          else
                            TextButton.icon(
                              onPressed: () => _handleSoftDelete(quiz),
                              icon: const Icon(Icons.delete_outline_rounded, size: 16),
                              label: const Text('Delete'),
                            ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}

class _CreateQuizSheet extends StatefulWidget {
  final List<Subject> subjects;
  final Quiz? quiz;

  const _CreateQuizSheet({required this.subjects, this.quiz});

  @override
  State<_CreateQuizSheet> createState() => _CreateQuizSheetState();
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

class _CreateQuizSheetState extends State<_CreateQuizSheet> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _durationController = TextEditingController(text: '30');

  String? _selectedSubjectId;
  bool _isSubmitting = false;

  bool get _isEditMode => widget.quiz != null;

  @override
  void initState() {
    super.initState();
    final quiz = widget.quiz;
    if (quiz == null) return;
    _selectedSubjectId = quiz.subjectId;
    _titleController.text = quiz.title;
    _durationController.text = quiz.duration.toString();
  }

  @override
  void dispose() {
    _titleController.dispose();
    _durationController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if ((_selectedSubjectId ?? '').isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Subject is required'), backgroundColor: AppColors.error),
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
      final duration = int.tryParse(_durationController.text.trim()) ?? 30;
      if (_isEditMode) {
        await QuizService.updateQuiz(
          quizId: widget.quiz!.id,
          title: _titleController.text.trim(),
          duration: duration,
        );
      } else {
        await QuizService.createQuiz(
          subjectId: _selectedSubjectId!,
          title: _titleController.text.trim(),
          duration: duration,
          createdBy: userId!,
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
                    _isEditMode ? 'Edit Quiz' : 'Create Quiz',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.w900,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 16),
                  DropdownButtonFormField<String>(
                    initialValue: _selectedSubjectId,
                    decoration: const InputDecoration(
                      labelText: 'Subject *',
                      border: OutlineInputBorder(),
                    ),
                    items: widget.subjects
                        .map(
                          (subject) => DropdownMenuItem(
                            value: subject.id,
                            child: Text('${subject.subjectCode} - ${subject.subjectName}'),
                          ),
                        )
                        .toList(),
                    onChanged: _isEditMode ? null : (value) => setState(() => _selectedSubjectId = value),
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _titleController,
                    decoration: const InputDecoration(
                      labelText: 'Quiz title *',
                      border: OutlineInputBorder(),
                    ),
                    validator: (value) {
                      if ((value ?? '').trim().isEmpty) {
                        return 'Quiz title is required';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _durationController,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(
                      labelText: 'Duration (minutes) *',
                      border: OutlineInputBorder(),
                    ),
                    validator: (value) {
                      final duration = int.tryParse((value ?? '').trim());
                      if (duration == null || duration <= 0) {
                        return 'Duration must be greater than 0';
                      }
                      return null;
                    },
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
                            : (_isEditMode ? 'Update quiz' : 'Create quiz'),
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

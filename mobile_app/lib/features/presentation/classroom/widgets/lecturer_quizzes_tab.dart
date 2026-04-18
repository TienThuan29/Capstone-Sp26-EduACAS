import 'package:flutter/material.dart';
import 'package:mobile/core/storage/token_storage.dart';
import 'package:mobile/core/theme/app_colors.dart';
import 'package:mobile/core/widgets/background.dart';
import 'package:mobile/features/models/quiz.dart';
import 'package:mobile/features/models/quiz_practice.dart';
import 'package:mobile/features/presentation/quiz/lecturer_quiz_submissions_page.dart';
import 'package:mobile/features/services/quiz_practice_service.dart';
import 'package:mobile/features/services/quiz_service.dart';

class LecturerQuizzesTab extends StatefulWidget {
  final String classroomId;

  const LecturerQuizzesTab({
    super.key,
    required this.classroomId,
  });

  @override
  State<LecturerQuizzesTab> createState() => _LecturerQuizzesTabState();
}

class _LecturerQuizzesTabState extends State<LecturerQuizzesTab> {
  bool _isLoading = true;
  String? _error;

  List<ClassroomQuiz> _classroomQuizzes = [];
  List<Quiz> _quizBank = [];
  final Map<String, QuizDetail> _quizDetailsByQuizId = {};

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

      List<Quiz> quizBank = const [];
      try {
        final paged = await QuizService.getQuizzesPaged(pageIndex: 1, pageSize: 100, includeDeleted: false);
        quizBank = paged.items;
      } catch (_) {
        // Keep classroom assignments visible even if quiz bank fails to load.
      }

      quizzes.sort((a, b) => b.startTime.compareTo(a.startTime));

      if (!mounted) return;
      setState(() {
        _classroomQuizzes = quizzes;
        _quizBank = quizBank;
        _quizDetailsByQuizId
          ..clear()
          ..addEntries(
            loadedDetails.where((entry) => entry.value != null).map((entry) => MapEntry(entry.key, entry.value!)),
          );
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

  Future<void> _openCreateSheet() async {
    if (_quizBank.isEmpty) {
      _showSnack('No quiz available in quiz bank', isError: true);
      return;
    }

    final payload = await showModalBottomSheet<_ClassroomQuizFormValue>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _ClassroomQuizFormSheet(quizzes: _quizBank),
    );

    if (payload == null) return;

    try {
      final userId = await TokenStorage.getUserId();
      if (userId == null || userId.isEmpty) {
        throw Exception('Cannot identify lecturer account');
      }

      await QuizPracticeService.createClassroomQuiz(
        classroomId: widget.classroomId,
        quizId: payload.quizId,
        startTime: payload.startTime,
        endTime: payload.endTime,
        maxOfAttempts: payload.maxOfAttempts,
        passcode: payload.passcode,
        createdBy: userId,
      );

      if (!mounted) return;
      _showSnack('Quiz assigned successfully');
      _loadData();
    } catch (e) {
      _showSnack(e.toString().replaceFirst('Exception: ', ''), isError: true);
    }
  }

  Future<void> _openEditSheet(ClassroomQuiz classroomQuiz) async {
    final payload = await showModalBottomSheet<_ClassroomQuizFormValue>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _ClassroomQuizFormSheet(
        quizzes: _quizBank,
        initial: classroomQuiz,
      ),
    );

    if (payload == null) return;

    try {
      await QuizPracticeService.updateClassroomQuiz(
        classroomQuizId: classroomQuiz.id,
        startTime: payload.startTime,
        endTime: payload.endTime,
        maxOfAttempts: payload.maxOfAttempts,
        passcode: payload.passcode,
        status: payload.status,
      );

      if (!mounted) return;
      _showSnack('Quiz assignment updated');
      _loadData();
    } catch (e) {
      _showSnack(e.toString().replaceFirst('Exception: ', ''), isError: true);
    }
  }

  Future<void> _deleteQuizAssignment(ClassroomQuiz classroomQuiz) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Remove quiz assignment'),
        content: const Text('This assignment will be soft deleted. Continue?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Delete')),
        ],
      ),
    );

    if (confirmed != true) return;

    try {
      await QuizPracticeService.softDeleteClassroomQuiz(classroomQuiz.id);
      if (!mounted) return;
      _showSnack('Quiz assignment removed');
      _loadData();
    } catch (e) {
      _showSnack(e.toString().replaceFirst('Exception: ', ''), isError: true);
    }
  }

  Future<void> _changeQuizStatus({
    required ClassroomQuiz classroomQuiz,
    required String targetStatus,
  }) async {
    try {
      await QuizPracticeService.updateClassroomQuiz(
        classroomQuizId: classroomQuiz.id,
        status: targetStatus,
      );

      if (!mounted) return;
      _showSnack('Quiz status updated to $targetStatus');
      _loadData();
    } catch (e) {
      _showSnack(e.toString().replaceFirst('Exception: ', ''), isError: true);
    }
  }

  Widget _buildQuickStatusAction(ClassroomQuiz item) {
    final normalized = item.status.trim().toUpperCase();

    if (normalized == 'DRAFT') {
      return Align(
        alignment: Alignment.centerRight,
        child: OutlinedButton.icon(
          onPressed: () => _changeQuizStatus(classroomQuiz: item, targetStatus: 'PUBLISHED'),
          icon: const Icon(Icons.publish_rounded, size: 16),
          label: const Text('Publish'),
          style: OutlinedButton.styleFrom(
            foregroundColor: Colors.blue.shade700,
            side: BorderSide(color: Colors.blue.withValues(alpha: 0.6)),
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            textStyle: const TextStyle(fontWeight: FontWeight.w700),
          ),
        ),
      );
    }

    if (normalized == 'PUBLISHED') {
      return Align(
        alignment: Alignment.centerRight,
        child: OutlinedButton.icon(
          onPressed: () => _changeQuizStatus(classroomQuiz: item, targetStatus: 'ONGOING'),
          icon: const Icon(Icons.play_arrow_rounded, size: 16),
          label: const Text('Open'),
          style: OutlinedButton.styleFrom(
            foregroundColor: AppColors.success,
            side: BorderSide(color: AppColors.success.withValues(alpha: 0.6)),
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            textStyle: const TextStyle(fontWeight: FontWeight.w700),
          ),
        ),
      );
    }

    if (normalized == 'ONGOING') {
      return Align(
        alignment: Alignment.centerRight,
        child: OutlinedButton.icon(
          onPressed: () => _changeQuizStatus(classroomQuiz: item, targetStatus: 'CLOSED'),
          icon: const Icon(Icons.lock_rounded, size: 16),
          label: const Text('Close'),
          style: OutlinedButton.styleFrom(
            foregroundColor: AppColors.error,
            side: BorderSide(color: AppColors.error.withValues(alpha: 0.6)),
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            textStyle: const TextStyle(fontWeight: FontWeight.w700),
          ),
        ),
      );
    }

    return const SizedBox.shrink();
  }

  void _showSnack(String message, {bool isError = false}) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: isError ? AppColors.error : AppColors.success,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        const GradientBackground(),
        Column(
          children: [
            _buildTopBar(),
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

  Widget _buildTopBar() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
      child: Row(
        children: [
          const Expanded(
            child: Text(
              'Classroom Quizzes',
              style: TextStyle(
                fontSize: 17,
                fontWeight: FontWeight.w800,
                color: AppColors.textPrimary,
              ),
            ),
          ),
          ElevatedButton.icon(
            onPressed: _openCreateSheet,
            icon: const Icon(Icons.add_rounded),
            label: const Text('Assign Quiz'),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              textStyle: const TextStyle(fontWeight: FontWeight.w700),
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
            Icon(Icons.quiz_outlined, size: 56, color: Colors.grey[300]),
            const SizedBox(height: 10),
            Text(
              'No quiz assignment yet.',
              style: TextStyle(color: Colors.grey[600], fontSize: 15),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadData,
      child: ListView.builder(
        padding: const EdgeInsets.fromLTRB(16, 14, 16, 24),
        itemCount: _classroomQuizzes.length,
        itemBuilder: (context, index) {
          final item = _classroomQuizzes[index];
          final detail = _quizDetailsByQuizId[item.quizId];
          final title = detail?.title ?? 'Quiz ${item.quizId}';

          return InkWell(
            onTap: () async {
              await Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => LecturerQuizSubmissionsPage(
                    classroomQuiz: item,
                    quizTitle: title,
                  ),
                ),
              );
            },
            borderRadius: BorderRadius.circular(14),
            child: Container(
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: Colors.grey.withValues(alpha: 0.12)),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.04),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          title,
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w800,
                            color: AppColors.textPrimary,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const SizedBox(width: 10),
                      _StatusChip(status: item.status),
                      PopupMenuButton<String>(
                        onSelected: (value) {
                          if (value == 'edit') {
                            _openEditSheet(item);
                          } else if (value == 'delete') {
                            _deleteQuizAssignment(item);
                          }
                        },
                        itemBuilder: (_) => const [
                          PopupMenuItem(value: 'edit', child: Text('Edit')),
                          PopupMenuItem(value: 'delete', child: Text('Delete')),
                        ],
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'Duration: ${detail?.duration ?? '-'} min • Questions: ${detail?.totalQuestions ?? '-'}',
                    style: const TextStyle(fontSize: 12.5, color: AppColors.textSecondary),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'Window: ${_fmt(item.startTime)} - ${_fmt(item.endTime)}',
                    style: const TextStyle(fontSize: 12, color: AppColors.textLight),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Max attempts: ${item.maxOfAttempts}',
                    style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                  ),
                  const SizedBox(height: 8),
                  _buildQuickStatusAction(item),
                  const SizedBox(height: 8),
                  const Row(
                    children: [
                      Icon(Icons.insights_rounded, size: 15, color: AppColors.primary),
                      SizedBox(width: 6),
                      Text(
                        'Tap to view student scores',
                        style: TextStyle(fontSize: 12, color: AppColors.primary, fontWeight: FontWeight.w600),
                      ),
                    ],
                  ),
                  if (item.passcode != null && item.passcode!.trim().isNotEmpty) ...[
                    const SizedBox(height: 4),
                    Text(
                      'Passcode: ${item.passcode}',
                      style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                    ),
                  ],
                ],
              ),
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
            const Icon(Icons.error_outline_rounded, size: 56, color: AppColors.error),
            const SizedBox(height: 10),
            Text(
              _error ?? 'Failed to load quizzes',
              textAlign: TextAlign.center,
              style: const TextStyle(color: AppColors.textSecondary),
            ),
            const SizedBox(height: 14),
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

class _StatusChip extends StatelessWidget {
  final String status;

  const _StatusChip({required this.status});

  @override
  Widget build(BuildContext context) {
    final normalized = status.toUpperCase();
    Color background;
    Color text;

    if (normalized == 'ONGOING') {
      background = AppColors.success.withValues(alpha: 0.14);
      text = AppColors.success;
    } else if (normalized == 'PUBLISHED') {
      background = Colors.blue.withValues(alpha: 0.14);
      text = Colors.blue.shade700;
    } else if (normalized == 'CLOSED') {
      background = AppColors.error.withValues(alpha: 0.14);
      text = AppColors.error;
    } else {
      background = Colors.orange.withValues(alpha: 0.16);
      text = Colors.orange.shade800;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        normalized,
        style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: text),
      ),
    );
  }
}

class _ClassroomQuizFormSheet extends StatefulWidget {
  final List<Quiz> quizzes;
  final ClassroomQuiz? initial;

  const _ClassroomQuizFormSheet({
    required this.quizzes,
    this.initial,
  });

  @override
  State<_ClassroomQuizFormSheet> createState() => _ClassroomQuizFormSheetState();
}

class _ClassroomQuizFormSheetState extends State<_ClassroomQuizFormSheet> {
  late final TextEditingController _attemptController;
  late final TextEditingController _passcodeController;

  late String _selectedQuizId;
  late DateTime _startTime;
  late DateTime _endTime;
  late String _status;

  bool _isSubmitting = false;

  @override
  void initState() {
    super.initState();

    final now = DateTime.now();
    final initial = widget.initial;

    _selectedQuizId = initial?.quizId ?? (widget.quizzes.isNotEmpty ? widget.quizzes.first.id : '');
    _startTime = initial?.startTime.toLocal() ?? now.add(const Duration(minutes: 15));
    _endTime = initial?.endTime.toLocal() ?? now.add(const Duration(hours: 1));
    _status = (initial?.status.toUpperCase() ?? 'DRAFT');

    _attemptController = TextEditingController(text: (initial?.maxOfAttempts ?? 1).toString());
    _passcodeController = TextEditingController(text: initial?.passcode ?? '');
  }

  @override
  void dispose() {
    _attemptController.dispose();
    _passcodeController.dispose();
    super.dispose();
  }

  Future<void> _pickStartTime() async {
    final picked = await _pickDateTime(_startTime);
    if (picked == null) return;
    setState(() => _startTime = picked);
  }

  Future<void> _pickEndTime() async {
    final picked = await _pickDateTime(_endTime);
    if (picked == null) return;
    setState(() => _endTime = picked);
  }

  Future<DateTime?> _pickDateTime(DateTime initial) async {
    final date = await showDatePicker(
      context: context,
      initialDate: initial,
      firstDate: DateTime.now().subtract(const Duration(days: 365 * 2)),
      lastDate: DateTime.now().add(const Duration(days: 365 * 5)),
    );
    if (date == null) return null;

    if (!mounted) return null;
    final time = await showTimePicker(
      context: context,
      initialTime: TimeOfDay(hour: initial.hour, minute: initial.minute),
    );
    if (time == null) return null;

    return DateTime(
      date.year,
      date.month,
      date.day,
      time.hour,
      time.minute,
    );
  }

  void _submit() {
    final maxAttempts = int.tryParse(_attemptController.text.trim()) ?? 0;
    if (_selectedQuizId.isEmpty) {
      _showError('Please select a quiz');
      return;
    }
    if (maxAttempts <= 0) {
      _showError('Max attempts must be greater than 0');
      return;
    }
    if (!_endTime.isAfter(_startTime)) {
      _showError('End time must be after start time');
      return;
    }

    setState(() => _isSubmitting = true);
    Navigator.pop(
      context,
      _ClassroomQuizFormValue(
        quizId: _selectedQuizId,
        startTime: _startTime,
        endTime: _endTime,
        maxOfAttempts: maxAttempts,
        passcode: _passcodeController.text.trim(),
        status: _status,
      ),
    );
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), backgroundColor: AppColors.error),
    );
  }

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;
    final isEdit = widget.initial != null;

    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      padding: EdgeInsets.fromLTRB(16, 16, 16, 16 + bottomInset),
      child: SafeArea(
        top: false,
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                isEdit ? 'Edit Assignment' : 'Assign Quiz',
                style: const TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.w800,
                  color: AppColors.textPrimary,
                ),
              ),
              const SizedBox(height: 16),
              DropdownButtonFormField<String>(
                initialValue: _selectedQuizId,
                decoration: const InputDecoration(
                  labelText: 'Quiz',
                  filled: true,
                  fillColor: AppColors.background,
                  border: OutlineInputBorder(),
                ),
                items: widget.quizzes
                    .map(
                      (quiz) => DropdownMenuItem<String>(
                        value: quiz.id,
                        child: Text(
                          quiz.title,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    )
                    .toList(),
                onChanged: isEdit
                    ? null
                    : (value) {
                        if (value != null) {
                          setState(() => _selectedQuizId = value);
                        }
                      },
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: _DateTimeField(
                      label: 'Start Time',
                      value: _fmt(_startTime),
                      onTap: _pickStartTime,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: _DateTimeField(
                      label: 'End Time',
                      value: _fmt(_endTime),
                      onTap: _pickEndTime,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _attemptController,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(
                  labelText: 'Max Attempts',
                  filled: true,
                  fillColor: AppColors.background,
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _passcodeController,
                decoration: const InputDecoration(
                  labelText: 'Passcode (Optional)',
                  filled: true,
                  fillColor: AppColors.background,
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                initialValue: _status,
                decoration: const InputDecoration(
                  labelText: 'Status',
                  filled: true,
                  fillColor: AppColors.background,
                  border: OutlineInputBorder(),
                ),
                items: const [
                  DropdownMenuItem<String>(value: 'DRAFT', child: Text('DRAFT')),
                  DropdownMenuItem<String>(value: 'PUBLISHED', child: Text('PUBLISHED')),
                  DropdownMenuItem<String>(value: 'ONGOING', child: Text('ONGOING')),
                  DropdownMenuItem<String>(value: 'CLOSED', child: Text('CLOSED')),
                ],
                onChanged: (value) {
                  if (value != null) {
                    setState(() => _status = value);
                  }
                },
              ),
              const SizedBox(height: 18),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: _isSubmitting ? null : () => Navigator.pop(context),
                      child: const Text('Cancel'),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: _isSubmitting ? null : _submit,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        foregroundColor: Colors.white,
                      ),
                      child: Text(isEdit ? 'Save Changes' : 'Assign'),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _fmt(DateTime dt) {
    final day = dt.day.toString().padLeft(2, '0');
    final month = dt.month.toString().padLeft(2, '0');
    final year = dt.year.toString();
    final hour = dt.hour.toString().padLeft(2, '0');
    final minute = dt.minute.toString().padLeft(2, '0');
    return '$day/$month/$year $hour:$minute';
  }
}

class _DateTimeField extends StatelessWidget {
  final String label;
  final String value;
  final VoidCallback onTap;

  const _DateTimeField({
    required this.label,
    required this.value,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: InputDecorator(
        decoration: InputDecoration(
          labelText: label,
          filled: true,
          fillColor: AppColors.background,
          border: const OutlineInputBorder(),
        ),
        child: Row(
          children: [
            Expanded(
              child: Text(
                value,
                style: const TextStyle(fontSize: 13, color: AppColors.textPrimary),
                overflow: TextOverflow.ellipsis,
              ),
            ),
            const SizedBox(width: 8),
            const Icon(Icons.schedule_rounded, size: 18, color: AppColors.textSecondary),
          ],
        ),
      ),
    );
  }
}

class _ClassroomQuizFormValue {
  final String quizId;
  final DateTime startTime;
  final DateTime endTime;
  final int maxOfAttempts;
  final String passcode;
  final String status;

  const _ClassroomQuizFormValue({
    required this.quizId,
    required this.startTime,
    required this.endTime,
    required this.maxOfAttempts,
    required this.passcode,
    required this.status,
  });
}

import 'package:flutter/material.dart';
import 'package:mobile/core/storage/token_storage.dart';
import 'package:mobile/core/theme/app_colors.dart';
import 'package:mobile/core/widgets/background.dart';
import 'package:mobile/features/models/quiz.dart';
import 'package:mobile/features/models/quiz_practice.dart';
import 'package:mobile/features/services/classroom_quiz_service.dart';
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
  final Map<String, Quiz> _quizById = {};

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
      final quizzes = await ClassroomQuizService.getClassroomQuizzes(widget.classroomId);
      final paged = await QuizService.getQuizzesPaged(pageIndex: 1, pageSize: 100, includeDeleted: false);

      if (!mounted) return;
      setState(() {
        _classroomQuizzes = quizzes;
        _quizBank = paged.items;
        _quizById
          ..clear()
          ..addEntries(paged.items.map((e) => MapEntry(e.id, e)));
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
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('No quiz in quiz bank. Please create a quiz first.'),
          backgroundColor: AppColors.warning,
        ),
      );
      return;
    }

    final result = await showModalBottomSheet<_CreateClassroomQuizPayload>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _CreateClassroomQuizSheet(quizBank: _quizBank),
    );

    if (result == null) return;

    try {
      final userId = await TokenStorage.getUserId();
      if (userId == null || userId.isEmpty) {
        throw Exception('Missing user id. Please login again.');
      }

      await ClassroomQuizService.createClassroomQuiz(
        classroomId: widget.classroomId,
        quizId: result.quizId,
        startTimeUtc: result.startTimeLocal.toUtc(),
        endTimeUtc: result.endTimeLocal.toUtc(),
        maxOfAttempts: result.maxAttempts,
        passcode: result.passcode,
        createdBy: userId,
        publishAfterCreate: result.publishAfterCreate,
      );

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Quiz assigned to classroom successfully.'),
          backgroundColor: AppColors.success,
        ),
      );
      _loadData();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(e.toString().replaceFirst('Exception: ', '')),
          backgroundColor: AppColors.error,
        ),
      );
    }
  }

  Future<void> _closeQuiz(ClassroomQuiz item) async {
    try {
      await ClassroomQuizService.updateClassroomQuiz(id: item.id, status: 2);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Quiz has been closed.'), backgroundColor: AppColors.success),
      );
      _loadData();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.toString()), backgroundColor: AppColors.error),
      );
    }
  }

  Future<void> _softDeleteQuiz(ClassroomQuiz item) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Remove classroom quiz'),
        content: const Text('Soft delete this classroom quiz assignment?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Remove')),
        ],
      ),
    );

    if (confirmed != true) return;

    try {
      await ClassroomQuizService.softDeleteClassroomQuiz(item.id);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Classroom quiz removed.'), backgroundColor: AppColors.success),
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
    return Stack(
      children: [
        const GradientBackground(),
        Column(
          children: [
            _buildHeader(),
            Expanded(child: _buildBody()),
          ],
        ),
      ],
    );
  }

  Widget _buildHeader() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 10),
      child: Row(
        children: [
          const Expanded(
            child: Text(
              'Classroom Quizzes',
              style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: AppColors.textPrimary),
            ),
          ),
          ElevatedButton.icon(
            onPressed: _openCreateSheet,
            icon: const Icon(Icons.add_rounded),
            label: const Text('Assign'),
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
              const SizedBox(height: 12),
              ElevatedButton(onPressed: _loadData, child: const Text('Retry')),
            ],
          ),
        ),
      );
    }

    if (_classroomQuizzes.isEmpty) {
      return const Center(
        child: Text('No classroom quizzes yet.', style: TextStyle(color: AppColors.textSecondary)),
      );
    }

    final sorted = [..._classroomQuizzes]
      ..sort((a, b) => b.startTime.compareTo(a.startTime));

    return RefreshIndicator(
      onRefresh: _loadData,
      child: ListView.builder(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 20),
        itemCount: sorted.length,
        itemBuilder: (context, index) {
          final item = sorted[index];
          final quiz = _quizById[item.quizId];
          return _ClassroomQuizCard(
            item: item,
            quizTitle: quiz?.title ?? item.quizId,
            duration: quiz?.duration,
            onClose: item.isClosedStatus ? null : () => _closeQuiz(item),
            onRemove: () => _softDeleteQuiz(item),
          );
        },
      ),
    );
  }
}

class _ClassroomQuizCard extends StatelessWidget {
  final ClassroomQuiz item;
  final String quizTitle;
  final int? duration;
  final VoidCallback? onClose;
  final VoidCallback onRemove;

  const _ClassroomQuizCard({
    required this.item,
    required this.quizTitle,
    required this.duration,
    required this.onClose,
    required this.onRemove,
  });

  @override
  Widget build(BuildContext context) {
    final status = item.lifecycleStatus;
    final now = DateTime.now().toUtc();

    String statusText = 'UNKNOWN';
    Color statusColor = AppColors.textSecondary;
    switch (status) {
      case ClassroomQuizLifecycle.draft:
        statusText = 'DRAFT';
        statusColor = Colors.amber;
        break;
      case ClassroomQuizLifecycle.published:
        if (item.isWithinActiveWindow(now)) {
          statusText = 'ONGOING';
          statusColor = AppColors.success;
        } else if (now.isBefore(item.startTime)) {
          statusText = 'SCHEDULED';
          statusColor = AppColors.primary;
        } else {
          statusText = 'PUBLISHED';
          statusColor = AppColors.primary;
        }
        break;
      case ClassroomQuizLifecycle.closed:
        statusText = 'CLOSED';
        statusColor = AppColors.error;
        break;
      case ClassroomQuizLifecycle.unknown:
        statusText = 'UNKNOWN';
        statusColor = AppColors.textSecondary;
        break;
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.grey.withValues(alpha: 0.18)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  quizTitle,
                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: AppColors.textPrimary),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: statusColor.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(999),
                ),
                child: Text(
                  statusText,
                  style: TextStyle(color: statusColor, fontWeight: FontWeight.w700, fontSize: 11),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text('Duration: ${duration ?? '-'} min', style: const TextStyle(color: AppColors.textSecondary, fontSize: 12)),
          const SizedBox(height: 4),
          Text('Window: ${_fmt(item.startTime)} - ${_fmt(item.endTime)}', style: const TextStyle(color: AppColors.textSecondary, fontSize: 12)),
          const SizedBox(height: 4),
          Text('Attempts: ${item.maxOfAttempts}', style: const TextStyle(color: AppColors.textSecondary, fontSize: 12)),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: onClose,
                  icon: const Icon(Icons.lock_outline_rounded),
                  label: const Text('Close'),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: onRemove,
                  icon: const Icon(Icons.delete_outline_rounded),
                  label: const Text('Remove'),
                ),
              ),
            ],
          ),
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

class _CreateClassroomQuizPayload {
  final String quizId;
  final DateTime startTimeLocal;
  final DateTime endTimeLocal;
  final int maxAttempts;
  final String? passcode;
  final bool publishAfterCreate;

  _CreateClassroomQuizPayload({
    required this.quizId,
    required this.startTimeLocal,
    required this.endTimeLocal,
    required this.maxAttempts,
    required this.passcode,
    required this.publishAfterCreate,
  });
}

class _CreateClassroomQuizSheet extends StatefulWidget {
  final List<Quiz> quizBank;

  const _CreateClassroomQuizSheet({required this.quizBank});

  @override
  State<_CreateClassroomQuizSheet> createState() => _CreateClassroomQuizSheetState();
}

class _CreateClassroomQuizSheetState extends State<_CreateClassroomQuizSheet> {
  final _formKey = GlobalKey<FormState>();
  final _attemptController = TextEditingController(text: '1');
  final _passcodeController = TextEditingController();

  String? _quizId;
  DateTime? _startLocal;
  DateTime? _endLocal;
  bool _publishAfterCreate = true;

  @override
  void dispose() {
    _attemptController.dispose();
    _passcodeController.dispose();
    super.dispose();
  }

  Future<void> _pickDateTime({required bool isStart}) async {
    final initial = isStart
        ? (_startLocal ?? DateTime.now().add(const Duration(minutes: 10)))
        : (_endLocal ?? (_startLocal?.add(const Duration(hours: 1)) ?? DateTime.now().add(const Duration(hours: 1))));

    final date = await showDatePicker(
      context: context,
      initialDate: initial,
      firstDate: DateTime.now().subtract(const Duration(days: 1)),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );
    if (date == null || !mounted) return;

    final time = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.fromDateTime(initial),
    );
    if (time == null || !mounted) return;

    final selected = DateTime(date.year, date.month, date.day, time.hour, time.minute);

    setState(() {
      if (isStart) {
        _startLocal = selected;
        if (_endLocal != null && !_endLocal!.isAfter(selected)) {
          _endLocal = selected.add(const Duration(hours: 1));
        }
      } else {
        _endLocal = selected;
      }
    });
  }

  void _submit() {
    if (!_formKey.currentState!.validate()) return;
    if (_quizId == null || _quizId!.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select a quiz'), backgroundColor: AppColors.warning),
      );
      return;
    }
    if (_startLocal == null || _endLocal == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please choose start and end time'), backgroundColor: AppColors.warning),
      );
      return;
    }
    if (!_endLocal!.isAfter(_startLocal!)) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('End time must be after start time'), backgroundColor: AppColors.warning),
      );
      return;
    }

    final maxAttempts = int.tryParse(_attemptController.text.trim()) ?? 1;

    Navigator.pop(
      context,
      _CreateClassroomQuizPayload(
        quizId: _quizId!,
        startTimeLocal: _startLocal!,
        endTimeLocal: _endLocal!,
        maxAttempts: maxAttempts,
        passcode: _passcodeController.text.trim().isEmpty ? null : _passcodeController.text.trim(),
        publishAfterCreate: _publishAfterCreate,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      padding: EdgeInsets.only(
        left: 16,
        right: 16,
        top: 16,
        bottom: MediaQuery.of(context).viewInsets.bottom + 16,
      ),
      child: Form(
        key: _formKey,
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Assign Quiz To Classroom', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                initialValue: _quizId,
                decoration: const InputDecoration(labelText: 'Quiz', border: OutlineInputBorder()),
                items: widget.quizBank
                    .map((quiz) => DropdownMenuItem<String>(
                          value: quiz.id,
                          child: Text('${quiz.title} (${quiz.duration}m)'),
                        ))
                    .toList(),
                onChanged: (value) => setState(() => _quizId = value),
                validator: (value) => (value == null || value.isEmpty) ? 'Select a quiz' : null,
              ),
              const SizedBox(height: 10),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () => _pickDateTime(isStart: true),
                      icon: const Icon(Icons.play_circle_outline_rounded),
                      label: Text(_startLocal == null ? 'Start time' : _fmt(_startLocal!)),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () => _pickDateTime(isStart: false),
                      icon: const Icon(Icons.stop_circle_outlined),
                      label: Text(_endLocal == null ? 'End time' : _fmt(_endLocal!)),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              TextFormField(
                controller: _attemptController,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(labelText: 'Max attempts', border: OutlineInputBorder()),
                validator: (value) {
                  final n = int.tryParse(value ?? '');
                  if (n == null || n <= 0) return 'Enter attempts > 0';
                  return null;
                },
              ),
              const SizedBox(height: 10),
              TextFormField(
                controller: _passcodeController,
                decoration: const InputDecoration(labelText: 'Passcode (optional)', border: OutlineInputBorder()),
              ),
              const SizedBox(height: 10),
              SwitchListTile.adaptive(
                contentPadding: EdgeInsets.zero,
                title: const Text('Publish immediately'),
                value: _publishAfterCreate,
                onChanged: (value) => setState(() => _publishAfterCreate = value),
              ),
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: _submit,
                  icon: const Icon(Icons.check_circle_outline_rounded),
                  label: const Text('Create Assignment'),
                ),
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
    final hour = dt.hour.toString().padLeft(2, '0');
    final minute = dt.minute.toString().padLeft(2, '0');
    return '$day/$month ${dt.year} $hour:$minute';
  }
}

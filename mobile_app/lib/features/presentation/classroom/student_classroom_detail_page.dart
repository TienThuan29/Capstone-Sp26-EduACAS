import 'package:flutter/material.dart';
import 'package:mobile/core/theme/app_colors.dart';
import 'package:mobile/features/models/classroom.dart';
import 'package:mobile/core/widgets/background.dart';
import 'package:mobile/features/presentation/classroom/widgets/student_materials_tab.dart';
import 'package:mobile/features/presentation/classroom/widgets/student_examinations_tab.dart';
import 'package:mobile/features/presentation/classroom/widgets/student_discussions_tab.dart';
import 'package:mobile/core/storage/token_storage.dart';
import 'package:mobile/features/services/classroom_service.dart';

class StudentClassroomDetailPage extends StatefulWidget {
  final Classroom classroom;

  const StudentClassroomDetailPage({
    super.key,
    required this.classroom,
  });

  @override
  State<StudentClassroomDetailPage> createState() => _StudentClassroomDetailPageState();
}

class _StudentClassroomDetailPageState extends State<StudentClassroomDetailPage>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  late TextEditingController _enrollController;
  bool _isJoined = false;
  bool _isEnrolling = false;
  String _userId = '';

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _enrollController = TextEditingController();
    _isJoined = (widget.classroom.status?.toUpperCase() == 'JOINED');
    _getUserId();
  }

  Future<void> _getUserId() async {
    final id = await TokenStorage.getUserId();
    if (mounted) {
      setState(() {
        _userId = id ?? '';
      });
    }
  }

  @override
  void dispose() {
    _tabController.dispose();
    _enrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          const GradientBackground(),
          Column(
            children: [
              _buildHeader(context),
              if (_isJoined) ...[
                _buildTabNavigation(),
                Expanded(
                  child: TabBarView(
                    controller: _tabController,
                    children: [
                      StudentMaterialsTab(classroomId: widget.classroom.id),
                      StudentExaminationsTab(classroomId: widget.classroom.id),
                      StudentDiscussionsTab(
                        classroomId: widget.classroom.id,
                        classroomName: widget.classroom.className,
                      ),
                    ],
                  ),
                ),
              ] else
                Expanded(child: _buildEnrollView()),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildEnrollView() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        children: [
          const SizedBox(height: 40),
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.8),
              shape: BoxShape.circle,
            ),
            child: Icon(Icons.lock_person_rounded, size: 80, color: AppColors.primary.withValues(alpha: 0.5)),
          ),
          const SizedBox(height: 32),
          const Text(
            'Enrollment Required',
            style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
          ),
          const SizedBox(height: 12),
          const Text(
            'You need to join this classroom to access materials, examinations, and discussions.',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 15, color: AppColors.textSecondary, height: 1.5),
          ),
          const SizedBox(height: 40),
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
              boxShadow: [
                BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 20, offset: const Offset(0, 10)),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Enter Enrollment Key',
                  style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _enrollController,
                  decoration: InputDecoration(
                    hintText: 'Ask your lecturer for the key',
                    prefixIcon: const Icon(Icons.key_rounded, color: AppColors.primary, size: 20),
                    filled: true,
                    fillColor: Colors.grey.withValues(alpha: 0.05),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                    contentPadding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                ),
                const SizedBox(height: 24),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _isEnrolling ? null : _handleEnroll,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      elevation: 0,
                    ),
                    child: _isEnrolling
                        ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                        : const Text('Join Classroom', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _handleEnroll() async {
    final key = _enrollController.text.trim();
    if (key.isEmpty) {
      _showSnack('Please enter enrollment key', isError: true);
      return;
    }

    setState(() => _isEnrolling = true);

    try {
      final response = await ClassroomService.enrollClassroom(
        classId: widget.classroom.id,
        studentId: _userId,
        enrolKey: key,
      );

      if (response['success'] == true) {
        _showSnack('Successfully joined the classroom!');
        if (mounted) {
          setState(() {
            _isJoined = true;
            _isEnrolling = false;
          });
        }
      } else {
        _showSnack(response['message'] ?? 'Failed to join classroom', isError: true);
        setState(() => _isEnrolling = false);
      }
    } catch (e) {
      String msg = e.toString().replaceFirst('Exception: ', '');
      if (msg.contains('400')) {
        msg = 'Invalid enrollment key. Please try again.';
      } else if (msg.contains('409')) {
        msg = 'You are already enrolled in this classroom.';
      } else if (msg.contains('500')) {
        msg = 'Server error. Please try again later.';
      }
      _showSnack(msg, isError: true);
      setState(() => _isEnrolling = false);
    }
  }

  void _showSnack(String message, {bool isError = false}) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: isError ? AppColors.error : AppColors.success,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      ),
    );
  }

  Widget _buildHeader(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 50, 16, 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              IconButton(
                onPressed: () => Navigator.pop(context),
                icon: const Icon(Icons.arrow_back_ios_new_rounded, color: AppColors.primary, size: 20),
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(),
              ),
              const SizedBox(width: 16),
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(Icons.school_rounded, color: AppColors.primary, size: 20),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      widget.classroom.className,
                      style: const TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.w900,
                        color: AppColors.textPrimary,
                        letterSpacing: -0.5,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    Text(
                      'Code: ${widget.classroom.classCode}',
                      style: const TextStyle(
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
        ],
      ),
    );
  }

  Widget _buildTabNavigation() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.5),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.withValues(alpha: 0.1)),
      ),
      child: TabBar(
        controller: _tabController,
        isScrollable: true,
        tabAlignment: TabAlignment.start,
        indicator: BoxDecoration(
          borderRadius: BorderRadius.circular(10),
          color: AppColors.primary,
        ),
        labelColor: Colors.white,
        unselectedLabelColor: AppColors.textLight,
        labelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
        unselectedLabelStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
        indicatorSize: TabBarIndicatorSize.tab,
        dividerColor: Colors.transparent,
        padding: const EdgeInsets.all(4),
        labelPadding: const EdgeInsets.symmetric(horizontal: 16),
        tabs: const [
          Tab(text: 'Materials'),
          Tab(text: 'Exams'),
          Tab(text: 'Discussions'),
        ],
      ),
    );
  }
}

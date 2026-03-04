import 'package:flutter/material.dart';
import 'package:mobile/core/theme/app_colors.dart';
import 'package:mobile/features/models/classroom.dart';
import 'package:mobile/features/presentation/classroom/widgets/student_materials_tab.dart';
import 'package:mobile/features/presentation/classroom/widgets/student_examinations_tab.dart';
import 'package:mobile/features/presentation/classroom/widgets/student_discussions_tab.dart';

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

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        titleSpacing: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, color: AppColors.primary, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              widget.classroom.className,
              style: const TextStyle(
                fontSize: 18, 
                color: AppColors.textPrimary, 
                fontWeight: FontWeight.bold,
              ),
            ),
            Text(
              widget.classroom.classCode,
              style: const TextStyle(
                fontSize: 12, 
                color: AppColors.textSecondary,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(50),
          child: Container(
            decoration: BoxDecoration(
              border: Border(bottom: BorderSide(color: Colors.grey.withValues(alpha: 0.1))),
            ),
            child: TabBar(
              controller: _tabController,
              indicatorColor: AppColors.primary,
              indicatorWeight: 3,
              labelColor: AppColors.primary,
              unselectedLabelColor: AppColors.textLight,
              labelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
              unselectedLabelStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
              tabs: const [
                Tab(text: 'Materials'),
                Tab(text: 'Exams'),
                Tab(text: 'Discussions'),
              ],
            ),
          ),
        ),
      ),
      body: TabBarView(
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
    );
  }
}

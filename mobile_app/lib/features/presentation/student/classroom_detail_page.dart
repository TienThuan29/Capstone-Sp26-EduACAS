import 'package:flutter/material.dart';
import 'package:mobile/core/theme/app_colors.dart';
import 'package:mobile/features/models/classroom.dart';
import 'package:mobile/features/presentation/student/tabs/student_materials_tab.dart';
import 'package:mobile/features/presentation/student/tabs/student_examinations_tab.dart';
import 'package:mobile/features/presentation/student/tabs/student_discussions_tab.dart';

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
        backgroundColor: AppColors.primary,
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              widget.classroom.className,
              style: const TextStyle(fontSize: 18, color: Colors.white, fontWeight: FontWeight.bold),
            ),
            Text(
              'Code: ${widget.classroom.classCode}',
              style: const TextStyle(fontSize: 12, color: Colors.white70),
            ),
          ],
        ),
        iconTheme: const IconThemeData(color: Colors.white),
        elevation: 0,
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: Colors.white,
          labelColor: Colors.white,
          unselectedLabelColor: Colors.white70,
          tabs: const [
            Tab(
              icon: Icon(Icons.file_present),
              text: 'Materials',
            ),
            Tab(
              icon: Icon(Icons.assignment),
              text: 'Examinations',
            ),
            Tab(
              icon: Icon(Icons.forum),
              text: 'Discussions',
            ),
          ],
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

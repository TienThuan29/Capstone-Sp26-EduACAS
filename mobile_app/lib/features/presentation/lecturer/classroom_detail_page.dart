import 'package:flutter/material.dart';
import 'package:mobile/core/theme/app_colors.dart';
import 'package:mobile/features/models/classroom.dart';
import 'package:mobile/features/presentation/lecturer/tabs/materials_tab.dart';
import 'package:mobile/features/presentation/lecturer/tabs/assignments_tab.dart';

class ClassroomDetailPage extends StatefulWidget {
  final Classroom classroom;

  const ClassroomDetailPage({
    super.key,
    required this.classroom,
  });

  @override
  State<ClassroomDetailPage> createState() => _ClassroomDetailPageState();
}

class _ClassroomDetailPageState extends State<ClassroomDetailPage>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
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
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              widget.classroom.className,
              style: const TextStyle(fontSize: 18),
            ),
            Text(
              'Code: ${widget.classroom.classCode}',
              style: const TextStyle(fontSize: 12),
            ),
          ],
        ),
        elevation: 0,
        bottom: TabBar(
          controller: _tabController,
          isScrollable: true,
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
              text: 'Exercises',
            ),
            Tab(
              icon: Icon(Icons.forum),
              text: 'Discussions',
            ),
            Tab(
              icon: Icon(Icons.code),
              text: 'Problems',
            ),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          MaterialsTab(classroomId: widget.classroom.id),
          AssignmentsTab(classroomId: widget.classroom.id),
          _buildComingSoonTab('Discussions'),
          _buildComingSoonTab('Problems'),
        ],
      ),
    );
  }

  Widget _buildComingSoonTab(String tabName) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.construction,
            size: 64,
            color: AppColors.textSecondary,
          ),
          const SizedBox(height: 16),
          Text(
            '$tabName',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 8),
          Text(
            'This feature is coming soon',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: AppColors.textSecondary,
                ),
          ),
        ],
      ),
    );
  }
}

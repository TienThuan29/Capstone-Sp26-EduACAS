import 'package:flutter/material.dart';
import 'package:mobile/core/theme/app_colors.dart';
import 'package:mobile/core/widgets/background.dart';
import 'package:mobile/features/models/classroom.dart';
import 'package:mobile/features/presentation/classroom/widgets/student_materials_tab.dart';
import 'package:mobile/features/presentation/classroom/widgets/student_discussions_tab.dart';
import 'package:mobile/features/presentation/classroom/widgets/student_marks_tab.dart';
import 'package:mobile/features/presentation/classroom/widgets/student_quizzes_tab.dart';
import 'package:mobile/features/presentation/classroom/student_academic_warning_tab.dart';

class StudentClassroomHubPage extends StatelessWidget {
  final Classroom classroom;
  final int? initialTabIndex;

  const StudentClassroomHubPage({
    super.key,
    required this.classroom,
    this.initialTabIndex,
  });

  @override
  Widget build(BuildContext context) {
    if (initialTabIndex != null) {
      return _ClassroomTabPage(
        classroom: classroom,
        initialTabIndex: initialTabIndex!,
      );
    }

    return Scaffold(
      body: Stack(
        children: [
          const GradientBackground(),
          SafeArea(
            child: Column(
              children: [
                _buildHeader(context),
                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
                    child: Column(
                      children: [
                        _HubGrid(classroom: classroom),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHeader(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
      child: Row(
        children: [
          IconButton(
            onPressed: () => Navigator.pop(context),
            icon: const Icon(Icons.arrow_back_ios_new_rounded,
                color: AppColors.primary, size: 20),
            padding: EdgeInsets.zero,
            constraints: const BoxConstraints(),
          ),
          const SizedBox(width: 16),
          Container(
            width: 40,
            height: 40,
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: AppColors.primary.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(Icons.school_rounded,
                color: AppColors.primary, size: 20),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  classroom.className,
                  style: const TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.w900,
                    color: AppColors.textPrimary,
                    letterSpacing: -0.5,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                Text(
                  'Code: ${classroom.classCode}',
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
    );
  }
}

class _HubGrid extends StatelessWidget {
  final Classroom classroom;

  const _HubGrid({required this.classroom});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Row(
          children: [
            Expanded(
              child: _HubCard(
                icon: Icons.folder_rounded,
                label: 'Materials',
                subtitle: 'Study resources',
                color: AppColors.primary,
                gradient: const LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [Color(0xFF154360), AppColors.primary],
                ),
                onTap: () => _pushTab(context, 0),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _HubCard(
                icon: Icons.quiz_rounded,
                label: 'Quizzes',
                subtitle: 'Practice tests',
                color: AppColors.accent,
                gradient: const LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [Color(0xFF1A5276), AppColors.accent],
                ),
                onTap: () => _pushTab(context, 1),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _HubCard(
                icon: Icons.assessment_rounded,
                label: 'Marks',
                subtitle: 'View grades',
                color: AppColors.success,
                gradient: const LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [Color(0xFF1E8449), AppColors.success],
                ),
                onTap: () => _pushTab(context, 2),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _HubCard(
                icon: Icons.forum_rounded,
                label: 'Discussions',
                subtitle: 'Q&A forum',
                color: AppColors.info,
                gradient: const LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [Color(0xFF154360), AppColors.info],
                ),
                onTap: () => _pushTab(context, 3),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        _HubCard(
          icon: Icons.warning_amber_rounded,
          label: 'Academic Warning',
          subtitle: 'Score alerts & warnings',
          color: AppColors.warning,
          gradient: const LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [Color(0xFF9A7D0A), AppColors.warning],
          ),
          onTap: () => _pushWarningTab(context),
          wide: true,
        ),
      ],
    );
  }

  void _pushTab(BuildContext context, int index) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => _ClassroomTabPage(
          classroom: classroom,
          initialTabIndex: index,
        ),
      ),
    );
  }

  void _pushWarningTab(BuildContext context) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => _ClassroomTabPage(
          classroom: classroom,
          initialTabIndex: 4,
        ),
      ),
    );
  }
}

class _HubCard extends StatelessWidget {
  final IconData icon;
  final String label;
  final String subtitle;
  final Color color;
  final LinearGradient gradient;
  final VoidCallback onTap;
  final bool wide;

  const _HubCard({
    required this.icon,
    required this.label,
    required this.subtitle,
    required this.color,
    required this.gradient,
    required this.onTap,
    this.wide = false,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          gradient: gradient,
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: color.withValues(alpha: 0.3),
              blurRadius: 12,
              offset: const Offset(0, 6),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: wide ? CrossAxisAlignment.start : CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.2),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: Colors.white, size: 24),
            ),
            const SizedBox(height: 14),
            Text(
              label,
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w900,
                color: Colors.white,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              subtitle,
              style: TextStyle(
                fontSize: 12,
                color: Colors.white.withValues(alpha: 0.7),
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// Redirect page that shows tabs
// Internal tabbed page (used by hub and direct navigation)
class _ClassroomTabPage extends StatefulWidget {
  final Classroom classroom;
  final int initialTabIndex;

  const _ClassroomTabPage({
    required this.classroom,
    this.initialTabIndex = 0,
  });

  @override
  State<_ClassroomTabPage> createState() => _ClassroomTabPageState();
}

class _ClassroomTabPageState extends State<_ClassroomTabPage>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    final safeIndex = widget.initialTabIndex.clamp(0, 4);
    _tabController = TabController(length: 5, initialIndex: safeIndex, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          const GradientBackground(),
          SafeArea(
            child: Column(
              children: [
                _buildHeader(context),
                _buildTabNavigation(),
                Expanded(
                  child: TabBarView(
                    controller: _tabController,
                    children: [
                      StudentMaterialsTab(classroomId: widget.classroom.id),
                      StudentQuizzesTab(classroomId: widget.classroom.id),
                      StudentMarksTab(classroomId: widget.classroom.id),
                      StudentDiscussionsTab(
                        classroomId: widget.classroom.id,
                        classroomName: widget.classroom.className,
                      ),
                      StudentAcademicWarningTab(classroomId: widget.classroom.id),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHeader(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
      child: Row(
        children: [
          IconButton(
            onPressed: () => Navigator.pop(context),
            icon: const Icon(Icons.arrow_back_ios_new_rounded,
                color: AppColors.primary, size: 20),
            padding: EdgeInsets.zero,
            constraints: const BoxConstraints(),
          ),
          const SizedBox(width: 16),
          Container(
            width: 40,
            height: 40,
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: AppColors.primary.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(Icons.school_rounded,
                color: AppColors.primary, size: 20),
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
                  maxLines: 2,
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
        labelPadding: const EdgeInsets.symmetric(horizontal: 12),
        tabs: const [
          Tab(text: 'Materials'),
          Tab(text: 'Quizzes'),
          Tab(text: 'Marks'),
          Tab(text: 'Discussions'),
          Tab(text: 'Warning'),
        ],
      ),
    );
  }
}

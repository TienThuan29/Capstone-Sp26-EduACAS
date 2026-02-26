import 'package:flutter/material.dart';
import 'package:sidebarx/sidebarx.dart';
import 'package:mobile/core/theme/app_colors.dart';
import 'package:mobile/core/storage/token_storage.dart';
import 'package:mobile/features/presentation/components/sidebar.dart';
import 'package:mobile/features/presentation/auth/login_page.dart';
import 'package:mobile/features/presentation/lecturer/discussion_issue_management.dart';
import 'package:mobile/features/presentation/lecturer/problem_management_page.dart';

class LecturerPage extends StatefulWidget {
  const LecturerPage({super.key});

  @override
  State<LecturerPage> createState() => _LecturerPageState();
}

class _LecturerPageState extends State<LecturerPage> {
  final _controller = SidebarXController(selectedIndex: 0, extended: true);
  final _scaffoldKey = GlobalKey<ScaffoldState>();
  String _userName = '';

  @override
  void initState() {
    super.initState();
    _loadUserName();
    _controller.addListener(() {
      if (mounted) setState(() {});
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _loadUserName() async {
    final name = await TokenStorage.getUserName();
    if (mounted) {
      setState(() {
        _userName = name ?? 'Lecturer';
      });
    }
  }

  Future<void> _handleLogout() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Logout'),
        content: const Text('Are you sure you want to logout?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('Logout'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      await TokenStorage.clearTokens();
      await TokenStorage.clearUserName();
      await TokenStorage.clearUserRole();
      if (!mounted) return;
      Navigator.pushAndRemoveUntil(
        context,
        MaterialPageRoute(builder: (context) => const LoginPage()),
        (route) => false,
      );
    }
  }

  Widget _buildContent() {
    switch (_controller.selectedIndex) {
      case 0:
        // My Classrooms - placeholder
        return _buildPlaceholder(
          icon: Icons.class_,
          title: 'My Classrooms',
          subtitle: 'Manage your classrooms here',
        );
      case 1:
        // Problem Banks
        return const ProblemManagementPage();
      case 2:
        // Discussions
        return const DiscussionIssueManagementPage(
          classroomId: 'demo-classroom-1',
          classroomName: 'SE490 - Capstone Project',
        );
      default:
        return _buildPlaceholder(
          icon: Icons.school,
          title: 'Welcome, $_userName!',
          subtitle: 'Select an option from the sidebar',
        );
    }
  }

  Widget _buildPlaceholder({
    required IconData icon,
    required String title,
    required String subtitle,
  }) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, size: 64, color: Colors.grey[300]),
          const SizedBox(height: 16),
          Text(
            title,
            style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                  color: AppColors.textPrimary,
                ),
          ),
          const SizedBox(height: 8),
          Text(
            subtitle,
            style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                  color: AppColors.textSecondary,
                ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isSmallScreen = MediaQuery.of(context).size.width < 600;

    return Scaffold(
      key: _scaffoldKey,
      backgroundColor: AppColors.background,
      appBar: isSmallScreen
          ? AppBar(
              backgroundColor: AppColors.primary,
              title: const Text('EduACAS'),
              leading: IconButton(
                onPressed: () {
                  _scaffoldKey.currentState?.openDrawer();
                },
                icon: const Icon(Icons.menu),
              ),
            )
          : null,
      drawer: isSmallScreen
          ? AppSidebar(
              controller: _controller,
              onLogout: _handleLogout,
              userRole: Roles.lecturer,
            )
          : null,
      body: Row(
        children: [
          if (!isSmallScreen)
            AppSidebar(
              controller: _controller,
              onLogout: _handleLogout,
              userRole: Roles.lecturer,
            ),
          Expanded(child: _buildContent()),
        ],
      ),
    );
  }
}

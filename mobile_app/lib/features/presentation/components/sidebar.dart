import 'package:flutter/material.dart';
import 'package:sidebarx/sidebarx.dart';
import 'package:mobile/core/theme/app_colors.dart';
import 'package:mobile/core/storage/token_storage.dart';
import 'package:mobile/features/presentation/auth/login_page.dart';
import 'package:mobile/features/presentation/profile/profile_screen.dart';
import 'package:mobile/features/presentation/student/student_page.dart';
import 'package:mobile/features/presentation/student/student_classroom_list_page.dart';
import 'package:mobile/features/presentation/lecturer/lecturer_classroom_list_page.dart';
import 'package:mobile/features/presentation/lecturer/problem_management_page.dart';
import 'package:mobile/features/presentation/lecturer/discussion_issue_management.dart';
import 'package:mobile/features/presentation/lecturer/lecturer_page.dart';

/// Role constants matching web_app
class Roles {
  static const String admin = 'ADMIN';
  static const String lecturer = 'LECTURER';
  static const String student = 'STUDENT';
}

/// Get sidebar items based on user role
List<SidebarXItem> getSidebarItemsForRole(String? role) {
  switch (role?.toUpperCase()) {
    case Roles.admin:
      return const [
        SidebarXItem(icon: Icons.dashboard, label: 'Dashboard'),
        SidebarXItem(icon: Icons.class_, label: 'Manage Classrooms'),
        SidebarXItem(icon: Icons.book, label: 'Manage Subjects'),
        SidebarXItem(icon: Icons.code, label: 'Manage Languages'),
        SidebarXItem(icon: Icons.people, label: 'Manage Users'),
      ];
    case Roles.lecturer:
      return const [
        SidebarXItem(icon: Icons.class_, label: 'My Classrooms'),
        SidebarXItem(icon: Icons.quiz, label: 'Problem Banks'),
      ];
    case Roles.student:
    default:
      return const [
        SidebarXItem(icon: Icons.dashboard, label: 'Dashboard'),
        SidebarXItem(icon: Icons.class_, label: 'Classrooms'),
        SidebarXItem(icon: Icons.campaign, label: 'Announcements'),
      ];
  }
}

class AppSidebar extends StatelessWidget {
  const AppSidebar({
    super.key,
    required this.controller,
    this.onLogout,
    this.userRole,
  });

  final SidebarXController controller;
  final VoidCallback? onLogout;
  final String? userRole;

  @override
  Widget build(BuildContext context) {
    return SidebarX(
      controller: controller,
      theme: SidebarXTheme(
        margin: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: AppColors.primary,
          borderRadius: BorderRadius.circular(20),
        ),
        hoverColor: AppColors.primary.withValues(alpha: 0.7),
        textStyle: const TextStyle(color: Colors.white),
        selectedTextStyle: const TextStyle(color: Colors.white),
        hoverTextStyle: const TextStyle(
          color: Colors.white,
          fontWeight: FontWeight.w500,
        ),
        itemTextPadding: const EdgeInsets.only(left: 30),
        selectedItemTextPadding: const EdgeInsets.only(left: 30),
        itemDecoration: BoxDecoration(
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: AppColors.primary),
        ),
        selectedItemDecoration: BoxDecoration(
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: AppColors.accent.withValues(alpha: 0.37)),
          gradient: LinearGradient(
            colors: [AppColors.accent.withValues(alpha: 0.5), AppColors.accent],
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.28),
              blurRadius: 30,
            )
          ],
        ),
        iconTheme: const IconThemeData(
          color: Colors.white,
          size: 20,
        ),
        selectedIconTheme: const IconThemeData(
          color: Colors.white,
          size: 20,
        ),
      ),
      extendedTheme: SidebarXTheme(
        width: 200,
        decoration: BoxDecoration(
          color: AppColors.primary,
        ),
      ),
      footerDivider: Divider(color: Colors.white.withValues(alpha: 0.3), height: 1),
      footerBuilder: (context, extended) {
        return Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Profile Button
              InkWell(
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (context) => const ProfileScreen()),
                  );
                },
                borderRadius: BorderRadius.circular(10),
                child: Container(
                  padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(10),
                    color: Colors.white.withValues(alpha: 0.1),
                  ),
                  child: Row(
                    mainAxisAlignment: extended ? MainAxisAlignment.start : MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.person, color: Colors.white, size: 20),
                      if (extended) ...[
                        const SizedBox(width: 12),
                        const Text(
                          'Profile',
                          style: TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 12),
              // Logout Button
              InkWell(
                onTap: onLogout,
                borderRadius: BorderRadius.circular(10),
                child: Container(
                  padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(10),
                    color: Colors.red.withValues(alpha: 0.2),
                  ),
                  child: Row(
                    mainAxisAlignment: extended ? MainAxisAlignment.start : MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.logout, color: Colors.white, size: 20),
                      if (extended) ...[
                        const SizedBox(width: 12),
                        const Text(
                          'Logout',
                          style: TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
            ],
          ),
        );
      },
      headerBuilder: (context, extended) {
        return SizedBox(
          height: 100,
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: extended
                ? const Row(
                    children: [
                      Icon(Icons.school, color: Colors.white, size: 32),
                      SizedBox(width: 10),
                      Text(
                        'EduACAS',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  )
                : const Icon(Icons.school, color: Colors.white, size: 32),
          ),
        );
      },
      items: getSidebarItemsForRole(userRole),
    );
  }
}

class SidebarScaffold extends StatefulWidget {
  const SidebarScaffold({
    super.key,
    required this.child,
    this.selectedIndex = 0,
  });

  final Widget child;
  final int selectedIndex;

  @override
  State<SidebarScaffold> createState() => _SidebarScaffoldState();
}

class _SidebarScaffoldState extends State<SidebarScaffold> {
  late SidebarXController _controller;
  final _key = GlobalKey<ScaffoldState>();
  String? _userRole;

  @override
  void initState() {
    super.initState();
    _controller = SidebarXController(
      selectedIndex: widget.selectedIndex,
      extended: true,
    );
    _loadUserRole();
    
    // Add listener to handle navigation outside of build phase
    _controller.addListener(_navigationListener);
  }

  @override
  void dispose() {
    _controller.removeListener(_navigationListener);
    _controller.dispose();
    super.dispose();
  }

  void _navigationListener() {
    if (_controller.selectedIndex != widget.selectedIndex) {
      _onItemSelected(_controller.selectedIndex);
    }
  }

  Future<void> _loadUserRole() async {
    final role = await TokenStorage.getUserRole();
    if (mounted) {
      setState(() {
        _userRole = role;
      });
    }
  }

  void _onItemSelected(int index) {
    Widget? nextScreen;
    final role = _userRole?.toUpperCase();

    if (role == Roles.student) {
      switch (index) {
        case 0: // Dashboard
          nextScreen = const StudentPage();
          break;
        case 1: // Classrooms
          nextScreen = const StudentClassroomListPage();
          break;
      }
    } else if (role == Roles.lecturer) {
      switch (index) {
        case 0: // Dashboard/Classrooms
          nextScreen = const LecturerClassroomListPage();
          break;
        case 1: // Problem Banks
          nextScreen = const ProblemManagementPage();
          break;
      }
    } else if (role == Roles.admin) {
      switch (index) {
        case 2: // Manage Classrooms
          // Admin classroom management logic
          break;
      }
    }

    if (nextScreen != null) {
      // Use microtask to ensure we are outside of build/layout phase
      Future.microtask(() {
        if (!mounted) return;
        Navigator.pushReplacement(
          context,
          PageRouteBuilder(
            pageBuilder: (context, animation1, animation2) => nextScreen!,
            transitionDuration: Duration.zero,
            reverseTransitionDuration: Duration.zero,
          ),
        );
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

  @override
  Widget build(BuildContext context) {
    final isSmallScreen = MediaQuery.of(context).size.width < 600;

    return Scaffold(
      key: _key,
      appBar: isSmallScreen
          ? AppBar(
              backgroundColor: AppColors.primary,
              title: const Text('EduACAS'),
              leading: IconButton(
                onPressed: () {
                  _key.currentState?.openDrawer();
                },
                icon: const Icon(Icons.menu),
              ),
            )
          : null,
      drawer: isSmallScreen
          ? AppSidebar(
              controller: _controller,
              onLogout: _handleLogout,
              userRole: _userRole,
            )
          : null,
      body: Row(
        children: [
          if (!isSmallScreen)
            AppSidebar(
              controller: _controller,
              onLogout: _handleLogout,
              userRole: _userRole,
            ),
          Expanded(
            child: widget.child,
          ),
        ],
      ),
    );
  }
}

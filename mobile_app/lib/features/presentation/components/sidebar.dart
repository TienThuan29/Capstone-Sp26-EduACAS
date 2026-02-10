import 'package:flutter/material.dart';
import 'package:sidebarx/sidebarx.dart';
import 'package:mobile/core/theme/app_colors.dart';
import 'package:mobile/core/storage/token_storage.dart';
import 'package:mobile/features/presentation/auth/login_page.dart';

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
        SidebarXItem(icon: Icons.dashboard, label: 'Admin Dashboard'),
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
          child: InkWell(
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

/// Example usage of sidebar with a scaffold
class SidebarScaffold extends StatefulWidget {
  const SidebarScaffold({super.key, required this.child});

  final Widget child;

  @override
  State<SidebarScaffold> createState() => _SidebarScaffoldState();
}

class _SidebarScaffoldState extends State<SidebarScaffold> {
  final _controller = SidebarXController(selectedIndex: 0, extended: true);
  final _key = GlobalKey<ScaffoldState>();
  String? _userRole;

  @override
  void initState() {
    super.initState();
    _loadUserRole();
  }

  Future<void> _loadUserRole() async {
    final role = await TokenStorage.getUserRole();
    if (mounted) {
      setState(() {
        _userRole = role;
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
          ? AppSidebar(controller: _controller, onLogout: _handleLogout, userRole: _userRole)
          : null,
      body: Row(
        children: [
          if (!isSmallScreen) AppSidebar(controller: _controller, onLogout: _handleLogout, userRole: _userRole),
          Expanded(child: widget.child),
        ],
      ),
    );
  }
}

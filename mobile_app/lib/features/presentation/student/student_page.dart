import 'package:flutter/material.dart';
import 'package:mobile/core/storage/token_storage.dart';
import 'package:mobile/core/theme/app_colors.dart';
import 'package:mobile/features/presentation/auth/login_page.dart';
import 'package:mobile/features/presentation/components/sidebar.dart';
import 'package:mobile/features/presentation/student/student_classroom_list_page.dart';
import 'package:sidebarx/sidebarx.dart';
import 'package:mobile/core/widgets/background.dart';

class StudentPage extends StatefulWidget {
  const StudentPage({super.key});

  @override
  State<StudentPage> createState() => _StudentPageState();
}

class _StudentPageState extends State<StudentPage> {
  final _controller = SidebarXController(selectedIndex: 0, extended: true);
  final _key = GlobalKey<ScaffoldState>();
  int _currentIndex = 0;
  String _userName = '';
  String? _userRole;

  @override
  void initState() {
    super.initState();
    _loadUser();
    // Initialize controller with current index
    _controller.selectIndex(_currentIndex);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _onSidebarItemSelected(int newIndex) {
    if (!mounted) return;
    if (_key.currentState?.isDrawerOpen ?? false) {
      _key.currentState?.closeDrawer();
      Future.delayed(const Duration(milliseconds: 250), () {
        if (mounted) setState(() => _currentIndex = newIndex);
      });
    } else {
      setState(() => _currentIndex = newIndex);
    }
  }

  void _navigateTo(int index) {
    setState(() => _currentIndex = index);
    if (_controller.selectedIndex != index) {
      _controller.selectIndex(index);
    }
  }

  Future<void> _loadUser() async {
    final name = await TokenStorage.getUserName();
    final role = await TokenStorage.getUserRole();
    if (mounted) {
      setState(() {
        _userName = name ?? 'Student';
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
      await TokenStorage.clearUserId();
      if (!mounted) return;
      Navigator.pushAndRemoveUntil(
        context,
        MaterialPageRoute(builder: (context) => const LoginPage()),
        (route) => false,
      );
    }
  }

  String _getPageTitle() {
    switch (_currentIndex) {
      case 0:
        return 'Dashboard';
      case 1:
        return 'My Classrooms';
      case 2:
        return 'Announcements';
      default:
        return 'EduACAS';
    }
  }

  Widget _buildContent() {
    switch (_currentIndex) {
      case 1: // Classrooms
        return const StudentClassroomListPage();
      case 0: // Dashboard / Home
      default:
        return _buildWelcome();
    }
  }

  Widget _buildWelcome() {
    return Stack(
      children: [
        const GradientBackground(),
        SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 40),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Show Hero Section only on larger screens or specifically in Dashboard
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(32),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [AppColors.primary, Color(0xFF154360)],
                  ),
                  borderRadius: BorderRadius.circular(24),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.primary.withOpacity(0.3),
                      blurRadius: 20,
                      offset: const Offset(0, 10),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.15),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.school_rounded, color: Colors.white, size: 32),
                    ),
                    const SizedBox(height: 24),
                    const Text(
                      'Welcome to EduACAS',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 28,
                        fontWeight: FontWeight.w900,
                        letterSpacing: -0.5,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Hello, $_userName! Ready to learn something today?',
                      style: TextStyle(
                        color: Colors.white.withOpacity(0.8),
                        fontSize: 16,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 40),

              const Text(
                'QUICK ACTIONS',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w900,
                  color: AppColors.textLight,
                  letterSpacing: 1.5,
                ),
              ),
              const SizedBox(height: 20),

              _QuickButton(
                icon: Icons.book_rounded,
                label: 'View My Classrooms',
                description: 'Access your materials, exams and discussions',
                color: AppColors.primary,
                onTap: () => _navigateTo(1),
              ),
              const SizedBox(height: 16),
              _QuickButton(
                icon: Icons.person_outline_rounded,
                label: 'Manage My Profile',
                description: 'Update your personal information and settings',
                color: AppColors.accent,
                onTap: () {
                   Navigator.push(
                    context,
                    MaterialPageRoute(builder: (context) => const LoginPage()), // Placeholder for Profile
                  );
                }, 
              ),
            ],
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final isSmallScreen = MediaQuery.of(context).size.width < 600;

    return Scaffold(
      key: _key,
      appBar: isSmallScreen
          ? AppBar(
              backgroundColor: Colors.white,
              elevation: 0,
              iconTheme: const IconThemeData(color: AppColors.primary),
              title: Text(
                _getPageTitle(),
                style: const TextStyle(
                  color: AppColors.primary, 
                  fontWeight: FontWeight.w900, 
                  fontSize: 20
                ),
              ),
              centerTitle: true,
              shape: Border(
                bottom: BorderSide(color: Colors.grey.withOpacity(0.1), width: 1),
              ),
            )
          : null,
      drawer: isSmallScreen
          ? AppSidebar(
              controller: _controller,
              onLogout: _handleLogout,
              userRole: _userRole,
              onItemSelected: _onSidebarItemSelected,
            )
          : null,
      body: Row(
        children: [
          if (!isSmallScreen)
            AppSidebar(
              controller: _controller,
              onLogout: _handleLogout,
              userRole: _userRole,
              onItemSelected: _onSidebarItemSelected,
            ),
          Expanded(
            child: _buildContent(),
          ),
        ],
      ),
    );
  }
}

class _QuickButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final String description;
  final Color color;
  final VoidCallback onTap;

  const _QuickButton({
    required this.icon,
    required this.label,
    required this.description,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.withOpacity(0.1)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(16),
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: color.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(icon, color: color, size: 24),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        label,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: AppColors.textPrimary,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        description,
                        style: const TextStyle(
                          fontSize: 12,
                          color: AppColors.textLight,
                        ),
                      ),
                    ],
                  ),
                ),
                Icon(Icons.arrow_forward_ios_rounded, size: 14, color: Colors.grey[300]),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

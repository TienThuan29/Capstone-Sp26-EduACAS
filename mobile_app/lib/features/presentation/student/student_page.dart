import 'package:flutter/material.dart';
import 'package:mobile/core/storage/token_storage.dart';
import 'package:mobile/core/theme/app_colors.dart';
import 'package:mobile/features/presentation/auth/login_page.dart';
import 'package:mobile/features/presentation/components/sidebar.dart';
import 'package:mobile/features/presentation/student/classroom_page.dart';
import 'package:sidebarx/sidebarx.dart';

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
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  /// Called by AppSidebar when user taps an item.
  void _onSidebarItemSelected(int newIndex) {
    if (!mounted) return;
    // Always update — even if sidebar thinks index didn't change
    if (_key.currentState?.isDrawerOpen ?? false) {
      _key.currentState?.closeDrawer();
      Future.delayed(const Duration(milliseconds: 250), () {
        if (mounted) setState(() => _currentIndex = newIndex);
      });
    } else {
      setState(() => _currentIndex = newIndex);
    }
  }

  /// Navigate programmatically (e.g. from Quick Action cards) and keep sidebar in sync.
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

  Widget _buildContent() {
    switch (_currentIndex) {
      case 1: // Classrooms
        return const ClassroomPage();
      case 2: // Announcements (placeholder)
        return _buildPlaceholder(
          icon: Icons.campaign_outlined,
          label: 'Announcements',
          subtitle: 'Coming soon',
        );
      case 0: // Dashboard / Home
      default:
        return _buildWelcome();
    }
  }

  Widget _buildWelcome() {
    return Container(
      color: AppColors.background,
      child: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 40),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ── Greeting header ───────────────────────────────────────────
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [AppColors.primary, AppColors.primaryLight],
                    ),
                    borderRadius: BorderRadius.circular(20),
                    boxShadow: [
                      BoxShadow(
                        color: AppColors.primary.withValues(alpha: 0.3),
                        blurRadius: 20,
                        offset: const Offset(0, 8),
                      ),
                    ],
                  ),
                  child: const Icon(Icons.school_rounded,
                      size: 40, color: Colors.white),
                ),
                const SizedBox(width: 18),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Welcome back,',
                        style: TextStyle(
                          fontSize: 14,
                          color: Colors.grey[500],
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        _userName,
                        style: const TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                          color: AppColors.textPrimary,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),

            const SizedBox(height: 36),

            // ── Section label ─────────────────────────────────────────────
            const Text(
              'Quick Access',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w700,
                color: AppColors.textSecondary,
                letterSpacing: 0.8,
              ),
            ),
            const SizedBox(height: 14),

            // ── Quick action cards ─────────────────────────────────────────
            _QuickActionCard(
              icon: Icons.class_rounded,
              label: 'My Classrooms',
              subtitle: 'Browse and join your classrooms',
              gradientColors: const [Color(0xFF1F4E79), Color(0xFF2E86C1)],
              onTap: () => _navigateTo(1),
            ),
            const SizedBox(height: 14),
            _QuickActionCard(
              icon: Icons.campaign_rounded,
              label: 'Announcements',
              subtitle: 'Stay up to date with the latest news',
              gradientColors: const [Color(0xFF4A235A), Color(0xFF7D3C98)],
              onTap: () => _navigateTo(2),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPlaceholder({
    required IconData icon,
    required String label,
    required String subtitle,
  }) {
    return Container(
      color: AppColors.background,
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 64, color: Colors.grey[300]),
            const SizedBox(height: 16),
            Text(
              label,
              style: const TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              subtitle,
              style: const TextStyle(color: AppColors.textSecondary),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isSmallScreen = MediaQuery.of(context).size.width < 600;

    return Scaffold(
      key: _key,
      appBar: isSmallScreen
          ? AppBar(
              backgroundColor: AppColors.primary,
              title: const Text('EduACAS',
                  style: TextStyle(color: Colors.white)),
              leading: IconButton(
                onPressed: () => _key.currentState?.openDrawer(),
                icon: const Icon(Icons.menu, color: Colors.white),
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
          Expanded(child: _buildContent()),
        ],
      ),
    );
  }
}

// ── _QuickActionCard ──────────────────────────────────────────────────────────

class _QuickActionCard extends StatefulWidget {
  const _QuickActionCard({
    required this.icon,
    required this.label,
    required this.subtitle,
    required this.gradientColors,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final String subtitle;
  final List<Color> gradientColors;
  final VoidCallback onTap;

  @override
  State<_QuickActionCard> createState() => _QuickActionCardState();
}

class _QuickActionCardState extends State<_QuickActionCard> {
  bool _hovered = false;

  @override
  Widget build(BuildContext context) {
    return MouseRegion(
      cursor: SystemMouseCursors.click,
      onEnter: (_) => setState(() => _hovered = true),
      onExit: (_) => setState(() => _hovered = false),
      child: GestureDetector(
        onTap: widget.onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(18),
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: widget.gradientColors,
            ),
            boxShadow: [
              BoxShadow(
                color: widget.gradientColors.first.withValues(
                  alpha: _hovered ? 0.45 : 0.25,
                ),
                blurRadius: _hovered ? 24 : 14,
                offset: Offset(0, _hovered ? 10 : 6),
              ),
            ],
          ),
          padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 20),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.18),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Icon(widget.icon, color: Colors.white, size: 28),
              ),
              const SizedBox(width: 18),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      widget.label,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 17,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      widget.subtitle,
                      style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.75),
                        fontSize: 13,
                      ),
                    ),
                  ],
                ),
              ),
              AnimatedContainer(
                duration: const Duration(milliseconds: 180),
                transform: Matrix4.translationValues(
                    _hovered ? 4 : 0, 0, 0),
                child: const Icon(
                  Icons.arrow_forward_ios_rounded,
                  color: Colors.white70,
                  size: 18,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

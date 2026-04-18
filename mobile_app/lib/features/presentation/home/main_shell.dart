import 'package:flutter/material.dart';
import 'package:mobile/core/theme/app_colors.dart';
import 'package:mobile/core/storage/token_storage.dart';
import 'package:mobile/features/presentation/shared/sidebar.dart';
import 'package:mobile/features/presentation/auth/login_page.dart';
import 'package:mobile/features/presentation/home/dashboard_page.dart';
import 'package:mobile/features/presentation/classroom/student_classroom_list_page.dart';
import 'package:mobile/features/presentation/classroom/lecturer_classroom_list_page.dart';
import 'package:mobile/features/presentation/announcement/announcement_page.dart';
import 'package:mobile/features/presentation/profile/profile_screen.dart';
import 'package:mobile/features/services/announcement_service.dart';

/// Unified shell with BottomNavigationBar for quick-access navigation.
class MainShell extends StatefulWidget {
  const MainShell({super.key});

  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  int _currentIndex = 0;
  String _userName = '';
  String? _userRole;
  bool _pendingAnnouncementJump = false;
  bool _hasUnreadAnnouncements = false;

  @override
  void initState() {
    super.initState();
    AnnouncementFeed.focusRequestRevision.addListener(_handleAnnouncementFocusRequest);
    AnnouncementFeed.hasUnreadAnnouncements.addListener(_handleUnreadAnnouncementsChanged);
    _loadUser();
  }

  @override
  void dispose() {
    AnnouncementFeed.focusRequestRevision.removeListener(_handleAnnouncementFocusRequest);
    AnnouncementFeed.hasUnreadAnnouncements.removeListener(_handleUnreadAnnouncementsChanged);
    super.dispose();
  }

  Future<void> _loadUser() async {
    final name = await TokenStorage.getUserName();
    final role = await TokenStorage.getUserRole();
    if (mounted) {
      setState(() {
        _userName = name ?? 'User';
        _userRole = role?.toUpperCase();

        if (_pendingAnnouncementJump && _userRole == Roles.student) {
          _currentIndex = 2;
          _pendingAnnouncementJump = false;
        }
      });

      if (_userRole == Roles.student) {
        AnnouncementFeed.refreshUnreadStatus();
      }
    }
  }

  void _handleAnnouncementFocusRequest() {
    if (!mounted) {
      return;
    }

    if (_userRole == null) {
      _pendingAnnouncementJump = true;
      return;
    }

    if (_userRole == Roles.student && _currentIndex != 2) {
      setState(() => _currentIndex = 2);
    }
  }

  void _handleUnreadAnnouncementsChanged() {
    if (!mounted) {
      return;
    }

    setState(() {
      _hasUnreadAnnouncements = AnnouncementFeed.hasUnreadAnnouncements.value;
    });
  }

  // ── Navigation ────────────────────────────────────────

  void _selectTab(int index) {
    if (_currentIndex == index) return;
    setState(() => _currentIndex = index);
  }

  // ── Logout ────────────────────────────────────────────

  Future<void> _handleLogout() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Logout'),
        content: const Text('Are you sure you want to logout?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
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
        MaterialPageRoute(builder: (_) => const LoginPage()),
        (route) => false,
      );
    }
  }

  // ── Menu config ───────────────────────────────────────

  List<_NavItem> _getNavItems() {
    if (_userRole == Roles.lecturer) {
      return [
        _NavItem('Home', Icons.home_rounded, Icons.home_outlined),
        _NavItem('Classrooms', Icons.class_rounded, Icons.class_outlined),
        _NavItem('Profile', Icons.person_rounded, Icons.person_outline_rounded),
      ];
    }
    // Student (default)
    return [
      _NavItem('Home', Icons.home_rounded, Icons.home_outlined),
      _NavItem('Classrooms', Icons.class_rounded, Icons.class_outlined),
      _NavItem(
        'Announcements',
        Icons.campaign_rounded,
        Icons.campaign_outlined,
        showDot: _hasUnreadAnnouncements,
      ),
      _NavItem('Profile', Icons.person_rounded, Icons.person_outline_rounded),
    ];
  }

  // ── Pages ─────────────────────────────────────────────

  List<Widget> _buildPages() {
    if (_userRole == Roles.lecturer) {
      return [
        DashboardPage(
          role: Roles.lecturer,
          userName: _userName,
          onNavigate: _selectTab,
        ),
        const LecturerClassroomListPage(),
        ProfileScreen(onLogout: _handleLogout),
      ];
    }
    // Student (default)
    return [
      DashboardPage(
        role: Roles.student,
        userName: _userName,
        onNavigate: _selectTab,
      ),
      const StudentClassroomListPage(),
      const AnnouncementPage(),
      ProfileScreen(onLogout: _handleLogout),
    ];
  }

  // ── Build ─────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    final navItems = _getNavItems();
    final pages = _buildPages();

    return Scaffold(
      backgroundColor: AppColors.background,
      body: IndexedStack(
        index: _currentIndex.clamp(0, pages.length - 1),
        children: pages,
      ),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.06),
              blurRadius: 12,
              offset: const Offset(0, -2),
            ),
          ],
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: List.generate(navItems.length, (i) {
                final item = navItems[i];
                final isSelected = _currentIndex == i;
                return _BottomNavButton(
                  icon: isSelected ? item.activeIcon : item.icon,
                  label: item.label,
                  isSelected: isSelected,
                  showDot: item.showDot,
                  onTap: () => _selectTab(i),
                );
              }),
            ),
          ),
        ),
      ),
    );
  }
}

/// Single bottom‐nav button with animated indicator.
class _BottomNavButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool isSelected;
  final bool showDot;
  final VoidCallback onTap;

  const _BottomNavButton({
    required this.icon,
    required this.label,
    required this.isSelected,
    this.showDot = false,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected
              ? AppColors.primary.withValues(alpha: 0.1)
              : Colors.transparent,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Stack(
              clipBehavior: Clip.none,
              children: [
                Icon(
                  icon,
                  size: 24,
                  color: isSelected ? AppColors.primary : AppColors.textLight,
                ),
                if (showDot)
                  Positioned(
                    right: -18,
                    top: 8,
                    child: Container(
                      width: 8,
                      height: 8,
                      decoration: const BoxDecoration(
                        shape: BoxShape.circle,
                        color: AppColors.error,
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 4),
            Text(
              label,
              style: TextStyle(
                fontSize: 11,
                fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                color: isSelected ? AppColors.primary : AppColors.textLight,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Nav item model.
class _NavItem {
  final String label;
  final IconData activeIcon;
  final IconData icon;
  final bool showDot;
  const _NavItem(
    this.label,
    this.activeIcon,
    this.icon, {
    this.showDot = false,
  });
}

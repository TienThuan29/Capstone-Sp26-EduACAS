import 'package:flutter/material.dart';
import 'package:mobile/core/theme/app_colors.dart';
import 'package:mobile/core/widgets/background.dart';
import 'package:mobile/features/presentation/shared/sidebar.dart';
import 'package:mobile/features/presentation/profile/profile_screen.dart';

/// Role-aware dashboard – same design language, different content per role.
class DashboardPage extends StatelessWidget {
  final String role;
  final String userName;

  /// Callback to switch tabs in [MainShell].
  final void Function(int index) onNavigate;

  const DashboardPage({
    super.key,
    required this.role,
    required this.userName,
    required this.onNavigate,
  });

  bool get _isLecturer => role == Roles.lecturer;

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        const GradientBackground(),
        SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 40),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // ── Hero Card ──────────────────────────────
              _HeroCard(
                userName: userName,
                subtitle: _isLecturer
                    ? 'Manage your classrooms and problems'
                    : 'Ready to learn something today?',
                icon: _isLecturer ? Icons.school_rounded : Icons.school_rounded,
              ),

              const SizedBox(height: 40),

              // ── Quick Actions ──────────────────────────
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

              ..._buildQuickActions(context),
            ],
          ),
        ),
      ],
    );
  }

  List<Widget> _buildQuickActions(BuildContext context) {
    if (_isLecturer) {
      return [
        _QuickButton(
          icon: Icons.class_rounded,
          label: 'My Classrooms',
          description: 'View and manage your classrooms',
          color: AppColors.primary,
          onTap: () => onNavigate(1),
        ),
        const SizedBox(height: 16),
        _QuickButton(
          icon: Icons.quiz_rounded,
          label: 'Problem Banks',
          description: 'Create and organize coding problems',
          color: AppColors.accent,
          onTap: () => onNavigate(2),
        ),
        const SizedBox(height: 16),
        _QuickButton(
          icon: Icons.person_outline_rounded,
          label: 'My Profile',
          description: 'Update your personal information',
          color: AppColors.info,
          onTap: () => Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => const ProfileScreen()),
          ),
        ),
      ];
    }

    // Student
    return [
      _QuickButton(
        icon: Icons.book_rounded,
        label: 'View My Classrooms',
        description: 'Access your materials, exams and discussions',
        color: AppColors.primary,
        onTap: () => onNavigate(1),
      ),
      const SizedBox(height: 16),
      _QuickButton(
        icon: Icons.person_outline_rounded,
        label: 'My Profile',
        description: 'Update your personal information and settings',
        color: AppColors.accent,
        onTap: () => Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => const ProfileScreen()),
        ),
      ),
    ];
  }
}

// ──────────────────────────────────────────────
//  Hero Card (shared design for all roles)
// ──────────────────────────────────────────────

class _HeroCard extends StatelessWidget {
  final String userName;
  final String subtitle;
  final IconData icon;

  const _HeroCard({
    required this.userName,
    required this.subtitle,
    required this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
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
            color: AppColors.primary.withValues(alpha: 0.3),
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
              color: Colors.white.withValues(alpha: 0.15),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: Colors.white, size: 32),
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
            'Hello, $userName! $subtitle',
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.8),
              fontSize: 16,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}

// ──────────────────────────────────────────────
//  Quick Action Button (shared)
// ──────────────────────────────────────────────

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
        border: Border.all(color: Colors.grey.withValues(alpha: 0.1)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
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
                    color: color.withValues(alpha: 0.1),
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

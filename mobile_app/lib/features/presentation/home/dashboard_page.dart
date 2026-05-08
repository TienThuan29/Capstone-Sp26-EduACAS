import 'package:flutter/material.dart';
import 'package:mobile/core/theme/app_colors.dart';
import 'package:mobile/core/widgets/background.dart';
import 'package:mobile/features/presentation/shared/sidebar.dart';
import 'package:mobile/features/presentation/profile/profile_screen.dart';
import 'package:mobile/features/presentation/question/question_management_page.dart';
import 'package:mobile/features/presentation/quiz/quiz_management_page.dart';

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
                    ? 'Manage your classrooms'
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

              const SizedBox(height: 32),
              const Text(
                'COMMUNITY OVERVIEW',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w900,
                  color: AppColors.textLight,
                  letterSpacing: 1.5,
                ),
              ),
              const SizedBox(height: 20),
              Row(
                children: [
                  Expanded(child: _buildSmallStat('1.2K+', 'Students')),
                  const SizedBox(width: 12),
                  Expanded(child: _buildSmallStat('45+', 'Lecturers')),
                  const SizedBox(width: 12),
                  Expanded(child: _buildSmallStat('80+', 'Classrooms')),
                ],
              ),
              const SizedBox(height: 40),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildSmallStat(String value, String label) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(color: Colors.black.withValues(alpha: 0.03), blurRadius: 10, offset: const Offset(0, 4)),
        ],
      ),
      child: Column(
        children: [
          Text(
            value,
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w900,
              color: AppColors.primary,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            style: const TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.bold,
              color: AppColors.textLight,
            ),
          ),
        ],
      ),
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
          icon: Icons.help_outline_rounded,
          label: 'Question Bank',
          description: 'Create and organize questions for quizzes',
          color: AppColors.info,
          onTap: () => Navigator.push(
            context,
            MaterialPageRoute(
              builder: (_) => QuestionManagementPage(onNavigateMainTab: onNavigate),
            ),
          ),
        ),
        const SizedBox(height: 16),
        _QuickButton(
          icon: Icons.assignment_rounded,
          label: 'Quiz Bank',
          description: 'Create quizzes and assign questions',
          color: AppColors.accent,
          onTap: () => Navigator.push(
            context,
            MaterialPageRoute(
              builder: (_) => QuizManagementPage(onNavigateMainTab: onNavigate),
            ),
          ),
        ),
        const SizedBox(height: 16),
        _QuickButton(
          icon: Icons.person_outline_rounded,
          label: 'My Profile',
          description: 'Update your personal information',
          color: AppColors.info,
          onTap: () => onNavigate(2),
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
        onTap: () => onNavigate(3),
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
            color: AppColors.primary.withValues(alpha: 0.15),
            blurRadius: 15,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Image.asset(
                  'assets/logo.png',
                  width: 32,
                  height: 32,
                  fit: BoxFit.contain,
                ),
              ),
              const SizedBox(width: 16),
              const Expanded(
                child: Text(
                  'Welcome to EduACAS',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 24,
                    fontWeight: FontWeight.w900,
                    letterSpacing: -0.5,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),
          Text(
            'Hello, $userName! $subtitle',
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.8),
              fontSize: 15,
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
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 8,
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

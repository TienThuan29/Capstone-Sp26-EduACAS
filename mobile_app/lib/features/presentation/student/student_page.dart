import 'package:flutter/material.dart';
import 'package:mobile/core/storage/token_storage.dart';
import 'package:mobile/features/presentation/components/sidebar.dart';

import 'package:mobile/core/theme/app_colors.dart';
import 'package:mobile/core/widgets/background.dart';

class StudentPage extends StatefulWidget {
  const StudentPage({super.key});

  @override
  State<StudentPage> createState() => _StudentPageState();
}

class _StudentPageState extends State<StudentPage> {
  String _userName = '';

  @override
  void initState() {
    super.initState();
    _loadUserName();
  }

  Future<void> _loadUserName() async {
    final name = await TokenStorage.getUserName();
    if (mounted) {
      setState(() {
        _userName = name ?? 'Student';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return SidebarScaffold(
      selectedIndex: 0,
      child: Stack(
        children: [
          const GradientBackground(),
          Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.1),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.school, size: 64, color: AppColors.primary),
                ),
                const SizedBox(height: 24),
                Text(
                  'Welcome, $_userName!',
                  style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                    color: AppColors.primary,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  'Select an option from the sidebar to get started',
                  style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                    color: AppColors.textSecondary,
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

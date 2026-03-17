import 'package:flutter/material.dart';
import 'package:mobile/features/presentation/auth/login_page.dart';
import 'package:mobile/features/presentation/home/main_shell.dart';

class RoleNavigator {
  static const String roleStudent = 'STUDENT';
  static const String roleTeacher = 'LECTURER';

  /// Navigate to the unified MainShell after login.
  /// MainShell reads the role from TokenStorage and adapts automatically.
  static void navigateByRole(BuildContext context, String role) {
    final upperRole = role.toUpperCase();
    if (upperRole == roleStudent || upperRole == roleTeacher) {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (_) => const MainShell()),
      );
    } else {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (_) => const LoginPage()),
      );
    }
  }

  /// Get home route name based on role
  static String getHomeRoute(String role) {
    switch (role.toUpperCase()) {
      case roleStudent:
        return '/student';
      case roleTeacher:
        return '/lecturer';
      default:
        return '/login';
    }
  }
}

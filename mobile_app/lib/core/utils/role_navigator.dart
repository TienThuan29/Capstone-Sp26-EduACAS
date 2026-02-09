import 'package:flutter/material.dart';
import 'package:mobile/features/presentation/student/student_page.dart';
// import 'package:mobile/features/presentation/teacher/teacher_page.dart';
// import 'package:mobile/features/presentation/admin/admin_page.dart';

class RoleNavigator {
  static const String roleStudent = 'STUDENT';
  static const String roleTeacher = 'TEACHER';
  static const String roleAdmin = 'ADMIN';

  /// Navigate to appropriate page based on user role
  static void navigateByRole(BuildContext context, String role) {
    Widget targetPage;

    switch (role.toUpperCase()) {
      case roleStudent:
        targetPage = const StudentPage();
        break;
      case roleTeacher:
        // targetPage = const TeacherPage();
        targetPage = const StudentPage(); // TODO: Replace with TeacherPage
        break;
      case roleAdmin:
        // targetPage = const AdminPage();
        targetPage = const StudentPage(); // TODO: Replace with AdminPage
        break;
      default:
        targetPage = const StudentPage(); // Default fallback
        break;
    }

    Navigator.pushReplacement(
      context,
      MaterialPageRoute(builder: (context) => targetPage),
    );
  }

  /// Get home route name based on role
  static String getHomeRoute(String role) {
    switch (role.toUpperCase()) {
      case roleStudent:
        return '/student';
      case roleTeacher:
        return '/teacher';
      case roleAdmin:
        return '/admin';
      default:
        return '/student';
    }
  }
}

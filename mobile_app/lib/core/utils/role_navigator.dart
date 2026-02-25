import 'package:flutter/material.dart';
import 'package:mobile/features/presentation/auth/login_page.dart';
import 'package:mobile/features/presentation/lecturer/lecturer_classroom_list_page.dart';
import 'package:mobile/features/presentation/student/student_page.dart';
// import 'package:mobile/features/presentation/teacher/teacher_page.dart';
// import 'package:mobile/features/presentation/admin/admin_page.dart';

class RoleNavigator {
  static const String roleStudent = 'STUDENT';
  static const String roleTeacher = 'LECTURER';

  /// Navigate to appropriate page based on user role
  static void navigateByRole(BuildContext context, String role) {
    Widget targetPage;

    switch (role.toUpperCase()) {
      case roleStudent:
        targetPage = const StudentPage();
        break;
      case roleTeacher:
        targetPage = const LecturerClassroomListPage();
        break;
      default:
        targetPage = const LoginPage();
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
        return '/lecturer';
      default:
        return '/login';
    }
  }
}

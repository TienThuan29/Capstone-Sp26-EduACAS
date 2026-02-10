import 'package:flutter/material.dart';

/// App color scheme based on Edu-ACAS web app design
class AppColors {
  // Primary colors
  static const Color primary = Color(0xFF1F4E79);        // Main blue
  static const Color primaryLight = Color(0xFF2A5A8A);   // Lighter blue
  static const Color primaryDark = Color(0xFF163A5C);    // Darker blue

  // Accent colors
  static const Color accent = Color(0xFFC9A24D);         // Gold accent
  static const Color accentLight = Color(0xFFD4B56A);    // Lighter gold
  static const Color accentDark = Color(0xFFB08D3A);     // Darker gold

  // Background colors
  static const Color background = Color(0xFFF5F7FA);     // Light grey background
  static const Color backgroundWhite = Color(0xFFFFFFFF); // White
  static const Color surface = Color(0xFFFFFFFF);        // Surface white

  // Text colors
  static const Color textPrimary = Color(0xFF1E1E1E);    // Dark text
  static const Color textSecondary = Color(0xFF6B7280);  // Grey text
  static const Color textLight = Color(0xFF9CA3AF);      // Light grey text

  // Status colors
  static const Color success = Color(0xFF22C55E);
  static const Color error = Color(0xFFEF4444);
  static const Color warning = Color(0xFFF59E0B);
  static const Color info = Color(0xFF3B82F6);

  // Gradient colors
  static const LinearGradient primaryGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [primary, primaryLight, accent],
  );

  static const LinearGradient buttonGradient = LinearGradient(
    begin: Alignment.centerLeft,
    end: Alignment.centerRight,
    colors: [primary, primaryLight],
  );

  static const LinearGradient backgroundGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [
      Color(0xFFE8EEF4),  // Light blue-grey
      Color(0xFFF5F7FA),  // Very light grey
      backgroundWhite,
    ],
    stops: [0.0, 0.4, 1.0],
  );
}

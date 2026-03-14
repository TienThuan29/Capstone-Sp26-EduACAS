import 'package:flutter/material.dart';
import 'package:mobile/core/theme/app_colors.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:mobile/features/presentation/auth/login_page.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  try {
    // Load environment variables (optional)
    await dotenv.load(fileName: ".env");
    debugPrint('Environment loaded successfully');
    debugPrint('API Base URL: ${dotenv.env['API_BASE_URL']}');
    debugPrint('Dotenv initialized: ${dotenv.isInitialized}');
  } catch (e) {
    debugPrint('Error loading .env file: $e');
    debugPrint('Continuing with dart-define or fallback values');
    // Continue with default values
  }
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Edu-ACAS',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: AppColors.primary,
          primary: AppColors.primary,
          secondary: AppColors.accent,
        ),
        scaffoldBackgroundColor: AppColors.background,
        appBarTheme: const AppBarTheme(
          backgroundColor: AppColors.primary,
          foregroundColor: Colors.white,
        ),
      ),
      home: const LoginPage(),
    );
  }
}

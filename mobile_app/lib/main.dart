import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:mobile/core/theme/app_colors.dart';
import 'package:mobile/features/services/fcm_service.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:mobile/features/presentation/auth/login_page.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Determine environment from build type:
  // - Release build type (--release) -> prod (uses .env.prod)
  // - Debug build type (--debug)    -> local (uses .env)
  final isRelease = kReleaseMode;
  final envFile = isRelease ? '.env.prod' : '.env';

  try {
    await dotenv.load(fileName: envFile);
    debugPrint('Environment loaded from: $envFile (mode: ${isRelease ? "release/prod" : "debug/local"})');
    debugPrint('API Base URL: ${dotenv.env['API_BASE_URL']}');
  } catch (e) {
    debugPrint('Error loading $envFile: $e');
  }

  try {
    await FcmService.initialize();
    debugPrint('FCM initialized successfully');
  } catch (e) {
    debugPrint('FCM initialization failed: $e');
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

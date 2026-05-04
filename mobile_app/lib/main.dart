import 'package:flutter/material.dart';
import 'package:mobile/core/theme/app_colors.dart';
import 'package:mobile/features/services/fcm_service.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:mobile/features/presentation/auth/login_page.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Load .env file
  try {
    await dotenv.load(fileName: '.env');
    debugPrint('Environment loaded from: .env');
    debugPrint('API Base URL: ${dotenv.env['API_BASE_URL']}');
  } catch (e) {
    debugPrint('Error loading .env: $e');
  }

  // Initialize Firebase BEFORE runApp() (required for background messages)
  try {
    await FcmService.initializeFirebase();
    debugPrint('Firebase core initialized');
  } catch (e) {
    debugPrint('Firebase initialization failed: $e');
  }

  runApp(const EduACASApp());
}

class EduACASApp extends StatefulWidget {
  const EduACASApp({super.key});

  @override
  State<EduACASApp> createState() => _EduACASAppState();
}

class _EduACASAppState extends State<EduACASApp> {
  @override
  void initState() {
    super.initState();
    // Initialize FCM listeners AFTER app starts - non-blocking
    _initFcm();
  }

  Future<void> _initFcm() async {
    try {
      await FcmService.initializePostRun();
    } catch (e) {
      debugPrint('FCM post-init failed: $e');
    }
  }

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

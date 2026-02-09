import 'package:flutter/foundation.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';

class ApiConfig {
  static String get baseUrl {
    final apiBaseUrl = dotenv.env['API_BASE_URL'];
    if (apiBaseUrl != null && apiBaseUrl.isNotEmpty) {
      debugPrint('Using API_BASE_URL from .env: $apiBaseUrl');
      return apiBaseUrl;
    } else {
      throw Exception('API_BASE_URL is not set in .env file');
    }
  }

  static String get loginEndpoint => '/api/auth/v1/authenticate';
  // static String get registerEndpoint => '/api/auth/v1/register';
  static String get userProfileEndpoint => '/api/auth/v1/profile';
  static String get refreshTokenEndpoint => '/api/auth/v1/refresh';

  // // Blog endpoints
  // static String get blogsEndpoint => '/api/patients/v1/blogs';

  // // Patient Report endpoints
  // static String get patientReportsEndpoint =>
  //     '/api/patients/v1/patient-reports';

  static Duration get requestTimeout {
    try {
      final timeoutSeconds =
          int.tryParse(dotenv.env['REQUEST_TIMEOUT_SECONDS'] ?? '30') ?? 30;
      return Duration(seconds: timeoutSeconds);
    } catch (e) {
      return const Duration(seconds: 30);
    }
  }

  // Headers
  static const Map<String, String> defaultHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  static bool get isDebugMode {
    try {
      return dotenv.env['DEBUG_MODE']?.toLowerCase() == 'true';
    } catch (e) {
      return true;
    }
  }
}

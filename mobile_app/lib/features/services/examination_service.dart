import 'package:mobile/core/configs/api_config.dart';
import 'package:mobile/core/network/api_network.dart';

class ExaminationService {
  static Future<Map<String, dynamic>> getAllExaminations(String token) async {
    try {
      final response = await ApiNetwork.getWithAuth(
        endpoint: ApiConfig.examinationsEndpoint,
        token: token,
      );

      return response;
    } catch (e) {
      throw Exception('Failed to get examinations: $e');
    }
  }
}

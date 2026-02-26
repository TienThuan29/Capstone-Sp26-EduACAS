import 'package:mobile/core/network/api_network.dart';
import 'package:mobile/core/storage/token_storage.dart';
import 'package:mobile/features/models/classroom/classroom_model.dart';

class ClassroomService {
  static const String _classroomsEndpoint = '/api/v1/classrooms';
  static const String _enrollEndpoint = '/api/v1/class-enrollments/enroll';

  /// Fetch paginated classrooms, passing userId so the backend fills
  /// the [enrollment.isJoining] flag for the current student.
  static Future<PagedClassrooms> getAllClassrooms({
    required String userId,
    int pageIndex = 1,
    int pageSize = 9,
  }) async {
    final token = await TokenStorage.getAccessToken();
    if (token == null || token.isEmpty) {
      throw Exception('No access token found');
    }

    final response = await ApiNetwork.getWithAuth(
      endpoint: _classroomsEndpoint,
      token: token,
      queryParameters: {
        'userId': userId,
        'pageIndex': pageIndex.toString(),
        'pageSize': pageSize.toString(),
      },
    );

    final data = response['dataResponse'];
    if (data == null) {
      return PagedClassrooms(
        items: [],
        totalCount: 0,
        pageIndex: pageIndex,
        pageSize: pageSize,
        totalPages: 0,
        hasPreviousPage: false,
        hasNextPage: false,
      );
    }

    return PagedClassrooms.fromJson(data as Map<String, dynamic>);
  }

  /// Enroll the current student into a classroom using [enrolKey].
  static Future<Map<String, dynamic>> enrollClassroom({
    required String classId,
    required String studentId,
    required String enrolKey,
  }) async {
    final token = await TokenStorage.getAccessToken();
    if (token == null || token.isEmpty) {
      throw Exception('No access token found');
    }

    final response = await ApiNetwork.postWithAuth(
      endpoint: _enrollEndpoint,
      token: token,
      body: {
        'classId': classId,
        'studentId': studentId,
        'enrolKey': enrolKey,
      },
    );

    return response;
  }
}

import '../../../core/configs/api_config.dart';
import '../../../core/network/api_network.dart';
import '../../../core/storage/token_storage.dart';
import '../models/dashboard_stats.dart';

class DashboardService {
  static Future<ClassroomDashboardData> getClassroomDashboardData(String classroomId) async {
    try {
      final token = await TokenStorage.getAccessToken();
      if (token == null) throw Exception('No token found');

      final results = await Future.wait([
        // 1. Fetch Overview stats
        ApiNetwork.getWithAuth(
          endpoint: ApiConfig.classroomDashboardStatsEndpoint,
          token: token,
          queryParameters: {'classroomId': classroomId},
        ),
        // 2. Fetch Score Distribution
        ApiNetwork.getWithAuth(
          endpoint: ApiConfig.classroomDashboardScoreDistributionEndpoint(classroomId),
          token: token,
        ),
        // 3. Fetch At-Risk Students
        ApiNetwork.getWithAuth(
          endpoint: ApiConfig.classroomDashboardAtRiskEndpoint(classroomId),
          token: token,
        ),
        // 4. Fetch Recent Warnings
        ApiNetwork.getWithAuth(
          endpoint: ApiConfig.classroomDashboardWarningsEndpoint(classroomId),
          token: token,
        ),
        // 5. Fetch Exam Statistics
        ApiNetwork.getWithAuth(
          endpoint: '/api/acas/v1/classrooms/$classroomId/dashboard/exam-statistics',
          token: token,
        ),
        // 6. Fetch Quiz Statistics
        ApiNetwork.getWithAuth(
          endpoint: '/api/acas/v1/classrooms/$classroomId/dashboard/quiz-statistics',
          token: token,
        ),
      ]);

      // Process Overview
      Map<String, dynamic> overviewMap = {};
      final statsData = results[0]['dataResponse'];
      if (statsData is List && statsData.isNotEmpty) {
        overviewMap = statsData.first;
      } else if (statsData is Map<String, dynamic>) {
        overviewMap = statsData;
      }

      return ClassroomDashboardData(
        overview: DashboardOverview.fromJson(overviewMap),
        scoreDistribution: (results[1]['dataResponse'] as List? ?? [])
            .map((e) => ScoreDistribution.fromJson(e))
            .toList(),
        atRiskStudents: (results[2]['dataResponse'] as List? ?? [])
            .map((e) => AtRiskStudent.fromJson(e))
            .toList(),
        recentWarnings: (results[3]['dataResponse'] as List? ?? [])
            .map((e) => RecentWarning.fromJson(e))
            .toList(),
        examStatistics: (results[4]['dataResponse'] as List? ?? [])
            .map((e) => ExamScoreStatistics.fromJson(e))
            .toList(),
        quizStatistics: (results[5]['dataResponse'] as List? ?? [])
            .map((e) => QuizScoreStatistics.fromJson(e))
            .toList(),
      );
    } catch (e) {
      throw 'Failed to load dashboard: $e';
    }
  }
}

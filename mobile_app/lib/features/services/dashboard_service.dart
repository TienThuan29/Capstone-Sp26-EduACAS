import 'package:flutter/foundation.dart';
import '../../../core/configs/api_config.dart';
import '../../../core/network/api_network.dart';
import '../../../core/storage/token_storage.dart';
import '../models/dashboard_stats.dart';

class DashboardService {
  static Future<ClassroomDashboardData> getClassroomDashboardData(String classroomId) async {
    final token = await TokenStorage.getAccessToken();
    if (token == null) throw Exception('No token found');

    DashboardOverview overview = DashboardOverview.empty();
    List<ScoreDistribution> scoreDistribution = [];
    List<AtRiskStudent> atRiskStudents = [];
    List<RecentWarning> recentWarnings = [];
    List<ExamScoreStatistics> examStatistics = [];
    List<QuizScoreStatistics> quizStatistics = [];

    await Future.wait([
      _fetchOverview(token, classroomId).then((v) => overview = v).catchError((e) {
        debugPrint('Failed to fetch overview: $e');
        return DashboardOverview.empty();
      }),
      _fetchScoreDistribution(token, classroomId).then((v) => scoreDistribution = v).catchError((e) {
        debugPrint('Failed to fetch score distribution: $e');
        return <ScoreDistribution>[];
      }),
      _fetchAtRiskStudents(token, classroomId).then((v) => atRiskStudents = v).catchError((e) {
        debugPrint('Failed to fetch at-risk students: $e');
        return <AtRiskStudent>[];
      }),
      _fetchRecentWarnings(token, classroomId).then((v) => recentWarnings = v).catchError((e) {
        debugPrint('Failed to fetch recent warnings: $e');
        return <RecentWarning>[];
      }),
      _fetchExamStatistics(token, classroomId).then((v) => examStatistics = v).catchError((e) {
        debugPrint('Failed to fetch exam statistics: $e');
        return <ExamScoreStatistics>[];
      }),
      _fetchQuizStatistics(token, classroomId).then((v) => quizStatistics = v).catchError((e) {
        debugPrint('Failed to fetch quiz statistics: $e');
        return <QuizScoreStatistics>[];
      }),
    ]);

    return ClassroomDashboardData(
      overview: overview,
      scoreDistribution: scoreDistribution,
      atRiskStudents: atRiskStudents,
      recentWarnings: recentWarnings,
      examStatistics: examStatistics,
      quizStatistics: quizStatistics,
    );
  }

  static Future<DashboardOverview> _fetchOverview(String token, String classroomId) async {
    final res = await ApiNetwork.getWithAuth(
      endpoint: ApiConfig.classroomDashboardStatsEndpoint,
      token: token,
      queryParameters: {'classroomId': classroomId},
    );
    Map<String, dynamic> overviewMap = {};
    final statsData = res['dataResponse'];
    if (statsData is List && statsData.isNotEmpty) {
      overviewMap = statsData.first;
    } else if (statsData is Map<String, dynamic>) {
      overviewMap = statsData;
    }
    return DashboardOverview.fromJson(overviewMap);
  }

  static Future<List<ScoreDistribution>> _fetchScoreDistribution(String token, String classroomId) async {
    final res = await ApiNetwork.getWithAuth(
      endpoint: ApiConfig.classroomDashboardScoreDistributionEndpoint(classroomId),
      token: token,
    );
    return (res['dataResponse'] as List? ?? [])
        .map((e) => ScoreDistribution.fromJson(e))
        .toList();
  }

  static Future<List<AtRiskStudent>> _fetchAtRiskStudents(String token, String classroomId) async {
    final res = await ApiNetwork.getWithAuth(
      endpoint: ApiConfig.classroomDashboardAtRiskEndpoint(classroomId),
      token: token,
    );
    return (res['dataResponse'] as List? ?? [])
        .map((e) => AtRiskStudent.fromJson(e))
        .toList();
  }

  static Future<List<RecentWarning>> _fetchRecentWarnings(String token, String classroomId) async {
    final res = await ApiNetwork.getWithAuth(
      endpoint: ApiConfig.classroomDashboardWarningsEndpoint(classroomId),
      token: token,
    );
    return (res['dataResponse'] as List? ?? [])
        .map((e) => RecentWarning.fromJson(e))
        .toList();
  }

  static Future<List<ExamScoreStatistics>> _fetchExamStatistics(String token, String classroomId) async {
    final res = await ApiNetwork.getWithAuth(
      endpoint: '/api/acas/v1/classrooms/$classroomId/dashboard/exam-statistics',
      token: token,
    );
    return (res['dataResponse'] as List? ?? [])
        .map((e) => ExamScoreStatistics.fromJson(e))
        .toList();
  }

  static Future<List<QuizScoreStatistics>> _fetchQuizStatistics(String token, String classroomId) async {
    final res = await ApiNetwork.getWithAuth(
      endpoint: '/api/acas/v1/classrooms/$classroomId/dashboard/quiz-statistics',
      token: token,
    );
    return (res['dataResponse'] as List? ?? [])
        .map((e) => QuizScoreStatistics.fromJson(e))
        .toList();
  }
}

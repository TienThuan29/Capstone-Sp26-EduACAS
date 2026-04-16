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
  static String get registerDeviceTokenEndpoint =>
      '/api/acas/v1/device-token/register';
  static String get myAnnouncementsEndpoint => '/api/acas/v1/notifications/my';
  static String get examinationsEndpoint => '/api/acas/v1/examinations';

  // Classroom endpoints
  static String lecturerClassroomsEndpoint(String lecturerId) =>
      '/api/acas/v1/classrooms/lecturer/$lecturerId';
  static String studentClassroomsEndpoint(String studentId) =>
      '/api/acas/v1/classrooms/student/$studentId';
  static String classroomByIdEndpoint(String id) =>
      '/api/acas/v1/classrooms/$id';

  // Material endpoints
  static String materialsByClassroomEndpoint(String classroomId) =>
      '/api/acas/v1/materials/classroom/$classroomId';
  static String get createMaterialEndpoint => '/api/acas/v1/materials';
  static String deleteMaterialEndpoint(String id) =>
      '/api/acas/v1/materials/$id';

  // Examination endpoints
  static String examinationsByClassEndpoint(String classId) =>
      '/api/acas/v1/examinations/by-class/$classId';
  static String examinationByIdEndpoint(String id) =>
      '/api/acas/v1/examinations/$id';

    // Quiz endpoints
    static String quizzesByIdEndpoint(String id) => '/api/acas/v1/quizzes/$id';
    static String get classroomQuizzesEndpoint => '/api/acas/v1/classroom-quizzes';
    static String classroomQuizzesByClassroomEndpoint(String classroomId) =>
      '/api/acas/v1/classroom-quizzes/classroom/$classroomId';
    static String classroomQuizByIdEndpoint(String id) =>
      '/api/acas/v1/classroom-quizzes/$id';
    static String get createClassroomQuizEndpoint => '/api/acas/v1/classroom-quizzes';
    static String updateClassroomQuizEndpoint(String id) =>
      '/api/acas/v1/classroom-quizzes/$id';
    static String softDeleteClassroomQuizEndpoint(String id) =>
      '/api/acas/v1/classroom-quizzes/$id/soft-delete';
    static String quizAttemptStartEndpoint() => '/api/acas/v1/quiz-attempts/start';
    static String quizAttemptAnswerEndpoint(String attemptId) =>
      '/api/acas/v1/quiz-attempts/$attemptId/answers';
    static String quizAttemptSubmitEndpoint(String attemptId) =>
      '/api/acas/v1/quiz-attempts/$attemptId/submit';
    static String quizAttemptByIdEndpoint(String attemptId) =>
      '/api/acas/v1/quiz-attempts/$attemptId';
    static String quizAttemptsByStudentEndpoint(String studentId) =>
      '/api/acas/v1/quiz-attempts/student/$studentId';
    static String submissionsByStudentEndpoint(String studentId) =>
      '/api/acas/v1/submissions/student/$studentId';
    static String quizSubmissionsPagedEndpoint({
      required String classroomQuizId,
      int pageIndex = 1,
      int pageSize = 10,
    }) =>
      '/api/acas/v1/quiz-attempts/submissions/classroom-quiz/$classroomQuizId?pageIndex=$pageIndex&pageSize=$pageSize';
    static String studentAnswersByAttemptEndpoint(String attemptId) =>
      '/api/acas/v1/student-answers/attempt/$attemptId';

  // S3 endpoints
  static String privateFileUrlEndpoint(String filename) =>
      '/api/acas/v1/private-s3/file/${Uri.encodeComponent(filename)}';

  // Discussion Issue endpoints (matches web app)
  static String get discussionIssuesBaseEndpoint =>
      '/api/acas/v1/discussion-issues';
  static String discussionIssueByIdEndpoint(String id) =>
      '/api/acas/v1/discussion-issues/$id';
  static String get discussionIssueCountEndpoint =>
      '/api/acas/v1/discussion-issues/count';
  static String changeDiscussionStatusEndpoint(String id) =>
      '/api/acas/v1/discussion-issues/$id/status';
  static String softDeleteDiscussionIssueEndpoint(String id) =>
      '/api/acas/v1/discussion-issues/$id/soft-delete';

  // Comment endpoints (nested under discussion-issues, matches web app)
  static String get writeCommentEndpoint =>
      '/api/acas/v1/discussion-issues/comments';
  static String get replyCommentEndpoint =>
      '/api/acas/v1/discussion-issues/comments/reply';
  static String get upvoteCommentEndpoint =>
      '/api/acas/v1/discussion-issues/comments/upvote';

  // Problem endpoints
  static String problemsByLecturerEndpoint(String lecturerId) =>
      '/api/acas/v1/problems/lecturer/$lecturerId';
  static String problemByIdEndpoint(String id) =>
      '/api/acas/v1/problems/$id';

    // Subject endpoints
    static String get subjectsEndpoint => '/api/acas/v1/subjects';

    // Question endpoints
    static String get questionsEndpoint => '/api/acas/v1/questions';
    static String get questionsPagedEndpoint => '/api/acas/v1/questions/paged';
    static String questionByIdEndpoint(String id) => '/api/acas/v1/questions/$id';
    static String softDeleteQuestionEndpoint(String id) =>
      '/api/acas/v1/questions/$id/soft-delete';
    static String restoreQuestionEndpoint(String id) =>
      '/api/acas/v1/questions/$id/restore';

    // Quiz endpoints
    static String get quizzesEndpoint => '/api/acas/v1/quizzes';
    static String get quizzesPagedEndpoint => '/api/acas/v1/quizzes/paged';
    static String quizByIdEndpoint(String id) => '/api/acas/v1/quizzes/$id';
    static String assignQuizQuestionsEndpoint(String id) =>
      '/api/acas/v1/quizzes/$id/questions';
    static String softDeleteQuizEndpoint(String id) =>
      '/api/acas/v1/quizzes/$id/soft-delete';
    static String restoreQuizEndpoint(String id) => '/api/acas/v1/quizzes/$id/restore';

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

class ClassroomQuiz {
  final String id;
  final String classroomId;
  final String quizId;
  final DateTime startTime;
  final DateTime endTime;
  final int maxOfAttempts;
  final String? passcode;
  final String status;

  ClassroomQuiz({
    required this.id,
    required this.classroomId,
    required this.quizId,
    required this.startTime,
    required this.endTime,
    required this.maxOfAttempts,
    required this.passcode,
    required this.status,
  });

  factory ClassroomQuiz.fromJson(Map<String, dynamic> json) {
    return ClassroomQuiz(
      id: json['id'] ?? '',
      classroomId: json['classroomId'] ?? '',
      quizId: json['quizId'] ?? '',
      startTime: DateTime.tryParse(json['startTime'] ?? '')?.toUtc() ?? DateTime.now().toUtc(),
      endTime: DateTime.tryParse(json['endTime'] ?? '')?.toUtc() ?? DateTime.now().toUtc(),
      maxOfAttempts: (json['maxOfAttempts'] as num?)?.toInt() ?? 1,
      passcode: json['passcode'],
      status: (json['status'] ?? '').toString(),
    );
  }
}

class QuizDetail {
  final String id;
  final String title;
  final int duration;
  final int totalQuestions;
  final List<QuizQuestionRef> questions;

  QuizDetail({
    required this.id,
    required this.title,
    required this.duration,
    required this.totalQuestions,
    required this.questions,
  });

  factory QuizDetail.fromJson(Map<String, dynamic> json) {
    return QuizDetail(
      id: json['id'] ?? '',
      title: json['title'] ?? '',
        duration: (json['duration'] as num?)?.toInt() ?? 0,
        totalQuestions: (json['totalQuestions'] as num?)?.toInt() ?? 0,
      questions: (json['questions'] as List<dynamic>? ?? [])
          .map((e) => QuizQuestionRef.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }
}

class QuizQuestionRef {
  final String questionId;
  final double marks;
  final int displayOrder;

  QuizQuestionRef({
    required this.questionId,
    required this.marks,
    required this.displayOrder,
  });

  factory QuizQuestionRef.fromJson(Map<String, dynamic> json) {
    return QuizQuestionRef(
      questionId: json['questionId'] ?? '',
      marks: (json['marks'] ?? 0).toDouble(),
      displayOrder: (json['displayOrder'] as num?)?.toInt() ?? 0,
    );
  }
}

class QuestionDetail {
  final String id;
  final String content;
  final String type;
  final List<AnswerOptionDetail> answerOptions;

  QuestionDetail({
    required this.id,
    required this.content,
    required this.type,
    required this.answerOptions,
  });

  factory QuestionDetail.fromJson(Map<String, dynamic> json) {
    return QuestionDetail(
      id: json['id'] ?? '',
      content: json['content'] ?? '',
      type: (json['type'] ?? '').toString(),
      answerOptions: (json['answerOptions'] as List<dynamic>? ?? [])
          .map((e) => AnswerOptionDetail.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }
}

class AnswerOptionDetail {
  final String id;
  final String content;
  final bool isCorrect;

  AnswerOptionDetail({
    required this.id,
    required this.content,
    required this.isCorrect,
  });

  factory AnswerOptionDetail.fromJson(Map<String, dynamic> json) {
    return AnswerOptionDetail(
      id: json['id'] ?? '',
      content: json['content'] ?? '',
      isCorrect: json['isCorrect'] == true,
    );
  }
}

class QuizAttemptInfo {
  final String id;
  final String classroomQuizId;
  final String studentId;
  final DateTime startTime;
  final DateTime? endTime;
  final String status;
  final double? finalScore;
  final int attemptNumber;

  QuizAttemptInfo({
    required this.id,
    required this.classroomQuizId,
    required this.studentId,
    required this.startTime,
    required this.endTime,
    required this.status,
    required this.finalScore,
    required this.attemptNumber,
  });

  factory QuizAttemptInfo.fromJson(Map<String, dynamic> json) {
    return QuizAttemptInfo(
      id: json['id'] ?? '',
      classroomQuizId: json['classroomQuizId'] ?? '',
      studentId: json['studentId'] ?? '',
      startTime: DateTime.tryParse(json['startTime'] ?? '')?.toUtc() ?? DateTime.now().toUtc(),
      endTime: DateTime.tryParse((json['endTime'] ?? '').toString())?.toUtc(),
      status: (json['status'] ?? '').toString(),
      finalScore: (json['finalScore'] as num?)?.toDouble(),
      attemptNumber: (json['attemptNumber'] as num?)?.toInt() ?? 1,
    );
  }

  Duration get duration {
    if (endTime == null) return Duration.zero;
    return endTime!.difference(startTime);
  }
}

class StudentAnswerInfo {
  final String id;
  final String attemptId;
  final String questionId;
  final String? answerOptionId;
  final String? textAnswer;
  final bool isCorrect;

  StudentAnswerInfo({
    required this.id,
    required this.attemptId,
    required this.questionId,
    required this.answerOptionId,
    required this.textAnswer,
    required this.isCorrect,
  });

  factory StudentAnswerInfo.fromJson(Map<String, dynamic> json) {
    return StudentAnswerInfo(
      id: json['id'] ?? '',
      attemptId: json['attemptId'] ?? '',
      questionId: json['questionId'] ?? '',
      answerOptionId: json['answerOptionId'],
      textAnswer: json['textAnswer'],
      isCorrect: json['isCorrect'] == true,
    );
  }
}

class PagedQuizSubmissionResult {
  final List<QuizSubmissionInfo> items;
  final int totalCount;
  final int pageIndex;
  final int pageSize;
  final int totalPages;

  const PagedQuizSubmissionResult({
    required this.items,
    required this.totalCount,
    required this.pageIndex,
    required this.pageSize,
    required this.totalPages,
  });
}

class QuizSubmissionInfo {
  final String id;
  final String classroomQuizId;
  final String studentId;
  final String? studentName;
  final String? studentEmail;
  final DateTime startTime;
  final DateTime? endTime;
  final String status;
  final double? score;
  final int attemptNumber;

  const QuizSubmissionInfo({
    required this.id,
    required this.classroomQuizId,
    required this.studentId,
    required this.studentName,
    required this.studentEmail,
    required this.startTime,
    required this.endTime,
    required this.status,
    required this.score,
    required this.attemptNumber,
  });

  factory QuizSubmissionInfo.fromJson(Map<String, dynamic> json) {
    return QuizSubmissionInfo(
      id: (json['id'] ?? '').toString(),
      classroomQuizId: (json['classroomQuizId'] ?? '').toString(),
      studentId: (json['studentId'] ?? '').toString(),
      studentName: json['studentName']?.toString(),
      studentEmail: json['studentEmail']?.toString(),
      startTime: DateTime.tryParse((json['startTime'] ?? '').toString())?.toUtc() ?? DateTime.now().toUtc(),
      endTime: DateTime.tryParse((json['endTime'] ?? '').toString())?.toUtc(),
      status: (json['status'] ?? '').toString(),
      score: (json['score'] as num?)?.toDouble() ?? (json['finalScore'] as num?)?.toDouble(),
      attemptNumber: (json['attemptNumber'] as num?)?.toInt() ?? 1,
    );
  }
}

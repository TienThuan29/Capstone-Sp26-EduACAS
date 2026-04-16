class QuizQuestion {
  final String quizId;
  final String questionId;
  final double marks;
  final int displayOrder;

  QuizQuestion({
    required this.quizId,
    required this.questionId,
    required this.marks,
    required this.displayOrder,
  });

  factory QuizQuestion.fromJson(Map<String, dynamic> json) {
    return QuizQuestion(
      quizId: json['quizId'] ?? '',
      questionId: json['questionId'] ?? '',
      marks: (json['marks'] ?? 0).toDouble(),
      displayOrder: json['displayOrder'] ?? 0,
    );
  }
}

class Quiz {
  final String id;
  final String subjectId;
  final String title;
  final int duration;
  final int totalQuestions;
  final bool isDeleted;
  final String createdBy;
  final List<QuizQuestion> questions;

  Quiz({
    required this.id,
    required this.subjectId,
    required this.title,
    required this.duration,
    required this.totalQuestions,
    required this.isDeleted,
    required this.createdBy,
    required this.questions,
  });

  factory Quiz.fromJson(Map<String, dynamic> json) {
    final questionItems = (json['questions'] as List<dynamic>? ?? [])
        .map((item) => QuizQuestion.fromJson(item as Map<String, dynamic>))
        .toList();

    return Quiz(
      id: json['id'] ?? '',
      subjectId: json['subjectId'] ?? '',
      title: json['title'] ?? '',
      duration: json['duration'] ?? 0,
      totalQuestions: json['totalQuestions'] ?? 0,
      isDeleted: json['isDeleted'] == true,
      createdBy: json['createdBy'] ?? '',
      questions: questionItems,
    );
  }
}

class AssignQuizQuestionPayload {
  final String questionId;
  final double marks;
  final int displayOrder;

  AssignQuizQuestionPayload({
    required this.questionId,
    required this.marks,
    required this.displayOrder,
  });

  Map<String, dynamic> toJson() {
    return {
      'questionId': questionId,
      'marks': marks,
      'displayOrder': displayOrder,
    };
  }
}

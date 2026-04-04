enum QuestionType { singleChoice, multipleChoice, essay }

QuestionType questionTypeFromValue(dynamic value) {
  final normalized = (value ?? '').toString().toUpperCase();
  switch (normalized) {
    case 'SINGLE_CHOICE':
      return QuestionType.singleChoice;
    case 'MULTIPLE_CHOICE':
      return QuestionType.multipleChoice;
    case 'ESSAY':
      return QuestionType.essay;
    default:
      return QuestionType.singleChoice;
  }
}

String questionTypeToApiValue(QuestionType type) {
  switch (type) {
    case QuestionType.singleChoice:
      return 'SINGLE_CHOICE';
    case QuestionType.multipleChoice:
      return 'MULTIPLE_CHOICE';
    case QuestionType.essay:
      return 'ESSAY';
  }
}

String questionTypeLabel(QuestionType type) {
  switch (type) {
    case QuestionType.singleChoice:
      return 'Single choice';
    case QuestionType.multipleChoice:
      return 'Multiple choice';
    case QuestionType.essay:
      return 'Essay';
  }
}

class AnswerOption {
  final String id;
  final String questionId;
  final String content;
  final bool isCorrect;

  AnswerOption({
    required this.id,
    required this.questionId,
    required this.content,
    required this.isCorrect,
  });

  factory AnswerOption.fromJson(Map<String, dynamic> json) {
    return AnswerOption(
      id: json['id'] ?? '',
      questionId: json['questionId'] ?? '',
      content: json['content'] ?? '',
      isCorrect: json['isCorrect'] == true,
    );
  }

  Map<String, dynamic> toCreateJson() {
    return {
      'content': content,
      'isCorrect': isCorrect,
    };
  }
}

class Question {
  final String id;
  final String content;
  final String? imageUrl;
  final QuestionType type;
  final String? textAnswer;
  final bool isDeleted;
  final String createdBy;
  final List<AnswerOption> answerOptions;

  Question({
    required this.id,
    required this.content,
    this.imageUrl,
    required this.type,
    this.textAnswer,
    required this.isDeleted,
    required this.createdBy,
    required this.answerOptions,
  });

  factory Question.fromJson(Map<String, dynamic> json) {
    final options = (json['answerOptions'] as List<dynamic>? ?? [])
        .map((item) => AnswerOption.fromJson(item as Map<String, dynamic>))
        .toList();

    return Question(
      id: json['id'] ?? '',
      content: json['content'] ?? '',
      imageUrl: json['imageUrl'],
      type: questionTypeFromValue(json['type']),
      textAnswer: json['textAnswer'],
      isDeleted: json['isDeleted'] == true,
      createdBy: json['createdBy'] ?? '',
      answerOptions: options,
    );
  }
}

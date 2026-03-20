/// Difficulty level — matches backend enum (0=EASY, 1=MEDIUM, 2=HARD).
enum Difficulty { easy, medium, hard }

Difficulty difficultyFromValue(dynamic value) {
  if (value is int) {
    switch (value) {
      case 0:
        return Difficulty.easy;
      case 1:
        return Difficulty.medium;
      case 2:
        return Difficulty.hard;
      default:
        return Difficulty.easy;
    }
  }
  if (value is String) {
    switch (value.toUpperCase()) {
      case 'EASY':
        return Difficulty.easy;
      case 'MEDIUM':
        return Difficulty.medium;
      case 'HARD':
        return Difficulty.hard;
      default:
        return Difficulty.easy;
    }
  }
  return Difficulty.easy;
}

String difficultyLabel(Difficulty d) {
  switch (d) {
    case Difficulty.easy:
      return 'EASY';
    case Difficulty.medium:
      return 'MEDIUM';
    case Difficulty.hard:
      return 'HARD';
  }
}

/// Lightweight model returned by the list endpoint.
class ProblemBasic {
  final String id;
  final String title;
  final Difficulty difficulty;
  final String createdDate;

  ProblemBasic({
    required this.id,
    required this.title,
    required this.difficulty,
    required this.createdDate,
  });

  factory ProblemBasic.fromJson(Map<String, dynamic> json) {
    return ProblemBasic(
      id: json['id'] ?? '',
      title: json['title'] ?? '',
      difficulty: difficultyFromValue(json['difficulty']),
      createdDate: json['createdDate'] ?? '',
    );
  }
}

/// A single test case belonging to a problem.
class TestCase {
  final String id;
  final String inputData;
  final String expectedOutput;
  final bool isPublic;
  final bool isCaseInsensitive;
  final bool isRemovedSpace;

  TestCase({
    required this.id,
    required this.inputData,
    required this.expectedOutput,
    required this.isPublic,
    required this.isCaseInsensitive,
    required this.isRemovedSpace,
  });

  factory TestCase.fromJson(Map<String, dynamic> json) {
    return TestCase(
      id: json['id'] ?? '',
      inputData: json['inputData'] ?? '',
      expectedOutput: json['expectedOutput'] ?? '',
      isPublic: json['isPublic'] == true,
      isCaseInsensitive: json['isCaseInsensitive'] == true,
      isRemovedSpace: json['isRemovedSpace'] == true,
    );
  }
}

/// Full problem model returned by the detail endpoint.
class Problem {
  final String id;
  final String lecturerId;
  final String title;
  final String content;
  final String fileName;
  final String? fileUrl;
  final Difficulty difficulty;
  final String codeTemplate;
  final List<TestCase> testCases;
  final String createdDate;
  final String updatedDate;

  Problem({
    required this.id,
    required this.lecturerId,
    required this.title,
    required this.content,
    required this.fileName,
    this.fileUrl,
    required this.difficulty,
    required this.codeTemplate,
    required this.testCases,
    required this.createdDate,
    required this.updatedDate,
  });

  factory Problem.fromJson(Map<String, dynamic> json) {
    final List<dynamic> tcList = json['testCases'] ?? [];
    return Problem(
      id: json['id'] ?? '',
      lecturerId: json['lecturerId'] ?? '',
      title: json['title'] ?? '',
      content: json['content'] ?? '',
      fileName: json['fileName'] ?? '',
      fileUrl: json['fileUrl'],
      difficulty: difficultyFromValue(json['difficulty']),
      codeTemplate: json['codeTemplate'] ?? '',
      testCases: tcList
          .map((e) => TestCase.fromJson(e as Map<String, dynamic>))
          .toList(),
      createdDate: json['createdDate'] ?? '',
      updatedDate: json['updatedDate'] ?? '',
    );
  }
}

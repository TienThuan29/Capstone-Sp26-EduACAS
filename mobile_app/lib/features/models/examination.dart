import 'classroom.dart';

class ProgrammingLanguage {
  final String id;
  final String name;
  final String? monaco;
  final List<String> extensions;
  final String? logoUrl;
  final String? formatter;
  final String? digitSeparator;
  final List<Compiler> compilers;
  final bool isEnabled;

  ProgrammingLanguage({
    required this.id,
    required this.name,
    this.monaco,
    required this.extensions,
    this.logoUrl,
    this.formatter,
    this.digitSeparator,
    required this.compilers,
    required this.isEnabled,
  });

  factory ProgrammingLanguage.fromJson(Map<String, dynamic> json) {
    return ProgrammingLanguage(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      monaco: json['monaco'] ?? json['monacoLanguage'],
      extensions: List<String>.from(json['extensions'] ?? []),
      logoUrl: json['logoUrl'] ?? json['logoFileUrl'],
      formatter: json['formatter'],
      digitSeparator: json['digitSeparator'],
      compilers: (json['compilers'] as List? ?? [])
          .map((i) => Compiler.fromJson(i))
          .toList(),
      isEnabled: json['isEnabled'] ?? (json['status'] == 'ACTIVE'),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'monaco': monaco,
      'extensions': extensions,
      'logoUrl': logoUrl,
      'formatter': formatter,
      'digitSeparator': digitSeparator,
      'compilers': compilers.map((e) => e.toJson()).toList(),
      'isEnabled': isEnabled,
    };
  }
}

class Compiler {
  final String id;
  final String name;
  final String group;
  final List<String> stdVersions;

  Compiler({
    required this.id,
    required this.name,
    required this.group,
    required this.stdVersions,
  });

  factory Compiler.fromJson(Map<String, dynamic> json) {
    return Compiler(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      group: json['group'] ?? '',
      stdVersions: List<String>.from(json['stdVersions'] ?? []),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'group': group,
      'stdVersions': stdVersions,
    };
  }
}

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
      isPublic: json['isPublic'] ?? false,
      isCaseInsensitive: json['isCaseInsensitive'] ?? false,
      isRemovedSpace: json['isRemovedSpace'] ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'inputData': inputData,
      'expectedOutput': expectedOutput,
      'isPublic': isPublic,
      'isCaseInsensitive': isCaseInsensitive,
      'isRemovedSpace': isRemovedSpace,
    };
  }
}

class Problem {
  final String id;
  final String examId;
  final String lecturerId;
  final String title;
  final String content;
  final String? fileName;
  final int difficulty;
  final String? codeTemplate;
  final List<TestCase> testCases;
  final String createdDate;
  final String updatedDate;

  Problem({
    required this.id,
    required this.examId,
    required this.lecturerId,
    required this.title,
    required this.content,
    this.fileName,
    required this.difficulty,
    this.codeTemplate,
    required this.testCases,
    required this.createdDate,
    required this.updatedDate,
  });

  factory Problem.fromJson(Map<String, dynamic> json) {
    return Problem(
      id: json['id'] ?? '',
      examId: json['examId'] ?? '',
      lecturerId: json['lecturerId'] ?? '',
      title: json['title'] ?? '',
      content: json['content'] ?? '',
      fileName: json['fileName'],
      difficulty: json['difficulty'] ?? 0,
      codeTemplate: json['codeTemplate'],
      testCases: (json['testCases'] as List<dynamic>?)
              ?.map((e) => TestCase.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      createdDate: json['createdDate'] ?? '',
      updatedDate: json['updatedDate'] ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'examId': examId,
      'lecturerId': lecturerId,
      'title': title,
      'content': content,
      'fileName': fileName,
      'difficulty': difficulty,
      'codeTemplate': codeTemplate,
      'testCases': testCases.map((e) => e.toJson()).toList(),
      'createdDate': createdDate,
      'updatedDate': updatedDate,
    };
  }
}

class ExamProblem {
  final String problemId;
  final double mark;

  ExamProblem({
    required this.problemId,
    required this.mark,
  });

  factory ExamProblem.fromJson(Map<String, dynamic> json) {
    return ExamProblem(
      problemId: json['problemId'] ?? '',
      mark: (json['mark'] ?? 0).toDouble(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'problemId': problemId,
      'mark': mark,
    };
  }
}

enum ExaminationMode {
  practical(0),
  examination(1);

  final int value;
  const ExaminationMode(this.value);

  static ExaminationMode fromValue(int value) {
    return ExaminationMode.values.firstWhere(
      (mode) => mode.value == value,
      orElse: () => ExaminationMode.practical,
    );
  }
}

enum ExaminationStatus {
  pending(0),
  ongoing(1),
  completed(2);

  final int value;
  const ExaminationStatus(this.value);

  static ExaminationStatus fromValue(int value) {
    return ExaminationStatus.values.firstWhere(
      (status) => status.value == value,
      orElse: () => ExaminationStatus.pending,
    );
  }
}

class Examination {
  final String id;
  final String examName;
  final ProgrammingLanguage programmingLanguage;
  final List<ExamProblem> examProblems;
  final List<Problem> problems;
  final ClassroomLite classroom;
  final String startDatetime;
  final String endDatetime;
  final String description;
  final bool isPublicResult;
  final double totalMark;
  final ExaminationStatus status;
  final ExaminationMode mode;
  final bool isDeleted;
  final String createdDate;
  final String updatedDate;

  Examination({
    required this.id,
    required this.examName,
    required this.programmingLanguage,
    required this.examProblems,
    required this.problems,
    required this.classroom,
    required this.startDatetime,
    required this.endDatetime,
    required this.description,
    required this.isPublicResult,
    required this.totalMark,
    required this.status,
    required this.mode,
    required this.isDeleted,
    required this.createdDate,
    required this.updatedDate,
  });

  factory Examination.fromJson(Map<String, dynamic> json) {
    return Examination(
      id: json['id'] ?? '',
      examName: json['examName'] ?? '',
      programmingLanguage: ProgrammingLanguage.fromJson(
        json['programmingLanguage'] ?? {},
      ),
      examProblems: (json['examProblems'] as List<dynamic>?)
              ?.map((e) => ExamProblem.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      problems: (json['problems'] as List<dynamic>?)
              ?.map((e) => Problem.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      classroom: ClassroomLite.fromJson(json['classroom'] ?? {}),
      startDatetime: json['startDatetime'] ?? '',
      endDatetime: json['endDatetime'] ?? '',
      description: json['description'] ?? '',
      isPublicResult: json['isPublicResult'] ?? false,
      totalMark: (json['totalMark'] ?? 0).toDouble(),
      status: ExaminationStatus.fromValue(json['status'] ?? 0),
      mode: ExaminationMode.fromValue(json['mode'] ?? 0),
      isDeleted: json['isDeleted'] ?? false,
      createdDate: json['createdDate'] ?? '',
      updatedDate: json['updatedDate'] ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'examName': examName,
      'programmingLanguage': programmingLanguage.toJson(),
      'examProblems': examProblems.map((e) => e.toJson()).toList(),
      'problems': problems.map((e) => e.toJson()).toList(),
      'classroom': classroom.toJson(),
      'startDatetime': startDatetime,
      'endDatetime': endDatetime,
      'description': description,
      'isPublicResult': isPublicResult,
      'totalMark': totalMark,
      'status': status.value,
      'mode': mode.value,
      'isDeleted': isDeleted,
      'createdDate': createdDate,
      'updatedDate': updatedDate,
    };
  }

  String getModeText() {
    return mode == ExaminationMode.practical ? 'Practical' : 'Examination';
  }

  String getStatusText() {
    switch (status) {
      case ExaminationStatus.pending:
        return 'Pending';
      case ExaminationStatus.ongoing:
        return 'Ongoing';
      case ExaminationStatus.completed:
        return 'Completed';
    }
  }
}

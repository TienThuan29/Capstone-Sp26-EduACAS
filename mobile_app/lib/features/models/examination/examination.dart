class Examination {
  final String id;
  final String examName;
  final ProgrammingLanguage programmingLanguage;
  final List<ExamProblem> examProblems;
  final ClassroomMini classroom;
  final String startDatetime;
  final String endDatetime;
  final String description;
  final bool isPublicResult;
  final int totalMark;
  final int status;
  final int mode;
  final bool isDeleted;
  final String createdDate;
  final String updatedDate;

  Examination({
    required this.id,
    required this.examName,
    required this.programmingLanguage,
    required this.examProblems,
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
      programmingLanguage: ProgrammingLanguage.fromJson(json['programmingLanguage'] ?? {}),
      examProblems: (json['examProblems'] as List? ?? [])
          .map((i) => ExamProblem.fromJson(i))
          .toList(),
      classroom: ClassroomMini.fromJson(json['classroom'] ?? {}),
      startDatetime: json['startDatetime'] ?? '',
      endDatetime: json['endDatetime'] ?? '',
      description: json['description'] ?? '',
      isPublicResult: json['isPublicResult'] ?? false,
      totalMark: json['totalMark'] ?? 0,
      status: json['status'] ?? 0,
      mode: json['mode'] ?? 0,
      isDeleted: json['isDeleted'] ?? false,
      createdDate: json['createdDate'] ?? '',
      updatedDate: json['updatedDate'] ?? '',
    );
  }
}

class ProgrammingLanguage {
  final String id;
  final String name;
  final String monaco;
  final List<String> extensions;
  final String logoFileUrl;
  final String formatter;
  final String digitSeparator;
  final List<Compiler> compilers;
  final String status;
  final String createdDate;
  final String updatedDate;

  ProgrammingLanguage({
    required this.id,
    required this.name,
    required this.monaco,
    required this.extensions,
    required this.logoFileUrl,
    required this.formatter,
    required this.digitSeparator,
    required this.compilers,
    required this.status,
    required this.createdDate,
    required this.updatedDate,
  });

  factory ProgrammingLanguage.fromJson(Map<String, dynamic> json) {
    return ProgrammingLanguage(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      monaco: json['monaco'] ?? '',
      extensions: List<String>.from(json['extensions'] ?? []),
      logoFileUrl: json['logoFileUrl'] ?? '',
      formatter: json['formatter'] ?? '',
      digitSeparator: json['digitSeparator'] ?? '',
      compilers: (json['compilers'] as List? ?? [])
          .map((i) => Compiler.fromJson(i))
          .toList(),
      status: json['status'] ?? '',
      createdDate: json['createdDate'] ?? '',
      updatedDate: json['updatedDate'] ?? '',
    );
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
}

class ExamProblem {
  final String problemId;
  final int mark;

  ExamProblem({
    required this.problemId,
    required this.mark,
  });

  factory ExamProblem.fromJson(Map<String, dynamic> json) {
    return ExamProblem(
      problemId: json['problemId'] ?? '',
      mark: json['mark'] ?? 0,
    );
  }
}

class ClassroomMini {
  final String id;
  final String className;

  ClassroomMini({
    required this.id,
    required this.className,
  });

  factory ClassroomMini.fromJson(Map<String, dynamic> json) {
    return ClassroomMini(
      id: json['id'] ?? '',
      className: json['className'] ?? '',
    );
  }
}

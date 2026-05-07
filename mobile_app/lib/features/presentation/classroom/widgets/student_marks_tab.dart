import 'package:flutter/material.dart';
import 'package:mobile/core/storage/token_storage.dart';
import 'package:mobile/core/theme/app_colors.dart';
import 'package:mobile/core/widgets/background.dart';
import 'package:mobile/core/configs/api_config.dart';
import 'package:mobile/features/models/examination.dart';
import 'package:mobile/features/models/quiz_practice.dart';
import 'package:mobile/features/models/submission.dart';
import 'package:mobile/core/network/api_network.dart';
import 'package:mobile/features/services/problem_service.dart';
import 'package:mobile/features/services/quiz_practice_service.dart';
import 'package:mobile/features/services/submission_service.dart';

class StudentMarksTab extends StatefulWidget {
  final String classroomId;

  const StudentMarksTab({
    super.key,
    required this.classroomId,
  });

  @override
  State<StudentMarksTab> createState() => _StudentMarksTabState();
}

class _StudentMarksTabState extends State<StudentMarksTab> {
  bool _isLoading = true;
  String? _error;

  List<_QuizMarkItem> _quizMarks = [];
  List<_ExamMarkItem> _examMarks = [];
  List<_ExamMarkItem> _practicalMarks = [];

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  String _normalizeId(String id) => id.trim().toLowerCase();

  Future<void> _loadData() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final studentId = await TokenStorage.getUserId();
      if (studentId == null || studentId.isEmpty) {
        throw Exception('Unable to identify student account');
      }

      final results = await Future.wait([
        QuizPracticeService.getClassroomQuizzes(widget.classroomId),
        QuizPracticeService.getAttemptsByStudent(studentId),
        _fetchExaminationsByMode('PRACTICAL'),
        _fetchExaminationsByMode('EXAMINATION'),
        SubmissionService.getSubmissionsByStudentId(studentId),
      ]);

      final classroomQuizzes = results[0] as List<ClassroomQuiz>;
      final attempts = results[1] as List<QuizAttemptInfo>;
      final practicalExams = results[2] as List<Examination>;
      final examModeExaminations = results[3] as List<Examination>;
      final submissions = results[4] as List<Submission>;

      final examinations = [...practicalExams, ...examModeExaminations];

      final examIds = examinations.map((e) => e.id).toSet();
      final examSubmissions = submissions.where((s) => examIds.contains(s.examId)).toList();

      final problemTitleById = <String, String>{};
      void putProblemTitle(String problemId, String? title) {
        if (title == null || title.trim().isEmpty) {
          return;
        }
        problemTitleById[_normalizeId(problemId)] = title.trim();
      }

      for (final exam in examinations) {
        for (final examProblem in exam.examProblems) {
          putProblemTitle(examProblem.problemId, examProblem.title);
        }
        for (final problem in exam.problems) {
          putProblemTitle(problem.id, problem.title);
        }
      }

      for (final submission in examSubmissions) {
        putProblemTitle(submission.problemId, submission.problemTitle);
      }

      final missingProblemIds = examSubmissions
          .map((s) => s.problemId)
          .where((id) => !problemTitleById.containsKey(_normalizeId(id)))
          .toSet()
          .toList();

      if (missingProblemIds.isNotEmpty) {
        final missingProblems = await Future.wait(
          missingProblemIds.map((id) async {
            try {
              final prob = await ProblemService.getById(id);
              return MapEntry(id, prob);
            } catch (e) {
              return MapEntry(id, null);
            }
          }),
        );
        for (final entry in missingProblems) {
          putProblemTitle(entry.key, entry.value?.title);
        }
      }

      final quizDetailEntries = await Future.wait(
        classroomQuizzes.map((item) async {
          try {
            final detail = await QuizPracticeService.getQuizById(item.quizId);
            return MapEntry(item.id, detail);
          } catch (e) {
             return MapEntry(item.id, null);
          }
        }),
      );
      final quizDetailsByClassroomQuizId = <String, QuizDetail>{
        for (final entry in quizDetailEntries)
          if (entry.value != null) entry.key: entry.value!,
      };

      final scoredAttemptsByQuizId = <String, List<QuizAttemptInfo>>{};
      for (final attempt in attempts.where((a) => a.finalScore != null)) {
        scoredAttemptsByQuizId.putIfAbsent(attempt.classroomQuizId, () => []).add(attempt);
      }

      final quizMarks = classroomQuizzes
          .where((classroomQuiz) => scoredAttemptsByQuizId.containsKey(classroomQuiz.id))
          .map((classroomQuiz) {
            final quizAttempts = scoredAttemptsByQuizId[classroomQuiz.id]!
                ..sort((a, b) => b.startTime.compareTo(a.startTime));
            final latestAttempt = quizAttempts.first;
            final quizDetail = quizDetailsByClassroomQuizId[classroomQuiz.id];
            
            return _QuizMarkItem(
              title: quizDetail?.title ?? 'Quiz',
              score: latestAttempt.finalScore,
              maxScore: _quizMaxScore(quizDetail),
              attemptNumber: latestAttempt.attemptNumber,
              submittedAt: latestAttempt.endTime ?? latestAttempt.startTime,
              allAttempts: quizAttempts,
            );
          })
          .toList()
        ..sort((a, b) => b.sortDate.compareTo(a.sortDate));

      final examMarks = <_ExamMarkItem>[];
      final practicalMarks = <_ExamMarkItem>[];

      for (final exam in examinations) {
        final submissionsOfExam = examSubmissions.where((s) => s.examId == exam.id).toList();
        final latestByProblem = _latestSubmissionByProblem(submissionsOfExam);
        final scoredByProblem = <String, Submission>{
          for (final entry in latestByProblem.entries)
            if (entry.value.finalScore != null) entry.key: entry.value,
        };
        final aggregatedScore = scoredByProblem.values.fold<double>(
          0,
          (sum, item) => sum + (item.finalScore ?? 0),
        );

        final problemScores = scoredByProblem.entries.map((entry) {
          final problemId = entry.key;
          final submission = entry.value;
          final normalizedProblemId = problemId.trim().toLowerCase();

          final examProblemTitle = exam.examProblems
            .where((p) => p.problemId.trim().toLowerCase() == normalizedProblemId)
              .map((p) => p.title)
              .cast<String?>()
              .firstWhere((title) => title != null && title.trim().isNotEmpty, orElse: () => null);
            final titleFromMap = problemTitleById[normalizedProblemId];
            final submissionProblemTitle = submission.problemTitle;
            final problemTitle = titleFromMap ??
              submissionProblemTitle ??
            examProblemTitle ??
              exam.problems
              .where((p) => p.id.trim().toLowerCase() == normalizedProblemId)
                  .map((p) => p.title)
                  .cast<String?>()
                  .firstWhere((title) => title != null && title.trim().isNotEmpty, orElse: () => null) ??
              'Problem ${problemId.length > 8 ? problemId.substring(0, 8) : problemId}';

          return _ProblemScoreItem(
            examId: exam.id,
            submissionId: submission.id,
            problemTitle: problemTitle,
            score: submission.finalScore,
            version: submission.version,
            submittedAt: submission.submittedDate,
          );
        }).toList()
          ..sort((a, b) => a.problemTitle.toLowerCase().compareTo(b.problemTitle.toLowerCase()));

        final canShowScore = exam.mode == ExaminationMode.practical || exam.isPublicResult;

        final markItem = _ExamMarkItem(
          examId: exam.id,
          examName: exam.examName,
          score: (scoredByProblem.isEmpty || !canShowScore) ? null : aggregatedScore,
          maxScore: exam.totalMark,
          latestSubmissionAt: _latestSubmissionDate(submissionsOfExam),
          problemScores: problemScores,
          isPractical: exam.mode == ExaminationMode.practical,
        );

        if (markItem.score != null) {
          if (exam.mode == ExaminationMode.practical) {
            practicalMarks.add(markItem);
          } else {
            examMarks.add(markItem);
          }
        }
      }

      examMarks.sort((a, b) => b.sortDate.compareTo(a.sortDate));
      practicalMarks.sort((a, b) => b.sortDate.compareTo(a.sortDate));

      if (!mounted) {
        return;
      }
      setState(() {
        _quizMarks = quizMarks;
        _examMarks = examMarks;
        _practicalMarks = practicalMarks;
        _isLoading = false;
      });
    } catch (e) {
      if (!mounted) {
        return;
      }
      setState(() {
        _error = e.toString().replaceFirst('Exception: ', '');
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        const GradientBackground(),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildStickyHeader(),
            Expanded(
              child: _isLoading
                  ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
                  : _error != null
                      ? _buildErrorState()
                      : _buildContent(),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildSectionHeader(String title, IconData icon, Color accentColor) {
    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      child: Row(
        children: [
          Container(
            width: 8,
            height: 32,
            decoration: BoxDecoration(
              color: accentColor,
              borderRadius: BorderRadius.circular(4),
            ),
          ),
          const SizedBox(width: 12),
          Icon(icon, color: accentColor, size: 24),
          const SizedBox(width: 10),
          Text(
            title,
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.w900,
              color: accentColor,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildContent() {
    final isEmpty = _quizMarks.isEmpty && _examMarks.isEmpty && _practicalMarks.isEmpty;
    if (isEmpty) {
      return _buildEmptyState();
    }

    return RefreshIndicator(
      onRefresh: _loadData,
      color: AppColors.primary,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 20, 16, 24),
        children: [
          _buildSectionHeader('Quiz Marks', Icons.quiz_outlined, AppColors.primary),
          const SizedBox(height: 4),
          if (_quizMarks.isEmpty)
            _buildSectionEmpty('No quiz marks yet.')
          else
            ..._quizMarks.map((item) => Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: _QuizMarkCard(item: item),
                )),
          const SizedBox(height: 20),
          _buildSectionHeader('Exam Marks', Icons.assignment_outlined, AppColors.accent),
          const SizedBox(height: 4),
          if (_examMarks.isEmpty)
            _buildSectionEmpty('No exam marks yet.')
          else
            ..._examMarks.map((item) => Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: _ExamMarkCard(item: item),
                )),
          const SizedBox(height: 20),
          _buildSectionHeader('Practical Marks', Icons.science_outlined, const Color(0xFF00BCD4)),
          const SizedBox(height: 4),
          if (_practicalMarks.isEmpty)
            _buildSectionEmpty('No practical marks yet.')
          else
            ..._practicalMarks.map((item) => Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: _ExamMarkCard(item: item),
                )),
        ],
      ),
    );
  }

  Widget _buildSectionEmpty(String message) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.withValues(alpha: 0.15)),
      ),
      child: Text(
        message,
        style: const TextStyle(color: AppColors.textSecondary, fontSize: 13),
      ),
    );
  }

  Widget _buildErrorState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.error_outline, size: 48, color: AppColors.error),
            const SizedBox(height: 12),
            Text(_error!, textAlign: TextAlign.center),
            const SizedBox(height: 16),
            ElevatedButton(onPressed: _loadData, child: const Text('Try again')),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.bar_chart_rounded, size: 58, color: Colors.grey[300]),
          const SizedBox(height: 10),
          Text(
            'No marks available yet.',
            style: TextStyle(color: Colors.grey[600], fontSize: 15),
          ),
        ],
      ),
    );
  }

  double? _quizMaxScore(QuizDetail? quizDetail) {
    if (quizDetail == null || quizDetail.questions.isEmpty) {
      return null;
    }
    return quizDetail.questions.fold<double>(0, (sum, q) => sum + q.marks);
  }

  DateTime? _latestSubmissionDate(List<Submission> submissions) {
    if (submissions.isEmpty) {
      return null;
    }

    DateTime? latest;
    for (final submission in submissions) {
      final current = submission.submittedDate;
      if (current == null) {
        continue;
      }

      if (latest == null || current.isAfter(latest)) {
        latest = current;
      }
    }

    return latest;
  }

  Map<String, Submission> _latestSubmissionByProblem(List<Submission> submissions) {
    final latestByProblem = <String, Submission>{};
    for (final submission in submissions) {
      final current = latestByProblem[submission.problemId];
      if (current == null) {
        latestByProblem[submission.problemId] = submission;
        continue;
      }

      if (submission.version > current.version) {
        latestByProblem[submission.problemId] = submission;
        continue;
      }

      if (submission.version == current.version) {
        final currentDate = current.submittedDate;
        final submissionDate = submission.submittedDate;
        if (submissionDate != null && (currentDate == null || submissionDate.isAfter(currentDate))) {
          latestByProblem[submission.problemId] = submission;
        }
      }
    }

    return latestByProblem;
  }

  Future<List<Examination>> _fetchExaminationsByMode(String mode) async {
    try {
      final token = await TokenStorage.getAccessToken();
      if (token == null) return [];

      final response = await ApiNetwork.getWithAuth(
        endpoint: ApiConfig.examinationsByClassAndModeEndpoint(widget.classroomId, mode),
        token: token,
      );

      if (response['success'] == true && response['dataResponse'] != null) {
        final List<dynamic> data = response['dataResponse'];
        return data
            .map((json) => Examination.fromJson(json as Map<String, dynamic>))
            .toList();
      }
      return [];
    } catch (e) {
      debugPrint('Failed to fetch examinations by mode $mode: $e');
      return [];
    }
  }
}

class _QuizMarkItem {
  final String title;
  final double? score;
  final double? maxScore;
  final int? attemptNumber;
  final DateTime? submittedAt;
  final List<QuizAttemptInfo> allAttempts;

  const _QuizMarkItem({
    required this.title,
    required this.score,
    required this.maxScore,
    required this.attemptNumber,
    required this.submittedAt,
    this.allAttempts = const [],
  });

  DateTime get sortDate => submittedAt ?? DateTime.fromMillisecondsSinceEpoch(0);
}

class _ExamMarkItem {
  final String examId;
  final String examName;
  final double? score;
  final double maxScore;
  final DateTime? latestSubmissionAt;
  final List<_ProblemScoreItem> problemScores;
  final bool isPractical;

  const _ExamMarkItem({
    required this.examId,
    required this.examName,
    required this.score,
    required this.maxScore,
    required this.latestSubmissionAt,
    required this.problemScores,
    this.isPractical = false,
  });

  DateTime get sortDate => latestSubmissionAt ?? DateTime.fromMillisecondsSinceEpoch(0);
}

class _ProblemScoreItem {
  final String examId;
  final String submissionId;
  final String problemTitle;
  final double? score;
  final int version;
  final DateTime? submittedAt;

  const _ProblemScoreItem({
    required this.examId,
    required this.submissionId,
    required this.problemTitle,
    required this.score,
    required this.version,
    required this.submittedAt,
  });
}

class _QuizMarkCard extends StatelessWidget {
  final _QuizMarkItem item;

  const _QuizMarkCard({required this.item});

  @override
  Widget build(BuildContext context) {
    final score = item.score ?? 0;
    final max = item.maxScore ?? 100;
    final percentage = max > 0 ? (score / max * 100).clamp(0.0, 100.0).toDouble() : 0.0;
    final scoreColor = _getScoreColor(percentage);

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        item.title,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w800,
                          color: AppColors.textPrimary,
                          height: 1.3,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          if (item.attemptNumber != null) ...[
                            _InfoChip(
                              icon: Icons.refresh_rounded,
                              label: 'Attempt #${item.attemptNumber}',
                              color: AppColors.textSecondary,
                            ),
                            const SizedBox(width: 8),
                          ],
                          if (item.submittedAt != null)
                            _InfoChip(
                              icon: Icons.schedule_rounded,
                              label: _fmt(item.submittedAt!),
                              color: AppColors.textLight,
                            ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 16),
                _ScoreCircle(
                  score: score,
                  max: max,
                  percentage: percentage,
                  color: scoreColor,
                  size: 72,
                ),
              ],
            ),
          ),
          if (item.allAttempts.length > 1) ...[
            Container(
              height: 1,
              color: Colors.grey.withValues(alpha: 0.08),
            ),
            Theme(
              data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
              child: ExpansionTile(
                backgroundColor: Colors.transparent,
                collapsedBackgroundColor: Colors.transparent,
                tilePadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 0),
                childrenPadding: const EdgeInsets.fromLTRB(16, 4, 16, 14),
                title: Row(
                  children: [
                    Container(
                      width: 4,
                      height: 16,
                      decoration: BoxDecoration(
                        color: AppColors.primary.withValues(alpha: 0.5),
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      'Attempt history (${item.allAttempts.length})',
                      style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ],
                ),
                children: item.allAttempts.asMap().entries.map((entry) {
                  final attemptIndex = entry.key;
                  final attempt = entry.value;
                  final isLatest = attemptIndex == 0;
                  final attScore = attempt.finalScore ?? 0;
                  final attMax = item.maxScore ?? 100;
                  final attPct = attMax > 0 ? (attScore / attMax * 100).clamp(0.0, 100.0).toDouble() : 0.0;
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: isLatest ? AppColors.primary.withValues(alpha: 0.04) : Colors.grey.withValues(alpha: 0.05),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(
                          color: isLatest ? AppColors.primary.withValues(alpha: 0.15) : Colors.grey.withValues(alpha: 0.08),
                        ),
                      ),
                      child: Row(
                        children: [
                          Container(
                            width: 4,
                            height: 36,
                            decoration: BoxDecoration(
                              color: _getScoreColor(attPct).withValues(alpha: isLatest ? 1.0 : 0.5),
                              borderRadius: BorderRadius.circular(2),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  isLatest ? 'Attempt #${attempt.attemptNumber} (Latest)' : 'Attempt #${attempt.attemptNumber}',
                                  style: TextStyle(
                                    fontSize: 13,
                                    fontWeight: FontWeight.w700,
                                    color: isLatest ? AppColors.primary : AppColors.textPrimary,
                                  ),
                                ),
                                if (attempt.endTime != null) ...[
                                  const SizedBox(height: 2),
                                  Text(
                                    _fmt(attempt.endTime!),
                                    style: const TextStyle(
                                      fontSize: 11,
                                      color: AppColors.textLight,
                                    ),
                                  ),
                                ],
                              ],
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                            decoration: BoxDecoration(
                              color: _getScoreColor(attPct).withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Text(
                              item.maxScore == null
                                  ? _formatScore(attempt.finalScore)
                                  : '${_formatScore(attempt.finalScore)} / ${_formatScore(item.maxScore)}',
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w800,
                                color: _getScoreColor(attPct),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                }).toList(),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _ExamMarkCard extends StatelessWidget {
  final _ExamMarkItem item;

  const _ExamMarkCard({required this.item});

  @override
  Widget build(BuildContext context) {
    final score = item.score ?? 0;
    final max = item.maxScore;
    final percentage = max > 0 ? (score / max * 100).clamp(0.0, 100.0).toDouble() : 0.0;
    final scoreColor = _getScoreColor(percentage);

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        item.examName,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w800,
                          color: AppColors.textPrimary,
                          height: 1.3,
                        ),
                      ),
                      const SizedBox(height: 10),
                      if (item.latestSubmissionAt != null)
                        _InfoChip(
                          icon: Icons.schedule_rounded,
                          label: 'Submitted: ${_fmt(item.latestSubmissionAt!)}',
                          color: AppColors.textLight,
                        ),
                      const SizedBox(height: 10),
                    ],
                  ),
                ),
                const SizedBox(width: 16),
                _ScoreCircle(
                  score: score,
                  max: max,
                  percentage: percentage,
                  color: scoreColor,
                  size: 72,
                ),
              ],
            ),
          ),
          if (item.problemScores.isNotEmpty) ...[
            Container(
              height: 1,
              color: Colors.grey.withValues(alpha: 0.08),
            ),
            Theme(
              data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
              child: ExpansionTile(
                backgroundColor: Colors.transparent,
                collapsedBackgroundColor: Colors.transparent,
                tilePadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 0),
                childrenPadding: const EdgeInsets.fromLTRB(16, 4, 16, 14),
                title: Row(
                  children: [
                    Container(
                      width: 4,
                      height: 16,
                      decoration: BoxDecoration(
                        color: AppColors.accent.withValues(alpha: 0.7),
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      'Problem breakdown (${item.problemScores.length})',
                      style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ],
                ),
                children: item.problemScores.isEmpty
                    ? [
                        const Align(
                          alignment: Alignment.centerLeft,
                          child: Padding(
                            padding: EdgeInsets.only(top: 8),
                            child: Text(
                              'No submission score yet.',
                              style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
                            ),
                          ),
                        ),
                      ]
                    : item.problemScores.asMap().entries.map((entry) {
                        final index = entry.key;
                        final problem = entry.value;
                        final probScore = problem.score ?? 0;
                        final probMax = max;
                        final probPct = probMax > 0 ? (probScore / probMax * 100).clamp(0.0, 100.0).toDouble() : 0.0;
                        final probColor = _getScoreColor(probPct);
                        final isLast = index == item.problemScores.length - 1;

                        return Container(
                          margin: EdgeInsets.only(bottom: isLast ? 0 : 8),
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: Colors.grey.withValues(alpha: 0.04),
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(color: Colors.grey.withValues(alpha: 0.07)),
                          ),
                          child: Row(
                            children: [
                              Container(
                                width: 24,
                                height: 24,
                                decoration: BoxDecoration(
                                  color: probColor.withValues(alpha: 0.1),
                                  shape: BoxShape.circle,
                                ),
                                child: Center(
                                  child: Text(
                                    '${index + 1}',
                                    style: TextStyle(
                                      fontSize: 11,
                                      fontWeight: FontWeight.w800,
                                      color: probColor,
                                    ),
                                  ),
                                ),
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      problem.problemTitle,
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                      style: const TextStyle(
                                        fontSize: 13,
                                        fontWeight: FontWeight.w700,
                                        color: AppColors.textPrimary,
                                      ),
                                    ),
                                    if (problem.submittedAt != null) ...[
                                      const SizedBox(height: 2),
                                      Text(
                                        'v${problem.version} • ${_fmt(problem.submittedAt!)}',
                                        style: const TextStyle(
                                          fontSize: 10,
                                          color: AppColors.textLight,
                                        ),
                                      ),
                                    ],
                                  ],
                                ),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                decoration: BoxDecoration(
                                  color: probColor.withValues(alpha: 0.1),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Text(
                                  _formatScore(problem.score),
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w800,
                                    color: probColor,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        );
                      }).toList(),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

Widget _InfoChip({
  required IconData icon,
  required String label,
  required Color color,
}) {
  return Row(
    mainAxisSize: MainAxisSize.min,
    children: [
      Icon(icon, size: 13, color: color),
      const SizedBox(width: 4),
      Text(
        label,
        style: TextStyle(fontSize: 12, color: color, fontWeight: FontWeight.w500),
      ),
    ],
  );
}

class _ScoreCircle extends StatelessWidget {
  final double score;
  final double max;
  final double percentage;
  final Color color;
  final double size;

  const _ScoreCircle({
    required this.score,
    required this.max,
    required this.percentage,
    required this.color,
    required this.size,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size,
      height: size,
      child: Stack(
        alignment: Alignment.center,
        children: [
          SizedBox(
            width: size,
            height: size,
            child: CircularProgressIndicator(
              value: percentage / 100,
              strokeWidth: 6,
              backgroundColor: color.withValues(alpha: 0.1),
              valueColor: AlwaysStoppedAnimation(color),
            ),
          ),
          Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                _formatScore(score),
                style: TextStyle(
                  fontSize: size * 0.24,
                  fontWeight: FontWeight.w900,
                  color: color,
                  height: 1,
                ),
              ),
              Text(
                '/ ${_formatScore(max)}',
                style: TextStyle(
                  fontSize: size * 0.14,
                  fontWeight: FontWeight.w600,
                  color: AppColors.textLight,
                  height: 1.1,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

Color _getScoreColor(double percentage) {
  if (percentage >= 80) return AppColors.success;
  if (percentage >= 60) return AppColors.warning;
  return AppColors.error;
}

String _formatScore(double? score) {
  if (score == null) {
    return '-';
  }
  if ((score - score.roundToDouble()).abs() < 0.001) {
    return score.toStringAsFixed(0);
  }
  return score.toStringAsFixed(2);
}

String _fmt(DateTime dt) {
  final local = dt.toLocal();
  final day = local.day.toString().padLeft(2, '0');
  final month = local.month.toString().padLeft(2, '0');
  final year = local.year.toString();
  final hour = local.hour.toString().padLeft(2, '0');
  final minute = local.minute.toString().padLeft(2, '0');
  return '$day/$month/$year $hour:$minute';
}

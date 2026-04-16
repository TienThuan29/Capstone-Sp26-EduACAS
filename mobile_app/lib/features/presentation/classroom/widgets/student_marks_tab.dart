import 'package:flutter/material.dart';
import 'package:mobile/core/storage/token_storage.dart';
import 'package:mobile/core/theme/app_colors.dart';
import 'package:mobile/core/widgets/background.dart';
import 'package:mobile/features/models/examination.dart';
import 'package:mobile/features/models/quiz_practice.dart';
import 'package:mobile/features/models/submission.dart';
import 'package:mobile/features/services/examination_service.dart';
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
        ExaminationService.getExaminationsByClassId(widget.classroomId),
        SubmissionService.getSubmissionsByStudentId(studentId),
      ]);

      final classroomQuizzes = results[0] as List<ClassroomQuiz>;
      final attempts = results[1] as List<QuizAttemptInfo>;
      final examinations = results[2] as List<Examination>;
      final submissions = results[3] as List<Submission>;

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
          missingProblemIds.map((id) async => MapEntry(id, await ProblemService.getById(id))),
        );
        for (final entry in missingProblems) {
          putProblemTitle(entry.key, entry.value?.title);
        }
      }

      final quizDetailEntries = await Future.wait(
        classroomQuizzes.map((item) async {
          final detail = await QuizPracticeService.getQuizById(item.quizId);
          return MapEntry(item.id, detail);
        }),
      );
      final quizDetailsByClassroomQuizId = <String, QuizDetail>{
        for (final entry in quizDetailEntries)
          if (entry.value != null) entry.key: entry.value!,
      };

      final latestScoredAttemptByQuizId = <String, QuizAttemptInfo>{};
      for (final attempt in attempts.where((a) => a.finalScore != null)) {
        final current = latestScoredAttemptByQuizId[attempt.classroomQuizId];
        if (current == null || attempt.startTime.isAfter(current.startTime)) {
          latestScoredAttemptByQuizId[attempt.classroomQuizId] = attempt;
        }
      }

      final quizMarks = classroomQuizzes
          .where((classroomQuiz) {
            final latestAttempt = latestScoredAttemptByQuizId[classroomQuiz.id];
            return latestAttempt != null && latestAttempt.finalScore != null;
          })
          .map((classroomQuiz) {
            final latestAttempt = latestScoredAttemptByQuizId[classroomQuiz.id]!;
            final quizDetail = quizDetailsByClassroomQuizId[classroomQuiz.id];
            return _QuizMarkItem(
              title: quizDetail?.title ?? 'Quiz',
              score: latestAttempt.finalScore,
              maxScore: _quizMaxScore(quizDetail),
              attemptNumber: latestAttempt.attemptNumber,
              submittedAt: latestAttempt.endTime ?? latestAttempt.startTime,
            );
          })
          .toList()
        ..sort((a, b) => b.sortDate.compareTo(a.sortDate));

      final examMarks = examinations.map((exam) {
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
            problemTitle: problemTitle,
            score: submission.finalScore,
            version: submission.version,
            submittedAt: submission.submittedDate,
          );
        }).toList()
          ..sort((a, b) => a.problemTitle.toLowerCase().compareTo(b.problemTitle.toLowerCase()));

        return _ExamMarkItem(
          examName: exam.examName,
          score: scoredByProblem.isEmpty ? null : aggregatedScore,
          maxScore: exam.totalMark,
          latestSubmissionAt: _latestSubmissionDate(submissionsOfExam),
          problemScores: problemScores,
        );
      }).where((item) => item.score != null).toList()
        ..sort((a, b) => b.sortDate.compareTo(a.sortDate));

      if (!mounted) {
        return;
      }
      setState(() {
        _quizMarks = quizMarks;
        _examMarks = examMarks;
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
        _isLoading
            ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
            : _error != null
                ? _buildErrorState()
                : _buildContent(),
      ],
    );
  }

  Widget _buildContent() {
    final isEmpty = _quizMarks.isEmpty && _examMarks.isEmpty;
    if (isEmpty) {
      return _buildEmptyState();
    }

    return RefreshIndicator(
      onRefresh: _loadData,
      color: AppColors.primary,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 20, 16, 24),
        children: [
          _buildSectionTitle('Quiz Marks'),
          const SizedBox(height: 10),
          if (_quizMarks.isEmpty)
            _buildSectionEmpty('No quiz marks yet.')
          else
            ..._quizMarks.map((item) => Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: _QuizMarkCard(item: item),
                )),
          const SizedBox(height: 14),
          _buildSectionTitle('Exam Marks'),
          const SizedBox(height: 10),
          if (_examMarks.isEmpty)
            _buildSectionEmpty('No exam marks yet.')
          else
            ..._examMarks.map((item) => Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: _ExamMarkCard(item: item),
                )),
        ],
      ),
    );
  }

  Widget _buildSectionTitle(String text) {
    return Text(
      text,
      style: const TextStyle(
        fontSize: 20,
        fontWeight: FontWeight.w900,
        color: AppColors.textPrimary,
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
}

class _QuizMarkItem {
  final String title;
  final double? score;
  final double? maxScore;
  final int? attemptNumber;
  final DateTime? submittedAt;

  const _QuizMarkItem({
    required this.title,
    required this.score,
    required this.maxScore,
    required this.attemptNumber,
    required this.submittedAt,
  });

  DateTime get sortDate => submittedAt ?? DateTime.fromMillisecondsSinceEpoch(0);
}

class _ExamMarkItem {
  final String examName;
  final double? score;
  final double maxScore;
  final DateTime? latestSubmissionAt;
  final List<_ProblemScoreItem> problemScores;

  const _ExamMarkItem({
    required this.examName,
    required this.score,
    required this.maxScore,
    required this.latestSubmissionAt,
    required this.problemScores,
  });

  DateTime get sortDate => latestSubmissionAt ?? DateTime.fromMillisecondsSinceEpoch(0);
}

class _ProblemScoreItem {
  final String problemTitle;
  final double? score;
  final int version;
  final DateTime? submittedAt;

  const _ProblemScoreItem({
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
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            item.title,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w800,
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              _scorePill(
                label: item.maxScore == null
                    ? _formatScore(item.score)
                    : '${_formatScore(item.score)} / ${_formatScore(item.maxScore)}',
                backgroundColor: AppColors.primary.withValues(alpha: 0.1),
                textColor: AppColors.primary,
              ),
              const SizedBox(width: 8),
              if (item.attemptNumber != null)
                _scorePill(
                  label: 'Attempt #${item.attemptNumber}',
                  backgroundColor: Colors.grey.withValues(alpha: 0.15),
                  textColor: AppColors.textSecondary,
                ),
            ],
          ),
          if (item.submittedAt != null) ...[
            const SizedBox(height: 8),
            Text(
              'Submitted: ${_fmt(item.submittedAt!)}',
              style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
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
    final scoreLabel = '${_formatScore(item.score)} / ${_formatScore(item.maxScore)}';

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(14, 14, 14, 6),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item.examName,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w800,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 8),
                _scorePill(
                  label: scoreLabel,
                  backgroundColor: Colors.green.withValues(alpha: 0.1),
                  textColor: Colors.green.shade700,
                ),
                if (item.latestSubmissionAt != null) ...[
                  const SizedBox(height: 8),
                  Text(
                    'Latest submission: ${_fmt(item.latestSubmissionAt!)}',
                    style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                  ),
                ],
              ],
            ),
          ),
          const Divider(height: 1),
          Theme(
            data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
            child: ExpansionTile(
              tilePadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 0),
              childrenPadding: const EdgeInsets.fromLTRB(14, 0, 14, 12),
              title: Text(
                'Problem scores (${item.problemScores.length})',
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textSecondary,
                ),
              ),
              children: item.problemScores.isEmpty
                  ? [
                      const Align(
                        alignment: Alignment.centerLeft,
                        child: Text(
                          'No submission score yet.',
                          style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
                        ),
                      ),
                    ]
                  : item.problemScores.map((problem) {
                      return Container(
                        margin: const EdgeInsets.only(bottom: 8),
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: Colors.grey.withValues(alpha: 0.06),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Expanded(
                                  child: Text(
                                    problem.problemTitle,
                                    style: const TextStyle(
                                      fontSize: 13,
                                      fontWeight: FontWeight.w700,
                                      color: AppColors.textPrimary,
                                    ),
                                  ),
                                ),
                                Text(
                                  _formatScore(problem.score),
                                  style: const TextStyle(
                                    fontSize: 13,
                                    fontWeight: FontWeight.w800,
                                    color: AppColors.primary,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 6),
                            Text(
                              'Version ${problem.version}${problem.submittedAt != null ? ' • ${_fmt(problem.submittedAt!)}' : ''}',
                              style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
                            ),
                          ],
                        ),
                      );
                    }).toList(),
            ),
          ),
        ],
      ),
    );
  }
}

Widget _scorePill({
  required String label,
  required Color backgroundColor,
  required Color textColor,
}) {
  return Container(
    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
    decoration: BoxDecoration(
      color: backgroundColor,
      borderRadius: BorderRadius.circular(999),
    ),
    child: Text(
      label,
      style: TextStyle(
        fontSize: 12,
        fontWeight: FontWeight.w700,
        color: textColor,
      ),
    ),
  );
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

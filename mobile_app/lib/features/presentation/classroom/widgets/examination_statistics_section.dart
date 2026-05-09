import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../models/dashboard_stats.dart';
import '../../../models/classroom_student.dart';
import '../../../models/submission.dart';
import '../../../services/dashboard_service.dart';
import '../../../services/submission_service.dart';

class ExaminationStatisticsSection extends StatefulWidget {
  final String classId;
  final List<ClassroomStudentResponse> students;
  final String mode; // 'EXAMINATION' or 'PRACTICAL'

  const ExaminationStatisticsSection({
    super.key,
    required this.classId,
    required this.students,
    required this.mode,
  });

  @override
  State<ExaminationStatisticsSection> createState() => _ExaminationStatisticsSectionState();
}

class _ExaminationStatisticsSectionState extends State<ExaminationStatisticsSection> {
  List<ExamScoreStatistics> _examStatistics = [];
  String? _selectedExamId;
  bool _isAllExamsSelected = false;
  bool _isLoading = true;
  bool _isScoresLoading = false;

  Map<String, List<Map<String, dynamic>>> _studentScores = {};

  @override
  void initState() {
    super.initState();
    _loadExams();
  }

  Future<void> _loadExams() async {
    try {
      final data = await DashboardService.getExamStatistics(widget.classId, mode: widget.mode);
      if (mounted) {
        setState(() {
          _examStatistics = data;
          if (data.isNotEmpty) {
            _selectedExamId = data[0].examId;
            _loadStudentScores();
          }
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _loadStudentScores() async {
    if (_selectedExamId == null && !_isAllExamsSelected) return;
    
    setState(() => _isScoresLoading = true);
    try {
      final Map<String, List<Map<String, dynamic>>> allScores = {};

      if (_isAllExamsSelected) {
        for (final exam in _examStatistics) {
          final submissions = await SubmissionService.getLatestSubmissionsByExam(exam.examId);
          for (final ps in submissions) {
            for (final sub in ps.submissions) {
              allScores.putIfAbsent(sub.studentId, () => []);
              allScores[sub.studentId]!.add({
                'examId': exam.examId,
                'examName': exam.examName,
                'totalScore': sub.finalScore ?? 0,
              });
            }
          }
        }
      } else if (_selectedExamId != null) {
        final submissions = await SubmissionService.getLatestSubmissionsByExam(_selectedExamId!);
        final selectedExam = _examStatistics.firstWhere((e) => e.examId == _selectedExamId);
        for (final ps in submissions) {
          for (final sub in ps.submissions) {
            allScores.putIfAbsent(sub.studentId, () => []);
            allScores[sub.studentId]!.add({
              'examId': _selectedExamId,
              'examName': selectedExam.examName,
              'totalScore': sub.finalScore ?? 0,
            });
          }
        }
      }

      if (mounted) {
        setState(() {
          _studentScores = allScores;
          _isScoresLoading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isScoresLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Padding(
        padding: EdgeInsets.all(40),
        child: Center(child: CircularProgressIndicator()),
      );
    }

    if (_examStatistics.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(24),
        margin: const EdgeInsets.symmetric(vertical: 16),
        decoration: BoxDecoration(
          color: Colors.grey.withValues(alpha: 0.05),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.grey.withValues(alpha: 0.1), style: BorderStyle.solid),
        ),
        child: Center(
          child: Text(
            'No ${widget.mode} exams available',
            style: const TextStyle(color: AppColors.textLight, fontSize: 14),
          ),
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 24),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              '${widget.mode} Statistics',
              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: AppColors.textPrimary),
            ),
            const SizedBox(height: 4),
            Text(
              _isAllExamsSelected ? 'Average across all exams' : 'Score per student',
              style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
            ),
            const SizedBox(height: 16),
            _buildExamSelector(),
          ],
        ),
        const SizedBox(height: 20),
        _buildChartCard(),
      ],
    );
  }

  Widget _buildExamSelector() {
    return SizedBox(
      width: double.infinity,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.grey.withValues(alpha: 0.2)),
        ),
        child: DropdownButtonHideUnderline(
          child: DropdownButton<String>(
            isExpanded: true,
            value: _isAllExamsSelected ? '__all__' : _selectedExamId,
            style: const TextStyle(fontSize: 13, color: AppColors.textPrimary, fontWeight: FontWeight.bold),
            items: [
              const DropdownMenuItem(value: '__all__', child: Text('Average All')),
              ..._examStatistics.map((e) => DropdownMenuItem(
                value: e.examId, 
                child: Text(e.examName, softWrap: true, maxLines: 2, style: const TextStyle(fontSize: 12)),
              )),
            ],
            onChanged: (val) {
              if (val == '__all__') {
                setState(() {
                  _isAllExamsSelected = true;
                  _selectedExamId = null;
                });
              } else {
                setState(() {
                  _isAllExamsSelected = false;
                  _selectedExamId = val;
                });
              }
              _loadStudentScores();
            },
          ),
        ),
      ),
    );
  }

  Widget _buildChartCard() {
    if (_isScoresLoading) {
      return Container(
        height: 300,
        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(24)),
        child: const Center(child: CircularProgressIndicator()),
      );
    }

    if (_studentScores.isEmpty) {
      return Container(
        height: 200,
        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(24)),
        child: const Center(child: Text('No submissions found', style: TextStyle(color: AppColors.textLight))),
      );
    }

    final chartData = _studentScores.entries.map((entry) {
      final student = widget.students.firstWhere((s) => s.studentId == entry.key, 
        orElse: () => ClassroomStudentResponse(studentId: entry.key, fullname: entry.key, email: '', isJoining: true));
      
      double scoreValue;
      if (_isAllExamsSelected) {
        scoreValue = entry.value.fold(0.0, (sum, e) => sum + (e['totalScore'] as num)) / entry.value.length;
      } else {
        scoreValue = entry.value.fold(0.0, (sum, e) => sum + (e['totalScore'] as num));
      }
      
      return _BarData(student.fullname, scoreValue);
    }).toList();

    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(color: Colors.black.withValues(alpha: 0.03), blurRadius: 15, offset: const Offset(0, 8)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            _isAllExamsSelected ? 'Average Score (0-10)' : 'Total Score',
            style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.textSecondary),
          ),
          const SizedBox(height: 32),
          SizedBox(
            height: 250,
            child: BarChart(
              BarChartData(
                alignment: BarChartAlignment.spaceAround,
                maxY: _isAllExamsSelected ? 10 : chartData.map((e) => e.value).reduce((a, b) => a > b ? a : b) * 1.2,
                barTouchData: BarTouchData(
                  touchTooltipData: BarTouchTooltipData(
                    getTooltipColor: (_) => AppColors.primary,
                    getTooltipItem: (group, groupIndex, rod, rodIndex) {
                      return BarTooltipItem(
                        '${chartData[groupIndex].label}\n',
                        const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12),
                        children: [
                          TextSpan(
                            text: rod.toY.toStringAsFixed(2),
                            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w500, fontSize: 10),
                          ),
                        ],
                      );
                    },
                  ),
                ),
                titlesData: FlTitlesData(
                  show: true,
                  bottomTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      reservedSize: 60,
                      getTitlesWidget: (value, meta) {
                        final index = value.toInt();
                        if (index < 0 || index >= chartData.length) return const SizedBox.shrink();
                        return SideTitleWidget(
                          meta: meta,
                          angle: -45,
                          child: Text(
                            chartData[index].label,
                            style: const TextStyle(fontSize: 9, color: AppColors.textLight, fontWeight: FontWeight.bold),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        );
                      },
                    ),
                  ),
                  leftTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      reservedSize: 30,
                      getTitlesWidget: (value, meta) {
                        return SideTitleWidget(
                          meta: meta,
                          child: Text(value.toInt().toString(), style: const TextStyle(fontSize: 10, color: AppColors.textLight)),
                        );
                      },
                    ),
                  ),
                  topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                ),
                gridData: FlGridData(show: true, drawVerticalLine: false, getDrawingHorizontalLine: (value) => FlLine(color: Colors.grey.withValues(alpha: 0.05), strokeWidth: 1)),
                borderData: FlBorderData(show: false),
                barGroups: chartData.asMap().entries.map((e) {
                  return BarChartGroupData(
                    x: e.key,
                    barRods: [
                      BarChartRodData(
                        toY: e.value.value,
                        color: widget.mode == 'EXAMINATION' ? AppColors.success : AppColors.primary,
                        width: 16,
                        borderRadius: const BorderRadius.vertical(top: Radius.circular(6)),
                      ),
                    ],
                  );
                }).toList(),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _BarData {
  final String label;
  final double value;
  _BarData(this.label, this.value);
}

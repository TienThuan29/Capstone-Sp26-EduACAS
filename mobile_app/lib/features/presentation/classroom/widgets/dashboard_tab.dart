import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:shimmer/shimmer.dart';
import 'package:mobile/core/theme/app_colors.dart';
import 'package:mobile/core/widgets/background.dart';
import '../../../models/dashboard_stats.dart';
import '../../../services/dashboard_service.dart';


class DashboardTab extends StatefulWidget {
  final String classroomId;

  const DashboardTab({super.key, required this.classroomId});

  @override
  State<DashboardTab> createState() => _DashboardTabState();
}

class _DashboardTabState extends State<DashboardTab> with SingleTickerProviderStateMixin {
  ClassroomDashboardData? _data;
  bool _isLoading = true;
  String? _errorMessage;
  late TabController _subTabController;

  @override
  void initState() {
    super.initState();
    _subTabController = TabController(length: 3, vsync: this);
    _loadData();
  }

  @override
  void dispose() {
    _subTabController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    if (!mounted) return;
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final data = await DashboardService.getClassroomDashboardData(widget.classroomId);
      if (mounted) {
        setState(() {
          _data = data;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = e.toString();
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) return _buildShimmerLoading();

    if (_errorMessage != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 48, color: AppColors.error),
            const SizedBox(height: 16),
            Text(_errorMessage!, textAlign: TextAlign.center, style: const TextStyle(color: AppColors.textSecondary)),
            const SizedBox(height: 16),
            ElevatedButton(onPressed: _loadData, child: const Text('Retry')),
          ],
        ),
      );
    }

    return Stack(
      children: [
        const GradientBackground(),
        Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Classroom Dashboard',
                    style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    'Overview of student performance and warnings',
                    style: TextStyle(fontSize: 14, color: AppColors.textSecondary),
                  ),
                  const SizedBox(height: 16),
                  TabBar(
                    controller: _subTabController,
                    isScrollable: true,
                    tabAlignment: TabAlignment.start,
                    labelColor: AppColors.primary,
                    unselectedLabelColor: AppColors.textSecondary,
                    indicatorColor: AppColors.primary,
                    tabs: const [
                      Tab(text: 'Overview'),
                      Tab(text: 'Exams'),
                      Tab(text: 'Quizzes'),
                    ],
                  ),
                ],
              ),
            ),
            Expanded(
              child: TabBarView(
                controller: _subTabController,
                children: [
                  _buildOverviewTab(),
                  _buildExamsTab(),
                  _buildQuizzesTab(),
                ],
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildOverviewTab() {
    return RefreshIndicator(
      onRefresh: _loadData,
      child: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          _buildOverviewStats(),
          const SizedBox(height: 24),
          _buildScoreDistribution(),
          const SizedBox(height: 24),
          _buildAtRiskStudents(),
          const SizedBox(height: 24),
          _buildRecentWarnings(),
          const SizedBox(height: 40),
        ],
      ),
    );
  }

  Widget _buildOverviewStats() {
    final overview = _data?.overview ?? DashboardOverview.empty();
    return Column(
      children: [
        Row(
          children: [
            Expanded(child: _buildStatCard('Total Students', overview.totalStudents.toString(), Icons.people_outline, AppColors.primary)),
            const SizedBox(width: 12),
            Expanded(child: _buildStatCard('Class Average', overview.classAverage.toStringAsFixed(1), Icons.analytics_outlined, AppColors.accent)),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(child: _buildStatCard('At Risk', overview.atRiskCount.toString(), Icons.warning_amber_outlined, AppColors.error)),
            const SizedBox(width: 12),
            Expanded(child: _buildStatCard('Warnings', overview.totalWarnings.toString(), Icons.notifications_active_outlined, AppColors.warning)),
          ],
        ),
      ],
    );
  }

  Widget _buildStatCard(String title, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 10, offset: const Offset(0, 4)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 20, color: color),
          const SizedBox(height: 12),
          Text(value, style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: color)),
          const SizedBox(height: 4),
          Text(title, style: const TextStyle(fontSize: 12, color: AppColors.textSecondary, fontWeight: FontWeight.w500)),
        ],
      ),
    );
  }

  Widget _buildScoreDistribution() {
    final dist = _data?.scoreDistribution ?? [];
    if (dist.isEmpty) return const SizedBox.shrink();

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 10, offset: const Offset(0, 4)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Score Distribution', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 24),
          SizedBox(
            height: 200,
            child: BarChart(
              BarChartData(
                alignment: BarChartAlignment.spaceAround,
                maxY: dist.map((e) => e.count).reduce((a, b) => a > b ? a : b).toDouble() * 1.2,
                barTouchData: BarTouchData(enabled: true),
                titlesData: FlTitlesData(
                  show: true,
                  bottomTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      reservedSize: 30,
                      getTitlesWidget: (value, meta) {
                        int index = value.toInt();
                        if (index < 0 || index >= dist.length) return const SizedBox.shrink();
                        return SideTitleWidget(
                          meta: meta,
                          child: Text(dist[index].range, style: const TextStyle(fontSize: 9, color: AppColors.textLight)),
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
                          child: Text(value.toInt().toString(), style: const TextStyle(fontSize: 9, color: AppColors.textLight)),
                        );
                      },
                    ),
                  ),
                  topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                ),
                gridData: FlGridData(show: true, drawVerticalLine: false, getDrawingHorizontalLine: (value) => FlLine(color: Colors.grey.withValues(alpha: 0.1), strokeWidth: 1)),
                borderData: FlBorderData(show: false),
                barGroups: dist.asMap().entries.map((e) {
                  return BarChartGroupData(
                    x: e.key,
                    barRods: [
                      BarChartRodData(
                        toY: e.value.count.toDouble(),
                        color: _getBarColor(e.key),
                        width: 16,
                        borderRadius: const BorderRadius.vertical(top: Radius.circular(4)),
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

  Widget _buildAtRiskStudents() {
    final students = _data?.atRiskStudents ?? [];
    if (students.isEmpty) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('At-Risk Students', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
        const SizedBox(height: 12),
        ...students.take(5).map((s) => _buildStudentItem(s)),
      ],
    );
  }

  Widget _buildStudentItem(AtRiskStudent student) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.withValues(alpha: 0.05)),
      ),
      child: Row(
        children: [
          CircleAvatar(
            backgroundColor: AppColors.primary.withValues(alpha: 0.1),
            child: Text(student.studentName.substring(0, 1).toUpperCase(), style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold)),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(student.studentName, style: const TextStyle(fontWeight: FontWeight.bold)),
                Text('Avg Score: ${student.averageScore.toStringAsFixed(1)}', style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: (student.warningLevel >= 2 ? AppColors.error : AppColors.warning).withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(
              'Level ${student.warningLevel}',
              style: TextStyle(color: student.warningLevel >= 2 ? AppColors.error : AppColors.warning, fontSize: 11, fontWeight: FontWeight.bold),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRecentWarnings() {
    final warnings = _data?.recentWarnings ?? [];
    if (warnings.isEmpty) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Recent Warnings', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
        const SizedBox(height: 12),
        ...warnings.take(3).map((w) => _buildWarningItem(w)),
      ],
    );
  }

  Widget _buildWarningItem(RecentWarning warning) {
    final color = warning.warningLevel >= 2 ? AppColors.error : AppColors.warning;
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: color.withValues(alpha: 0.1)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(warning.studentName, style: const TextStyle(fontWeight: FontWeight.bold)),
              Text(
                'Level ${warning.warningLevel}',
                style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.bold),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text(warning.message, style: const TextStyle(fontSize: 13, color: AppColors.textSecondary)),
          const SizedBox(height: 8),
          Text(_formatDateTime(warning.createdAt), style: const TextStyle(fontSize: 10, color: AppColors.textLight)),
        ],
      ),
    );
  }

  Widget _buildExamsTab() {
    final exams = _data?.examStatistics ?? [];
    if (exams.isEmpty) return _buildEmptyTab('No exam statistics available');

    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        const Text('Examination Performance', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
        const SizedBox(height: 16),
        ...exams.map((exam) => _buildExamStatsCard(exam)),
      ],
    );
  }

  Widget _buildExamStatsCard(ExamScoreStatistics exam) {
    return Container(
      margin: const EdgeInsets.only(bottom: 20),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 10, offset: const Offset(0, 4)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(exam.examName, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          const SizedBox(height: 4),
          Row(
            children: [
              Text(exam.mode, style: const TextStyle(fontSize: 11, color: AppColors.primary, fontWeight: FontWeight.bold)),
              const Spacer(),
              Text('${exam.totalSubmissions}/${exam.totalStudents} Submissions', style: const TextStyle(fontSize: 11, color: AppColors.textLight)),
            ],
          ),
          const SizedBox(height: 20),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _buildMiniStat('Avg', exam.averageScore.toStringAsFixed(1)),
              _buildMiniStat('High', exam.highestScore.toStringAsFixed(1)),
              _buildMiniStat('Low', exam.lowestScore.toStringAsFixed(1)),
              _buildMiniStat('Pass', '${exam.passRate.toStringAsFixed(0)}%'),
            ],
          ),
          const SizedBox(height: 20),
          const Text('Score Distribution', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.textSecondary)),
          const SizedBox(height: 12),
          _buildMiniDistribution(exam.scoreDistribution),
        ],
      ),
    );
  }

  Widget _buildQuizzesTab() {
    final quizzes = _data?.quizStatistics ?? [];
    if (quizzes.isEmpty) return _buildEmptyTab('No quiz statistics available');

    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        const Text('Quiz Performance', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
        const SizedBox(height: 16),
        ...quizzes.map((quiz) => _buildQuizStatsCard(quiz)),
      ],
    );
  }

  Widget _buildQuizStatsCard(QuizScoreStatistics quiz) {
    return Container(
      margin: const EdgeInsets.only(bottom: 20),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 10, offset: const Offset(0, 4)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(quiz.quizTitle, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          const SizedBox(height: 4),
          Text('${quiz.totalSubmissions} Submissions (${quiz.totalAttempts} total attempts)', style: const TextStyle(fontSize: 11, color: AppColors.textLight)),
          const SizedBox(height: 20),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _buildMiniStat('Avg', quiz.averageScore.toStringAsFixed(1)),
              _buildMiniStat('High', quiz.highestScore.toStringAsFixed(1)),
              _buildMiniStat('Low', quiz.lowestScore.toStringAsFixed(1)),
              _buildMiniStat('Pass', '${quiz.passRate.toStringAsFixed(0)}%'),
            ],
          ),
          const SizedBox(height: 20),
          const Text('Score Distribution', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.textSecondary)),
          const SizedBox(height: 12),
          _buildMiniDistribution(quiz.scoreDistribution),
        ],
      ),
    );
  }

  Widget _buildMiniStat(String label, String value) {
    return Column(
      children: [
        Text(value, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
        Text(label, style: const TextStyle(fontSize: 10, color: AppColors.textLight)),
      ],
    );
  }

  Widget _buildMiniDistribution(List<ScoreDistribution> dist) {
    if (dist.isEmpty) return const SizedBox.shrink();
    final maxCount = dist.map((e) => e.count).reduce((a, b) => a > b ? a : b);
    
    return Row(
      crossAxisAlignment: CrossAxisAlignment.end,
      children: dist.asMap().entries.map((e) {
        final height = maxCount > 0 ? (e.value.count / maxCount) * 40 : 0.0;
        return Expanded(
          child: Column(
            children: [
              Container(
                height: height,
                margin: const EdgeInsets.symmetric(horizontal: 4),
                decoration: BoxDecoration(
                  color: _getBarColor(e.key).withValues(alpha: 0.7),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(height: 4),
              Text(e.value.range, style: const TextStyle(fontSize: 7, color: AppColors.textLight), textAlign: TextAlign.center),
            ],
          ),
        );
      }).toList(),
    );
  }

  Color _getBarColor(int index) {
    if (index <= 1) return AppColors.error;
    if (index <= 3) return AppColors.warning;
    return AppColors.success;
  }

  String _formatDateTime(DateTime dt) {
    return '${dt.day}/${dt.month} ${dt.hour}:${dt.minute.toString().padLeft(2, '0')}';
  }

  Widget _buildShimmerLoading() {
    return Shimmer.fromColors(
      baseColor: Colors.grey[300]!,
      highlightColor: Colors.grey[100]!,
      child: Column(
        children: [
          Container(height: 120, color: Colors.white, margin: const EdgeInsets.all(20)),
          Expanded(
            child: ListView(
              padding: const EdgeInsets.all(20),
              children: List.generate(3, (index) => Container(height: 100, color: Colors.white, margin: const EdgeInsets.only(bottom: 20))),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyTab(String message) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.inbox_rounded, size: 64, color: Colors.grey[300]),
          const SizedBox(height: 16),
          Text(message, style: TextStyle(color: Colors.grey[500], fontSize: 15)),
        ],
      ),
    );
  }
}


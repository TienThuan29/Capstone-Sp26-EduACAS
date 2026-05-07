import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:shimmer/shimmer.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../services/student_dashboard_service.dart';

class StudentDashboardTab extends StatefulWidget {
  final String classroomId;

  const StudentDashboardTab({super.key, required this.classroomId});

  @override
  State<StudentDashboardTab> createState() => _StudentDashboardTabState();
}

class _StudentDashboardTabState extends State<StudentDashboardTab> {
  StudentDashboardData? _data;
  bool _isLoading = true;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    if (!mounted) return;
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final data = await StudentDashboardService.getStudentDashboardData(widget.classroomId);
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

    return RefreshIndicator(
      onRefresh: _loadData,
      color: AppColors.primary,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _buildHeader(),
          const SizedBox(height: 20),
          _buildOverviewCards(),
          const SizedBox(height: 24),
          _buildScoreTrend(),
          const SizedBox(height: 24),
          _buildSubmissionStats(),
          const SizedBox(height: 24),
          _buildExamsList(),
          const SizedBox(height: 24),
          _buildWarningsList(),
          const SizedBox(height: 40),
        ],
      ),
    );
  }

  Widget _buildHeader() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Course Dashboard',
          style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
        ),
        const SizedBox(height: 4),
        Text(
          'Performance overview for ${_data?.overview.className ?? 'this class'}',
          style: const TextStyle(fontSize: 14, color: AppColors.textSecondary),
        ),
      ],
    );
  }

  Widget _buildOverviewCards() {
    final overview = _data!.overview;
    return Column(
      children: [
        Row(
          children: [
            Expanded(
              child: _buildStatCard(
                'My Average Score',
                overview.averageScore.toStringAsFixed(1),
                '/10',
                Icons.analytics_outlined,
                _getScoreColor(overview.averageScore),
                trend: overview.trend,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildStatCard(
                'Class Average',
                (overview.averageScore - overview.classAverage >= 0 ? '+' : '') + 
                (overview.averageScore - overview.classAverage).toStringAsFixed(1),
                '',
                Icons.group_outlined,
                (overview.averageScore >= overview.classAverage) ? AppColors.success : AppColors.error,
                subtitle: 'vs ${overview.classAverage.toStringAsFixed(1)}',
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _buildStatCard(
                'My Rank',
                '#${overview.myRank}',
                '/ ${overview.totalStudents}',
                Icons.emoji_events_outlined,
                AppColors.primary,
                subtitle: 'Top ${overview.percentile.toStringAsFixed(0)}%',
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildStatCard(
                'Submission Rate',
                '${overview.submissionRate.toStringAsFixed(0)}%',
                '',
                Icons.check_circle_outline,
                AppColors.accent,
                subtitle: '${overview.submittedExams}/${overview.totalExams} exams',
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildStatCard(String title, String value, String unit, IconData icon, Color color, {String? trend, String? subtitle}) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 10, offset: const Offset(0, 4)),
        ],
        border: Border.all(color: Colors.grey.withValues(alpha: 0.05)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(
                  title,
                  style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: AppColors.textSecondary),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              Icon(icon, size: 16, color: color.withValues(alpha: 0.8)),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            crossAxisAlignment: CrossAxisAlignment.baseline,
            textBaseline: TextBaseline.alphabetic,
            children: [
              Text(
                value,
                style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: color),
              ),
              if (unit.isNotEmpty) ...[
                const SizedBox(width: 2),
                Text(unit, style: const TextStyle(fontSize: 12, color: AppColors.textLight)),
              ],
            ],
          ),
          if (trend != null) ...[
            const SizedBox(height: 4),
            Row(
              children: [
                Icon(
                  trend == 'improving' ? Icons.trending_up : (trend == 'declining' ? Icons.trending_down : Icons.trending_flat),
                  size: 14,
                  color: trend == 'improving' ? AppColors.success : (trend == 'declining' ? AppColors.error : Colors.grey),
                ),
                const SizedBox(width: 4),
                Text(
                  trend.toUpperCase(),
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                    color: trend == 'improving' ? AppColors.success : (trend == 'declining' ? AppColors.error : Colors.grey),
                  ),
                ),
              ],
            ),
          ],
          if (subtitle != null) ...[
            const SizedBox(height: 4),
            Text(subtitle, style: const TextStyle(fontSize: 11, color: AppColors.textLight)),
          ],
        ],
      ),
    );
  }

  Widget _buildScoreTrend() {
    final trend = _data!.scoreTrend;
    if (trend.isEmpty) return const SizedBox.shrink();

    double maxScore = 10.0;
    for (var s in trend) {
      if (s.score > maxScore) maxScore = s.score;
    }

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
          const Text('Score Trend', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 24),
          SizedBox(
            height: 180,
            child: BarChart(
              BarChartData(
                alignment: BarChartAlignment.spaceAround,
                maxY: maxScore,
                barTouchData: BarTouchData(
                  enabled: true,
                  touchTooltipData: BarTouchTooltipData(
                    getTooltipColor: (_) => Colors.black87,
                    tooltipPadding: const EdgeInsets.all(8),
                    tooltipMargin: 8,
                    getTooltipItem: (group, groupIndex, rod, rodIndex) {
                      return BarTooltipItem(
                        '${trend[groupIndex].examName}\n',
                        const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12),
                        children: [
                          TextSpan(
                            text: rod.toY.toStringAsFixed(1),
                            style: const TextStyle(color: AppColors.primaryLight, fontSize: 14, fontWeight: FontWeight.w900),
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
                      reservedSize: 30,
                      getTitlesWidget: (value, meta) {
                        int index = value.toInt();
                        if (index < 0 || index >= trend.length) return const SizedBox.shrink();
                        String name = trend[index].examName;
                        if (name.length > 6) name = '${name.substring(0, 5)}..';
                        return SideTitleWidget(
                          meta: meta,
                          space: 8,
                          child: Text(name, style: const TextStyle(fontSize: 9, color: AppColors.textLight)),
                        );
                      },
                    ),
                  ),
                  leftTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      reservedSize: 30,
                      getTitlesWidget: (value, meta) {
                        if (value % 2.5 != 0) return const SizedBox.shrink();
                        return SideTitleWidget(
                          meta: meta,
                          child: Text(value.toStringAsFixed(1), style: const TextStyle(fontSize: 9, color: AppColors.textLight)),
                        );
                      },
                    ),
                  ),
                  topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                ),
                gridData: FlGridData(
                  show: true,
                  drawVerticalLine: false,
                  getDrawingHorizontalLine: (value) => FlLine(color: Colors.grey.withValues(alpha: 0.1), strokeWidth: 1),
                ),
                borderData: FlBorderData(show: false),
                barGroups: trend.asMap().entries.map((e) {
                  return BarChartGroupData(
                    x: e.key,
                    barRods: [
                      BarChartRodData(
                        toY: e.value.score,
                        color: _getScoreColor(e.value.score),
                        width: 16,
                        borderRadius: const BorderRadius.vertical(top: Radius.circular(4)),
                        backDrawRodData: BackgroundBarChartRodData(
                          show: true,
                          toY: maxScore,
                          color: Colors.grey.withValues(alpha: 0.05),
                        ),
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

  Widget _buildSubmissionStats() {
    final stats = _data!.submissionStats;
    if (stats == null) return const SizedBox.shrink();

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
          const Text('Submission Statistics', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Completed Exams', style: TextStyle(color: AppColors.textSecondary)),
              Text('${stats.submittedExams} / ${stats.totalExams}', style: const TextStyle(fontWeight: FontWeight.bold)),
            ],
          ),
          const SizedBox(height: 8),
          ClipRRect(
            borderRadius: BorderRadius.circular(10),
            child: LinearProgressIndicator(
              value: stats.totalExams > 0 ? stats.submittedExams / stats.totalExams : 0,
              backgroundColor: Colors.grey.withValues(alpha: 0.1),
              valueColor: const AlwaysStoppedAnimation<Color>(AppColors.primary),
              minHeight: 10,
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(color: Colors.grey.withValues(alpha: 0.05), borderRadius: BorderRadius.circular(12)),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Submission Rate', style: TextStyle(fontSize: 10, color: AppColors.textLight)),
                      const SizedBox(height: 4),
                      Text('${stats.submissionRate.toStringAsFixed(0)}%', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(color: Colors.grey.withValues(alpha: 0.05), borderRadius: BorderRadius.circular(12)),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Late Submissions', style: TextStyle(fontSize: 10, color: AppColors.textLight)),
                      const SizedBox(height: 4),
                      Text(
                        stats.isLate ? 'YES' : 'NONE',
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: stats.isLate ? AppColors.error : AppColors.success),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
          if (stats.latestSubmissionTime != null) ...[
            const SizedBox(height: 12),
            Row(
              children: [
                const Icon(Icons.access_time, size: 14, color: AppColors.textLight),
                const SizedBox(width: 4),
                Text(
                  'Latest: ${_formatTimeAgo(stats.latestSubmissionTime!)}',
                  style: const TextStyle(fontSize: 11, color: AppColors.textLight),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildExamsList() {
    final exams = _data!.examScores;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text('My Exams', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            Text(
              '${exams.where((e) => e.status == 'GRADED').length} completed',
              style: const TextStyle(fontSize: 12, color: AppColors.textLight),
            ),
          ],
        ),
        const SizedBox(height: 12),
        if (exams.isEmpty)
          const Center(child: Padding(padding: EdgeInsets.all(20), child: Text('No exams found', style: TextStyle(color: AppColors.textLight))))
        else
          ...exams.take(5).map((exam) => _buildExamItem(exam)),
      ],
    );
  }

  Widget _buildExamItem(StudentExamScore exam) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.withValues(alpha: 0.05)),
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () {}, // Detail navigation could be added here
          borderRadius: BorderRadius.circular(16),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(exam.examName, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15), maxLines: 1, overflow: TextOverflow.ellipsis),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(color: Colors.grey.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(4)),
                            child: Text(exam.mode, style: const TextStyle(fontSize: 10, color: AppColors.textSecondary)),
                          ),
                          const SizedBox(width: 8),
                          if (exam.submittedAt != null)
                            Text(_formatTimeAgo(exam.submittedAt!), style: const TextStyle(fontSize: 10, color: AppColors.textLight)),
                          if (exam.rank > 0) ...[
                            const SizedBox(width: 8),
                            Text('Rank #${exam.rank}', style: const TextStyle(fontSize: 10, color: AppColors.primary, fontWeight: FontWeight.bold)),
                          ],
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 12),
                if (exam.status == 'GRADED')
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.baseline,
                        textBaseline: TextBaseline.alphabetic,
                        children: [
                          Text(exam.score.toStringAsFixed(1), style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: _getScoreColor(exam.score))),
                          Text('/${exam.totalMark.toInt()}', style: const TextStyle(fontSize: 10, color: AppColors.textLight)),
                        ],
                      ),
                      const Icon(Icons.check_circle, size: 14, color: AppColors.success),
                    ],
                  )
                else if (exam.status == 'NOT_SUBMITTED')
                  const Icon(Icons.cancel_outlined, color: Colors.grey, size: 24)
                else
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(exam.status, style: const TextStyle(fontSize: 12, color: Colors.orange, fontWeight: FontWeight.bold)),
                      const Icon(Icons.pending_outlined, size: 14, color: Colors.orange),
                    ],
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildWarningsList() {
    final warnings = _data!.warnings;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text('My Warnings', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            if (warnings.any((w) => !w.isRead))
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(color: Colors.amber.withValues(alpha: 0.2), borderRadius: BorderRadius.circular(10)),
                child: Text('${warnings.where((w) => !w.isRead).length} Unread', style: const TextStyle(fontSize: 10, color: Colors.amber, fontWeight: FontWeight.bold)),
              ),
          ],
        ),
        const SizedBox(height: 12),
        if (warnings.isEmpty)
          const Center(child: Padding(padding: EdgeInsets.all(20), child: Text('No warnings in this class', style: TextStyle(color: AppColors.textLight))))
        else
          ...warnings.take(3).map((w) => _buildWarningItem(w)),
      ],
    );
  }

  Widget _buildWarningItem(StudentWarning warning) {
    final color = warning.warningLevel == 2 ? AppColors.error : AppColors.warning;
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: warning.isRead ? Colors.white : color.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: warning.isRead ? Colors.grey.withValues(alpha: 0.05) : color.withValues(alpha: 0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Row(
                  children: [
                    Flexible(
                      child: Text(
                        _data?.overview.className ?? 'Classroom',
                        style: const TextStyle(fontWeight: FontWeight.bold),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    if (!warning.isRead) ...[
                      const SizedBox(width: 6),
                      Container(width: 6, height: 6, decoration: const BoxDecoration(color: Colors.blue, shape: BoxShape.circle)),
                    ],
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(color: color.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(6)),
                child: Text('Level ${warning.warningLevel}', style: TextStyle(fontSize: 10, color: color, fontWeight: FontWeight.bold)),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(warning.reason, style: const TextStyle(fontSize: 13, color: AppColors.textSecondary)),
          const SizedBox(height: 8),
          Text(_formatTimeAgo(warning.createdAt), style: const TextStyle(fontSize: 10, color: AppColors.textLight)),
        ],
      ),
    );
  }

  String _formatTimeAgo(DateTime date) {
    final now = DateTime.now();
    final diff = now.difference(date);
    if (diff.inMinutes < 60) return '${diff.inMinutes} mins ago';
    if (diff.inHours < 24) return '${diff.inHours} hours ago';
    return '${diff.inDays} days ago';
  }

  Color _getScoreColor(double score) {
    if (score >= 9) return Colors.green[700]!;
    if (score >= 7) return Colors.blue[700]!;
    if (score >= 5) return Colors.orange[700]!;
    return Colors.red[700]!;
  }

  Widget _buildShimmerLoading() {
    return Shimmer.fromColors(
      baseColor: Colors.grey[300]!,
      highlightColor: Colors.grey[100]!,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Container(height: 30, width: 200, color: Colors.white, margin: const EdgeInsets.only(bottom: 20)),
          GridView.count(
            crossAxisCount: 2,
            shrinkWrap: true,
            crossAxisSpacing: 12,
            mainAxisSpacing: 12,
            childAspectRatio: 1.5,
            children: List.generate(4, (index) => Container(decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16)))),
          ),
          const SizedBox(height: 24),
          Container(height: 220, decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20))),
          const SizedBox(height: 24),
          Container(height: 150, decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20))),
        ],
      ),
    );
  }
}

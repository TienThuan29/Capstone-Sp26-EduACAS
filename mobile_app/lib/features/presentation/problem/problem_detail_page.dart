import 'package:flutter/material.dart';
import 'package:mobile/core/theme/app_colors.dart';
import 'package:mobile/features/models/problem.dart';
import 'package:mobile/features/services/problem_service.dart';

class ProblemDetailPage extends StatefulWidget {
  final String problemId;

  const ProblemDetailPage({super.key, required this.problemId});

  @override
  State<ProblemDetailPage> createState() => _ProblemDetailPageState();
}

class _ProblemDetailPageState extends State<ProblemDetailPage> {
  Problem? _problem;
  bool _isLoading = true;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _loadProblem();
  }

  Future<void> _loadProblem() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final problem = await ProblemService.getById(widget.problemId);
      setState(() {
        _problem = problem;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _errorMessage = e.toString();
        _isLoading = false;
      });
    }
  }

  Color _difficultyColor(Difficulty d) {
    switch (d) {
      case Difficulty.easy:
        return AppColors.success;
      case Difficulty.medium:
        return AppColors.warning;
      case Difficulty.hard:
        return AppColors.error;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_problem?.title ?? 'Problem Detail'),
        elevation: 0,
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_errorMessage != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 64, color: AppColors.error),
            const SizedBox(height: 16),
            Text('Failed to load problem',
                style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 8),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 32),
              child: Text(
                _errorMessage!,
                style: Theme.of(context)
                    .textTheme
                    .bodyMedium
                    ?.copyWith(color: AppColors.textSecondary),
                textAlign: TextAlign.center,
              ),
            ),
            const SizedBox(height: 16),
            ElevatedButton.icon(
              onPressed: _loadProblem,
              icon: const Icon(Icons.refresh),
              label: const Text('Retry'),
            ),
          ],
        ),
      );
    }

    if (_problem == null) {
      return const Center(child: Text('Problem not found'));
    }

    final problem = _problem!;
    final diffColor = _difficultyColor(problem.difficulty);

    return RefreshIndicator(
      onRefresh: _loadProblem,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ── Title & Difficulty ──
            _buildSection(
              child: Column(
                children: [
                  Text(
                    problem.title,
                    textAlign: TextAlign.center,
                    style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                  const SizedBox(height: 12),
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 14, vertical: 5),
                    decoration: BoxDecoration(
                      color: diffColor.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Text(
                      difficultyLabel(problem.difficulty),
                      style: TextStyle(
                        color: diffColor,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 16),

            // ── Test Cases ──
            if (problem.testCases.isNotEmpty) ...[
              _buildSectionHeader(
                icon: Icons.checklist,
                title: 'Test Cases (${problem.testCases.length})',
              ),
              const SizedBox(height: 8),
              ...problem.testCases.asMap().entries.map((entry) {
                final idx = entry.key;
                final tc = entry.value;
                return _buildTestCaseCard(idx + 1, tc);
              }),
              const SizedBox(height: 16),
            ],

            // ── Content ──
            if (problem.content.trim().isNotEmpty) ...[
              _buildSectionHeader(
                icon: Icons.description_outlined,
                title: 'Content',
              ),
              const SizedBox(height: 8),
              _buildSection(
                child: SelectableText(
                  problem.content,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        height: 1.6,
                      ),
                ),
              ),
              const SizedBox(height: 16),
            ],

            // ── Attachment info ──
            if (problem.fileName.isNotEmpty) ...[
              _buildSectionHeader(
                icon: Icons.attach_file,
                title: 'Attachment',
              ),
              const SizedBox(height: 8),
              _buildSection(
                child: Row(
                  children: [
                    const Icon(Icons.picture_as_pdf,
                        color: AppColors.error, size: 28),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        problem.fileName,
                        style: Theme.of(context).textTheme.bodyMedium,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
            ],

            // ── Code Template ──
            if (problem.codeTemplate.trim().isNotEmpty) ...[
              _buildSectionHeader(
                icon: Icons.code,
                title: 'Code Template',
              ),
              const SizedBox(height: 8),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFF1E1E2E),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: SelectableText(
                    problem.codeTemplate,
                    style: const TextStyle(
                      fontFamily: 'monospace',
                      fontSize: 13,
                      color: Color(0xFFCDD6F4),
                      height: 1.5,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 16),
            ],

            // ── Dates ──
            _buildSectionHeader(icon: Icons.info_outline, title: 'Info'),
            const SizedBox(height: 8),
            _buildSection(
              child: Column(
                children: [
                  _buildInfoRow('Created', _formatDate(problem.createdDate)),
                  const SizedBox(height: 6),
                  _buildInfoRow('Updated', _formatDate(problem.updatedDate)),
                ],
              ),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  // ─── Helpers ───────────────────────────────────────────────────────

  Widget _buildSection({required Widget child}) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.backgroundWhite,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: child,
    );
  }

  Widget _buildSectionHeader({required IconData icon, required String title}) {
    return Row(
      children: [
        Icon(icon, size: 20, color: AppColors.primary),
        const SizedBox(width: 8),
        Text(
          title,
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
                color: AppColors.primary,
              ),
        ),
      ],
    );
  }

  Widget _buildTestCaseCard(int index, TestCase tc) {
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      elevation: 1,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Test case $index',
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                ),
                if (tc.isPublic)
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(
                      color: AppColors.info.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Text(
                      'Public',
                      style: TextStyle(
                        color: AppColors.info,
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 10),
            // Input
            _buildCodeLabel('INPUT'),
            const SizedBox(height: 4),
            _buildCodeBlock(tc.inputData.isNotEmpty ? tc.inputData : '—'),
            const SizedBox(height: 10),
            // Expected Output
            _buildCodeLabel('EXPECTED OUTPUT'),
            const SizedBox(height: 4),
            _buildCodeBlock(
                tc.expectedOutput.isNotEmpty ? tc.expectedOutput : '—'),
          ],
        ),
      ),
    );
  }

  Widget _buildCodeLabel(String label) {
    return Text(
      label,
      style: TextStyle(
        fontSize: 10,
        fontWeight: FontWeight.w700,
        letterSpacing: 1.2,
        color: AppColors.textSecondary,
      ),
    );
  }

  Widget _buildCodeBlock(String text) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: AppColors.background,
        borderRadius: BorderRadius.circular(6),
      ),
      child: SelectableText(
        text,
        style: const TextStyle(
          fontFamily: 'monospace',
          fontSize: 13,
          height: 1.4,
        ),
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Row(
      children: [
        SizedBox(
          width: 80,
          child: Text(
            label,
            style: Theme.of(context)
                .textTheme
                .bodySmall
                ?.copyWith(color: AppColors.textSecondary),
          ),
        ),
        Expanded(
          child: Text(value, style: Theme.of(context).textTheme.bodyMedium),
        ),
      ],
    );
  }

  String _formatDate(String dateStr) {
    try {
      final dt = DateTime.parse(dateStr);
      return '${dt.day.toString().padLeft(2, '0')}/${dt.month.toString().padLeft(2, '0')}/${dt.year} ${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
    } catch (_) {
      return dateStr;
    }
  }
}

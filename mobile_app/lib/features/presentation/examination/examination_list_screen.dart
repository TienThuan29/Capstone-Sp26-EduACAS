import 'package:flutter/material.dart';
import 'package:mobile/core/theme/app_colors.dart';
import 'package:mobile/core/widgets/background.dart';
import 'package:mobile/features/models/examination/examination.dart';
import 'package:mobile/features/presentation/components/sidebar.dart';
import 'package:mobile/core/storage/token_storage.dart';
import 'examination_controller.dart';

class ExaminationListScreen extends StatefulWidget {
  const ExaminationListScreen({super.key});

  @override
  State<ExaminationListScreen> createState() => _ExaminationListScreenState();
}

class _ExaminationListScreenState extends State<ExaminationListScreen> {
  final _controller = ExaminationController();
  final _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadExaminations();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadExaminations() async {
    await _controller.fetchExaminations(() {
      if (mounted) setState(() {});
    });
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<String?>(
      future: TokenStorage.getUserRole(),
      builder: (context, snapshot) {
        final role = snapshot.data?.toUpperCase();
        int index = 2; // Default for Student
        if (role == 'LECTURER' || role == 'ADMIN') {
          index = 1;
        }
        
        return SidebarScaffold(
          selectedIndex: index,
          child: Stack(
            children: [
              const GradientBackground(),
              SafeArea(
                child: Column(
                  children: [
                    _buildHeader(),
                    Expanded(
                      child: _controller.isLoading
                          ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
                          : _controller.errorMessage != null
                              ? _buildErrorState()
                              : _buildGroupedExaminationList(),
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildHeader() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(24, 24, 24, 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Examinations',
            style: TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.bold,
              color: AppColors.primary,
            ),
          ),
          const SizedBox(height: 16),
          // Search Bar
          TextField(
            controller: _searchController,
            onChanged: (value) => _controller.updateSearchQuery(value, () => setState(() {})),
            decoration: InputDecoration(
              hintText: 'Search exams or classes...',
              prefixIcon: const Icon(Icons.search, color: Colors.grey),
              filled: true,
              fillColor: Colors.white.withValues(alpha: 0.8),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(15),
                borderSide: BorderSide.none,
              ),
              contentPadding: const EdgeInsets.symmetric(vertical: 0),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildGroupedExaminationList() {
    final groupedExams = _controller.getGroupedExaminations();

    if (groupedExams.isEmpty) {
      return _buildEmptyState();
    }

    return RefreshIndicator(
      onRefresh: _loadExaminations,
      color: AppColors.primary,
      child: ListView.builder(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
        itemCount: _calculateTotalItems(groupedExams),
        itemBuilder: (context, index) {
          return _buildItemAt(index, groupedExams);
        },
      ),
    );
  }

  int _calculateTotalItems(Map<String, List<Examination>> grouped) {
    int count = 0;
    for (var list in grouped.values) {
      count += 1; // Header
      count += list.length;
    }
    return count;
  }

  Widget _buildItemAt(int index, Map<String, List<Examination>> grouped) {
    int currentIndex = 0;
    for (var entry in grouped.entries) {
      // Check for header
      if (currentIndex == index) {
        return _buildSectionHeader(entry.key);
      }
      currentIndex++;

      if (index < currentIndex + entry.value.length) {
        final exam = entry.value[index - currentIndex];
        return _ExaminationCard(
          examination: exam,
          onTap: () => _showExaminationDetailModal(exam),
        );
      }
      currentIndex += entry.value.length;
    }
    return const SizedBox.shrink();
  }

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.only(top: 24, bottom: 12, left: 4),
      child: Text(
        title.toUpperCase(),
        style: TextStyle(
          color: Colors.grey[700],
          fontSize: 13,
          fontWeight: FontWeight.bold,
          letterSpacing: 1.2,
        ),
      ),
    );
  }

  Widget _buildErrorState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 64, color: AppColors.error),
            const SizedBox(height: 16),
            Text(
              _controller.errorMessage ?? 'An error occurred',
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 16, color: Colors.grey),
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: _loadExaminations,
              child: const Text('Try Again'),
            ),
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
          Icon(Icons.assignment_outlined, size: 80, color: Colors.grey[300]),
          const SizedBox(height: 16),
          Text(
            _controller.searchQuery.isEmpty 
                ? 'No examinations found'
                : 'No results for "${_controller.searchQuery}"',
            style: TextStyle(fontSize: 18, color: Colors.grey[600]),
          ),
          const SizedBox(height: 12),
          if (_controller.searchQuery.isNotEmpty)
            TextButton(
              onPressed: () {
                _searchController.clear();
                _controller.updateSearchQuery('', () => setState(() {}));
              },
              child: const Text('Clear search'),
            ),
        ],
      ),
    );
  }

  void _showExaminationDetailModal(Examination exam) {
    showDialog(
      context: context,
      builder: (context) => _ExaminationDetailModal(examination: exam),
    );
  }
}

class _ExaminationCard extends StatelessWidget {
  final Examination examination;
  final VoidCallback onTap;

  const _ExaminationCard({
    required this.examination,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(20),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: AppColors.primary.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.school, size: 14, color: AppColors.primary),
                        const SizedBox(width: 4),
                        Text(
                          examination.classroom.className,
                          style: const TextStyle(
                            color: AppColors.primary,
                            fontWeight: FontWeight.bold,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ),
                  _buildStatusBadge(examination.status),
                ],
              ),
              const SizedBox(height: 12),
              Text(
                examination.examName,
                style: const TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: Colors.black87,
                ),
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  const Icon(Icons.code, size: 16, color: Colors.grey),
                  const SizedBox(width: 4),
                  Text(
                    'Language: ${examination.programmingLanguage.name}',
                    style: const TextStyle(color: Colors.grey, fontSize: 13),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                   const Icon(Icons.schedule, size: 16, color: Colors.grey),
                   const SizedBox(width: 4),
                   Text(
                     'Starts: ${_formatDateTime(examination.startDatetime)}',
                     style: const TextStyle(
                       color: Colors.grey,
                       fontSize: 13,
                       fontWeight: FontWeight.w500,
                     ),
                   ),
                ],
              ),
              const SizedBox(height: 16),
              const Divider(height: 1),
              const SizedBox(height: 12),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.star_outline, size: 16, color: Colors.orange),
                      const SizedBox(width: 4),
                      Text(
                        'Total Mark: ${examination.totalMark}',
                        style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w500,
                          color: Colors.black54,
                        ),
                      ),
                    ],
                  ),
                  const Icon(Icons.arrow_forward_ios, size: 14, color: Colors.grey),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatusBadge(int status) {
    Color color;
    String label;
    
    switch (status) {
      case 1:
        color = Colors.green;
        label = 'Active';
        break;
      case 2:
        color = Colors.orange;
        label = 'Upcoming';
        break;
      default:
        color = Colors.grey;
        label = 'Ended';
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: color,
          fontSize: 10,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }

  String _formatDateTime(String dateTimeStr) {
    if (dateTimeStr.isEmpty) return 'N/A';
    try {
      final dt = DateTime.parse(dateTimeStr);
      return '${dt.day}/${dt.month} ${dt.hour}:${dt.minute.toString().padLeft(2, '0')}';
    } catch (e) {
      return dateTimeStr.split('T')[0];
    }
  }
}

class _ExaminationDetailModal extends StatelessWidget {
  final Examination examination;

  const _ExaminationDetailModal({required this.examination});

  @override
  Widget build(BuildContext context) {
    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)),
      child: Container(
        constraints: BoxConstraints(maxWidth: 500, maxHeight: MediaQuery.of(context).size.height * 0.8),
        padding: const EdgeInsets.all(24),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Assessment Detail',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                      color: Colors.grey,
                      letterSpacing: 1.2,
                    ),
                  ),
                  IconButton(
                    onPressed: () => Navigator.pop(context),
                    icon: const Icon(Icons.close),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Text(
                examination.examName,
                style: const TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: AppColors.primary,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Class: ${examination.classroom.className}',
                style: TextStyle(
                  fontSize: 16,
                  color: Colors.grey[600],
                  fontWeight: FontWeight.w500,
                ),
              ),
              const SizedBox(height: 24),
              const Divider(),
              const SizedBox(height: 16),
              _buildDetailRow(Icons.code, 'Language', examination.programmingLanguage.name),
              _buildDetailRow(Icons.star, 'Total Mark', '${examination.totalMark} pts'),
              _buildDetailRow(Icons.schedule, 'Start Time', _formatFullDateTime(examination.startDatetime)),
              _buildDetailRow(Icons.timer_off, 'End Time', _formatFullDateTime(examination.endDatetime)),
              _buildDetailRow(Icons.info_outline, 'Status', _getStatusLabel(examination.status)),
              _buildDetailRow(Icons.settings_suggest, 'Mode', _getModeLabel(examination.mode)),
              const SizedBox(height: 24),
              const Text(
                'Points Breakdown',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Colors.black87,
                ),
              ),
              const SizedBox(height: 12),
              ListView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: examination.examProblems.length,
                itemBuilder: (context, index) {
                  final problem = examination.examProblems[index];
                  return Padding(
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(6),
                              decoration: BoxDecoration(
                                color: AppColors.primary.withValues(alpha: 0.1),
                                shape: BoxShape.circle,
                              ),
                              child: Text(
                                '${index + 1}',
                                style: const TextStyle(
                                  color: AppColors.primary,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 12,
                                ),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Text(
                              'Problem ${index + 1}',
                              style: const TextStyle(
                                fontSize: 15,
                                color: Colors.black54,
                              ),
                            ),
                          ],
                        ),
                        Text(
                          '${problem.mark} pts',
                          style: const TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.bold,
                            color: AppColors.primary,
                          ),
                        ),
                      ],
                    ),
                  );
                },
              ),
              const SizedBox(height: 32),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () => Navigator.pop(context),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(15),
                    ),
                  ),
                  child: const Text(
                    'Got it',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildDetailRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          Icon(icon, size: 20, color: Colors.grey[400]),
          const SizedBox(width: 12),
          Text(
            '$label: ',
            style: TextStyle(color: Colors.grey[600], fontSize: 15, fontWeight: FontWeight.w500),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(
                color: Colors.black87,
                fontWeight: FontWeight.bold,
                fontSize: 15,
              ),
            ),
          ),
        ],
      ),
    );
  }

  String _formatFullDateTime(String dateTimeStr) {
    if (dateTimeStr.isEmpty) return 'N/A';
    try {
      final dt = DateTime.parse(dateTimeStr);
      return '${dt.day.toString().padLeft(2, '0')}/${dt.month.toString().padLeft(2, '0')}/${dt.year} ${dt.hour}:${dt.minute.toString().padLeft(2, '0')}';
    } catch (e) {
      return dateTimeStr;
    }
  }

  String _getStatusLabel(int status) {
    switch (status) {
      case 0: return 'Pending';
      case 1: return 'Ongoing';
      case 2: return 'Completed';
      default: return 'Unknown';
    }
  }

  String _getModeLabel(int mode) {
    switch (mode) {
      case 0: return 'Practical';
      case 1: return 'Examination';
      default: return 'Practice';
    }
  }
}

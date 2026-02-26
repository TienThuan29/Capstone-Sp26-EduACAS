import 'package:flutter/material.dart';
import 'package:mobile/core/theme/app_colors.dart';
import 'package:mobile/core/widgets/background.dart';
import 'package:mobile/features/models/discussion_issue.dart';
import 'package:mobile/features/services/discussion_provider.dart';
import 'package:mobile/features/presentation/student/discussion_detail_screen.dart';

class StudentDiscussionsTab extends StatefulWidget {
  final String classroomId;
  final String classroomName;

  const StudentDiscussionsTab({
    super.key,
    required this.classroomId,
    required this.classroomName,
  });

  @override
  State<StudentDiscussionsTab> createState() => _StudentDiscussionsTabState();
}

class _StudentDiscussionsTabState extends State<StudentDiscussionsTab> {
  final _controller = DiscussionProvider();
  final _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadDiscussions();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadDiscussions() async {
    await _controller.fetchDiscussions(
      () { if (mounted) setState(() {}); },
      classId: widget.classroomId,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.transparent,
      body: Stack(
        children: [
          const GradientBackground(),
          Column(
            children: [
              _buildSearchBar(),
              _buildStatsBar(),
              Expanded(
                child: _controller.isLoading
                    ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
                    : _controller.errorMessage != null
                        ? _buildErrorState()
                        : _buildDiscussionList(),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildSearchBar() {
    return Container(
      padding: const EdgeInsets.fromLTRB(24, 16, 24, 12),
      child: TextField(
        controller: _searchController,
        onChanged: (value) => _controller.updateSearchQuery(value, () => setState(() {})),
        decoration: InputDecoration(
          hintText: 'Search discussions...',
          hintStyle: const TextStyle(color: AppColors.textLight),
          prefixIcon: const Icon(Icons.search, color: AppColors.textSecondary),
          suffixIcon: _controller.searchQuery.isNotEmpty
              ? IconButton(
                  icon: const Icon(Icons.clear, color: AppColors.textSecondary),
                  onPressed: () {
                    _searchController.clear();
                    _controller.updateSearchQuery('', () => setState(() {}));
                  },
                )
              : null,
          filled: true,
          fillColor: Colors.white.withOpacity(0.8),
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(15),
            borderSide: BorderSide.none,
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(15),
            borderSide: BorderSide.none,
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(15),
            borderSide: const BorderSide(color: AppColors.primary, width: 1.5),
          ),
        ),
      ),
    );
  }

  Widget _buildStatsBar() {
    final filtered = _controller.getFilteredDiscussions();
    return Padding(
      padding: const EdgeInsets.fromLTRB(24, 0, 24, 12),
      child: Row(
        children: [
          _StatChip(
            icon: Icons.forum,
            label: '${filtered.length} issues',
            color: AppColors.primary,
          ),
          const SizedBox(width: 12),
          _StatChip(
            icon: Icons.comment,
            label: '${filtered.fold<int>(0, (sum, i) => sum + i.commentCount)} total comments',
            color: Colors.orange,
          ),
        ],
      ),
    );
  }

  Widget _buildDiscussionList() {
    final filtered = _controller.getFilteredDiscussions();

    if (filtered.isEmpty) {
      return _buildEmptyState();
    }

    return RefreshIndicator(
      onRefresh: _loadDiscussions,
      color: AppColors.primary,
      child: ListView.builder(
        padding: const EdgeInsets.symmetric(horizontal: 20),
        itemCount: filtered.length,
        itemBuilder: (context, index) => _DiscussionCard(discussion: filtered[index]),
      ),
    );
  }

  Widget _buildErrorState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.error_outline, size: 64, color: AppColors.error),
          const SizedBox(height: 16),
          const Text('Error loading discussions', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          Text(_controller.errorMessage!, style: const TextStyle(color: Colors.grey), textAlign: TextAlign.center),
          const SizedBox(height: 24),
          ElevatedButton(onPressed: _loadDiscussions, child: const Text('Try Again')),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.forum_outlined, size: 80, color: Colors.grey),
          const SizedBox(height: 16),
          Text(
            _controller.searchQuery.isEmpty 
                ? 'No discussions for this class'
                : 'No results for "${_controller.searchQuery}"',
            style: const TextStyle(fontSize: 18, color: Colors.grey),
          ),
        ],
      ),
    );
  }
}

class _DiscussionCard extends StatelessWidget {
  final DiscussionIssue discussion;

  const _DiscussionCard({required this.discussion});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      elevation: 1,
      shadowColor: Colors.black12,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      child: InkWell(
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => StudentDiscussionDetailScreen(issue: discussion),
            ),
          );
        },
        borderRadius: BorderRadius.circular(14),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  CircleAvatar(
                    radius: 18,
                    backgroundColor: AppColors.primary.withOpacity(0.15),
                    child: Text(
                      discussion.authorName.isNotEmpty ? discussion.authorName[0].toUpperCase() : '?',
                      style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          discussion.title,
                          style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: AppColors.textPrimary),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 4),
                        Row(
                          children: [
                            Text(
                              discussion.authorName,
                              style: const TextStyle(fontSize: 11, color: AppColors.primary, fontWeight: FontWeight.w500),
                            ),
                            const SizedBox(width: 8),
                            Text(
                              _formatTimeAgo(discussion.createdDate),
                              style: const TextStyle(fontSize: 11, color: AppColors.textLight),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              Text(
                discussion.content,
                style: const TextStyle(fontSize: 13, color: AppColors.textSecondary, height: 1.4),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  const Icon(Icons.chat_bubble_outline, size: 14, color: AppColors.textLight),
                  const SizedBox(width: 4),
                  Text('${discussion.commentCount}', style: const TextStyle(fontSize: 12, color: AppColors.textLight)),
                  const Spacer(),
                  const Icon(Icons.arrow_forward_ios, size: 12, color: Colors.grey),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _formatTimeAgo(DateTime date) {
    final duration = DateTime.now().difference(date);
    if (duration.inDays > 7) return '${date.day}/${date.month}';
    if (duration.inDays > 0) return '${duration.inDays}d ago';
    if (duration.inHours > 0) return '${duration.inHours}h ago';
    if (duration.inMinutes > 0) return '${duration.inMinutes}m ago';
    return 'Just now';
  }
}

class _StatChip extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;

  const _StatChip({required this.icon, required this.label, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(20)),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: color),
          const SizedBox(width: 6),
          Text(label, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: color)),
        ],
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:mobile/core/theme/app_colors.dart';
import 'package:mobile/core/storage/token_storage.dart';
import 'package:mobile/features/models/discussion_issue.dart';
import 'package:mobile/features/services/discussion_service.dart';
import 'package:mobile/features/presentation/discussion/discussion_detail_page.dart';

// ──────────────────────────────────────────────
//  Main Page: Discussion Issue List
// ──────────────────────────────────────────────

class DiscussionIssueManagementPage extends StatefulWidget {
  final String classroomId;
  final String classroomName;
  /// When true, hides the AppBar so the widget can be embedded inside a tab.
  final bool isEmbedded;

  const DiscussionIssueManagementPage({
    super.key,
    required this.classroomId,
    this.classroomName = 'Classroom',
    this.isEmbedded = false,
  });

  @override
  State<DiscussionIssueManagementPage> createState() =>
      _DiscussionIssueManagementPageState();
}

class _DiscussionIssueManagementPageState
    extends State<DiscussionIssueManagementPage> {
  List<DiscussionIssue> _issues = [];
  List<DiscussionIssue> _filteredIssues = [];
  bool _isLoading = true;
  String _searchQuery = '';
  String _sortBy = 'newest'; // newest, oldest, most_comments
  final TextEditingController _searchController = TextEditingController();
  String? _currentUserId;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    try {
      _currentUserId = await TokenStorage.getUserId();

      final data = await DiscussionIssueService.getByClassroomId(widget.classroomId);
      _issues = data.map((json) => DiscussionIssue.fromJson(json)).toList();
      _applyFilters();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to load discussions: $e'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _applyFilters() {
    var filtered = _issues.where((issue) => !issue.isDeleted).toList();

    // Search filter
    if (_searchQuery.isNotEmpty) {
      final query = _searchQuery.toLowerCase();
      filtered = filtered.where((issue) {
        return issue.title.toLowerCase().contains(query) ||
            issue.content.toLowerCase().contains(query) ||
            issue.authorName.toLowerCase().contains(query);
      }).toList();
    }

    // Sort
    switch (_sortBy) {
      case 'newest':
        filtered.sort((a, b) => b.createdDate.compareTo(a.createdDate));
        break;
      case 'oldest':
        filtered.sort((a, b) => a.createdDate.compareTo(b.createdDate));
        break;
      case 'most_comments':
        filtered.sort((a, b) => b.commentCount.compareTo(a.commentCount));
        break;
    }

    setState(() => _filteredIssues = filtered);
  }

  Future<void> _deleteIssue(DiscussionIssue issue) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Delete Discussion'),
        content: Text('Are you sure you want to delete "${issue.title}"?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: TextButton.styleFrom(foregroundColor: AppColors.error),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
    if (confirmed != true) return;

    try {
      await DiscussionIssueService.delete(issue.id);

      setState(() {
        _issues.removeWhere((i) => i.id == issue.id);
        _applyFilters();
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Discussion deleted successfully'),
            backgroundColor: AppColors.success,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to delete: $e'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  void _navigateToCreate() async {
    final result = await Navigator.push<DiscussionIssue>(
      context,
      MaterialPageRoute(
        builder: (_) => CreateEditIssuePage(
          classroomId: widget.classroomId,
        ),
      ),
    );
    if (result != null) {
      setState(() {
        _issues.insert(0, result);
        _applyFilters();
      });
    }
  }

  void _navigateToEdit(DiscussionIssue issue) async {
    final result = await Navigator.push<DiscussionIssue>(
      context,
      MaterialPageRoute(
        builder: (_) => CreateEditIssuePage(
          classroomId: widget.classroomId,
          existingIssue: issue,
        ),
      ),
    );
    if (result != null) {
      setState(() {
        final index = _issues.indexWhere((i) => i.id == result.id);
        if (index != -1) _issues[index] = result;
        _applyFilters();
      });
    }
  }

  void _navigateToDetail(DiscussionIssue issue) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => DiscussionDetailPage(
          issue: issue,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: widget.isEmbedded
          ? null
          : AppBar(
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
              title: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Discussions', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                  Text(
                    widget.classroomName,
                    style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w400),
                  ),
                ],
              ),
              actions: [
                PopupMenuButton<String>(
                  icon: const Icon(Icons.sort, color: Colors.white),
                  tooltip: 'Sort by',
                  onSelected: (value) {
                    setState(() {
                      _sortBy = value;
                      _applyFilters();
                    });
                  },
                  itemBuilder: (_) => [
                    _buildSortMenuItem('newest', 'Newest First', Icons.arrow_downward),
                    _buildSortMenuItem('oldest', 'Oldest First', Icons.arrow_upward),
                    _buildSortMenuItem('most_comments', 'Most Comments', Icons.comment),
                  ],
                ),
              ],
            ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _navigateToCreate,
        backgroundColor: AppColors.accent,
        foregroundColor: Colors.white,
        icon: const Icon(Icons.add),
        label: const Text('New Discussion'),
      ),
      body: Column(
        children: [
          // Search bar
          _buildSearchBar(),
          // Stats bar
          _buildStatsBar(),
          // Issue list
          Expanded(
            child: _isLoading
                ? const Center(
                    child: CircularProgressIndicator(color: AppColors.primary),
                  )
                : _filteredIssues.isEmpty
                    ? _buildEmptyState()
                    : RefreshIndicator(
                        color: AppColors.primary,
                        onRefresh: _loadData,
                        child: ListView.builder(
                          padding: const EdgeInsets.fromLTRB(16, 0, 16, 80),
                          itemCount: _filteredIssues.length,
                          itemBuilder: (ctx, index) {
                            return _IssueCard(
                              issue: _filteredIssues[index],
                              currentUserId: _currentUserId ?? '',
                              onTap: () => _navigateToDetail(_filteredIssues[index]),
                              onEdit: () => _navigateToEdit(_filteredIssues[index]),
                              onDelete: () => _deleteIssue(_filteredIssues[index]),
                            );
                          },
                        ),
                      ),
          ),
        ],
      ),
    );
  }

  PopupMenuItem<String> _buildSortMenuItem(
      String value, String label, IconData icon) {
    return PopupMenuItem(
      value: value,
      child: Row(
        children: [
          Icon(icon,
              size: 18,
              color: _sortBy == value ? AppColors.primary : AppColors.textSecondary),
          const SizedBox(width: 8),
          Text(
            label,
            style: TextStyle(
              color: _sortBy == value ? AppColors.primary : AppColors.textPrimary,
              fontWeight: _sortBy == value ? FontWeight.w600 : FontWeight.normal,
            ),
          ),
          if (_sortBy == value) ...[
            const Spacer(),
            const Icon(Icons.check, size: 18, color: AppColors.primary),
          ],
        ],
      ),
    );
  }

  Widget _buildSearchBar() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.5),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.grey.withValues(alpha: 0.1)),
        ),
        child: TextField(
          controller: _searchController,
          onChanged: (value) {
            _searchQuery = value;
            _applyFilters();
          },
          decoration: InputDecoration(
            hintText: 'Search discussions...',
            hintStyle: const TextStyle(color: AppColors.textLight, fontSize: 14),
            prefixIcon: const Icon(Icons.search_rounded, color: AppColors.textLight, size: 20),
            suffixIcon: _searchQuery.isNotEmpty
                ? IconButton(
                    icon: const Icon(Icons.clear_rounded, color: AppColors.textLight, size: 18),
                    onPressed: () {
                      _searchController.clear();
                      _searchQuery = '';
                      _applyFilters();
                    },
                  )
                : null,
            border: InputBorder.none,
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          ),
        ),
      ),
    );
  }

  Widget _buildStatsBar() {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
      child: Row(
        children: [
          _StatChip(
            icon: Icons.forum_rounded,
            label: '${_filteredIssues.length} ISSUES',
            color: AppColors.primary,
          ),
          const SizedBox(width: 12),
          _StatChip(
            icon: Icons.comment_rounded,
            label:
                '${_filteredIssues.fold<int>(0, (sum, i) => sum + i.commentCount)} COMMENTS',
            color: Colors.orange,
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.forum_outlined, size: 80, color: Colors.grey[300]),
            const SizedBox(height: 16),
            Text(
              _searchQuery.isNotEmpty
                  ? 'No discussions match your search'
                  : 'No discussions yet',
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w600,
                color: AppColors.textSecondary,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              _searchQuery.isNotEmpty
                  ? 'Try a different search term'
                  : 'Start a new discussion to engage with your students',
              style: const TextStyle(color: AppColors.textLight),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}

// ──────────────────────────────────────────────
//  Stat Chip Widget
// ──────────────────────────────────────────────

class _StatChip extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;

  const _StatChip({
    required this.icon,
    required this.label,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: color),
          const SizedBox(width: 6),
          Text(
            label,
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w900,
              color: color,
              letterSpacing: 0.5,
            ),
          ),
        ],
      ),
    );
  }
}

// ──────────────────────────────────────────────
//  Issue Card Widget
// ──────────────────────────────────────────────

class _IssueCard extends StatelessWidget {
  final DiscussionIssue issue;
  final String currentUserId;
  final VoidCallback onTap;
  final VoidCallback onEdit;
  final VoidCallback onDelete;

  const _IssueCard({
    required this.issue,
    required this.currentUserId,
    required this.onTap,
    required this.onEdit,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.withValues(alpha: 0.1)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(16),
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: onTap,
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Header row
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Author avatar
                      CircleAvatar(
                        radius: 20,
                        backgroundColor: AppColors.primary.withValues(alpha: 0.1),
                        child: Text(
                          issue.authorName.isNotEmpty
                              ? issue.authorName[0].toUpperCase()
                              : '?',
                          style: const TextStyle(
                            color: AppColors.primary,
                            fontWeight: FontWeight.bold,
                            fontSize: 16,
                          ),
                        ),
                      ),
                      const SizedBox(width: 14),
                      // Title and author info
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              issue.title,
                              style: const TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                                color: AppColors.textPrimary,
                                height: 1.3,
                              ),
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                            ),
                            const SizedBox(height: 6),
                            Row(
                              children: [
                                Text(
                                  issue.authorName,
                                  style: const TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w600,
                                    color: AppColors.primary,
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Text(
                                  '•',
                                  style: TextStyle(color: Colors.grey[300], fontSize: 12),
                                ),
                                const SizedBox(width: 8),
                                Text(
                                  _formatTimeAgo(issue.createdDate),
                                  style: const TextStyle(
                                    fontSize: 12,
                                    color: AppColors.textLight,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                      // More menu
                      PopupMenuButton<String>(
                        icon: const Icon(Icons.more_horiz_rounded,
                            size: 20, color: AppColors.textLight),
                        padding: EdgeInsets.zero,
                        constraints: const BoxConstraints(),
                        onSelected: (value) {
                          if (value == 'edit') onEdit();
                          if (value == 'delete') onDelete();
                        },
                        itemBuilder: (_) => [
                          const PopupMenuItem(
                            value: 'edit',
                            child: Row(
                              children: [
                                Icon(Icons.edit_rounded, size: 18, color: AppColors.primary),
                                SizedBox(width: 8),
                                Text('Edit'),
                              ],
                            ),
                          ),
                          const PopupMenuItem(
                            value: 'delete',
                            child: Row(
                              children: [
                                Icon(Icons.delete_rounded, size: 18, color: AppColors.error),
                                SizedBox(width: 8),
                                Text('Delete', style: TextStyle(color: AppColors.error)),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  // Content preview
                  if (issue.content.isNotEmpty) ...[
                    Text(
                      issue.content,
                      style: const TextStyle(
                        fontSize: 14,
                        color: AppColors.textSecondary,
                        height: 1.5,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 16),
                  ],
                  // Footer row
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                        decoration: BoxDecoration(
                          color: Colors.orange.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.chat_bubble_outline_rounded,
                                size: 14, color: Colors.orange),
                            const SizedBox(width: 6),
                            Text(
                              '${issue.commentCount} comments',
                              style: const TextStyle(
                                fontSize: 12,
                                color: Colors.orange,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const Spacer(),
                      const Text(
                        'Read more',
                        style: TextStyle(fontSize: 13, color: AppColors.primary, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(width: 4),
                      const Icon(Icons.arrow_forward_rounded, size: 14, color: AppColors.primary),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

// ──────────────────────────────────────────────
//  Create / Edit Issue Page
// ──────────────────────────────────────────────


class CreateEditIssuePage extends StatefulWidget {
  final String classroomId;
  final DiscussionIssue? existingIssue;

  const CreateEditIssuePage({
    super.key,
    required this.classroomId,
    this.existingIssue,
  });

  @override
  State<CreateEditIssuePage> createState() => _CreateEditIssuePageState();
}

class _CreateEditIssuePageState extends State<CreateEditIssuePage> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _contentController = TextEditingController();
  bool _isSubmitting = false;
  bool get _isEditing => widget.existingIssue != null;

  @override
  void initState() {
    super.initState();
    if (_isEditing) {
      _titleController.text = widget.existingIssue!.title;
      _contentController.text = widget.existingIssue!.content;
    }
  }

  @override
  void dispose() {
    _titleController.dispose();
    _contentController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSubmitting = true);
    try {
      Map<String, dynamic>? result;
      if (_isEditing) {
        result = await DiscussionIssueService.update(
          issueId: widget.existingIssue!.id,
          title: _titleController.text.trim(),
          content: _contentController.text.trim(),
        );
      } else {
        final userId = await TokenStorage.getUserId() ?? '';
        final userName = await TokenStorage.getUserName() ?? '';
        result = await DiscussionIssueService.create(
          classroomId: widget.classroomId,
          title: _titleController.text.trim(),
          authorId: userId,
          authorName: userName,
          content: _contentController.text.trim(),
        );
      }

      if (result != null && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(_isEditing
                ? 'Discussion updated successfully'
                : 'Discussion created successfully'),
            backgroundColor: AppColors.success,
          ),
        );
        Navigator.pop(context, DiscussionIssue.fromJson(result));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to ${_isEditing ? 'update' : 'create'}: $e'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        title: Text(
          _isEditing ? 'Edit Discussion' : 'New Discussion',
          style: const TextStyle(fontSize: 18),
        ),
        actions: [
          TextButton.icon(
            onPressed: _isSubmitting ? null : _submit,
            icon: _isSubmitting
                ? const SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(
                        strokeWidth: 2, color: Colors.white),
                  )
                : const Icon(Icons.check, color: Colors.white),
            label: Text(
              _isEditing ? 'Save' : 'Post',
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // Title field
            Card(
              elevation: 1,
              shadowColor: Colors.black12,
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14)),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Title',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 8),
                    TextFormField(
                      controller: _titleController,
                      textCapitalization: TextCapitalization.sentences,
                      decoration: InputDecoration(
                        hintText: 'Enter discussion title...',
                        hintStyle: const TextStyle(color: AppColors.textLight),
                        filled: true,
                        fillColor: AppColors.background,
                        contentPadding: const EdgeInsets.symmetric(
                            horizontal: 16, vertical: 14),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: BorderSide.none,
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: BorderSide.none,
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: const BorderSide(
                              color: AppColors.primary, width: 1.5),
                        ),
                        errorBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: const BorderSide(
                              color: AppColors.error, width: 1.5),
                        ),
                      ),
                      validator: (value) {
                        if (value == null || value.trim().isEmpty) {
                          return 'Title is required';
                        }
                        if (value.trim().length < 5) {
                          return 'Title must be at least 5 characters';
                        }
                        return null;
                      },
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            // Content field
            Card(
              elevation: 1,
              shadowColor: Colors.black12,
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14)),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Text(
                          'Content',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            color: AppColors.textPrimary,
                          ),
                        ),
                        const Spacer(),
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: AppColors.info.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: const Text(
                            'Markdown supported',
                            style: TextStyle(
                              fontSize: 10,
                              color: AppColors.info,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    TextFormField(
                      controller: _contentController,
                      maxLines: 12,
                      minLines: 6,
                      textCapitalization: TextCapitalization.sentences,
                      decoration: InputDecoration(
                        hintText:
                            'Write your discussion content here...\n\nYou can use markdown for formatting.',
                        hintStyle: const TextStyle(
                            color: AppColors.textLight, height: 1.5),
                        filled: true,
                        fillColor: AppColors.background,
                        contentPadding: const EdgeInsets.all(16),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: BorderSide.none,
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: BorderSide.none,
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: const BorderSide(
                              color: AppColors.primary, width: 1.5),
                        ),
                        errorBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: const BorderSide(
                              color: AppColors.error, width: 1.5),
                        ),
                      ),
                      validator: (value) {
                        if (value == null || value.trim().isEmpty) {
                          return 'Content is required';
                        }
                        if (value.trim().length < 10) {
                          return 'Content must be at least 10 characters';
                        }
                        return null;
                      },
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            // Formatting tips
            Card(
              elevation: 0,
              color: AppColors.info.withValues(alpha: 0.05),
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14)),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(Icons.lightbulb_outline,
                            size: 16, color: AppColors.info),
                        const SizedBox(width: 8),
                        const Text(
                          'Formatting Tips',
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                            color: AppColors.info,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    _buildTip('**bold**', 'Bold text'),
                    _buildTip('*italic*', 'Italic text'),
                    _buildTip('```code```', 'Code block'),
                    _buildTip('- item', 'Bullet list'),
                    _buildTip('[link](url)', 'Hyperlink'),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTip(String syntax, String description) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(4),
            ),
            child: Text(
              syntax,
              style: const TextStyle(
                fontSize: 11,
                fontFamily: 'monospace',
                color: AppColors.textPrimary,
              ),
            ),
          ),
          const SizedBox(width: 8),
          Text(
            '→ $description',
            style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
          ),
        ],
      ),
    );
  }
}

// ──────────────────────────────────────────────
//  Helper Models & Utility Functions
// ──────────────────────────────────────────────

String _formatTimeAgo(DateTime dateTime) {
  final now = DateTime.now();
  final diff = now.difference(dateTime);

  if (diff.inMinutes < 1) return 'just now';
  if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
  if (diff.inHours < 24) return '${diff.inHours}h ago';
  if (diff.inDays < 7) return '${diff.inDays}d ago';
  if (diff.inDays < 30) return '${(diff.inDays / 7).floor()}w ago';
  return '${dateTime.day}/${dateTime.month}/${dateTime.year}';
}

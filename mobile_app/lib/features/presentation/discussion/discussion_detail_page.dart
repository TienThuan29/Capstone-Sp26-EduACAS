import 'package:flutter/material.dart';
import 'package:mobile/core/theme/app_colors.dart';
import 'package:mobile/core/storage/token_storage.dart';
import 'package:mobile/features/models/discussion_issue.dart';
import 'package:mobile/features/models/comment.dart';
import 'package:mobile/features/services/discussion_service.dart';
import 'package:mobile/core/widgets/background.dart';

class DiscussionDetailPage extends StatefulWidget {
  final String issueId;

  const DiscussionDetailPage({
    super.key,
    required this.issueId,
  });

  @override
  State<DiscussionDetailPage> createState() => _DiscussionDetailPageState();
}

class _DiscussionDetailPageState extends State<DiscussionDetailPage> {
  DiscussionIssue? _issue;
  bool _isLoading = true;
  bool _isSendingComment = false;
  String? _currentUserId;
  final TextEditingController _commentController = TextEditingController();
  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _loadInitialData();
  }

  Future<void> _loadInitialData() async {
    _currentUserId = await TokenStorage.getUserId();
    _loadIssue();
  }

  @override
  void dispose() {
    _commentController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  /// Load the full issue (with embedded comments) via getById
  Future<void> _loadIssue() async {
    setState(() => _isLoading = true);
    try {
      final issue = await DiscussionIssueService.getById(widget.issueId);
      if (mounted) {
        setState(() {
          _issue = issue;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to load discussion: $e'), backgroundColor: AppColors.error),
        );
        setState(() => _isLoading = false);
      }
    }
  }

  /// POST a top-level comment; backend returns updated issue with all comments
  Future<void> _submitComment() async {
    final content = _commentController.text.trim();
    if (content.isEmpty || _currentUserId == null) return;

    setState(() => _isSendingComment = true);
    try {
      final updatedIssue = await CommentService.writeComment(
        issueId: widget.issueId,
        authorId: _currentUserId!,
        content: content,
      );

      if (updatedIssue != null && mounted) {
        setState(() {
          _issue = updatedIssue;
          _commentController.clear();
          _isSendingComment = false;
        });

        // Scroll to bottom
        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (_scrollController.hasClients) {
            _scrollController.animateTo(
              _scrollController.position.maxScrollExtent,
              duration: const Duration(milliseconds: 300),
              curve: Curves.easeOut,
            );
          }
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to post comment: $e'), backgroundColor: AppColors.error),
        );
        setState(() => _isSendingComment = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: Stack(
        children: [
          const GradientBackground(),
          SafeArea(
            child: Column(
              children: [
                _buildHeader(context),
              Expanded(
                child: _isLoading
                    ? const Center(
                        child: CircularProgressIndicator(
                            color: AppColors.primary))
                    : _issue == null
                        ? const Center(child: Text('Discussion not found'))
                        : RefreshIndicator(
                            onRefresh: _loadIssue,
                            color: AppColors.primary,
                            child: ListView(
                              controller: _scrollController,
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 16, vertical: 8),
                              children: [
                                _buildIssueContent(),
                                const SizedBox(height: 32),
                                _buildCommentHeader(),
                                ...(_issue!.comments).map((comment) => _CommentCard(
                                      comment: comment,
                                      currentUserId: _currentUserId ?? '',
                                    )),
                                if (_issue!.comments.isEmpty) _buildEmptyComments(),
                                const SizedBox(height: 20),
                              ],
                            ),
                          ),
              ),
              _buildCommentInput(),
            ],
          ),
        ),
      ],
    ),
  );
}

  Widget _buildHeader(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              IconButton(
                onPressed: () => Navigator.pop(context),
                icon: const Icon(Icons.arrow_back_ios_new_rounded,
                    color: AppColors.primary, size: 20),
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(),
              ),
              const SizedBox(width: 16),
              Container(
                width: 40,
                height: 40,
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(Icons.forum_rounded,
                    color: AppColors.primary, size: 20),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Discussion Detail',
                      style: TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.w900,
                        color: AppColors.textPrimary,
                        letterSpacing: -0.5,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    Text(
                      'Started by ${_issue?.displayName ?? '...'}',
                      style: const TextStyle(
                        fontSize: 13,
                        color: AppColors.textSecondary,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildIssueContent() {
    final issue = _issue!;
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 15,
            offset: const Offset(0, 5),
          ),
        ],
        border: Border.all(color: Colors.grey.withValues(alpha: 0.1)),
      ),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                CircleAvatar(
                  radius: 20,
                  backgroundColor: AppColors.primary.withValues(alpha: 0.1),
                  child: Text(
                    issue.displayName.isNotEmpty ? issue.displayName[0].toUpperCase() : '?',
                    style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold, fontSize: 14),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        issue.displayName,
                        style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        _formatDate(issue.createdDate),
                        style: const TextStyle(fontSize: 11, color: AppColors.textLight),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: issue.status == DiscussionIssueStatus.CLOSED
                        ? Colors.red.withValues(alpha: 0.1)
                        : AppColors.primary.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    issue.status == DiscussionIssueStatus.CLOSED ? 'CLOSED' : 'OPEN',
                    style: TextStyle(
                      color: issue.status == DiscussionIssueStatus.CLOSED ? Colors.red : AppColors.primary,
                      fontSize: 10,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 0.5,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),
            Text(
              issue.title,
              style: const TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w900,
                color: AppColors.textPrimary,
                letterSpacing: -0.5,
                height: 1.2,
              ),
            ),
            const SizedBox(height: 12),
            Text(
              issue.content,
              style: const TextStyle(
                fontSize: 15,
                color: AppColors.textPrimary,
                height: 1.6,
                fontWeight: FontWeight.w500,
              ),
            ),
            if (issue.viewCount > 0) ...[
              const SizedBox(height: 16),
              Row(
                children: [
                  Icon(Icons.visibility_outlined, size: 14, color: Colors.grey[400]),
                  const SizedBox(width: 4),
                  Text(
                    '${issue.viewCount} views',
                    style: TextStyle(fontSize: 12, color: Colors.grey[400]),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildCommentHeader() {
    final commentCount = _issue?.comments.length ?? 0;
    return Padding(
      padding: const EdgeInsets.only(bottom: 20, left: 4),
      child: Row(
        children: [
          const Icon(Icons.forum_outlined, size: 18, color: AppColors.textSecondary),
          const SizedBox(width: 12),
          Text(
            '$commentCount Comments',
            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: AppColors.textPrimary),
          ),
          const SizedBox(width: 16),
          const Expanded(child: Divider(color: Colors.black12)),
        ],
      ),
    );
  }

  Widget _buildEmptyComments() {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 48),
      child: Center(
        child: Column(
          children: [
            Icon(Icons.chat_bubble_outline_rounded, size: 48, color: Colors.grey[300]),
            const SizedBox(height: 16),
            const Text(
              'No comments yet',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.grey),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCommentInput() {
    return Container(
      padding: EdgeInsets.fromLTRB(16, 12, 16, 12 + MediaQuery.of(context).padding.bottom),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, -5),
          ),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          Expanded(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              decoration: BoxDecoration(
                color: AppColors.background,
                borderRadius: BorderRadius.circular(24),
              ),
              child: TextField(
                controller: _commentController,
                decoration: const InputDecoration(
                  hintText: 'Share your thoughts...',
                  border: InputBorder.none,
                  contentPadding: EdgeInsets.symmetric(vertical: 12),
                ),
                maxLines: 5,
                minLines: 1,
              ),
            ),
          ),
          const SizedBox(width: 12),
          IconButton(
            onPressed: _isSendingComment ? null : _submitComment,
            icon: _isSendingComment
                ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
                : const Icon(Icons.send_rounded, color: AppColors.primary),
          ),
        ],
      ),
    );
  }

  String _formatDate(DateTime dt) {
    return '${dt.day}/${dt.month}/${dt.year} ${dt.hour}:${dt.minute.toString().padLeft(2, '0')}';
  }
}

class _CommentCard extends StatelessWidget {
  final Comment comment;
  final String currentUserId;

  const _CommentCard({
    required this.comment,
    required this.currentUserId,
  });

  @override
  Widget build(BuildContext context) {
    final isOwn = comment.authorId == currentUserId;
    
    return Padding(
      padding: const EdgeInsets.only(bottom: 20),
      child: Column(
        crossAxisAlignment: isOwn ? CrossAxisAlignment.end : CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: isOwn ? MainAxisAlignment.end : MainAxisAlignment.start,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (!isOwn) ...[
                CircleAvatar(
                  radius: 18,
                  backgroundColor: AppColors.primary.withValues(alpha: 0.1),
                  child: Text(
                    comment.displayName.isNotEmpty ? comment.displayName[0].toUpperCase() : '?',
                    style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold, fontSize: 12),
                  ),
                ),
                const SizedBox(width: 12),
              ],
              Flexible(
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: isOwn ? AppColors.primary : Colors.white,
                    borderRadius: BorderRadius.only(
                      topLeft: const Radius.circular(16),
                      topRight: const Radius.circular(16),
                      bottomLeft: Radius.circular(isOwn ? 16 : 4),
                      bottomRight: Radius.circular(isOwn ? 4 : 16),
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.05),
                        blurRadius: 8,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (!isOwn)
                        Padding(
                          padding: const EdgeInsets.only(bottom: 6),
                          child: Text(
                            comment.displayName,
                            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: AppColors.primary),
                          ),
                        ),
                      Text(
                        comment.content,
                        style: TextStyle(
                          fontSize: 14, 
                          color: isOwn ? Colors.white : AppColors.textPrimary,
                          height: 1.4,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      if (comment.upVoteCount > 0) ...[
                        const SizedBox(height: 8),
                        Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.thumb_up_outlined, size: 12,
                                color: isOwn ? Colors.white70 : AppColors.textLight),
                            const SizedBox(width: 4),
                            Text(
                              '${comment.upVoteCount}',
                              style: TextStyle(
                                fontSize: 11,
                                color: isOwn ? Colors.white70 : AppColors.textLight,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ],
                  ),
                ),
              ),
            ],
          ),
          Padding(
            padding: EdgeInsets.only(
              top: 6,
              left: !isOwn ? 48 : 0,
              right: isOwn ? 32 : 0,
            ),
            child: Text(
              _formatTimeAgo(comment.createdDate),
              style: const TextStyle(fontSize: 10, color: AppColors.textLight, fontWeight: FontWeight.w600),
            ),
          ),
          // Render replies (nested comments)
          if (comment.replies.isNotEmpty)
            Padding(
              padding: EdgeInsets.only(left: isOwn ? 0 : 32, top: 8),
              child: Column(
                children: comment.replies
                    .map((reply) => _CommentCard(
                          comment: reply,
                          currentUserId: currentUserId,
                        ))
                    .toList(),
              ),
            ),
        ],
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

import 'package:flutter/material.dart';
import 'package:mobile/core/theme/app_colors.dart';
import 'package:mobile/core/storage/token_storage.dart';
import 'package:mobile/features/models/discussion_issue.dart';
import 'package:mobile/features/models/comment.dart';
import 'package:mobile/features/services/discussion_service.dart';

class DiscussionDetailPage extends StatefulWidget {
  final String issueId;

  const DiscussionDetailPage({
    super.key,
    required this.issueId,
  });

  @override
  State<DiscussionDetailPage> createState() => _DiscussionDetailPageState();
}

class _DiscussionDetailPageState extends State<DiscussionDetailPage>
    with TickerProviderStateMixin {
  DiscussionIssue? _issue;
  bool _isLoading = true;
  bool _isSendingComment = false;
  bool _isChangingStatus = false;
  String? _currentUserId;
  String? _currentUserRole;
  final TextEditingController _commentController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  String? _replyingToCommentId;
  String? _replyingToName;

  // Edit comment state
  String? _editingCommentId;
  final TextEditingController _editCommentController = TextEditingController();

  // Delete comment state
  String? _deletingCommentId;

  late AnimationController _fadeController;
  late Animation<double> _fadeAnimation;

  @override
  void initState() {
    super.initState();
    _fadeController = AnimationController(
      duration: const Duration(milliseconds: 400),
      vsync: this,
    );
    _fadeAnimation = CurvedAnimation(
      parent: _fadeController,
      curve: Curves.easeOut,
    );
    _loadInitialData();
    _fadeController.forward();
  }

  Future<void> _loadInitialData() async {
    _currentUserId = await TokenStorage.getUserId();
    _currentUserRole = await TokenStorage.getUserRole();
    await _loadIssue();
  }

  @override
  void dispose() {
    _commentController.dispose();
    _editCommentController.dispose();
    _scrollController.dispose();
    _fadeController.dispose();
    super.dispose();
  }

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
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to load discussion: $e'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  void _startReplying(String commentId, String displayName) {
    setState(() {
      _replyingToCommentId = commentId;
      _replyingToName = displayName;
    });
  }

  void _cancelReply() {
    setState(() {
      _replyingToCommentId = null;
      _replyingToName = null;
    });
  }

  void _startEditingComment(String commentId, String currentContent) {
    setState(() {
      _editingCommentId = commentId;
      _editCommentController.text = currentContent;
    });
  }

  void _cancelEditing() {
    setState(() {
      _editingCommentId = null;
      _editCommentController.clear();
    });
  }

  Future<void> _submitEditComment() async {
    if (_editingCommentId == null || _editCommentController.text.trim().isEmpty) {
      return;
    }

    setState(() {});
    try {
      final updated = await CommentService.updateComment(
        commentId: _editingCommentId!,
        content: _editCommentController.text.trim(),
      );
      if (updated != null && mounted) {
        setState(() {
          _issue = updated;
          _editingCommentId = null;
          _editCommentController.clear();
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Comment updated'),
            backgroundColor: AppColors.success,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() {});
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to update comment: $e'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  void _confirmDeleteComment(String commentId) {
    setState(() => _deletingCommentId = commentId);
    showModalBottomSheet<bool>(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        padding: const EdgeInsets.all(24),
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.grey.shade300,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 20),
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: Colors.red.shade50,
                shape: BoxShape.circle,
              ),
              child: Icon(Icons.delete_outline_rounded,
                  size: 28, color: Colors.red.shade700),
            ),
            const SizedBox(height: 16),
            const Text(
              'Delete Comment',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Are you sure you want to delete this comment?\nThis action cannot be undone.',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey.shade600,
                height: 1.5,
              ),
            ),
            const SizedBox(height: 24),
            Row(
              children: [
                Expanded(
                  child: GestureDetector(
                    onTap: () => Navigator.pop(ctx, false),
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      decoration: BoxDecoration(
                        color: Colors.grey.shade100,
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: const Center(
                        child: Text(
                          'Cancel',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                            color: AppColors.textSecondary,
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: GestureDetector(
                    onTap: () => Navigator.pop(ctx, true),
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      decoration: BoxDecoration(
                        color: Colors.red,
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: const Center(
                        child: Text(
                          'Delete',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                            color: Colors.white,
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
            SizedBox(height: MediaQuery.of(context).padding.bottom),
          ],
        ),
      ),
    ).then((confirmed) {
      if (confirmed == true) {
        _submitDeleteComment();
      } else {
        setState(() => _deletingCommentId = null);
      }
    });
  }

  Future<void> _submitDeleteComment() async {
    if (_deletingCommentId == null) return;

    setState(() {});
    try {
      final updated = await CommentService.softDeleteComment(
        commentId: _deletingCommentId!,
      );
      if (updated != null && mounted) {
        setState(() {
          _issue = updated;
          _deletingCommentId = null;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Comment deleted'),
            backgroundColor: AppColors.success,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _deletingCommentId = null;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to delete comment: $e'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  Future<void> _submitComment() async {
    final content = _commentController.text.trim();
    if (content.isEmpty || _currentUserId == null) return;

    setState(() => _isSendingComment = true);
    try {
      DiscussionIssue? updatedIssue;
      if (_replyingToCommentId != null) {
        updatedIssue = await CommentService.replyComment(
          issueId: widget.issueId,
          parentCommentId: _replyingToCommentId!,
          authorId: _currentUserId!,
          content: content,
        );
      } else {
        updatedIssue = await CommentService.writeComment(
          issueId: widget.issueId,
          authorId: _currentUserId!,
          content: content,
        );
      }

      if (updatedIssue != null && mounted) {
        setState(() {
          _issue = updatedIssue;
          _commentController.clear();
          _isSendingComment = false;
          _replyingToCommentId = null;
          _replyingToName = null;
        });

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
          SnackBar(
            content: Text('Failed to post comment: $e'),
            backgroundColor: AppColors.error,
          ),
        );
        setState(() => _isSendingComment = false);
      }
    }
  }

  Future<void> _upvoteComment(String commentId) async {
    try {
      final updatedIssue = await CommentService.upvoteComment(
        issueId: widget.issueId,
        commentId: commentId,
      );
      if (updatedIssue != null && mounted) {
        setState(() => _issue = updatedIssue);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to upvote: $e'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  Future<void> _changeStatus(DiscussionIssueStatus newStatus) async {
    setState(() => _isChangingStatus = true);
    try {
      final updated = await DiscussionIssueService.changeStatus(
        issueId: widget.issueId,
        status: newStatus,
      );
      if (updated != null && mounted) {
        setState(() => _issue = updated);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              newStatus == DiscussionIssueStatus.CLOSED
                  ? 'Discussion closed'
                  : 'Discussion reopened',
            ),
            backgroundColor: AppColors.success,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to change status: $e'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isChangingStatus = false);
    }
  }

  bool get _isLecturerOrAdmin {
    return _currentUserRole == 'LECTURER' || _currentUserRole == 'ADMIN';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: Stack(
        children: [
          Container(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  Color(0xFFE8EEF4),
                  Color(0xFFF5F7FA),
                  AppColors.backgroundWhite,
                ],
                stops: [0.0, 0.4, 1.0],
              ),
            ),
          ),
          SafeArea(
            child: Column(
              children: [
                _buildTopBar(),
                Expanded(
                  child: _isLoading
                      ? const Center(
                          child:
                              CircularProgressIndicator(color: AppColors.primary),
                        )
                      : _issue == null
                          ? const Center(child: Text('Discussion not found'))
                          : RefreshIndicator(
                              color: AppColors.primary,
                              onRefresh: _loadIssue,
                              child: FadeTransition(
                                opacity: _fadeAnimation,
                                child: ListView(
                                  controller: _scrollController,
                                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 100),
                                  children: [
                                    _buildIssueCard(),
                                    const SizedBox(height: 20),
                                    _buildCommentHeader(),
                                    ...(_issue!.comments).map((comment) =>
                                        _CommentCard(
                                          comment: comment,
                                          currentUserId: _currentUserId ?? '',
                                          currentUserRole: _currentUserRole ?? '',
                                          isLecturerOrAdmin: _isLecturerOrAdmin,
                                          isEditing: _editingCommentId == comment.id,
                                          isDeleting: _deletingCommentId == comment.id,
                                          editController: _editCommentController,
                                          onReply: _startReplying,
                                          onUpvote: _upvoteComment,
                                          onEdit: _startEditingComment,
                                          onDelete: _confirmDeleteComment,
                                          onCancelReply: _cancelReply,
                                          onSubmitEdit: _submitEditComment,
                                          onCancelEdit: _cancelEditing,
                                        )),
                                    if (_issue!.comments.isEmpty) _buildEmptyComments(),
                                    const SizedBox(height: 20),
                                  ],
                                ),
                              ),
                            ),
                ),
                if (_issue != null &&
                    (_issue!.status == DiscussionIssueStatus.OPEN ||
                        _isLecturerOrAdmin))
                  _buildCommentInput(),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTopBar() {
    return Container(
      padding: const EdgeInsets.fromLTRB(8, 8, 16, 0),
      child: Row(
        children: [
          IconButton(
            onPressed: () => Navigator.pop(context),
            icon: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.06),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: const Icon(
                Icons.arrow_back_ios_new_rounded,
                size: 18,
                color: AppColors.primary,
              ),
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Discussion',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w900,
                    color: AppColors.textPrimary,
                  ),
                ),
                if (_issue != null)
                  Text(
                    _issue!.displayName,
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                      color: AppColors.textSecondary,
                    ),
                  ),
              ],
            ),
          ),
          if (_isLecturerOrAdmin && _issue != null)
            _StatusToggleButton(
              status: _issue!.status,
              isLoading: _isChangingStatus,
              onStatusChange: _changeStatus,
            ),
        ],
      ),
    );
  }

  Widget _buildIssueCard() {
    final issue = _issue!;
    final isClosed = issue.status == DiscussionIssueStatus.CLOSED;

    return Container(
      margin: const EdgeInsets.only(top: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 16,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header - Author & Status
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: isClosed
                    ? [Colors.grey.shade100, Colors.grey.shade50]
                    : [
                        AppColors.primary.withValues(alpha: 0.04),
                        AppColors.primary.withValues(alpha: 0.01),
                      ],
              ),
              borderRadius:
                  const BorderRadius.vertical(top: Radius.circular(20)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    CircleAvatar(
                      radius: 22,
                      backgroundColor: isClosed
                          ? Colors.grey.shade300
                          : AppColors.primary.withValues(alpha: 0.12),
                      backgroundImage: issue.authorDisplay?.avatarUrl != null &&
                              issue.authorDisplay!.avatarUrl!.isNotEmpty
                          ? NetworkImage(issue.authorDisplay!.avatarUrl!)
                          : null,
                      child: issue.authorDisplay?.avatarUrl == null ||
                              issue.authorDisplay!.avatarUrl!.isEmpty
                          ? Text(
                              issue.displayName.isNotEmpty
                                  ? issue.displayName[0].toUpperCase()
                                  : '?',
                              style: TextStyle(
                                color: isClosed
                                    ? Colors.grey.shade600
                                    : AppColors.primary,
                                fontWeight: FontWeight.bold,
                                fontSize: 16,
                              ),
                            )
                          : null,
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            issue.displayName,
                            style: const TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.w800,
                              color: AppColors.textPrimary,
                            ),
                          ),
                          Text(
                            _formatDate(issue.createdDate),
                            style: const TextStyle(
                              fontSize: 11,
                              color: AppColors.textLight,
                            ),
                          ),
                        ],
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: isClosed
                            ? Colors.grey.shade100
                            : AppColors.success.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: isClosed
                              ? Colors.grey.shade300
                              : AppColors.success.withValues(alpha: 0.3),
                        ),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Container(
                            width: 7,
                            height: 7,
                            decoration: BoxDecoration(
                              color: isClosed ? Colors.grey : AppColors.success,
                              shape: BoxShape.circle,
                            ),
                          ),
                          const SizedBox(width: 6),
                          Text(
                            isClosed ? 'Closed' : 'Open',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                              color: isClosed
                                  ? Colors.grey.shade600
                                  : AppColors.success,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Text(
                  issue.title,
                  style: const TextStyle(
                    fontSize: 19,
                    fontWeight: FontWeight.w900,
                    color: AppColors.textPrimary,
                    height: 1.3,
                    letterSpacing: -0.3,
                  ),
                ),
              ],
            ),
          ),

          // Content
          Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (issue.refProblem != null ||
                    (issue.refProblemId.isNotEmpty)) ...[
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(
                      color: AppColors.accent.withValues(alpha: 0.06),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: AppColors.accent.withValues(alpha: 0.15),
                      ),
                    ),
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(6),
                          decoration: BoxDecoration(
                            color: AppColors.accent.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: const Icon(
                            Icons.code_rounded,
                            size: 16,
                            color: AppColors.accentDark,
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'Related Problem',
                                style: TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w600,
                                  color: AppColors.accentDark,
                                  letterSpacing: 0.5,
                                ),
                              ),
                              Text(
                                issue.refProblem?.title ??
                                    'Problem',
                                style: const TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w700,
                                  color: AppColors.textPrimary,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                ],
                Text(
                  issue.content,
                  style: const TextStyle(
                    fontSize: 15,
                    color: AppColors.textPrimary,
                    height: 1.7,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    _StatBadge(
                      icon: Icons.visibility_outlined,
                      value: issue.viewCount,
                      label: 'views',
                      color: Colors.grey,
                    ),
                    const SizedBox(width: 12),
                    _StatBadge(
                      icon: Icons.chat_bubble_outline_rounded,
                      value: issue.commentCount,
                      label: 'comments',
                      color: Colors.orange,
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCommentHeader() {
    final commentCount = _issue?.commentCount ?? 0;
    return Padding(
      padding: const EdgeInsets.only(bottom: 16, left: 4),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: AppColors.primary.withValues(alpha: 0.08),
              borderRadius: BorderRadius.circular(10),
            ),
            child: const Icon(
              Icons.forum_outlined,
              size: 18,
              color: AppColors.primary,
            ),
          ),
          const SizedBox(width: 10),
          Text(
            '$commentCount Comments',
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w800,
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Container(
              height: 1,
              color: Colors.grey.withValues(alpha: 0.1),
            ),
          ),
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
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.grey.shade100,
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.chat_bubble_outline_rounded,
                size: 32,
                color: Colors.grey.shade400,
              ),
            ),
            const SizedBox(height: 12),
            const Text(
              'No comments yet',
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w700,
                color: AppColors.textSecondary,
              ),
            ),
            const SizedBox(height: 4),
            const Text(
              'Be the first to comment!',
              style: TextStyle(
                fontSize: 13,
                color: AppColors.textLight,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCommentInput() {
    return Container(
      padding: EdgeInsets.fromLTRB(
        16,
        12,
        16,
        12 + MediaQuery.of(context).padding.bottom,
      ),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.06),
            blurRadius: 12,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (_replyingToCommentId != null)
            Container(
              margin: const EdgeInsets.only(bottom: 8),
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                children: [
                  const Icon(Icons.reply_rounded,
                      size: 16, color: AppColors.primary),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Replying to $_replyingToName',
                      style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: AppColors.primary,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  GestureDetector(
                    onTap: _cancelReply,
                    child: const Icon(Icons.close_rounded,
                        size: 18, color: AppColors.primary),
                  ),
                ],
              ),
            ),
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Expanded(
                child: Container(
                  constraints: const BoxConstraints(maxHeight: 120),
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  decoration: BoxDecoration(
                    color: AppColors.background,
                    borderRadius: BorderRadius.circular(24),
                  ),
                  child: TextField(
                    controller: _commentController,
                    decoration: InputDecoration(
                      hintText: _replyingToCommentId != null
                          ? 'Type your reply...'
                          : 'Share your thoughts...',
                      border: InputBorder.none,
                      contentPadding:
                          const EdgeInsets.symmetric(vertical: 12),
                    ),
                    maxLines: null,
                    minLines: 1,
                  ),
                ),
              ),
              const SizedBox(width: 10),
              GestureDetector(
                onTap: _isSendingComment ? null : _submitComment,
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.primary,
                    borderRadius: BorderRadius.circular(14),
                    boxShadow: [
                      BoxShadow(
                        color: AppColors.primary.withValues(alpha: 0.3),
                        blurRadius: 8,
                        offset: const Offset(0, 3),
                      ),
                    ],
                  ),
                  child: _isSendingComment
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            valueColor:
                                AlwaysStoppedAnimation<Color>(Colors.white),
                          ),
                        )
                      : const Icon(Icons.send_rounded,
                          color: Colors.white, size: 20),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  String _formatDate(DateTime dt) {
    final months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    return '${months[dt.month - 1]} ${dt.day}, ${dt.year} at ${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
  }
}

// ──────────────────────────────────────────────
//  Status Toggle Button
// ──────────────────────────────────────────────

class _StatusToggleButton extends StatelessWidget {
  final DiscussionIssueStatus status;
  final bool isLoading;
  final Function(DiscussionIssueStatus) onStatusChange;

  const _StatusToggleButton({
    required this.status,
    required this.isLoading,
    required this.onStatusChange,
  });

  @override
  Widget build(BuildContext context) {
    final isClosed = status == DiscussionIssueStatus.CLOSED;
    return GestureDetector(
      onTap: isLoading ? null : () => onStatusChange(
        isClosed
            ? DiscussionIssueStatus.OPEN
            : DiscussionIssueStatus.CLOSED,
      ),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.06),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: isLoading
            ? const SizedBox(
                width: 18,
                height: 18,
                child: CircularProgressIndicator(strokeWidth: 2),
              )
            : Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    isClosed ? Icons.lock_open_rounded : Icons.lock_rounded,
                    size: 16,
                    color: isClosed ? AppColors.success : Colors.grey.shade600,
                  ),
                  const SizedBox(width: 6),
                  Text(
                    isClosed ? 'Reopen' : 'Close',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      color:
                          isClosed ? AppColors.success : Colors.grey.shade600,
                    ),
                  ),
                ],
              ),
      ),
    );
  }
}

// ──────────────────────────────────────────────
//  Stat Badge
// ──────────────────────────────────────────────

class _StatBadge extends StatelessWidget {
  final IconData icon;
  final int value;
  final String label;
  final Color color;

  const _StatBadge({
    required this.icon,
    required this.value,
    required this.label,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.06),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: color),
          const SizedBox(width: 6),
          Text(
            '$value $label',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w700,
              color: color,
            ),
          ),
        ],
      ),
    );
  }
}

// ──────────────────────────────────────────────
//  Comment Card (Threaded)
// ──────────────────────────────────────────────

class _CommentCard extends StatelessWidget {
  final Comment comment;
  final String currentUserId;
  final String currentUserRole;
  final bool isLecturerOrAdmin;
  final bool isEditing;
  final bool isDeleting;
  final TextEditingController? editController;
  final Function(String, String) onReply;
  final Function(String) onUpvote;
  final Function(String, String) onEdit;
  final Function(String) onDelete;
  final VoidCallback onCancelReply;
  final VoidCallback? onSubmitEdit;
  final VoidCallback? onCancelEdit;
  final int depth;

  const _CommentCard({
    required this.comment,
    required this.currentUserId,
    required this.currentUserRole,
    required this.isLecturerOrAdmin,
    this.isEditing = false,
    this.isDeleting = false,
    this.editController,
    required this.onReply,
    required this.onUpvote,
    required this.onEdit,
    required this.onDelete,
    required this.onCancelReply,
    this.onSubmitEdit,
    this.onCancelEdit,
    this.depth = 0,
  });

  @override
  Widget build(BuildContext context) {
    if (comment.isDeleted) return const SizedBox.shrink();

    final isOwn = comment.authorId == currentUserId;
    final leftIndent = depth * 32.0;

    // Border color by depth level
    final borderColors = [
      Colors.transparent,
      AppColors.primary.withValues(alpha: 0.3),
      Colors.orange.withValues(alpha: 0.3),
      Colors.grey.withValues(alpha: 0.3),
    ];
    final borderColor = borderColors[depth.clamp(0, 3)];

    return Padding(
      padding: EdgeInsets.only(bottom: 12, left: leftIndent),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            decoration: BoxDecoration(
              color: isDeleting
                  ? Colors.red.shade50
                  : Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border(
                left: depth > 0
                    ? BorderSide(color: borderColor, width: 2)
                    : BorderSide.none,
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.03),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Padding(
                  padding: const EdgeInsets.all(14),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Author row
                      Row(
                        children: [
                          CircleAvatar(
                            radius: 16,
                            backgroundColor:
                                AppColors.primary.withValues(alpha: 0.08),
                            backgroundImage:
                                comment.authorDisplay?.avatarUrl != null &&
                                        comment.authorDisplay!.avatarUrl!.isNotEmpty
                                    ? NetworkImage(comment.authorDisplay!.avatarUrl!)
                                    : null,
                            child: comment.authorDisplay?.avatarUrl == null ||
                                    comment.authorDisplay!.avatarUrl!.isEmpty
                                ? Text(
                                    comment.displayName.isNotEmpty
                                        ? comment.displayName[0].toUpperCase()
                                        : '?',
                                    style: const TextStyle(
                                      color: AppColors.primary,
                                      fontWeight: FontWeight.bold,
                                      fontSize: 12,
                                    ),
                                  )
                                : null,
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Flexible(
                                      child: Text(
                                        comment.displayName,
                                        style: const TextStyle(
                                          fontSize: 13,
                                          fontWeight: FontWeight.w700,
                                          color: AppColors.textPrimary,
                                        ),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ),
                                    if (isOwn) ...[
                                      const SizedBox(width: 6),
                                      Container(
                                        padding: const EdgeInsets.symmetric(
                                            horizontal: 6, vertical: 1),
                                        decoration: BoxDecoration(
                                          color: AppColors.primary.withValues(alpha: 0.08),
                                          borderRadius: BorderRadius.circular(4),
                                        ),
                                        child: const Text(
                                          'You',
                                          style: TextStyle(
                                            fontSize: 9,
                                            fontWeight: FontWeight.w700,
                                            color: AppColors.primary,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ],
                                ),
                                Text(
                                  _formatTimeAgo(comment.createdDate),
                                  style: const TextStyle(
                                    fontSize: 10,
                                    color: AppColors.textLight,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          // Upvote badge
                          if (comment.upVoteCount > 0)
                            Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: AppColors.success.withValues(alpha: 0.08),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  const Icon(Icons.thumb_up_alt_rounded,
                                      size: 11, color: AppColors.success),
                                  const SizedBox(width: 3),
                                  Text(
                                    '${comment.upVoteCount}',
                                    style: const TextStyle(
                                      fontSize: 11,
                                      fontWeight: FontWeight.w700,
                                      color: AppColors.success,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                        ],
                      ),
                      const SizedBox(height: 10),

                      // Content or Edit form
                      if (isEditing && editController != null)
                        _EditCommentForm(
                          controller: editController!,
                          onSubmit: onSubmitEdit ?? () {},
                          onCancel: onCancelEdit ?? () {},
                        )
                      else
                        Text(
                          comment.content,
                          style: const TextStyle(
                            fontSize: 14,
                            color: AppColors.textPrimary,
                            height: 1.5,
                            fontWeight: FontWeight.w500,
                          ),
                        ),

                      const SizedBox(height: 10),

                      // Action buttons row
                      if (!isEditing)
                        Wrap(
                          spacing: 6,
                          runSpacing: 6,
                          children: [
                            _ActionBtn(
                              icon: Icons.thumb_up_outlined,
                              label: 'Upvote',
                              onTap: () => onUpvote(comment.id),
                              color: AppColors.textSecondary,
                            ),
                            _ActionBtn(
                              icon: Icons.reply_rounded,
                              label: 'Reply',
                              onTap: () =>
                                  onReply(comment.id, comment.displayName),
                              color: AppColors.primary,
                            ),
                            if (isOwn)
                              _ActionBtn(
                                icon: Icons.edit_outlined,
                                label: 'Edit',
                                onTap: () =>
                                    onEdit(comment.id, comment.content),
                                color: AppColors.info,
                              ),
                            if (isOwn)
                              _ActionBtn(
                                icon: Icons.delete_outline_rounded,
                                label: 'Delete',
                                onTap: () => onDelete(comment.id),
                                color: Colors.red,
                              ),
                          ],
                        ),
                    ],
                  ),
                ),

                // Deleting indicator
                if (isDeleting)
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.red.shade50,
                      borderRadius: const BorderRadius.vertical(
                        bottom: Radius.circular(16),
                      ),
                    ),
                    child: const Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        SizedBox(
                          width: 14,
                          height: 14,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            valueColor:
                                AlwaysStoppedAnimation<Color>(Colors.red),
                          ),
                        ),
                        SizedBox(width: 8),
                        Text(
                          'Deleting...',
                          style: TextStyle(
                            fontSize: 13,
                            color: Colors.red,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ),
              ],
            ),
          ),

          // Nested replies
          if (comment.replies.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(top: 8),
              child: Column(
                children: comment.replies
                    .map((reply) => _CommentCard(
                          comment: reply,
                          currentUserId: currentUserId,
                          currentUserRole: currentUserRole,
                          isLecturerOrAdmin: isLecturerOrAdmin,
                          isEditing: false,
                          isDeleting: false,
                          onReply: onReply,
                          onUpvote: onUpvote,
                          onEdit: onEdit,
                          onDelete: onDelete,
                          onCancelReply: onCancelReply,
                          onSubmitEdit: onSubmitEdit,
                          onCancelEdit: onCancelEdit,
                          depth: (depth + 1).clamp(0, 3),
                        ))
                    .toList(),
              ),
            ),
        ],
      ),
    );
  }
}

// ──────────────────────────────────────────────
//  Edit Comment Form (inline)
// ──────────────────────────────────────────────

class _EditCommentForm extends StatelessWidget {
  final TextEditingController controller;
  final VoidCallback onSubmit;
  final VoidCallback onCancel;

  const _EditCommentForm({
    required this.controller,
    required this.onSubmit,
    required this.onCancel,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
          decoration: BoxDecoration(
            color: AppColors.info.withValues(alpha: 0.06),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: AppColors.info.withValues(alpha: 0.2)),
          ),
          child: Row(
            children: [
              const Icon(Icons.edit_rounded, size: 14, color: AppColors.info),
              const SizedBox(width: 6),
              const Text(
                'Editing comment',
                style: TextStyle(
                  fontSize: 12,
                  color: AppColors.info,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 10),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12),
          decoration: BoxDecoration(
            color: AppColors.background,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.grey.shade200),
          ),
          child: TextField(
            controller: controller,
            maxLines: null,
            minLines: 3,
            decoration: const InputDecoration(
              border: InputBorder.none,
              hintText: 'Edit your comment...',
              hintStyle: TextStyle(color: AppColors.textLight),
            ),
          ),
        ),
        const SizedBox(height: 10),
        Row(
          children: [
            GestureDetector(
              onTap: onCancel,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                decoration: BoxDecoration(
                  color: Colors.grey.shade100,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Text(
                  'Cancel',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textSecondary,
                  ),
                ),
              ),
            ),
            const SizedBox(width: 8),
            GestureDetector(
              onTap: onSubmit,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                decoration: BoxDecoration(
                  color: AppColors.primary,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Text(
                  'Update',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: Colors.white,
                  ),
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }
}

// ──────────────────────────────────────────────
//  Action Button
// ──────────────────────────────────────────────

class _ActionBtn extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final Color color;

  const _ActionBtn({
    required this.icon,
    required this.label,
    required this.onTap,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.06),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 14, color: color),
            const SizedBox(width: 5),
            Text(
              label,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: color,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ──────────────────────────────────────────────
//  Helpers
// ──────────────────────────────────────────────

String _formatTimeAgo(DateTime date) {
  final now = DateTime.now();
  final diff = now.difference(date);
  if (diff.inMinutes < 1) return 'just now';
  if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
  if (diff.inHours < 24) return '${diff.inHours}h ago';
  if (diff.inDays < 7) return '${diff.inDays}d ago';
  if (diff.inDays < 30) return '${(diff.inDays / 7).floor()}w ago';
  return '${date.day}/${date.month}/${date.year}';
}

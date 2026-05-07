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

  final TextEditingController _editCommentController = TextEditingController();
  String? _deletingCommentId;

  late AnimationController _fadeController;
  late Animation<double> _fadeAnimation;

  // Reply navigation stack: each entry is a comment being replied to
  // The last item is the current deepest level
  final List<_ReplyLevel> _replyStack = [];

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

  void _navigateToReplies(Comment parentComment) {
    setState(() {
      _replyingToCommentId = parentComment.id;
      _replyingToName = parentComment.displayName;
      _replyStack.add(_ReplyLevel(
        parentComment: parentComment,
        currentReplies: parentComment.replies,
      ));
    });
  }

  void _navigateBack() {
    if (_replyStack.isNotEmpty) {
      setState(() {
        _replyStack.removeLast();
        // After popping, the new top (if any) becomes the reply target
        if (_replyStack.isNotEmpty) {
          _replyingToCommentId = _replyStack.last.parentComment.id;
          _replyingToName = _replyStack.last.parentComment.displayName;
        } else {
          _replyingToCommentId = null;
          _replyingToName = null;
        }
      });
    }
  }

  void _navigateToRoot() {
    setState(() {
      _replyStack.clear();
      _replyingToCommentId = null;
      _replyingToName = null;
    });
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
    _editCommentController.text = currentContent;
    showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        padding: EdgeInsets.only(
          left: 24,
          right: 24,
          top: 16,
          bottom: MediaQuery.of(ctx).viewInsets.bottom + 24,
        ),
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.grey.shade300,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 20),
            Row(
              children: [
                const Icon(Icons.edit_rounded, size: 20, color: AppColors.info),
                const SizedBox(width: 8),
                const Text(
                  'Edit Comment',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textPrimary,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              decoration: BoxDecoration(
                color: AppColors.background,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.grey.shade200),
              ),
              child: TextField(
                controller: _editCommentController,
                maxLines: null,
                minLines: 3,
                autofocus: true,
                decoration: const InputDecoration(
                  border: InputBorder.none,
                  hintText: 'Edit your comment...',
                ),
              ),
            ),
            const SizedBox(height: 20),
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
                        color: AppColors.primary,
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: const Center(
                        child: Text(
                          'Update',
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
          ],
        ),
      ),
    ).then((confirmed) {
      if (confirmed == true) {
        _submitEditComment(commentId);
      }
      _editCommentController.clear();
    });
  }

  Future<void> _submitEditComment(String commentId) async {
    if (_editCommentController.text.trim().isEmpty) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Comment content cannot be empty'),
            backgroundColor: AppColors.error,
          ),
        );
      }
      return;
    }

    setState(() {});
    try {
      final updated = await CommentService.updateComment(
        issueId: widget.issueId,
        commentId: commentId,
        content: _editCommentController.text.trim(),
      );
      if (updated != null && mounted) {
        setState(() => _issue = updated);
        _syncReplyStack();
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
        issueId: widget.issueId,
        commentId: _deletingCommentId!,
      );
      if (updated != null && mounted) {
        setState(() {
          _issue = updated;
          _deletingCommentId = null;
        });
        _syncReplyStack();
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
        _syncReplyStack();

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
        _syncReplyStack();
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

  /// Sync reply stack with updated issue data
  void _syncReplyStack() {
    for (int i = 0; i < _replyStack.length; i++) {
      final level = _replyStack[i];
      Comment? updated = _findCommentById(_issue!.comments, level.parentComment.id);
      if (updated == null) {
        _replyStack.removeRange(i, _replyStack.length);
        break;
      }
      if (i == 0) {
        _replyStack[i] = _ReplyLevel(
          parentComment: updated,
          currentReplies: updated.replies,
        );
      } else {
        final prevParentId = _replyStack[i - 1].parentComment.id;
        Comment? prevUpdated = _findCommentById(_issue!.comments, prevParentId);
        if (prevUpdated != null) {
          Comment? found = _findCommentById(prevUpdated.replies, level.parentComment.id);
          if (found != null) {
            _replyStack[i] = _ReplyLevel(
              parentComment: found,
              currentReplies: found.replies,
            );
          }
        }
      }
    }
    if (_replyStack.isNotEmpty) {
      final currentParent = _replyStack.last.parentComment;
      _replyingToCommentId = currentParent.id;
      _replyingToName = currentParent.displayName;
    }
  }

  Comment? _findCommentById(List<Comment> comments, String id) {
    for (final c in comments) {
      if (c.id == id) return c;
      final found = _findCommentById(c.replies, id);
      if (found != null) return found;
    }
    return null;
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

  /// Gets the current comment list based on reply stack depth
  List<Comment> get _currentCommentList {
    if (_replyStack.isEmpty) {
      return _issue?.comments ?? [];
    }
    return _replyStack.last.currentReplies;
  }

  /// Gets the current parent comment (for displaying the parent at top when in reply view)
  Comment? get _currentParentComment {
    if (_replyStack.isEmpty) return null;
    return _replyStack.last.parentComment;
  }

  /// Whether we are in the root comment list view
  bool get _isAtRoot => _replyStack.isEmpty;

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
                                child: _buildMainContent(),
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

  Widget _buildMainContent() {
    return ListView(
      controller: _scrollController,
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 100),
      children: [
        if (_replyStack.isEmpty)
          _buildIssueCard(),
        if (_replyStack.isEmpty)
          const SizedBox(height: 20),
        if (_currentParentComment != null) _buildParentCommentHeader(),
        _buildCommentHeader(),
        ...(_currentCommentList).map((comment) =>
            _CommentCard(
              comment: comment,
              currentUserId: _currentUserId ?? '',
              currentUserRole: _currentUserRole ?? '',
              isLecturerOrAdmin: _isLecturerOrAdmin,
              isDeleting: _deletingCommentId == comment.id,
              onReply: _startReplying,
              onUpvote: _upvoteComment,
              onEdit: _startEditingComment,
              onDelete: _confirmDeleteComment,
              onCancelReply: _cancelReply,
              onNavigateToReplies: _navigateToReplies,
            )),
        if (_currentCommentList.isEmpty) _buildEmptyComments(),
        const SizedBox(height: 20),
      ],
    );
  }

  Widget _buildTopBar() {
    return Container(
      padding: const EdgeInsets.fromLTRB(8, 8, 16, 0),
      child: Row(
        children: [
          if (_replyStack.isNotEmpty)
            IconButton(
              onPressed: _navigateBack,
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
            )
          else
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
              mainAxisSize: MainAxisSize.min,
              children: [
                if (_replyStack.isEmpty)
                  const Text(
                    'Discussion',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w900,
                      color: AppColors.textPrimary,
                    ),
                  )
                else
                  _buildBreadcrumbRow(),
                if (_issue != null && _replyStack.isEmpty)
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
          if (_isLecturerOrAdmin && _issue != null && _replyStack.isEmpty)
            _StatusToggleButton(
              status: _issue!.status,
              isLoading: _isChangingStatus,
              onStatusChange: _changeStatus,
            ),
        ],
      ),
    );
  }

  String _buildBreadcrumb() {
    return _replyStack.map((level) => level.parentComment.displayName).join(' > ');
  }

  Widget _buildBreadcrumbRow() {
    final items = <Widget>[];

    // "Discussion" - always tappable to go to root
    items.add(
      GestureDetector(
        onTap: _navigateToRoot,
        child: const Text(
          'Discussion',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w900,
            color: AppColors.textPrimary,
          ),
        ),
      ),
    );

    // Build chain: Discussion > name1 > name2 > name3
    for (int i = 0; i < _replyStack.length; i++) {
      final level = _replyStack[i];

      // Chevron divider
      items.add(const Padding(
        padding: EdgeInsets.symmetric(horizontal: 4),
        child: Icon(
          Icons.chevron_right,
          size: 18,
          color: AppColors.textSecondary,
        ),
      ));

      // All names are clickable except the LAST one (current view)
      if (i == _replyStack.length - 1) {
        // Last item - not tappable, different color
        items.add(Text(
          level.parentComment.displayName,
          style: const TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w900,
            color: AppColors.primary,
          ),
        ));
      } else {
        // Intermediate items - tappable to go back to that level
        final targetIndex = i;
        items.add(
          GestureDetector(
            onTap: () {
              // Pop stack back to targetIndex (keep items 0..targetIndex inclusive)
              setState(() {
                while (_replyStack.length > targetIndex + 1) {
                  _replyStack.removeLast();
                }
                if (_replyStack.isNotEmpty) {
                  _replyingToCommentId = _replyStack.last.parentComment.id;
                  _replyingToName = _replyStack.last.parentComment.displayName;
                } else {
                  _replyingToCommentId = null;
                  _replyingToName = null;
                }
              });
            },
            child: Text(
              level.parentComment.displayName,
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w900,
                color: AppColors.textSecondary,
              ),
            ),
          ),
        );
      }
    }

    return Wrap(
      spacing: 0,
      runSpacing: 0,
      crossAxisAlignment: WrapCrossAlignment.center,
      children: items,
    );
  }

  Widget _buildParentCommentHeader() {
    final parent = _currentParentComment!;
    final authorAvatar = parent.authorDisplay?.avatarUrl;
    final authorName = parent.displayName;
    final timeAgo = _getTimeAgo(parent.createdDate);

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: AppColors.primary.withValues(alpha: 0.15),
          width: 1.5,
        ),
        boxShadow: [
          BoxShadow(
            color: AppColors.primary.withValues(alpha: 0.08),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Comment content area
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Author row
                Row(
                  children: [
                    CircleAvatar(
                      radius: 20,
                      backgroundColor: AppColors.primary.withValues(alpha: 0.15),
                      backgroundImage: authorAvatar != null && authorAvatar.isNotEmpty
                          ? NetworkImage(authorAvatar)
                          : null,
                      child: authorAvatar == null || authorAvatar.isEmpty
                          ? Text(
                              authorName.isNotEmpty ? authorName[0].toUpperCase() : '?',
                              style: const TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w700,
                                color: AppColors.primary,
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
                            authorName,
                            style: const TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.w700,
                              color: AppColors.textPrimary,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          Text(
                            timeAgo,
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w500,
                              color: AppColors.textSecondary.withValues(alpha: 0.8),
                            ),
                          ),
                        ],
                      ),
                    ),
                    // Navigate back button
                    GestureDetector(
                      onTap: _navigateBack,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: AppColors.primary.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(
                              Icons.arrow_back_ios_new_rounded,
                              size: 14,
                              color: AppColors.primary,
                            ),
                            const SizedBox(width: 4),
                            const Text(
                              'Back',
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                                color: AppColors.primary,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                // Content
                Text(
                  parent.content,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                    color: AppColors.textPrimary,
                    height: 1.5,
                  ),
                ),
              ],
            ),
          ),
          // Footer: replying to label
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            decoration: BoxDecoration(
              color: AppColors.primary.withValues(alpha: 0.06),
              borderRadius: const BorderRadius.only(
                bottomLeft: Radius.circular(16),
                bottomRight: Radius.circular(16),
              ),
            ),
            child: Row(
              children: [
                const Icon(
                  Icons.subdirectory_arrow_right_rounded,
                  size: 16,
                  color: AppColors.primary,
                ),
                const SizedBox(width: 8),
                Text(
                  'Replying to $authorName',
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: AppColors.primary,
                  ),
                ),
                const Spacer(),
                const Text(
                  'Viewing replies',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                    color: AppColors.textSecondary,
                  ),
                ),
              ],
            ),
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
    final commentCount = _currentCommentList.length;
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
            '$commentCount ${commentCount == 1 ? 'Reply' : 'Replies'}',
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
            Text(
              _isAtRoot ? 'No comments yet' : 'No replies yet',
              style: const TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w700,
                color: AppColors.textSecondary,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              _isAtRoot ? 'Be the first to comment!' : 'Be the first to reply!',
              style: const TextStyle(
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

  String _getTimeAgo(DateTime dt) {
    final diff = DateTime.now().difference(dt);
    if (diff.inMinutes < 1) return 'Just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    if (diff.inDays < 30) return '${diff.inDays}d ago';
    if (diff.inDays < 365) return '${(diff.inDays / 30).floor()}mo ago';
    return '${(diff.inDays / 365).floor()}y ago';
  }
}

// ──────────────────────────────────────────────
//  Reply Level (internal helper class)
// ──────────────────────────────────────────────

class _ReplyLevel {
  final Comment parentComment;
  final List<Comment> currentReplies;

  _ReplyLevel({
    required this.parentComment,
    required this.currentReplies,
  });
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
  final bool isDeleting;
  final Function(String, String) onReply;
  final Function(String) onUpvote;
  final Function(String, String) onEdit;
  final Function(String) onDelete;
  final VoidCallback onCancelReply;
  final Function(Comment) onNavigateToReplies;

  const _CommentCard({
    required this.comment,
    required this.currentUserId,
    required this.currentUserRole,
    required this.isLecturerOrAdmin,
    this.isDeleting = false,
    required this.onReply,
    required this.onUpvote,
    required this.onEdit,
    required this.onDelete,
    required this.onCancelReply,
    required this.onNavigateToReplies,
  });

  @override
  Widget build(BuildContext context) {
    if (comment.isDeleted) return const SizedBox.shrink();

    final isOwn = comment.authorId == currentUserId;
    final hasReplies = comment.replies.isNotEmpty;

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            decoration: BoxDecoration(
              color: isDeleting
                  ? Colors.red.shade50
                  : Colors.white,
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.03),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Padding(
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
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
                                  size: 18, color: AppColors.success),
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
                  Row(
                    children: [
                      _ActionBtn(
                        icon: Icons.thumb_up_outlined,
                        onTap: () => onUpvote(comment.id),
                        color: AppColors.textSecondary,
                      ),
                      const SizedBox(width: 6),
                      _ActionBtn(
                        icon: Icons.reply_rounded,
                        onTap: () => onNavigateToReplies(comment),
                        color: AppColors.primary,
                      ),
                        if (hasReplies) ...[
                        const SizedBox(width: 6),
                        GestureDetector(
                          onTap: () => onNavigateToReplies(comment),
                          child: Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 8, vertical: 6),
                            decoration: BoxDecoration(
                              color: Colors.orange.withValues(alpha: 0.08),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Icon(Icons.forum_outlined,
                                    size: 18, color: Colors.orange),
                                const SizedBox(width: 3),
                                Text(
                                  '${comment.replies.length}',
                                  style: const TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w700,
                                    color: Colors.orange,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                      if (isOwn) ...[
                        const SizedBox(width: 6),
                        _ActionBtn(
                          icon: Icons.edit_outlined,
                          onTap: () =>
                              onEdit(comment.id, comment.content),
                          color: AppColors.info,
                        ),
                        const SizedBox(width: 6),
                        _ActionBtn(
                          icon: Icons.delete_outline_rounded,
                          onTap: () => onDelete(comment.id),
                          color: Colors.red,
                        ),
                      ],
                    ],
                  ),
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
          ),
        ],
      ),
    );
  }
}

// ──────────────────────────────────────────────
//  Action Button
// ──────────────────────────────────────────────

class _ActionBtn extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;
  final Color color;

  const _ActionBtn({
    required this.icon,
    required this.onTap,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Icon(icon, size: 18, color: color),
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

import 'package:flutter/material.dart';
import 'package:mobile/core/storage/token_storage.dart';
import 'package:mobile/core/theme/app_colors.dart';
import 'package:mobile/core/widgets/background.dart';
import 'package:mobile/features/models/announcement.dart';
import 'package:mobile/features/models/classroom.dart';
import 'package:mobile/features/models/discussion_issue.dart';
import 'package:mobile/features/presentation/classroom/student_classroom_detail_page.dart';
import 'package:mobile/features/presentation/discussion/discussion_detail_page.dart';
import 'package:mobile/features/presentation/examination/examination_detail_page.dart';
import 'package:mobile/features/presentation/problem/problem_detail_page.dart';
import 'package:mobile/features/services/announcement_service.dart';
import 'package:mobile/features/services/classroom_service.dart';
import 'package:mobile/features/services/discussion_service.dart';
import 'package:mobile/features/services/examination_service.dart';
import 'package:shared_preferences/shared_preferences.dart';

enum AnnouncementFilter {
  all,
  unread,
  confirmed,
}

class AnnouncementPage extends StatefulWidget {
  const AnnouncementPage({super.key});

  @override
  State<AnnouncementPage> createState() => _AnnouncementPageState();
}

class _AnnouncementPageState extends State<AnnouncementPage> {
  bool _isLoading = true;
  String? _error;
  List<Announcement> _items = <Announcement>[];
  final Set<String> _acknowledgedKeys = <String>{};
  AnnouncementFilter _selectedFilter = AnnouncementFilter.all;
  String _ackStorageKey = 'announcement_ack_unknown';

  @override
  void initState() {
    super.initState();
    AnnouncementFeed.revision.addListener(_onFeedUpdated);
    _bootstrap();
  }

  @override
  void dispose() {
    AnnouncementFeed.revision.removeListener(_onFeedUpdated);
    super.dispose();
  }

  Future<void> _bootstrap() async {
    await _loadAcknowledgedState();
    await _loadAnnouncements();
  }

  Future<void> _loadAcknowledgedState() async {
    final userId = await TokenStorage.getUserId() ?? 'unknown';
    _ackStorageKey = 'announcement_ack_$userId';

    final prefs = await SharedPreferences.getInstance();
    final saved = prefs.getStringList(_ackStorageKey) ?? <String>[];

    if (!mounted) {
      return;
    }

    setState(() {
      _acknowledgedKeys
        ..clear()
        ..addAll(saved);
    });
  }

  Future<void> _saveAcknowledgedState() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setStringList(_ackStorageKey, _acknowledgedKeys.toList());
  }

  Future<void> _loadAnnouncements() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final fromServer = await AnnouncementService.getMyAnnouncements();
      final merged = _mergeAndSort(fromServer, AnnouncementFeed.inAppItems);

      if (!mounted) {
        return;
      }

      setState(() {
        _items = merged;
      });

      _syncUnreadState();
    } catch (e) {
      if (!mounted) {
        return;
      }

      setState(() {
        _error = e.toString();
      });
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  void _onFeedUpdated() {
    if (!mounted) {
      return;
    }

    setState(() {
      _items = _mergeAndSort(_items, AnnouncementFeed.inAppItems);
    });

    _syncUnreadState();
  }

  Future<void> _markAsAcknowledged(Announcement item) async {
    final key = item.dedupeKey;
    if (_acknowledgedKeys.contains(key)) {
      return;
    }

    setState(() {
      _acknowledgedKeys.add(key);
    });

    await _saveAcknowledgedState();
    _syncUnreadState();
  }

  void _syncUnreadState() {
    AnnouncementFeed.updateUnreadState(_unreadCount > 0);
  }

  List<Announcement> _mergeAndSort(
    List<Announcement> base,
    List<Announcement> extra,
  ) {
    final byKey = <String, Announcement>{
      for (final item in base) item.dedupeKey: item,
    };

    for (final item in extra) {
      byKey[item.dedupeKey] = item;
    }

    final merged = byKey.values.toList();
    merged.sort((a, b) => b.sentDate.compareTo(a.sentDate));
    return merged;
  }

  List<Announcement> get _filteredItems {
    switch (_selectedFilter) {
      case AnnouncementFilter.unread:
        return _items
            .where((x) => !_acknowledgedKeys.contains(x.dedupeKey))
            .toList();
      case AnnouncementFilter.confirmed:
        return _items
            .where((x) => _acknowledgedKeys.contains(x.dedupeKey))
            .toList();
      case AnnouncementFilter.all:
        return _items;
    }
  }

  Future<void> _handleAnnouncementTap(Announcement item) async {
    await _markAsAcknowledged(item);
    await _navigateByNotificationType(item);
  }

  Future<void> _navigateByNotificationType(Announcement item) async {
    final type = item.type.trim().toUpperCase();
    final payload = item.payload;

    try {
      if (type == 'NEW_MATERIAL' || type == 'NEW_PRACTICE') {
        final classroomId = _extractPayloadValue(payload, const [
          'classroomId',
          'classId',
        ]);
        if (classroomId != null) {
          await _openClassroom(classroomId, initialTabIndex: 0);
        }
        return;
      }

      if (type == 'NEW_EXAMINATION' || type == 'GRADE_RESULT') {
        final examId = _extractPayloadValue(payload, const [
          'examId',
          'examinationId',
        ]);
        if (examId != null) {
          await _openExamination(examId);
          return;
        }

        final classroomId = _extractPayloadValue(payload, const [
          'classroomId',
          'classId',
        ]);
        if (classroomId != null) {
          await _openClassroom(classroomId, initialTabIndex: 0);
        }
        return;
      }

      if (type == 'NEW_DISCUSSION_ISSUE' || type == 'REPLY_COMMENT') {
        final discussionIssueId = _extractPayloadValue(payload, const [
          'discussionIssueId',
          'issueId',
        ]);
        if (discussionIssueId != null) {
          await _openDiscussionIssue(discussionIssueId);
          return;
        }

        final classroomId = _extractPayloadValue(payload, const [
          'classroomId',
          'classId',
        ]);
        if (classroomId != null) {
          await _openClassroom(classroomId, initialTabIndex: 3);
        }
        return;
      }

      final problemId = _extractPayloadValue(payload, const [
        'problemId',
      ]);
      if (problemId != null) {
        await _openProblem(problemId);
      }
    } catch (e) {
      if (!mounted) {
        return;
      }

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Cannot open target screen: $e'),
          backgroundColor: AppColors.warning,
        ),
      );
    }
  }

  String? _extractPayloadValue(
    Map<String, dynamic> payload,
    List<String> candidateKeys,
  ) {
    if (payload.isEmpty) {
      return null;
    }

    for (final key in candidateKeys) {
      final direct = payload[key];
      if (direct != null && direct.toString().trim().isNotEmpty) {
        return direct.toString().trim();
      }

      final lowerKey = key.toLowerCase();
      for (final entry in payload.entries) {
        if (entry.key.toLowerCase() == lowerKey) {
          final value = entry.value?.toString().trim() ?? '';
          if (value.isNotEmpty) {
            return value;
          }
        }
      }
    }

    return null;
  }

  Future<void> _openClassroom(
    String classroomId, {
    int initialTabIndex = 0,
  }) async {
    Classroom? classroom;

    final userId = await TokenStorage.getUserId();
    if (userId != null && userId.isNotEmpty) {
      try {
        final studentClasses = await ClassroomService.getStudentClassrooms(userId);
        for (final candidate in studentClasses) {
          if (candidate.id == classroomId) {
            classroom = candidate;
            break;
          }
        }
      } catch (_) {
        // Fallback to classroom-by-id below when student context lookup fails.
      }
    }

    classroom ??= await ClassroomService.getClassroomById(classroomId);
    if (!mounted || classroom == null) {
      return;
    }

    await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => StudentClassroomDetailPage(
          classroom: classroom!,
          initialTabIndex: initialTabIndex,
        ),
      ),
    );
  }

  Future<void> _openDiscussionIssue(String discussionIssueId) async {
    final raw = await DiscussionIssueService.getById(discussionIssueId);
    if (!mounted || raw == null) {
      return;
    }

    await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => DiscussionDetailPage(issue: DiscussionIssue.fromJson(raw)),
      ),
    );
  }

  Future<void> _openExamination(String examId) async {
    final exam = await ExaminationService.getExaminationById(examId);
    if (!mounted || exam == null) {
      return;
    }

    await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => ExaminationDetailPage(examination: exam),
      ),
    );
  }

  Future<void> _openProblem(String problemId) async {
    if (!mounted) {
      return;
    }

    await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => ProblemDetailPage(problemId: problemId),
      ),
    );
  }

  int get _unreadCount {
    return _items.where((x) => !_acknowledgedKeys.contains(x.dedupeKey)).length;
  }

  int get _confirmedCount {
    return _items.where((x) => _acknowledgedKeys.contains(x.dedupeKey)).length;
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Stack(
        children: [
          GradientBackground(),
          Center(child: CircularProgressIndicator()),
        ],
      );
    }

    if (_error != null) {
      return Stack(
        children: [
          const GradientBackground(),
          Center(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.error_outline, size: 40, color: Colors.redAccent),
                  const SizedBox(height: 12),
                  Text(
                    'Failed to load announcements',
                    style: Theme.of(context).textTheme.titleMedium,
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    _error!,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: AppColors.textSecondary,
                        ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 16),
                  FilledButton.icon(
                    onPressed: _loadAnnouncements,
                    icon: const Icon(Icons.refresh),
                    label: const Text('Try again'),
                  ),
                ],
              ),
            ),
          ),
        ],
      );
    }

    return Stack(
      children: [
        const GradientBackground(),
        Column(
          children: [
            _buildHeader(),
            _buildFilterBanner(),
            Expanded(
              child: RefreshIndicator(
                onRefresh: _loadAnnouncements,
                child: _buildAnnouncementList(),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildHeader() {
    return Container(
      padding: const EdgeInsets.fromLTRB(24, 40, 24, 14),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppColors.primary.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(16),
            ),
            child: const Icon(Icons.campaign_rounded, color: AppColors.primary, size: 26),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Announcements',
                  style: TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.w900,
                    color: AppColors.textPrimary,
                    letterSpacing: -0.4,
                  ),
                ),
                Text(
                  'Thông báo theo tài khoản của bạn',
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey[600],
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterBanner() {
    return Container(
      margin: const EdgeInsets.fromLTRB(24, 0, 24, 12),
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.55),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.withValues(alpha: 0.1)),
      ),
      child: Row(
        children: [
          Expanded(
            child: _FilterButton(
              label: 'Tất cả',
              count: _items.length,
              selected: _selectedFilter == AnnouncementFilter.all,
              onTap: () => setState(() => _selectedFilter = AnnouncementFilter.all),
            ),
          ),
          Expanded(
            child: _FilterButton(
              label: 'Chưa đọc',
              count: _unreadCount,
              showUnreadDot: _unreadCount > 0,
              selected: _selectedFilter == AnnouncementFilter.unread,
              onTap: () => setState(() => _selectedFilter = AnnouncementFilter.unread),
            ),
          ),
          Expanded(
            child: _FilterButton(
              label: 'Đã xác nhận',
              count: _confirmedCount,
              selected: _selectedFilter == AnnouncementFilter.confirmed,
              onTap: () => setState(() => _selectedFilter = AnnouncementFilter.confirmed),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAnnouncementList() {
    final visibleItems = _filteredItems;

    if (visibleItems.isEmpty) {
      return ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.only(top: 72),
        children: [
          Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.notifications_none_rounded, size: 64, color: Colors.grey[350]),
                const SizedBox(height: 14),
                Text(
                  'Không có thông báo',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        color: AppColors.textPrimary,
                      ),
                ),
                const SizedBox(height: 6),
                Text(
                  'Thông báo mới sẽ hiển thị ở đây.',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: AppColors.textSecondary,
                      ),
                ),
              ],
            ),
          ),
        ],
      );
    }

    return ListView.separated(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
      itemCount: visibleItems.length,
      separatorBuilder: (_, index) => const SizedBox(height: 12),
      itemBuilder: (context, index) {
        final item = visibleItems[index];
        final isAcknowledged = _acknowledgedKeys.contains(item.dedupeKey);
        return _AnnouncementCard(
          item: item,
          isAcknowledged: isAcknowledged,
          onTap: () => _handleAnnouncementTap(item),
        );
      },
    );
  }
}

class _AnnouncementCard extends StatelessWidget {
  final Announcement item;
  final bool isAcknowledged;
  final VoidCallback onTap;

  const _AnnouncementCard({
    required this.item,
    required this.isAcknowledged,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final statusColor = isAcknowledged ? AppColors.info : AppColors.accentDark;

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: isAcknowledged ? 0.9 : 0.96),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: statusColor.withValues(alpha: 0.24)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.03),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.campaign, color: AppColors.primary, size: 18),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    _humanizeType(item.type),
                    style: Theme.of(context).textTheme.labelLarge?.copyWith(
                          fontWeight: FontWeight.w700,
                          color: AppColors.primary,
                        ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                if (!isAcknowledged) ...[
                  Container(
                    width: 9,
                    height: 9,
                    decoration: const BoxDecoration(
                      shape: BoxShape.circle,
                      color: AppColors.error,
                    ),
                  ),
                  const SizedBox(width: 8),
                ],
                _StatusPill(
                  label: isAcknowledged ? 'Đã xác nhận' : 'Chưa đọc',
                  color: statusColor,
                ),
              ],
            ),
            const SizedBox(height: 10),
            Text(
              item.title,
              style: Theme.of(context).textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.w700,
                    color: AppColors.textPrimary,
                  ),
            ),
            const SizedBox(height: 6),
            Text(
              item.body,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: AppColors.textSecondary,
                    height: 1.35,
                  ),
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                Text(
                  _formatDate(item.sentDate),
                  style: Theme.of(context).textTheme.labelSmall?.copyWith(
                        color: AppColors.textSecondary,
                      ),
                ),
                const Spacer(),
                const Icon(Icons.arrow_forward_ios_rounded, size: 14, color: AppColors.textLight),
              ],
            ),
          ],
        ),
      ),
    );
  }

  String _humanizeType(String raw) {
    final normalized = raw.trim();
    if (normalized.isEmpty) {
      return 'SYSTEM';
    }

    return normalized
        .split('_')
        .where((x) => x.isNotEmpty)
        .map((part) => '${part[0]}${part.substring(1).toLowerCase()}')
        .join(' ')
        .toUpperCase();
  }

  String _formatDate(DateTime input) {
    final local = input.toLocal();
    final y = local.year.toString().padLeft(4, '0');
    final m = local.month.toString().padLeft(2, '0');
    final d = local.day.toString().padLeft(2, '0');
    final hh = local.hour.toString().padLeft(2, '0');
    final mm = local.minute.toString().padLeft(2, '0');
    return '$d/$m/$y $hh:$mm';
  }
}

class _StatusPill extends StatelessWidget {
  final String label;
  final Color color;

  const _StatusPill({
    required this.label,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.w700,
          color: color,
        ),
      ),
    );
  }
}

class _FilterButton extends StatelessWidget {
  final String label;
  final int count;
  final bool showUnreadDot;
  final bool selected;
  final VoidCallback onTap;

  const _FilterButton({
    required this.label,
    required this.count,
    this.showUnreadDot = false,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(vertical: 8),
        decoration: BoxDecoration(
          color: selected ? AppColors.primary : Colors.transparent,
          borderRadius: BorderRadius.circular(10),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  label,
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    color: selected ? Colors.white : AppColors.textLight,
                  ),
                ),
                if (showUnreadDot) ...[
                  const SizedBox(width: 5),
                  Container(
                    width: 7,
                    height: 7,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: selected ? Colors.white : AppColors.error,
                    ),
                  ),
                ],
              ],
            ),
            const SizedBox(height: 2),
            Text(
              '$count',
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w700,
                color: selected ? Colors.white : AppColors.textSecondary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

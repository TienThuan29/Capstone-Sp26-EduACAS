import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:mobile/core/storage/token_storage.dart';
import 'package:mobile/core/theme/app_colors.dart';
import 'package:mobile/features/models/classroom/classroom_model.dart';
import 'package:mobile/features/services/classroom_service.dart';
import 'package:mobile/features/models/classroom.dart';
import 'package:mobile/features/presentation/student/classroom_detail_page.dart';

// ─────────────────────────────────────────────────────────────────────────────
//  Filter state
// ─────────────────────────────────────────────────────────────────────────────

enum _EnrollStatus { all, joined, notJoined }

// ─────────────────────────────────────────────────────────────────────────────
//  ClassroomPage
// ─────────────────────────────────────────────────────────────────────────────

class ClassroomPage extends StatefulWidget {
  const ClassroomPage({super.key});

  @override
  State<ClassroomPage> createState() => _ClassroomPageState();
}

class _ClassroomPageState extends State<ClassroomPage>
    with SingleTickerProviderStateMixin {
  // ── state ──────────────────────────────────────────────────────────────────
  List<ClassroomModel> _allClassrooms = [];
  bool _isLoading = true;
  String? _error;
  int _currentPage = 1;
  int _totalPages = 1;
  String _userId = '';

  // search + filter
  final _searchController = TextEditingController();
  String _searchQuery = '';
  _EnrollStatus _statusFilter = _EnrollStatus.all;
  String? _semesterFilter; // null = all semesters

  late AnimationController _animCtrl;
  late Animation<double> _fadeAnim;

  static const int _pageSize = 20; // load more at once, filter client-side

  // ── lifecycle ──────────────────────────────────────────────────────────────
  @override
  void initState() {
    super.initState();
    _animCtrl = AnimationController(
      duration: const Duration(milliseconds: 500),
      vsync: this,
    );
    _fadeAnim = CurvedAnimation(parent: _animCtrl, curve: Curves.easeOut);
    _searchController.addListener(() {
      setState(() => _searchQuery = _searchController.text.toLowerCase());
    });
    _init();
  }

  @override
  void dispose() {
    _animCtrl.dispose();
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _init() async {
    final id = await TokenStorage.getUserId();
    _userId = id ?? '';
    await _loadClassrooms();
  }

  Future<void> _loadClassrooms({int page = 1}) async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    _animCtrl.reset();
    try {
      final result = await ClassroomService.getAllClassrooms(
        userId: _userId,
        pageIndex: page,
        pageSize: _pageSize,
      );
      setState(() {
        _allClassrooms = result.items;
        _currentPage = result.pageIndex;
        _totalPages = result.totalPages;
        _isLoading = false;
      });
      _animCtrl.forward();
    } catch (e) {
      setState(() {
        _error = e.toString().replaceFirst('Exception: ', '');
        _isLoading = false;
      });
    }
  }

  // ── derived data ───────────────────────────────────────────────────────────

  List<String> get _semesters {
    final seen = <String>{};
    final result = <String>[];
    for (final c in _allClassrooms) {
      if (c.semesterName.isNotEmpty && seen.add(c.semesterName)) {
        result.add(c.semesterName);
      }
    }
    return result;
  }

  List<ClassroomModel> get _filtered {
    return _allClassrooms.where((c) {
      // search
      if (_searchQuery.isNotEmpty) {
        final q = _searchQuery;
        if (!c.className.toLowerCase().contains(q) &&
            !c.classCode.toLowerCase().contains(q) &&
            !c.subject.subjectName.toLowerCase().contains(q)) {
          return false;
        }
      }
      // status
      if (_statusFilter == _EnrollStatus.joined && !c.enrollment.isJoining) {
        return false;
      }
      if (_statusFilter == _EnrollStatus.notJoined && c.enrollment.isJoining) {
        return false;
      }
      // semester
      if (_semesterFilter != null && c.semesterName != _semesterFilter) {
        return false;
      }
      return true;
    }).toList();
  }

  // ── join dialog ─────────────────────────────────────────────────────────────
  Future<void> _showJoinDialog(ClassroomModel classroom) async {
    final keyController = TextEditingController();
    bool isJoining = false;

    await showDialog(
      context: context,
      barrierDismissible: true,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setLS) => Dialog(
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
          elevation: 0,
          backgroundColor: Colors.transparent,
          child: Container(
            padding: const EdgeInsets.all(28),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(24),
              boxShadow: [
                BoxShadow(
                  color: AppColors.primary.withValues(alpha: 0.15),
                  blurRadius: 32,
                  offset: const Offset(0, 12),
                ),
              ],
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(colors: [
                          AppColors.primary,
                          AppColors.primaryLight
                        ]),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(Icons.vpn_key_rounded,
                          color: Colors.white, size: 22),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('Join Classroom',
                              style: TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.bold,
                                  color: AppColors.textPrimary)),
                          Text(classroom.classCode,
                              style: const TextStyle(
                                  fontSize: 13,
                                  color: AppColors.textSecondary,
                                  fontWeight: FontWeight.w500)),
                        ],
                      ),
                    ),
                    IconButton(
                      onPressed: () => Navigator.pop(ctx),
                      icon: const Icon(Icons.close,
                          color: AppColors.textSecondary),
                      splashRadius: 20,
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                // Classroom info chip
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: AppColors.background,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.class_,
                          color: AppColors.primary, size: 20),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(classroom.className,
                            style: const TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                                color: AppColors.textPrimary)),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 18),
                Text('Enrollment Key',
                    style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: Colors.grey[700])),
                const SizedBox(height: 8),
                TextField(
                  controller: keyController,
                  decoration: InputDecoration(
                    hintText: 'Enter the enrollment key',
                    hintStyle: const TextStyle(color: AppColors.textLight),
                    prefixIcon: const Icon(Icons.lock_outline,
                        color: AppColors.primary, size: 20),
                    filled: true,
                    fillColor: AppColors.background,
                    border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide.none),
                    enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide:
                            BorderSide(color: Colors.grey.shade200)),
                    focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(
                            color: AppColors.primary, width: 2)),
                  ),
                ),
                const SizedBox(height: 24),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        onPressed: () => Navigator.pop(ctx),
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12)),
                          side: BorderSide(color: Colors.grey.shade300),
                        ),
                        child: const Text('Cancel',
                            style:
                                TextStyle(color: AppColors.textSecondary)),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: ElevatedButton(
                        onPressed: isJoining
                            ? null
                            : () async {
                                final key = keyController.text.trim();
                                if (key.isEmpty) {
                                  _showSnack(
                                      'Please enter the enrollment key',
                                      isError: true);
                                  return;
                                }
                                setLS(() => isJoining = true);
                                try {
                                  await ClassroomService.enrollClassroom(
                                    classId: classroom.id,
                                    studentId: _userId,
                                    enrolKey: key,
                                  );
                                  if (ctx.mounted) Navigator.pop(ctx);
                                  _showSnack(
                                      'Successfully joined ${classroom.className}!');
                                  _loadClassrooms(page: _currentPage);
                                } catch (e) {
                                  setLS(() => isJoining = false);
                                  String msg = e
                                      .toString()
                                      .replaceFirst('Exception: ', '');
                                  if (msg.contains('400')) {
                                    msg =
                                        'Invalid enrollment key. Please try again.';
                                  } else if (msg.contains('409')) {
                                    msg =
                                        'You are already enrolled in this classroom.';
                                  } else if (msg.contains('500')) {
                                    msg =
                                        'Server error. Please try again later.';
                                  }
                                  _showSnack(msg, isError: true);
                                }
                              },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12)),
                          elevation: 0,
                        ),
                        child: isJoining
                            ? const SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(
                                    strokeWidth: 2, color: Colors.white))
                            : const Text('Join',
                                style: TextStyle(
                                    fontWeight: FontWeight.bold)),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  // ── helpers ────────────────────────────────────────────────────────────────
  void _showSnack(String message, {bool isError = false}) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            Icon(
              isError ? Icons.error_outline : Icons.check_circle_outline,
              color: Colors.white,
              size: 18,
            ),
            const SizedBox(width: 8),
            Expanded(child: Text(message)),
          ],
        ),
        backgroundColor: isError ? AppColors.error : AppColors.success,
        behavior: SnackBarBehavior.floating,
        shape:
            RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        margin: const EdgeInsets.all(16),
      ),
    );
  }

  // ── build ───────────────────────────────────────────────────────────────────
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildHeader(),
          _buildSearchAndFilter(),
          Expanded(child: _buildBody()),
          if (!_isLoading && _error == null && _totalPages > 1)
            _buildPagination(),
        ],
      ),
    );
  }

  // ── header ──────────────────────────────────────────────────────────────────
  Widget _buildHeader() {
    final filtered = _filtered;
    return Container(
      padding: const EdgeInsets.fromLTRB(24, 28, 24, 20),
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [AppColors.primary, AppColors.primaryLight],
        ),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.2),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(Icons.school_rounded,
                color: Colors.white, size: 24),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Classrooms',
                    style: TextStyle(
                        color: Colors.white,
                        fontSize: 22,
                        fontWeight: FontWeight.bold)),
                if (!_isLoading && _error == null)
                  Text(
                    '${filtered.length} classroom${filtered.length != 1 ? 's' : ''} found',
                    style: const TextStyle(color: Colors.white70, fontSize: 13),
                  ),
              ],
            ),
          ),
          IconButton(
            onPressed: () => _loadClassrooms(page: _currentPage),
            icon: const Icon(Icons.refresh_rounded, color: Colors.white),
            tooltip: 'Refresh',
          ),
        ],
      ),
    );
  }

  // ── search + filter bar ─────────────────────────────────────────────────────
  Widget _buildSearchAndFilter() {
    final semesters = _semesters;
    return Container(
      color: Colors.white,
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Search field
          TextField(
            controller: _searchController,
            decoration: InputDecoration(
              hintText: 'Search by name, code or subject…',
              hintStyle: TextStyle(color: Colors.grey[400], fontSize: 14),
              prefixIcon: Icon(Icons.search_rounded,
                  color: Colors.grey[400], size: 20),
              suffixIcon: _searchQuery.isNotEmpty
                  ? IconButton(
                      icon: Icon(Icons.clear_rounded, color: Colors.grey[400]),
                      onPressed: () => _searchController.clear(),
                    )
                  : null,
              filled: true,
              fillColor: AppColors.background,
              contentPadding: const EdgeInsets.symmetric(vertical: 12),
              border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide: BorderSide.none),
              enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide:
                      BorderSide(color: Colors.grey.shade200)),
              focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide:
                      const BorderSide(color: AppColors.primary, width: 1.5)),
            ),
          ),
          const SizedBox(height: 10),
          // Filter chips row
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                // Status filters
                _FilterChip(
                  label: 'All',
                  selected: _statusFilter == _EnrollStatus.all,
                  onTap: () => setState(
                      () => _statusFilter = _EnrollStatus.all),
                ),
                const SizedBox(width: 8),
                _FilterChip(
                  label: '✓ Joined',
                  selected: _statusFilter == _EnrollStatus.joined,
                  onTap: () => setState(
                      () => _statusFilter = _EnrollStatus.joined),
                  selectedColor: AppColors.success,
                ),
                const SizedBox(width: 8),
                _FilterChip(
                  label: 'Not Joined',
                  selected: _statusFilter == _EnrollStatus.notJoined,
                  onTap: () => setState(
                      () => _statusFilter = _EnrollStatus.notJoined),
                  selectedColor: AppColors.accent,
                ),
                if (semesters.isNotEmpty) ...[
                  const SizedBox(width: 16),
                  Container(
                      width: 1,
                      height: 24,
                      color: Colors.grey.shade300),
                  const SizedBox(width: 16),
                  // Semester filters
                  for (final sem in semesters) ...[
                    _FilterChip(
                      label: sem,
                      selected: _semesterFilter == sem,
                      onTap: () => setState(() => _semesterFilter =
                          _semesterFilter == sem ? null : sem),
                      selectedColor: const Color(0xFF5B4FCF),
                    ),
                    const SizedBox(width: 8),
                  ],
                ],
              ],
            ),
          ),
          const SizedBox(height: 4),
          Divider(color: Colors.grey.shade100, height: 1),
        ],
      ),
    );
  }

  // ── body ────────────────────────────────────────────────────────────────────
  Widget _buildBody() {
    if (_isLoading) {
      return const Center(
          child: CircularProgressIndicator(color: AppColors.primary));
    }
    if (_error != null) return _buildErrorState();

    final items = _filtered;
    if (items.isEmpty) return _buildEmptyState();

    return FadeTransition(
      opacity: _fadeAnim,
      child: GridView.builder(
        padding: const EdgeInsets.all(16),
        gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
          maxCrossAxisExtent: 380,
          mainAxisSpacing: 16,
          crossAxisSpacing: 16,
          childAspectRatio: 0.88,
        ),
        itemCount: items.length,
        itemBuilder: (context, index) => _ClassroomCard(
          classroom: items[index],
          onJoin: _showJoinDialog,
        ),
      ),
    );
  }

  Widget _buildErrorState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                  color: AppColors.error.withValues(alpha: 0.1),
                  shape: BoxShape.circle),
              child: const Icon(Icons.wifi_off_rounded,
                  size: 48, color: AppColors.error),
            ),
            const SizedBox(height: 16),
            const Text('Failed to load classrooms',
                style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textPrimary)),
            const SizedBox(height: 8),
            Text(_error!,
                style: const TextStyle(color: AppColors.textSecondary),
                textAlign: TextAlign.center),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: () => _loadClassrooms(page: _currentPage),
              icon: const Icon(Icons.refresh),
              label: const Text('Try Again'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12)),
                padding: const EdgeInsets.symmetric(
                    horizontal: 24, vertical: 14),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    final hasFilter = _searchQuery.isNotEmpty ||
        _statusFilter != _EnrollStatus.all ||
        _semesterFilter != null;
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.08),
                  shape: BoxShape.circle),
              child: Icon(
                hasFilter ? Icons.search_off_rounded : Icons.class_outlined,
                size: 56,
                color: AppColors.primary,
              ),
            ),
            const SizedBox(height: 20),
            Text(
              hasFilter ? 'No matching classrooms' : 'No classrooms available',
              style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: AppColors.textPrimary),
            ),
            const SizedBox(height: 8),
            Text(
              hasFilter
                  ? 'Try adjusting your search or filters.'
                  : 'There are currently no classrooms to display.',
              style: const TextStyle(color: AppColors.textSecondary),
              textAlign: TextAlign.center,
            ),
            if (hasFilter) ...[
              const SizedBox(height: 16),
              TextButton.icon(
                onPressed: () {
                  _searchController.clear();
                  setState(() {
                    _statusFilter = _EnrollStatus.all;
                    _semesterFilter = null;
                  });
                },
                icon: const Icon(Icons.filter_alt_off_rounded),
                label: const Text('Clear Filters'),
              ),
            ],
          ],
        ),
      ),
    );
  }

  // ── pagination ──────────────────────────────────────────────────────────────
  Widget _buildPagination() {
    return Container(
      color: Colors.white,
      padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 20),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          _PaginationButton(
            icon: Icons.chevron_left_rounded,
            enabled: _currentPage > 1,
            onPressed: () => _loadClassrooms(page: _currentPage - 1),
          ),
          const SizedBox(width: 12),
          for (int i = 1; i <= _totalPages; i++)
            if (_shouldShowPage(i))
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 3),
                child: _PageChip(
                  page: i,
                  isActive: i == _currentPage,
                  onTap: () => _loadClassrooms(page: i),
                ),
              )
            else if (i == 2 && _currentPage > 4)
              const Padding(
                padding: EdgeInsets.symmetric(horizontal: 4),
                child: Text('…',
                    style: TextStyle(color: AppColors.textSecondary)),
              )
            else if (i == _totalPages - 1 && _currentPage < _totalPages - 3)
              const Padding(
                padding: EdgeInsets.symmetric(horizontal: 4),
                child: Text('…',
                    style: TextStyle(color: AppColors.textSecondary)),
              ),
          const SizedBox(width: 12),
          _PaginationButton(
            icon: Icons.chevron_right_rounded,
            enabled: _currentPage < _totalPages,
            onPressed: () => _loadClassrooms(page: _currentPage + 1),
          ),
        ],
      ),
    );
  }

  bool _shouldShowPage(int page) {
    if (_totalPages <= 7) return true;
    if (page == 1 || page == _totalPages) return true;
    if ((page - _currentPage).abs() <= 2) return true;
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  _FilterChip
// ─────────────────────────────────────────────────────────────────────────────

class _FilterChip extends StatelessWidget {
  const _FilterChip({
    required this.label,
    required this.selected,
    required this.onTap,
    this.selectedColor,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;
  final Color? selectedColor;

  @override
  Widget build(BuildContext context) {
    final color = selectedColor ?? AppColors.primary;
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 160),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
        decoration: BoxDecoration(
          color: selected ? color.withValues(alpha: 0.12) : Colors.grey.shade100,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: selected ? color : Colors.grey.shade300,
            width: selected ? 1.5 : 1,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 12,
            fontWeight:
                selected ? FontWeight.w700 : FontWeight.w500,
            color: selected ? color : AppColors.textSecondary,
          ),
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  _ClassroomCard
// ─────────────────────────────────────────────────────────────────────────────

class _ClassroomCard extends StatefulWidget {
  const _ClassroomCard({
    required this.classroom,
    required this.onJoin,
  });

  final ClassroomModel classroom;
  final Future<void> Function(ClassroomModel) onJoin;

  @override
  State<_ClassroomCard> createState() => _ClassroomCardState();
}

class _ClassroomCardState extends State<_ClassroomCard> {
  bool _hovered = false;

  static const _gradients = [
    [Color(0xFF1565C0), Color(0xFF1E88E5)],
    [Color(0xFF00695C), Color(0xFF00ACC1)],
    [Color(0xFF283593), Color(0xFF3949AB)],
    [Color(0xFF6A1B9A), Color(0xFFAB47BC)],
    [Color(0xFF2E7D32), Color(0xFF43A047)],
    [Color(0xFFBF360C), Color(0xFFEF6C00)],
  ];

  @override
  Widget build(BuildContext context) {
    final c = widget.classroom;
    final isJoined = c.enrollment.isJoining;
    final colorPair = _gradients[c.id.hashCode.abs() % _gradients.length];

    // Lecturer avatar initials
    final nameParts = c.lecturer.fullname.trim().split(' ');
    final initials = nameParts.length >= 2
        ? '${nameParts.first[0]}${nameParts.last[0]}'.toUpperCase()
        : c.lecturer.fullname.isNotEmpty
            ? c.lecturer.fullname[0].toUpperCase()
            : '?';

    // End date label
    final now = DateTime.now();
    final daysLeft = c.endDate.difference(now).inDays;
    final isEnded = daysLeft < 0;

    return MouseRegion(
      onEnter: (_) => setState(() => _hovered = true),
      onExit: (_) => setState(() => _hovered = false),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: colorPair.first.withValues(
                alpha: _hovered ? 0.22 : 0.10,
              ),
              blurRadius: _hovered ? 28 : 14,
              offset: Offset(0, _hovered ? 12 : 6),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ── Colored banner ──────────────────────────────────────────────
            Container(
              height: 90,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: colorPair,
                ),
                borderRadius:
                    const BorderRadius.vertical(top: Radius.circular(20)),
              ),
              padding: const EdgeInsets.fromLTRB(16, 14, 14, 12),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Code badge
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.18),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            c.classCode,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 10,
                              fontWeight: FontWeight.w700,
                              letterSpacing: 0.8,
                            ),
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          c.className,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 15,
                            fontWeight: FontWeight.bold,
                            height: 1.2,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  // Status badge
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 9, vertical: 5),
                    decoration: BoxDecoration(
                      color: isJoined
                          ? Colors.green.shade400.withValues(alpha: 0.85)
                          : Colors.white.withValues(alpha: 0.18),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          isJoined
                              ? Icons.check_circle_rounded
                              : Icons.lock_outline_rounded,
                          color: Colors.white,
                          size: 12,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          isJoined ? 'Joined' : 'Open',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 10,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            // ── Card body ───────────────────────────────────────────────────
            Expanded(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Subject
                    _InfoRow(
                      icon: Icons.book_outlined,
                      text: c.subject.subjectName.isNotEmpty
                          ? c.subject.subjectName
                          : '—',
                      iconColor: colorPair.first,
                    ),
                    const SizedBox(height: 8),

                    // Lecturer row with avatar initials
                    Row(
                      children: [
                        CircleAvatar(
                          radius: 12,
                          backgroundColor:
                              colorPair.first.withValues(alpha: 0.15),
                          child: Text(
                            initials,
                            style: TextStyle(
                              fontSize: 9,
                              fontWeight: FontWeight.bold,
                              color: colorPair.first,
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            c.lecturer.fullname.isNotEmpty
                                ? c.lecturer.fullname
                                : '—',
                            style: const TextStyle(
                              fontSize: 12,
                              color: AppColors.textSecondary,
                              fontWeight: FontWeight.w500,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),

                    // Semester + slots row
                    Row(
                      children: [
                        Expanded(
                          child: _InfoRow(
                            icon: Icons.calendar_today_outlined,
                            text: c.semesterName.isNotEmpty
                                ? c.semesterName
                                : '—',
                            iconColor: colorPair.first,
                          ),
                        ),
                        const SizedBox(width: 8),
                        _InfoRow(
                          icon: Icons.people_outline_rounded,
                          text: '${c.maxSlot} slots',
                          iconColor: colorPair.first,
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),

                    // End date / joined date
                    if (isJoined && c.enrollment.joinedDate != null)
                      _InfoRow(
                        icon: Icons.verified_rounded,
                        text:
                            'Joined ${DateFormat('dd MMM yyyy').format(c.enrollment.joinedDate!)}',
                        iconColor: Colors.green,
                        textColor: Colors.green.shade700,
                      )
                    else
                      _InfoRow(
                        icon: Icons.event_outlined,
                        text: isEnded
                            ? 'Ended ${DateFormat('dd MMM yyyy').format(c.endDate)}'
                            : 'Ends ${DateFormat('dd MMM yyyy').format(c.endDate)}',
                        iconColor:
                            isEnded ? AppColors.error : AppColors.textSecondary,
                        textColor:
                            isEnded ? AppColors.error : AppColors.textSecondary,
                      ),

                    const Spacer(),

                    // ── Action button ───────────────────────────────────
                    SizedBox(
                      width: double.infinity,
                      child: isJoined
                          ? ElevatedButton.icon(
                              onPressed: () {
                                final mappedClassroom = Classroom(
                                  id: c.id,
                                  className: c.className,
                                  classCode: c.classCode,
                                  subjectId: c.subject.id,
                                  subjectName: c.subject.subjectName,
                                  lecturerId: c.lecturer.id,
                                  lecturerName: c.lecturer.fullname,
                                  lecturerEmail: c.lecturer.email,
                                  semesterName: c.semesterName,
                                  enrolKey: c.enrolKey,
                                  maxSlot: c.maxSlot,
                                  isDeleted: c.isDeleted,
                                  createdDate: c.createdDate.toIso8601String(),
                                  updatedDate: c.updatedDate?.toIso8601String(),
                                  endDate: c.endDate.toIso8601String(),
                                );
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (context) => StudentClassroomDetailPage(classroom: mappedClassroom),
                                  ),
                                );
                              },
                              icon: const Icon(Icons.open_in_new_rounded,
                                  size: 15),
                              label: const Text('Access Classroom'),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: colorPair.first,
                                foregroundColor: Colors.white,
                                disabledBackgroundColor:
                                    colorPair.first.withValues(alpha: 0.75),
                                disabledForegroundColor: Colors.white,
                                shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(12)),
                                padding:
                                    const EdgeInsets.symmetric(vertical: 11),
                                elevation: 0,
                                textStyle: const TextStyle(
                                    fontSize: 13,
                                    fontWeight: FontWeight.w600),
                              ),
                            )
                          : ElevatedButton.icon(
                              onPressed: () => widget.onJoin(c),
                              icon: const Icon(Icons.add_rounded, size: 15),
                              label: const Text('Join Classroom'),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppColors.accent,
                                foregroundColor: Colors.white,
                                shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(12)),
                                padding:
                                    const EdgeInsets.symmetric(vertical: 11),
                                elevation: 0,
                                textStyle: const TextStyle(
                                    fontSize: 13,
                                    fontWeight: FontWeight.w600),
                              ),
                            ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  _InfoRow
// ─────────────────────────────────────────────────────────────────────────────

class _InfoRow extends StatelessWidget {
  const _InfoRow({
    required this.icon,
    required this.text,
    this.iconColor,
    this.textColor,
  });

  final IconData icon;
  final String text;
  final Color? iconColor;
  final Color? textColor;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon,
            size: 13,
            color: iconColor ?? AppColors.textSecondary),
        const SizedBox(width: 5),
        Flexible(
          child: Text(
            text,
            style: TextStyle(
              fontSize: 12,
              color: textColor ?? AppColors.textSecondary,
              fontWeight: FontWeight.w500,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  Pagination widgets
// ─────────────────────────────────────────────────────────────────────────────

class _PaginationButton extends StatelessWidget {
  const _PaginationButton({
    required this.icon,
    required this.enabled,
    required this.onPressed,
  });

  final IconData icon;
  final bool enabled;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: enabled ? AppColors.primary : Colors.grey.shade200,
      borderRadius: BorderRadius.circular(10),
      child: InkWell(
        onTap: enabled ? onPressed : null,
        borderRadius: BorderRadius.circular(10),
        child: Container(
          padding: const EdgeInsets.all(8),
          child: Icon(icon,
              size: 20,
              color: enabled ? Colors.white : Colors.grey.shade400),
        ),
      ),
    );
  }
}

class _PageChip extends StatelessWidget {
  const _PageChip({
    required this.page,
    required this.isActive,
    required this.onTap,
  });

  final int page;
  final bool isActive;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        width: 36,
        height: 36,
        decoration: BoxDecoration(
          color: isActive ? AppColors.primary : Colors.grey.shade100,
          borderRadius: BorderRadius.circular(10),
          border: isActive ? null : Border.all(color: Colors.grey.shade300),
        ),
        alignment: Alignment.center,
        child: Text(
          '$page',
          style: TextStyle(
            color: isActive ? Colors.white : AppColors.textPrimary,
            fontWeight: isActive ? FontWeight.bold : FontWeight.normal,
            fontSize: 13,
          ),
        ),
      ),
    );
  }
}

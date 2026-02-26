import 'package:flutter/material.dart';
import 'package:mobile/core/storage/token_storage.dart';
import 'package:mobile/core/theme/app_colors.dart';
import 'package:mobile/features/models/classroom/classroom_model.dart';
import 'package:mobile/features/services/classroom_service.dart';

/// Displays all classrooms for the current student with join / access actions.
class ClassroomPage extends StatefulWidget {
  const ClassroomPage({super.key});

  @override
  State<ClassroomPage> createState() => _ClassroomPageState();
}

class _ClassroomPageState extends State<ClassroomPage>
    with SingleTickerProviderStateMixin {
  // ── state ──────────────────────────────────────────────────────────────
  List<ClassroomModel> _classrooms = [];
  bool _isLoading = true;
  String? _error;
  int _currentPage = 1;
  int _totalPages = 1;
  String _userId = '';

  late AnimationController _animationController;
  late Animation<double> _fadeAnimation;

  static const int _pageSize = 9;

  // ── lifecycle ──────────────────────────────────────────────────────────
  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 600),
      vsync: this,
    );
    _fadeAnimation = CurvedAnimation(
      parent: _animationController,
      curve: Curves.easeOut,
    );
    _init();
  }

  @override
  void dispose() {
    _animationController.dispose();
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
    _animationController.reset();

    try {
      final result = await ClassroomService.getAllClassrooms(
        userId: _userId,
        pageIndex: page,
        pageSize: _pageSize,
      );
      setState(() {
        _classrooms = result.items;
        _currentPage = result.pageIndex;
        _totalPages = result.totalPages;
        _isLoading = false;
      });
      _animationController.forward();
    } catch (e) {
      setState(() {
        _error = e.toString().replaceFirst('Exception: ', '');
        _isLoading = false;
      });
    }
  }

  // ── join dialog ─────────────────────────────────────────────────────────
  Future<void> _showJoinDialog(ClassroomModel classroom) async {
    final keyController = TextEditingController();
    bool isJoining = false;

    await showDialog(
      context: context,
      barrierDismissible: true,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (ctx, setLocalState) {
            return Dialog(
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(20),
              ),
              elevation: 0,
              backgroundColor: Colors.transparent,
              child: Container(
                padding: const EdgeInsets.all(28),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.primary.withValues(alpha: 0.15),
                      blurRadius: 30,
                      offset: const Offset(0, 10),
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
                            gradient: const LinearGradient(
                              colors: [AppColors.primary, AppColors.primaryLight],
                            ),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: const Icon(
                            Icons.vpn_key_rounded,
                            color: Colors.white,
                            size: 22,
                          ),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'Join Classroom',
                                style: TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.bold,
                                  color: AppColors.textPrimary,
                                ),
                              ),
                              Text(
                                classroom.classCode,
                                style: const TextStyle(
                                  fontSize: 13,
                                  color: AppColors.textSecondary,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ],
                          ),
                        ),
                        IconButton(
                          onPressed: () => Navigator.pop(ctx),
                          icon: const Icon(Icons.close, color: AppColors.textSecondary),
                          splashRadius: 20,
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),

                    // Classroom info
                    Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: AppColors.background,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.class_, color: AppColors.primary, size: 20),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Text(
                              classroom.className,
                              style: const TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                                color: AppColors.textPrimary,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 18),

                    // Enrol key input
                    Text(
                      'Enrollment Key',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: Colors.grey[700],
                      ),
                    ),
                    const SizedBox(height: 8),
                    TextField(
                      controller: keyController,
                      decoration: InputDecoration(
                        hintText: 'Enter the enrollment key',
                        hintStyle: const TextStyle(color: AppColors.textLight),
                        prefixIcon: const Icon(
                          Icons.lock_outline,
                          color: AppColors.primary,
                          size: 20,
                        ),
                        filled: true,
                        fillColor: AppColors.background,
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: BorderSide.none,
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: BorderSide(
                            color: Colors.grey.shade200,
                          ),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: const BorderSide(
                            color: AppColors.primary,
                            width: 2,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),

                    // Action buttons
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton(
                            onPressed: () => Navigator.pop(ctx),
                            style: OutlinedButton.styleFrom(
                              padding: const EdgeInsets.symmetric(vertical: 14),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                              side: BorderSide(color: Colors.grey.shade300),
                            ),
                            child: const Text(
                              'Cancel',
                              style: TextStyle(color: AppColors.textSecondary),
                            ),
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
                                        isError: true,
                                      );
                                      return;
                                    }
                                    setLocalState(() => isJoining = true);
                                    try {
                                      await ClassroomService.enrollClassroom(
                                        classId: classroom.id,
                                        studentId: _userId,
                                        enrolKey: key,
                                      );
                                      if (ctx.mounted) Navigator.pop(ctx);
                                      _showSnack(
                                        'Successfully joined ${classroom.className}!',
                                      );
                                      _loadClassrooms(page: _currentPage);
                                    } catch (e) {
                                      setLocalState(() => isJoining = false);
                                      String msg = e.toString().replaceFirst('Exception: ', '');
                                      // Parse common error codes
                                      if (msg.contains('400')) {
                                        msg = 'Invalid enrollment key. Please try again.';
                                      } else if (msg.contains('409')) {
                                        msg = 'You are already enrolled in this classroom.';
                                      } else if (msg.contains('500')) {
                                        msg = 'Server error. Please try again later.';
                                      }
                                      _showSnack(msg, isError: true);
                                    }
                                  },
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppColors.primary,
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(vertical: 14),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                              elevation: 0,
                            ),
                            child: isJoining
                                ? const SizedBox(
                                    width: 20,
                                    height: 20,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2,
                                      color: Colors.white,
                                    ),
                                  )
                                : const Text(
                                    'Join',
                                    style: TextStyle(fontWeight: FontWeight.bold),
                                  ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  // ── helpers ────────────────────────────────────────────────────────────
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
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        margin: const EdgeInsets.all(16),
      ),
    );
  }

  // ── build ───────────────────────────────────────────────────────────────
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildHeader(),
          Expanded(child: _buildBody()),
          if (!_isLoading && _error == null && _totalPages > 1)
            _buildPagination(),
        ],
      ),
    );
  }

  Widget _buildHeader() {
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
            child: const Icon(Icons.school_rounded, color: Colors.white, size: 24),
          ),
          const SizedBox(width: 14),
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Classrooms',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 22,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Text(
                  'Browse and join your classrooms',
                  style: TextStyle(
                    color: Colors.white70,
                    fontSize: 13,
                  ),
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

  Widget _buildBody() {
    if (_isLoading) {
      return const Center(
        child: CircularProgressIndicator(color: AppColors.primary),
      );
    }

    if (_error != null) {
      return _buildErrorState();
    }

    if (_classrooms.isEmpty) {
      return _buildEmptyState();
    }

    return FadeTransition(
      opacity: _fadeAnimation,
      child: GridView.builder(
        padding: const EdgeInsets.all(20),
        gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
          maxCrossAxisExtent: 380,
          mainAxisSpacing: 16,
          crossAxisSpacing: 16,
          childAspectRatio: 1.05,
        ),
        itemCount: _classrooms.length,
        itemBuilder: (context, index) {
          return _ClassroomCard(
            classroom: _classrooms[index],
            onJoin: _showJoinDialog,
          );
        },
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
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.wifi_off_rounded,
                  size: 48, color: AppColors.error),
            ),
            const SizedBox(height: 16),
            const Text(
              'Failed to load classrooms',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              _error!,
              style: const TextStyle(color: AppColors.textSecondary),
              textAlign: TextAlign.center,
            ),
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
                padding:
                    const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
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
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.class_outlined,
                  size: 56, color: AppColors.primary),
            ),
            const SizedBox(height: 20),
            const Text(
              'No classrooms available',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'There are currently no classrooms to display.',
              style: TextStyle(color: AppColors.textSecondary),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPagination() {
    return Container(
      color: Colors.white,
      padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 20),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          // Previous
          _PaginationButton(
            icon: Icons.chevron_left_rounded,
            enabled: _currentPage > 1,
            onPressed: () => _loadClassrooms(page: _currentPage - 1),
          ),
          const SizedBox(width: 12),

          // Page chips
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
            else if (i == _totalPages - 1 &&
                _currentPage < _totalPages - 3)
              const Padding(
                padding: EdgeInsets.symmetric(horizontal: 4),
                child: Text('…',
                    style: TextStyle(color: AppColors.textSecondary)),
              ),

          const SizedBox(width: 12),
          // Next
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

// ── sub-widgets ────────────────────────────────────────────────────────────

/// Card that shows information about one classroom.
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

  @override
  Widget build(BuildContext context) {
    final classroom = widget.classroom;
    final isJoined = classroom.enrollment.isJoining;

    // Pick a deterministic gradient based on the classroom id hash
    final gradients = [
      [const Color(0xFF1F4E79), const Color(0xFF2A5A8A)],
      [const Color(0xFF0D5C6A), const Color(0xFF0E7C8E)],
      [const Color(0xFF2D3E72), const Color(0xFF3A50A0)],
      [const Color(0xFF4A235A), const Color(0xFF7D3C98)],
      [const Color(0xFF1D4D30), const Color(0xFF27AE60)],
    ];
    final colorPair = gradients[classroom.id.hashCode.abs() % gradients.length];

    return MouseRegion(
      onEnter: (_) => setState(() => _hovered = true),
      onExit: (_) => setState(() => _hovered = false),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(18),
          boxShadow: [
            BoxShadow(
              color: AppColors.primary.withValues(
                alpha: _hovered ? 0.18 : 0.08,
              ),
              blurRadius: _hovered ? 24 : 12,
              offset: Offset(0, _hovered ? 10 : 6),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ── colored top band ──────────────────────────────────────────
            Container(
              height: 80,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: colorPair,
                ),
                borderRadius:
                    const BorderRadius.vertical(top: Radius.circular(18)),
              ),
              padding: const EdgeInsets.fromLTRB(16, 14, 14, 10),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          classroom.classCode,
                          style: const TextStyle(
                            color: Colors.white60,
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            letterSpacing: 1,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          classroom.className,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                  if (isJoined)
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: AppColors.success.withValues(alpha: 0.25),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                            color: AppColors.success.withValues(alpha: 0.5)),
                      ),
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.check_circle,
                              color: Colors.white, size: 12),
                          SizedBox(width: 4),
                          Text(
                            'Joined',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ),
                ],
              ),
            ),

            // ── body ─────────────────────────────────────────────────────
            Expanded(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 14),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _InfoRow(
                      icon: Icons.book_outlined,
                      text: classroom.subject.subjectName.isNotEmpty
                          ? classroom.subject.subjectName
                          : '—',
                    ),
                    const SizedBox(height: 6),
                    _InfoRow(
                      icon: Icons.person_outline_rounded,
                      text: classroom.lecturer.fullname.isNotEmpty
                          ? classroom.lecturer.fullname
                          : '—',
                    ),
                    const SizedBox(height: 6),
                    _InfoRow(
                      icon: Icons.calendar_today_outlined,
                      text: classroom.semesterName.isNotEmpty
                          ? classroom.semesterName
                          : '—',
                    ),
                    const Spacer(),

                    // ── action button ─────────────────────────────────────
                    SizedBox(
                      width: double.infinity,
                      child: isJoined
                          ? ElevatedButton.icon(
                              onPressed: null, // UI only for now
                              icon: const Icon(Icons.open_in_new_rounded,
                                  size: 16),
                              label: const Text('Access'),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppColors.primary,
                                foregroundColor: Colors.white,
                                disabledBackgroundColor:
                                    AppColors.primary.withValues(alpha: 0.7),
                                disabledForegroundColor: Colors.white,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                padding:
                                    const EdgeInsets.symmetric(vertical: 10),
                                elevation: 0,
                              ),
                            )
                          : ElevatedButton.icon(
                              onPressed: () => widget.onJoin(classroom),
                              icon: const Icon(Icons.add_rounded, size: 16),
                              label: const Text('Join'),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppColors.accent,
                                foregroundColor: Colors.white,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                padding:
                                    const EdgeInsets.symmetric(vertical: 10),
                                elevation: 0,
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

class _InfoRow extends StatelessWidget {
  const _InfoRow({required this.icon, required this.text});
  final IconData icon;
  final String text;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 13, color: AppColors.textSecondary),
        const SizedBox(width: 6),
        Expanded(
          child: Text(
            text,
            style: const TextStyle(
              fontSize: 12,
              color: AppColors.textSecondary,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }
}

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
          child: Icon(
            icon,
            size: 20,
            color: enabled ? Colors.white : Colors.grey.shade400,
          ),
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
          border: isActive
              ? null
              : Border.all(color: Colors.grey.shade300),
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

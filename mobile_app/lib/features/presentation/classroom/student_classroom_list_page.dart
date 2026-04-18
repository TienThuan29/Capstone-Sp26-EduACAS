import 'package:flutter/material.dart';
import 'package:mobile/core/theme/app_colors.dart';
import 'package:mobile/core/storage/token_storage.dart';
import 'package:mobile/features/models/classroom.dart';
import 'package:mobile/features/services/classroom_service.dart';
import 'package:mobile/features/presentation/classroom/student_classroom_detail_page.dart';
import 'package:mobile/core/widgets/background.dart';

class StudentClassroomListPage extends StatefulWidget {
  const StudentClassroomListPage({super.key});

  @override
  State<StudentClassroomListPage> createState() => _StudentClassroomListPageState();
}

class _StudentClassroomListPageState extends State<StudentClassroomListPage> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final TextEditingController _searchController = TextEditingController();
  List<Classroom> _allClassrooms = []; // This will now represent "Joined" classrooms mostly
  List<Classroom> _searchResults = [];
  bool _isLoading = true;
  bool _isSearching = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _tabController.addListener(_handleTabSelection);
    _loadClassrooms();
  }

  void _handleTabSelection() {
    if (_tabController.indexIsChanging) return;
    
    // When switching to 'Joined' (0) or 'Moved Out' (2), refetch data
    if (_tabController.index == 0 || _tabController.index == 2) {
      _loadClassrooms();
    }
  }

  @override
  void dispose() {
    _tabController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadClassrooms() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final studentId = await TokenStorage.getUserId();
      if (studentId == null || studentId.isEmpty) {
        throw Exception('Student ID not found. Please log in again.');
      }

      final classrooms = await ClassroomService.getStudentClassrooms(studentId);
      setState(() {
        _allClassrooms = classrooms;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _errorMessage = e.toString();
        _isLoading = false;
      });
    }
  }

  Future<void> _handleSearch(String query) async {
    if (query.trim().isEmpty) {
      setState(() {
        _searchResults = [];
        _isSearching = false;
      });
      return;
    }

    setState(() {
      _isSearching = true;
      _errorMessage = null;
    });

    try {
      final results = await ClassroomService.searchClassroomsByKeyword(query.trim());
      // Search payload can miss enrollment status, so reuse status from the student's classroom list.
      final statusByClassId = {
        for (final c in _allClassrooms) c.id: c.status,
      };

      final mergedResults = results
          .map((result) {
            final mergedStatus = statusByClassId[result.id] ?? result.status;
            if (mergedStatus == result.status) {
              return result;
            }

            return Classroom(
              id: result.id,
              className: result.className,
              classCode: result.classCode,
              subjectId: result.subjectId,
              subjectName: result.subjectName,
              lecturerId: result.lecturerId,
              lecturerName: result.lecturerName,
              lecturerEmail: result.lecturerEmail,
              semesterName: result.semesterName,
              enrolKey: result.enrolKey,
              maxSlot: result.maxSlot,
              isDeleted: result.isDeleted,
              createdDate: result.createdDate,
              updatedDate: result.updatedDate,
              endDate: result.endDate,
              status: mergedStatus,
            );
          })
          .toList();

      setState(() {
        _searchResults = mergedResults;
        _isSearching = false;
      });
    } catch (e) {
      setState(() {
        _errorMessage = e.toString();
        _isSearching = false;
      });
    }
  }

  List<Classroom> get _joiningClassrooms => _allClassrooms.where((c) => (c.status ?? '').toUpperCase() == 'JOINED').toList();
  List<Classroom> get _movedOutClassrooms => _allClassrooms.where((c) => (c.status ?? '').toUpperCase() == 'MOVED_OUT').toList();

  @override
  Widget build(BuildContext context) {

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: Stack(
        children: [
          const GradientBackground(),
          Column(
            children: [
              _buildHeader(),
              _buildTabNavigation(),
              Expanded(
                child: TabBarView(
                  controller: _tabController,
                  children: [
                    _buildClassroomList(_joiningClassrooms),
                    _buildExploreTab(),
                    _buildClassroomList(_movedOutClassrooms),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildHeader() {
    return Container(
      padding: const EdgeInsets.fromLTRB(24, 60, 24, 20),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppColors.primary.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(16),
            ),
            child: const Icon(Icons.class_rounded, color: AppColors.primary, size: 28),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                const Text(
                  'My Classrooms',
                  style: TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.w900,
                    color: AppColors.textPrimary,
                    letterSpacing: -0.5,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  'Access your enrolled courses and materials',
                  style: TextStyle(fontSize: 12, color: Colors.grey[600], fontWeight: FontWeight.w500),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTabNavigation() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 24, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.5),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.withValues(alpha: 0.1)),
      ),
      child: TabBar(
        controller: _tabController,
        indicator: BoxDecoration(
          borderRadius: BorderRadius.circular(10),
          color: AppColors.primary,
        ),
        labelColor: Colors.white,
        unselectedLabelColor: AppColors.textLight,
        labelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
        unselectedLabelStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
        indicatorSize: TabBarIndicatorSize.tab,
        dividerColor: Colors.transparent,
        padding: const EdgeInsets.all(4),
        tabs: const [
          Tab(text: 'Joined'),
          Tab(text: 'Explore'),
          Tab(text: 'Moved Out'),
        ],
      ),
    );
  }

  Widget _buildExploreTab() {
    return Column(
      children: [
        _buildSearchBar(),
        Expanded(
          child: _isSearching
              ? const Center(child: CircularProgressIndicator())
              : _searchResults.isEmpty
                  ? _buildExploreEmptyState()
                    : ListView.builder(
                        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
                        itemCount: _searchResults.length,
                        itemBuilder: (context, index) => _buildClassroomCard(_searchResults[index], showStatus: false),
                      ),
        ),
      ],
    );
  }

  Widget _buildSearchBar() {
    return Container(
      margin: const EdgeInsets.fromLTRB(24, 12, 24, 20),
      padding: const EdgeInsets.symmetric(horizontal: 20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 10,
            offset: const Offset(0, 5),
          ),
        ],
        border: Border.all(color: Colors.grey.withValues(alpha: 0.1)),
      ),
      child: TextField(
        controller: _searchController,
        onSubmitted: _handleSearch,
        decoration: InputDecoration(
          hintText: 'Search by class code (e.g. SE1802)...',
          hintStyle: TextStyle(color: Colors.grey[400], fontSize: 14),
          border: InputBorder.none,
          icon: const Icon(Icons.search_rounded, color: AppColors.primary, size: 20),
          suffixIcon: _searchController.text.isNotEmpty
              ? IconButton(
                  icon: const Icon(Icons.clear_rounded, size: 18),
                  onPressed: () {
                    _searchController.clear();
                    setState(() => _searchResults = []);
                  },
                )
              : null,
        ),
      ),
    );
  }

  Widget _buildExploreEmptyState() {
    return Center(
      child: SingleChildScrollView(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.5),
                shape: BoxShape.circle,
              ),
              child: Icon(Icons.travel_explore_rounded, size: 64, color: AppColors.primary.withValues(alpha: 0.3)),
            ),
            const SizedBox(height: 24),
            const Text(
              'Explore Classrooms',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
            ),
            const SizedBox(height: 8),
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 48),
              child: Text(
                'Enter a class code to find and join new classrooms',
                style: TextStyle(color: AppColors.textLight),
                textAlign: TextAlign.center,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildClassroomList(List<Classroom> classrooms) {
    if (_isLoading) return const Center(child: CircularProgressIndicator());
    if (_errorMessage != null) return _buildErrorState();
    if (classrooms.isEmpty) return _buildEmptyState();

    return RefreshIndicator(
      onRefresh: _loadClassrooms,
      child: ListView.builder(
        padding: const EdgeInsets.all(24),
        itemCount: classrooms.length,
        itemBuilder: (context, index) => _buildClassroomCard(classrooms[index]),
      ),
    );
  }

  Widget _buildClassroomCard(Classroom classroom, {bool showStatus = true}) {
    final status = classroom.status ?? 'NOT_JOINED';
    final isJoined = status.toUpperCase() == 'JOINED';
    final isMovedOut = status.toUpperCase() == 'MOVED_OUT';

    String displayStatus = 'Available';
    Color statusColor = Colors.blue;

    if (isJoined) {
      displayStatus = 'Joined';
      statusColor = Colors.green;
    } else if (isMovedOut) {
      displayStatus = 'Moved Out';
      statusColor = Colors.orange;
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(color: Colors.black.withValues(alpha: 0.03), blurRadius: 8, offset: const Offset(0, 4)),
        ],
        border: Border.all(color: Colors.grey.withValues(alpha: 0.1)),
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(16),
        child: Stack(
          children: [

            Material(
              color: Colors.transparent,
              child: InkWell(
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (context) => StudentClassroomDetailPage(classroom: classroom)),
                  );
                },
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(color: AppColors.primary.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(6)),
                            child: Text(classroom.classCode, style: const TextStyle(color: AppColors.primary, fontSize: 10, fontWeight: FontWeight.bold)),
                          ),
                          const Spacer(),
                          if (showStatus)
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                color: statusColor.withValues(alpha: 0.1),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Text(
                                displayStatus,
                                style: TextStyle(
                                  color: statusColor,
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold,
                                  letterSpacing: 0.5,
                                ),
                              ),
                            ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Text(classroom.className, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                      const SizedBox(height: 16),
                      Row(
                        children: [
                          const Icon(Icons.person_outline, size: 14, color: AppColors.textLight),
                          const SizedBox(width: 8),
                          Text('Lecturer: ${classroom.lecturerName ?? 'Unknown'}', style: const TextStyle(fontSize: 12, color: AppColors.textLight)),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          const Icon(Icons.book_outlined, size: 14, color: AppColors.textLight),
                          const SizedBox(width: 8),
                          Text('Subject: ${classroom.subjectName ?? 'Unknown'}', style: const TextStyle(fontSize: 12, color: AppColors.textLight)),
                        ],
                      ),
                      const SizedBox(height: 20),
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        decoration: BoxDecoration(
                          border: Border.all(color: AppColors.primary.withValues(alpha: 0.5)),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Center(
                          child: Text('Access Classroom', style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold, fontSize: 13)),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
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
          Icon(Icons.school_outlined, size: 64, color: Colors.grey[300]),
          const SizedBox(height: 16),
          const Text('No classes found', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          const Text('Enroll in a classroom to see your courses here', style: TextStyle(color: AppColors.textLight)),
        ],
      ),
    );
  }

  Widget _buildErrorState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.error_outline, size: 48, color: Colors.red),
          const SizedBox(height: 16),
          Text(_errorMessage ?? 'Failed to load classrooms'),
          const SizedBox(height: 16),
          ElevatedButton(onPressed: _loadClassrooms, child: const Text('Retry')),
        ],
      ),
    );
  }
}

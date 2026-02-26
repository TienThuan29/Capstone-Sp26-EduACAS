import 'package:flutter/material.dart';
import 'package:mobile/core/theme/app_colors.dart';
import 'package:mobile/core/widgets/background.dart';
import 'package:mobile/features/models/classroom.dart';
import 'package:mobile/features/services/classroom_service.dart';
import 'package:mobile/features/presentation/components/sidebar.dart';
import 'package:mobile/core/storage/token_storage.dart';
import 'package:mobile/features/presentation/student/classroom_detail_page.dart';

class StudentClassroomListPage extends StatefulWidget {
  const StudentClassroomListPage({super.key});

  @override
  State<StudentClassroomListPage> createState() => _StudentClassroomListPageState();
}

class _StudentClassroomListPageState extends State<StudentClassroomListPage> {
  List<Classroom> _classrooms = [];
  bool _isLoading = true;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _loadClassrooms();
  }

  Future<void> _loadClassrooms() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final userId = await TokenStorage.getUserId();
      if (userId == null) throw Exception('User not logged in');

      final classrooms = await ClassroomService.getStudentClassrooms(userId);
      if (mounted) {
        setState(() {
          _classrooms = classrooms;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = e.toString();
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return SidebarScaffold(
      selectedIndex: 1, // Classrooms index
      child: Stack(
        children: [
          const GradientBackground(),
          SafeArea(
            child: Column(
              children: [
                _buildHeader(),
                Expanded(child: _buildBody()),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHeader() {
    return const Padding(
      padding: EdgeInsets.fromLTRB(24, 24, 24, 16),
      child: Row(
        children: [
          Text(
            'My Classrooms',
            style: TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.bold,
              color: AppColors.primary,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator(color: AppColors.primary));
    }

    if (_errorMessage != null) {
      return _buildErrorState();
    }

    if (_classrooms.isEmpty) {
      return _buildEmptyState();
    }

    return RefreshIndicator(
      onRefresh: _loadClassrooms,
      color: AppColors.primary,
      child: ListView.builder(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
        itemCount: _classrooms.length,
        itemBuilder: (context, index) => _buildClassroomCard(_classrooms[index]),
      ),
    );
  }

  Widget _buildClassroomCard(Classroom classroom) {
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      elevation: 1,
      shadowColor: Colors.black12,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      child: InkWell(
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => StudentClassroomDetailPage(classroom: classroom),
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
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppColors.primary.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(Icons.class_, color: AppColors.primary, size: 24),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          classroom.className,
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: AppColors.textPrimary,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Code: ${classroom.classCode}',
                          style: const TextStyle(color: AppColors.textSecondary, fontSize: 13),
                        ),
                      ],
                    ),
                  ),
                  const Icon(Icons.chevron_right, color: Colors.grey),
                ],
              ),
              if (classroom.subjectName != null || (classroom.semesterName != null && classroom.semesterName!.isNotEmpty)) ...[
                const SizedBox(height: 12),
                const Divider(height: 1),
                const SizedBox(height: 12),
                if (classroom.subjectName != null)
                  Row(
                    children: [
                      const Icon(Icons.book_outlined, size: 14, color: AppColors.textLight),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          classroom.subjectName!,
                          style: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
                        ),
                      ),
                    ],
                  ),
                if (classroom.semesterName != null && classroom.semesterName!.isNotEmpty) ...[
                  if (classroom.subjectName != null) const SizedBox(height: 6),
                  Row(
                    children: [
                      const Icon(Icons.calendar_today_outlined, size: 14, color: AppColors.textLight),
                      const SizedBox(width: 8),
                      Text(
                        classroom.semesterName!,
                        style: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
                      ),
                    ],
                  ),
                ],
              ],
            ],
          ),
        ),
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
          const Text('Error loading classrooms', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          Text(_errorMessage!, style: const TextStyle(color: Colors.grey), textAlign: TextAlign.center),
          const SizedBox(height: 24),
          ElevatedButton(onPressed: _loadClassrooms, child: const Text('Try Again')),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return const Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.school_outlined, size: 80, color: Colors.grey),
          SizedBox(height: 16),
          Text('No classrooms found', style: TextStyle(fontSize: 18, color: Colors.grey)),
        ],
      ),
    );
  }
}

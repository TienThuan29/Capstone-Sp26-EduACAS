import 'package:flutter/material.dart';
import 'package:mobile/features/presentation/discussion/discussion_management_page.dart';

class StudentDiscussionsTab extends StatelessWidget {
  final String classroomId;
  final String classroomName;

  const StudentDiscussionsTab({
    super.key,
    required this.classroomId,
    this.classroomName = 'Classroom',
  });

  @override
  Widget build(BuildContext context) {
    return DiscussionIssueManagementPage(
      classroomId: classroomId,
      classroomName: classroomName,
      isEmbedded: true,
    );
  }
}

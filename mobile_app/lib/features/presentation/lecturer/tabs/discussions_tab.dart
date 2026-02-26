import 'package:flutter/material.dart';
import 'package:mobile/features/presentation/lecturer/discussion_issue_management.dart';

class DiscussionsTab extends StatelessWidget {
  final String classroomId;
  final String classroomName;

  const DiscussionsTab({
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

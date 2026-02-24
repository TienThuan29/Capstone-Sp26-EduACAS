# Lecturer Features - Mobile App

This folder contains the lecturer-specific features for the EduACAS mobile application.

## Overview

The lecturer module implements the classroom management, material management, and exercise/assignment management features as shown in the application flow diagram.

## Features Implemented

### 1. Classroom List (`lecturer_classroom_list_page.dart`)
- Displays all classrooms assigned to the lecturer
- Shows classroom information:
  - Class name and code
  - Subject name
  - Number of enrolled students
- Pull-to-refresh functionality
- Navigation to classroom details

### 2. Classroom Detail (`classroom_detail_page.dart`)
- Tabbed interface with 4 sections:
  - **Materials** - Material management
  - **Exercises** - Exercise/Assignment management
  - **Discussions** - Coming soon
  - **Problems** - Coming soon

### 3. Material Management (`tabs/materials_tab.dart`)
- View all materials uploaded to the classroom
- Material information displayed:
  - Filename with appropriate icon
  - Upload date
  - Description
- Actions:
  - View material (opens file in external app)
  - Delete material (with confirmation)
- Pull-to-refresh functionality

### 4. Exercise/Assignment Management (`tabs/assignments_tab.dart`)
- View all exercises and examinations for the classroom
- Exercise information displayed:
  - Exam name
  - Status (Pending, Ongoing, Completed) with color indicators
  - Type (Practice or Examination)
  - Programming language
  - Start and end dates
  - Number of problems
- Navigation to exercise details

### 5. Exercise Detail (`examination_detail_page.dart`)
- Detailed view of an exercise/examination
- Information sections:
  - Basic Information (type, language, total marks, problem count)
  - Schedule (start and end dates)
  - Description
  - List of all problems with marks
- View submissions button (placeholder for future feature)

## Models

### `classroom.dart`
- `Classroom` - Full classroom information
- `ClassroomLite` - Lightweight classroom data

### `material.dart`
- `Material` - Material/document information
- `ApiResponse<T>` - Generic API response wrapper

### `examination.dart`
- `Examination` - Full examination/exercise information
- `Problem` - Problem details
- `TestCase` - Test case information
- `ProgrammingLanguage` - Programming language data
- `ExaminationMode` - Enum for Practice/Examination
- `ExaminationStatus` - Enum for Pending/Ongoing/Completed

## Services

### `classroom_service.dart`
- `getLecturerClassrooms()` - Fetch all classrooms for the logged-in lecturer
- `getClassroomById(classroomId)` - Get detailed classroom information

### `material_service.dart`
- `getMaterialsByClassroom(classroomId)` - Fetch all materials for a classroom
- `deleteMaterial(materialId)` - Delete a material
- `getPrivateFileUrl(filename)` - Get presigned URL for private file access

### `examination_service.dart`
- `getExaminationsByClassId(classId)` - Fetch all examinations for a classroom
- `getExaminationById(examId)` - Get detailed examination information

## API Configuration

The following endpoints have been added to `core/configs/api_config.dart`:

```dart
// Classroom endpoints
static String get lecturerClassroomsEndpoint => '/api/acas/v1/classrooms/lecturer';
static String classroomByIdEndpoint(String id) => '/api/acas/v1/classrooms/$id';

// Material endpoints
static String materialsByClassroomEndpoint(String classroomId) => '/api/acas/v1/materials/classroom/$classroomId';
static String get createMaterialEndpoint => '/api/acas/v1/materials';
static String deleteMaterialEndpoint(String id) => '/api/acas/v1/materials/$id';

// Examination endpoints
static String examinationsByClassEndpoint(String classId) => '/api/acas/v1/examinations/by-class/$classId';
static String examinationByIdEndpoint(String id) => '/api/acas/v1/examinations/$id';

// S3 endpoints
static String privateFileUrlEndpoint(String filename) => '/api/acas/v1/private-s3/file/${Uri.encodeComponent(filename)}';
```

## Dependencies

Added to `pubspec.yaml`:
- `url_launcher: ^6.3.1` - For opening material files in external applications

## Usage Example

```dart
// Navigate to lecturer classroom list
Navigator.push(
  context,
  MaterialPageRoute(
    builder: (context) => const LecturerClassroomListPage(),
  ),
);
```

## Future Enhancements

1. **Material Management**
   - Upload new materials
   - Edit material description
   - Download materials to device

2. **Exercise Management**
   - Create new exercises/examinations
   - View submission list
   - Grade submissions
   - View submission details
   - Handle regrading requests

3. **Discussion Management**
   - View discussion issues
   - Comment on discussions
   - Delete student comments

4. **Problem Management**
   - View problem details
   - Create/edit problems

## Design Patterns

- **State Management**: StatefulWidget with local state
- **Error Handling**: Try-catch with user-friendly error messages
- **Loading States**: CircularProgressIndicator during async operations
- **Empty States**: Informative messages when no data available
- **Pull-to-Refresh**: RefreshIndicator for manual data refresh
- **Navigation**: MaterialPageRoute for page transitions

## UI Components

- **Cards**: Elevated cards with rounded corners (12px radius)
- **Colors**: Uses AppColors from theme (primary, accent, status colors)
- **Icons**: Material Icons with contextual meaning
- **Typography**: Theme-based text styles
- **Feedback**: SnackBar for success/error messages, AlertDialog for confirmations

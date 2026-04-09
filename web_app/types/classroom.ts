export interface LecturerLite {
  lecturerId: string;
  fullname: string;
  email: string;
  avatarUrl: string;
}

export interface SubjectLite {
  subjectId: string;
  subjectName: string;
}

export interface Enrollment {
  isJoining: boolean;
  joinedDate: string;
  movedOutDate: string | null;
}

export interface Classroom {
  id: string;
  classCode: string;
  className: string;
  lecturer: LecturerLite;
  subject: SubjectLite;
  semesterName: string;
  enrolKey: string;
  createdDate: string;
  updatedDate: string | null;
  endDate: string;
  isDeleted: boolean;
  enrollment?: Enrollment;
  maxSlot: number;
  studentCount: number;
}

// student classroom response
export interface ClassroomStudentResponse {
  enrollmentId: string;
  studentId: string;
  joinedDate: string;
  isJoining: boolean;
  roleNumber: string;
  email: string;
  fullname: string;
  avatarUrl: string;
  birthday: string | null;
  role: string;
  isEnable: boolean;
}

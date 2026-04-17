export type StudentExamSessionPhase = 'NOTSTARTED' | 'ACTIVE' | 'COMPLETED' | 'LOCKED';

export interface StudentExamSessionDto {
  id: string;
  studentId: string;
  studentName: string;
  studentRoleNumber: string;
  examId: string;
  classroomId: string;
  phase: StudentExamSessionPhase;
  activeProblemId?: string | null;
  lockReason?: string | null;
  createdDate: string;
  updatedDate: string;
}

export type StudentExamSessionPhase = 'NOTSTARTED' | 'ACTIVE' | 'COMPLETED' | 'LOCKED';

export interface StudentExamSessionDto {
  examId: string;
  classroomId: string;
  phase: StudentExamSessionPhase;
  activeProblemId?: string | null;
  lockReason?: string | null;
  updatedDate: string;
}

export type QuizAttemptStatus = "INPROGRESS" | "SUBMITTED";

export interface QuizAttempt {
  id: string;
  classroomQuizId: string;
  studentId: string;
  startTime: string;
  endTime?: string | null;
  status: QuizAttemptStatus;
  finalScore?: number | null;
  attemptNumber: number;
}

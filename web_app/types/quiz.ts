export interface QuizQuestion {
  quizId: string;
  questionId: string;
  marks: number;
  displayOrder: number;
}

export interface Quiz {
  id: string;
  subjectId: string;
  title: string;
  duration: number;
  totalQuestions: number;
  isDeleted: boolean;
  createdBy: string;
  createdAt?: string;
  updatedAt?: string;
  questions: QuizQuestion[];
}

export enum ClassroomQuizStatus {
  DRAFT,
  PUBLISHED,
  CLOSED,
}

export interface ClassroomQuiz {
  id: string;
  classroomId: string;
  quizId: string;
  startTime: string;
  endTime: string;
  maxOfAttempts: number;
  passcode?: string;
  status: ClassroomQuizStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClassroomQuizRequest {
  classroomId: string;
  quizId: string;
  startTime: string;
  endTime: string;
  maxOfAttempts: number;
  passcode?: string;
  createdBy: string;
}

export interface UpdateClassroomQuizRequest {
  startTime?: string;
  endTime?: string;
  maxOfAttempts?: number;
  passcode?: string;
}

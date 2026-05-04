export interface QuizAnswerOption {
  id: string;
  content: string;
  isCorrect?: boolean;
}

export interface QuizQuestion {
  id: string;
  quizId: string;
  questionId: string;
  content: string;
  type: 'MULTIPLE_CHOICE' | 'SINGLE_CHOICE' | 'ESSAY';
  textAnswer?: string;
  imageUrl?: string;
  correctCount: number;
  options: QuizAnswerOption[];
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

export type ClassroomQuizStatus = 'DRAFT' | 'PUBLISHED' | 'ONGOING' | 'CLOSED';

export const CLASSROOM_QUIZ_STATUS: Record<ClassroomQuizStatus, ClassroomQuizStatus> = {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
  ONGOING: 'ONGOING',
  CLOSED: 'CLOSED',
};

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

export interface PagedClassroomQuizResult {
  items: ClassroomQuiz[];
  totalCount: number;
  pageIndex: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export type QuizAttemptStatus = 'INPROGRESS' | 'SUBMITTED';

export interface QuizAttempt {
  id: string;
  classroomQuizId: string;
  studentId: string;
  startTime: string;
  submittedAt?: string;
  status: QuizAttemptStatus;
  score?: number | null;
  attemptNumber: number;
  correctAnswers?: number;
  totalQuestions?: number;
}

export interface QuizAttemptResponse {
  id: string;
  classroomQuizId: string;
  studentId: string;
  startTime: string;
  endTime: string;
  status: QuizAttemptStatus;
  attemptNumber: number;
  studentName?: string;
  studentEmail?: string;
  score?: number | null;
  correctAnswers?: number;
  totalQuestions?: number;
  answers: Record<string, string>;
  questionResults: Record<string, boolean>;
  questions: QuizQuestion[];
  quizTitle?: string;
  duration: number;
}

export interface StartQuizAttemptRequest {
  classroomQuizId: string;
  studentId: string;
  passcode?: string;
}

export interface UpdateQuizAnswerRequest {
  questionId: string;
  selectedOptionId?: string;
  textAnswer?: string;
}

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

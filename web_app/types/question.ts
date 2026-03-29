export type QuestionType = "MULTIPLE_CHOICE" | "SINGLE_CHOICE" | "ESSAY";

export interface AnswerOption {
  id: string;
  questionId: string;
  content: string;
  isCorrect: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Question {
  id: string;
  content: string;
  imageUrl?: string | null;
  type: QuestionType;
  textAnswer?: string | null;
  isDeleted: boolean;
  createdBy: string;
  createdAt?: string;
  updatedAt?: string;
  answerOptions: AnswerOption[];
}

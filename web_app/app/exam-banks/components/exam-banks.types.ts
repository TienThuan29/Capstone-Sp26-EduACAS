import type { ExamTempProblemRequest } from "@/types/examination-template";
import type { ProblemBasicResponse } from "@/types/problem";

/** Display-only title; API payloads use ExamTempProblemRequest (problemId + mark only). */
export type ExamFormProblem = ExamTempProblemRequest & { title?: string };

export type ExamFormState = {
  examName: string;
  description: string;
  totalMark: number;
  problems: ExamFormProblem[];
};

export const initialFormState: ExamFormState = {
  examName: "",
  description: "",
  totalMark: 0,
  problems: [],
};

export type ProblemPickerState = {
  availableProblems: ProblemBasicResponse[];
  searchTerm: string;
  selectedProblemIds: Set<string>;
  problemMarks: Record<string, number>;
};

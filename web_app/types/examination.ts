import { ProgrammingLanguage } from "./language";

/** Lite response nested in ExaminationResponse */
export interface ClassroomLite {
  id: string;
  className: string;
}

export interface TestCase {
  id: string;
  inputData: string;
  expectedOutput: string;
  isPublic: boolean;
  isCaseInsensitive: boolean;
  isRemovedSpace: boolean;
}

export interface Problem {
  id: string;
  examId: string;
  lecturerId: string;
  title: string;
  content: string;
  fileName: string;
  difficulty: number;
  codeTemplate: string;
  testCases: TestCase[];
  tags?: string[];
  createdDate: string;
  updatedDate: string;
}

/** Boilerplate code for the editor; sourced from Problem.codeTemplate when a problem is set. */
export function getBoilerplateCode(problem: Problem | null): string {
  return problem?.codeTemplate?.trim() ?? '';
}

export interface Examination {
  id: string;
  examName: string;
  programmingLanguage: ProgrammingLanguage;
  examProblems: ExamProblem[];
  problems: Problem[];
  classroom: ClassroomLite;
  startDatetime: string;
  endDatetime: string;
  description: string;
  isPublicResult: boolean;
  totalMark: number;
  status: ExaminationStatus;
  mode: ExaminationMode;
  useStrict: boolean;
  minScoreThreshold: number;
  maxAttempts: number | null;
  isDeleted: boolean;
  createdDate: string;
  updatedDate: string;
}

/** Payload for create/update examination (matches backend ExaminationRequestDTO) */
export type ExaminationStatus = "PENDING" | "ONGOING" | "COMPLETED";
export type ExaminationMode = "PRACTICAL" | "EXAMINATION";

export interface ExamProblemDTO {
  problemId: string;
  mark: number;
}

export interface ExaminationRequest {
  examName: string;
  programmingLanguageId: string;
  problems: ExamProblemDTO[];
  classroomId: string;
  startDatetime: string;
  endDatetime: string;
  description: string;
  isPublicResult: boolean;
  totalMark: number;
  status: ExaminationStatus;
  mode: ExaminationMode;
  useStrict: boolean;
  minScoreThreshold: number;
  maxAttempts: number | null;
}

export interface ExamProblem {
  problemId: string;
  mark: number;
}

export interface ExaminationSpecificProblemResponse {
  id: string;
  examName: string;
  programmingLanguage: ProgrammingLanguage;
  problem: Problem;
  classroom: ClassroomLite;
  startDatetime: string;
  endDatetime: string;
  description: string;
  mode: "PRACTICAL" | "EXAMINATION";
  useStrict: boolean;
}

export enum Mode {
  PRACTICAL,
  EXAMINATION,
}
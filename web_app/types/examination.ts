/** Lite response nested in ExaminationResponse */
export interface ProgrammingLanguageLite {
  id: string;
  languageName: string;
}

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
  mark: number;
  difficulty: number;
  codeTemplate: string;
  testCases: TestCase[];
  createdDate: string;
  updatedDate: string;
}

export interface Examination {
  id: string;
  examName: string;
  programmingLanguage: ProgrammingLanguageLite;
  problemIds: string[];
  problems: Problem[];
  classroom: ClassroomLite;
  startDatetime: string;
  endDatetime: string;
  description: string;
  isPublicResult: boolean;
  totalMark: number;
  status: number;
  mode: number;
  isDeleted: boolean;
  createdDate: string;
  updatedDate: string;
}

/** Payload for create/update examination (matches backend ExaminationRequestDTO) */
export type ExaminationStatus = "PENDING" | "ONGOING" | "COMPLETED";
export type ExaminationMode = "PRACTICAL" | "EXAMINATION";

export interface ExaminationRequest {
  examName: string;
  programmingLanguageId: string;
  problemIds: string[];
  classroomId: string;
  startDatetime: string;
  endDatetime: string;
  description: string;
  isPublicResult: boolean;
  totalMark: number;
  status: ExaminationStatus;
  mode: ExaminationMode;
}

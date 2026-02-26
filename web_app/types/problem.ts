/** Difficulty level - matches backend enum (EASY | MEDIUM | HARD) */
export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

export const DIFFICULTY = {
  EASY: 'EASY',
  MEDIUM: 'MEDIUM',
  HARD: 'HARD',
} as const satisfies Record<string, Difficulty>;

export type ProblemMode = "MANUAL" | "FROM_FILE";

export const PROBLEM_MODE = {
  MANUAL: "MANUAL",
  FROM_FILE: "FROM_FILE",
} as const satisfies Record<string, ProblemMode>;

/** Backend serializes enum as number (0=EASY, 1=MEDIUM, 2=HARD). Normalize to string for display. */
const DIFFICULTY_BY_INDEX: Record<number, Difficulty> = {
  0: 'EASY',
  1: 'MEDIUM',
  2: 'HARD',
};

export function normalizeDifficulty(value: number | Difficulty): Difficulty {
  if (typeof value === 'number') {
    return DIFFICULTY_BY_INDEX[value] ?? 'EASY';
  }
  return value;
}

export type TestCaseResponse = {
  id: string;
  inputData: string;
  expectedOutput: string;
  isPublic: boolean;
  isCaseInsensitive: boolean;
  isRemovedSpace: boolean;
};

/** API may return difficulty as number (0=EASY, 1=MEDIUM, 2=HARD); use normalizeDifficulty() for display */
export type ProblemResponse = {
  id: string;
  lecturerId: string;
  title: string;
  content: string;
  fileName: string;
  /** Presigned URL for the file (private S3). Use for download/display. */
  fileUrl?: string;
  difficulty: number | Difficulty;
  codeTemplate: string;
  testCases: TestCaseResponse[];
  createdDate: string;
  updatedDate: string;
};

/** API may return difficulty as number (0=EASY, 1=MEDIUM, 2=HARD); use normalizeDifficulty() for display */
export type ProblemBasicResponse = {
  id: string;
  title: string;
  difficulty: number | Difficulty;
  createdDate: string;
};

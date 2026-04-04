/** One line of output from code-runner (stdout/stderr) */
export interface ResultLine {
  text: string;
}

/** Compilation/execution result from code-runner */
export interface CompilationResult {
  code: number;
  timedOut?: boolean;
  stdout?: ResultLine[];
  stderr?: ResultLine[];
  buildResult?: unknown;
  execResult?: CompilationResult;
  [key: string]: unknown;
}

/** Response from run-batch (compile once, run with each stdin) */
export interface RunBatchResponse {
  code: number;
  timedOut?: boolean;
  stdout?: ResultLine[];
  stderr?: ResultLine[];
  execResults: CompilationResult[];
  [key: string]: unknown;
}

/** Request body for custom testcase execution. Stdin is passed via compileRequest.options.executeParameters.stdin */
export interface CustomTestcaseRequest {
  compilerId: string;
  compileRequest: CompileRequest;
  lang: string;
}

export interface CompileOptions {
  userArguments?: string;
  filters?: Record<string, boolean>;
  compilerOptions?: Record<string, unknown>;
  executeParameters?: { stdin?: string; args?: string[] };
  tools?: unknown[];
  libraries?: unknown[];
}

export interface CompileRequest {
  source: string;
  options: CompileOptions;
  lang?: string;
  files?: { filename: string; contents: string }[];
  bypassCache?: boolean;
}

/** Test case payload for run-batch (public testcases) */
export interface RunBatchTestCase {
  id: string;
  problemId?: string;
  inputData: string;
  expectedOutput: string;
  isPublic: boolean;
  isCaseInsensitive: boolean;
  isFloatingPoint?: boolean;
  floatingPointTolerance?: number | null;
  decimalPlaces?: number | null;
  isTokenComparision?: boolean;
  isNotOrderedComparision?: boolean | null;
}

export interface RumBatchRequest extends CompileRequest {
  stdinList: string[];
  testCases: RunBatchTestCase[];
}

/** Request body for execute public testcases */
export interface PublicTestcasesRequest {
  compilerId: string;
  lang: string;
  runBatchRequest: RumBatchRequest;
}

/** Single test result from execute public testcases API */
export interface TestResultResponse {
  id: string;
  testcaseId: string;
  input: string;
  actualOutput: string;
  expectedOutput: string;
  executionTimeMs: number;
  status: string;
  createdDate: string;
}

export interface KeystrokeRecordResponse {
  timeStartSet: string;
  timeOffSet: string;
  duration: number;
  cps: number;
  charCount: number;
  content: string;
}

export interface KeystrokeLogResponse {
  id: string;
  submissionId: string;
  keystroke_data: KeystrokeRecordResponse[];
  createdDate: string;
}

/** Request body for saving a problem submission (code-editor submit) */
export interface SubmitProblemRequest {
  examId: string;
  problemId: string;
  studentId: string;
  source: string;
  languageId: string;
  compilerId: string;
}

export interface CreateExamLogRequest {
  submissionId: string;
  eventType: string;
  eventDetail: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  isViolation: boolean;
  clientTimestamp: string;
}

export interface CacheExamLogEntryRequest {
  eventType: string;
  eventDetail: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  isViolation: boolean;
  clientTimestamp: string;
}

export interface CacheExamLogsRequest {
  sessionKey: string;
  entries: CacheExamLogEntryRequest[];
}

export interface FlushCachedExamLogsRequest {
  sessionKey: string;
  submissionId: string;
}

export interface ExamLogResponse {
  id: string;
  submissionId: string;
  eventType: string;
  eventDetail: string;
  message: string;
  severity: 'info' | 'warning' | 'critical' | string;
  isViolation: boolean;
  clientTimestamp: string;
  createdDate: string;
}

export interface ProblemLiteResponse {
  id: string;
  title: string;
}

/** Minimal student info in submission detail. */
export interface StudentLiteResponse {
  studentId: string;
  fullname: string;
  email: string;
  roleNumber?: string;
}

export interface SubmissionResponse {
  id: string;
  studentId: string;
  examId: string;
  problemId: string;
  languageId?: string;
  compilerId?: string;
  source?: string;
  version: number;
  status: string;
  submittedDate: string;
  finalScore: number;
  gradedDate?: string;
  testResults?: TestResultResponse[];
  // Support both backend naming conventions.
  keystroke_logs?: KeystrokeLogResponse[];
  keystrokeLogs?: KeystrokeLogResponse[];
  problem?: ProblemLiteResponse;
  student?: StudentLiteResponse;
}

/** One problem's submissions from GET exam/{examId}/latest-all */
export interface ProblemSubmissionsResponse {
  problemId: string;
  submissions: SubmissionResponse[];
}

/** Request payload for one submission when calling auto-grade API */
export interface SubmissionGradingRequest {
  id: string;
  studentId: string;
  languageId: string;
  compilerId: string;
  examId: string;
  problemId: string;
  source: string;
}

/** Request body for run auto-grading (all submissions of a problem in an exam) */
export interface BulkSubmissionGradingRequest {
  problemId: string;
  examId: string;
  submissions: SubmissionGradingRequest[];
}

/** Per-submission result in auto-grade API response */
export interface AutoGradeSubmissionResult {
  submissionId: string;
  studentId: string;
  finalScore: number;
  status: string;
  gradedDate: string;
  passedTestCases: number;
  totalTestCases: number;
  errorMessage?: string | null;
}

/** Response from run auto-grading API */
export interface AutoGradeProblemResponse {
  problemId: string;
  examId: string;
  totalSubmissions: number;
  gradedCount: number;
  failedCount: number;
  results: AutoGradeSubmissionResult[];
}

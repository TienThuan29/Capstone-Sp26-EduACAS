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

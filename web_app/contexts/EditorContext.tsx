'use client';

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from 'react';
// import {
//   SubmissionStatus,
//   BOILERPLATE_CODE,
//   Problem,
//   Submission,
// } from '@/types/language';
import { ProgrammingLanguage } from '@/types/language';
import { Problem, TestCase, getBoilerplateCode } from '@/types/examination';


/**
 * state for monaco code editor
 */
export interface EditorState {
  code: string;
  language: ProgrammingLanguage;
  fontSize: number;
  theme: 'vs-dark' | 'vs-light';
}

/**
 * console tab for input/output, custom test case
 */
export interface ConsoleTab {
  id: string;
  label: string;
  type: 'testcase' | 'custom' | 'output';
}


interface EditorContextType {
  // Editor State
  editorState: EditorState;
  setCode: (code: string) => void;
  setLanguage: (language: ProgrammingLanguage) => void;
  setFontSize: (size: number) => void;
  toggleTheme: () => void;
  resetCode: () => void;

  // Problem State
  problem: Problem | null;
  setProblem: (problem: Problem) => void;

  // Test Cases
  testCases: TestCase[];
  setTestCases: (testCases: TestCase[]) => void;
  updateTestCase: (id: string, updates: Partial<TestCase>) => void;
  activeTestCaseId: string | null;
  setActiveTestCaseId: (id: string | null) => void;

  // Custom Input
  customInput: string;
  setCustomInput: (input: string) => void;

  // Console Output
  consoleOutput: string;
  setConsoleOutput: (output: string) => void;

  // Submission State
  // submissionStatus: SubmissionStatus;
  // setSubmissionStatus: (status: SubmissionStatus) => void;
  // submissions: Submission[];
  // addSubmission: (submission: Submission) => void;

  // Timer
  timerSeconds: number;
  isTimerRunning: boolean;
  startTimer: () => void;
  stopTimer: () => void;
  resetTimer: () => void;
  isExamMode: boolean;
  examDuration: number; // in seconds
  setExamMode: (isExam: boolean, duration?: number) => void;

  // Layout
  isLeftPanelCollapsed: boolean;
  toggleLeftPanel: () => void;

  // Anti-cheat
  focusWarnings: number;
  pasteWarnings: number;
  incrementFocusWarning: () => void;
  incrementPasteWarning: () => void;

  // Diff View
  showDiffView: boolean;
  setShowDiffView: (show: boolean) => void;
  diffContent: { expected: string; actual: string } | null;
  setDiffContent: (content: { expected: string; actual: string } | null) => void;

  // Actions
  runCode: () => Promise<void>;
  submitCode: () => Promise<void>;
  isRunning: boolean;
  isSubmitting: boolean;
}

const EditorContext = createContext<EditorContextType | undefined>(undefined);

/** Default language used before examination data loads; replaced by examination.programmingLanguage */
const DEFAULT_PROGRAMMING_LANGUAGE: ProgrammingLanguage = {
  id: '',
  name: '',
  monaco: 'plaintext',
  extensions: [],
  logoFileUrl: '',
  formatter: '',
  digitSeparator: '',
  compilers: [],
  status: '',
  createdDate: new Date(0),
  updatedDate: new Date(0),
};

/** Fallback when no problem is set; key by backend language id. */
const FALLBACK_BOILERPLATE: Record<string, string> = {
  c: '// C\n#include <stdio.h>\n\nint main() {\n    return 0;\n}',
  cpp: '// C++\n#include <iostream>\n\nint main() {\n    return 0;\n}',
  python: '// Python\nprint("Hello, World!")\n',
  javascript: '// JavaScript\nconsole.log("Hello, World!");\n',
  typescript: '// TypeScript\nconsole.log("Hello, World!");\n',
  java: '// Java\npublic class Main {\n    public static void main(String[] args) {\n        \n    }\n}',
};

export function EditorProvider({ children }: { children: React.ReactNode }) {
  // Editor State – language is overwritten by examination.programmingLanguage when exam loads
  const [editorState, setEditorState] = useState<EditorState>({
    code: '',
    language: DEFAULT_PROGRAMMING_LANGUAGE,
    fontSize: 14,
    theme: 'vs-dark',
  });

  // Problem State
  const [problem, setProblem] = useState<Problem | null>(null);

  // Test Cases
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [activeTestCaseId, setActiveTestCaseId] = useState<string | null>('1');

  // Custom Input & Console
  const [customInput, setCustomInput] = useState('');
  const [consoleOutput, setConsoleOutput] = useState('');

  // Submission State (commented out)
  // const [submissionStatus, setSubmissionStatus] = useState<SubmissionStatus>('idle');
  // const [submissions, setSubmissions] = useState<Submission[]>([]);

  // Timer
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isExamMode, setIsExamModeState] = useState(false);
  const [examDuration, setExamDuration] = useState(3600); // 1 hour default
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Layout
  const [isLeftPanelCollapsed, setIsLeftPanelCollapsed] = useState(false);

  // Anti-cheat
  const [focusWarnings, setFocusWarnings] = useState(0);
  const [pasteWarnings, setPasteWarnings] = useState(0);

  // Diff View
  const [showDiffView, setShowDiffView] = useState(false);
  const [diffContent, setDiffContent] = useState<{
    expected: string;
    actual: string;
  } | null>(null);

  // Loading States
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Timer Effect
  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => {
        setTimerSeconds((prev) => {
          if (isExamMode) {
            // Countdown for exam mode
            if (prev <= 0) {
              setIsTimerRunning(false);
              return 0;
            }
            return prev - 1;
          }
          // Count up for practice mode
          return prev + 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isTimerRunning, isExamMode]);

  const setCode = useCallback((code: string) => {
    setEditorState((prev) => ({ ...prev, code }));
  }, []);

  const setLanguage = useCallback((language: ProgrammingLanguage) => {
    const boilerplate = getBoilerplateCode(problem) || (FALLBACK_BOILERPLATE[language?.id] ?? FALLBACK_BOILERPLATE['java'] ?? '');
    setEditorState((prev) => ({
      ...prev,
      language,
      code: boilerplate,
    }));
  }, [problem]);

  const setFontSize = useCallback((fontSize: number) => {
    setEditorState((prev) => ({ ...prev, fontSize }));
  }, []);

  const toggleTheme = useCallback(() => {
    setEditorState((prev) => ({
      ...prev,
      theme: prev.theme === 'vs-dark' ? 'vs-light' : 'vs-dark',
    }));
  }, []);

  const resetCode = useCallback(() => {
    setEditorState((prev) => {
      const boilerplate = getBoilerplateCode(problem) || (FALLBACK_BOILERPLATE[prev.language?.id] ?? FALLBACK_BOILERPLATE['java'] ?? '');
      return { ...prev, code: boilerplate };
    });
  }, [problem]);

  const updateTestCase = useCallback((id: string, updates: Partial<TestCase>) => {
    setTestCases((prev) =>
      prev.map((tc) => (tc.id === id ? { ...tc, ...updates } : tc))
    );
  }, []);

  // const addSubmission = useCallback((submission: Submission) => {
  //   setSubmissions((prev) => [submission, ...prev]);
  // }, []);

  const startTimer = useCallback(() => {
    setIsTimerRunning(true);
  }, []);

  const stopTimer = useCallback(() => {
    setIsTimerRunning(false);
  }, []);

  const resetTimer = useCallback(() => {
    setIsTimerRunning(false);
    setTimerSeconds(isExamMode ? examDuration : 0);
  }, [isExamMode, examDuration]);

  const setExamMode = useCallback((isExam: boolean, duration?: number) => {
    setIsExamModeState(isExam);
    if (duration) {
      setExamDuration(duration);
      setTimerSeconds(duration);
    } else if (isExam) {
      setTimerSeconds(examDuration);
    } else {
      setTimerSeconds(0);
    }
  }, [examDuration]);

  const toggleLeftPanel = useCallback(() => {
    setIsLeftPanelCollapsed((prev) => !prev);
  }, []);

  const incrementFocusWarning = useCallback(() => {
    setFocusWarnings((prev) => prev + 1);
  }, []);

  const incrementPasteWarning = useCallback(() => {
    setPasteWarnings((prev) => prev + 1);
  }, []);

  // Mock run code function
  const runCode = useCallback(async () => {
    setIsRunning(true);
    setConsoleOutput('Running code...\n');
    // setSubmissionStatus('processing');

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Mock response - update test cases with results
    setTestCases((prev) =>
      prev.map((tc, index) => ({
        ...tc,
        status: index === 0 ? 'pass' : index === 1 ? 'fail' : 'pass',
        actualOutput: index === 1 ? '9' : tc.expectedOutput,
        executionTime: Math.random() * 100,
        memoryUsed: Math.random() * 10,
      }))
    );

    setConsoleOutput('Execution completed.\nTest Cases: 2/3 passed\n');
    // setSubmissionStatus('idle');
    setIsRunning(false);
  }, []);

  // Mock submit code function
  const submitCode = useCallback(async () => {
    setIsSubmitting(true);
    setConsoleOutput('Submitting code...\n');
    // setSubmissionStatus('queued');

    await new Promise((resolve) => setTimeout(resolve, 1000));
    // setSubmissionStatus('processing');

    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Mock submission result
    const passed = Math.random() > 0.3;
    // setSubmissionStatus(passed ? 'accepted' : 'wrong_answer');

    if (!passed) {
      setDiffContent({
        expected: '10',
        actual: '9',
      });
      setShowDiffView(true);
    }

    // const newSubmission: Submission = {
    //   id: Date.now().toString(),
    //   language: editorState.language,
    //   code: editorState.code,
    //   status: passed ? 'accepted' : 'wrong_answer',
    //   timestamp: new Date(),
    //   executionTime: Math.random() * 100,
    //   memoryUsed: Math.random() * 50,
    //   passedTestCases: passed ? 10 : 8,
    //   totalTestCases: 10,
    // };
    // addSubmission(newSubmission);

    setConsoleOutput(
      passed
        ? 'All test cases passed!\n'
        : 'Wrong Answer on test case 3.\n'
    );
    setIsSubmitting(false);
  }, [editorState.language, editorState.code]);

  const value: EditorContextType = {
    editorState,
    setCode,
    setLanguage,
    setFontSize,
    toggleTheme,
    resetCode,
    problem,
    setProblem,
    testCases,
    setTestCases,
    updateTestCase,
    activeTestCaseId,
    setActiveTestCaseId,
    customInput,
    setCustomInput,
    consoleOutput,
    setConsoleOutput,
    // submissionStatus,
    // setSubmissionStatus,
    // submissions,
    // addSubmission,
    timerSeconds,
    isTimerRunning,
    startTimer,
    stopTimer,
    resetTimer,
    isExamMode,
    examDuration,
    setExamMode,
    isLeftPanelCollapsed,
    toggleLeftPanel,
    focusWarnings,
    pasteWarnings,
    incrementFocusWarning,
    incrementPasteWarning,
    showDiffView,
    setShowDiffView,
    diffContent,
    setDiffContent,
    runCode,
    submitCode,
    isRunning,
    isSubmitting,
  };

  return (
    <EditorContext.Provider value={value}>{children}</EditorContext.Provider>
  );
}

export function useEditorContext() {
  const context = useContext(EditorContext);
  if (context === undefined) {
    throw new Error('useEditorContext must be used within an EditorProvider');
  }
  return context;
}

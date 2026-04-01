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
import { useAuth } from '@/contexts/AuthContext';
import { ProgrammingLanguage, Compiler } from '@/types/language';
import { Problem, TestCase, getBoilerplateCode } from '@/types/examination';
import type { SubmissionResponse } from '@/types/submission';
import { useSubmissionStudent } from '@/hooks/submission/useSubmissionStudent';


/**
 * state for monaco code editor
 */
/** Monaco cursorBlinking option values */
export type CursorBlinking = 'blink' | 'smooth' | 'phase' | 'expand' | 'solid';

export interface EditorState {
  code: string;
  language: ProgrammingLanguage;
  fontSize: number;
  theme: 'vs-dark' | 'vs-light';
  tabSize: number;
  wordWrap: boolean;
  minimapEnabled: boolean;
  fontFamily: string;
  cursorBlinking: CursorBlinking;
  cursorSmoothCaretAnimation: boolean;
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
  selectedCompiler: Compiler | null;
  setSelectedCompiler: (compiler: Compiler | null) => void;
  setFontSize: (size: number) => void;
  setTheme: (theme: 'vs-dark' | 'vs-light') => void;
  setTabSize: (size: number) => void;
  setWordWrap: (enabled: boolean) => void;
  setMinimapEnabled: (enabled: boolean) => void;
  setFontFamily: (fontFamily: string) => void;
  setCursorBlinking: (value: CursorBlinking) => void;
  setCursorSmoothCaretAnimation: (enabled: boolean) => void;
  toggleTheme: () => void;
  resetCode: () => void;

  // Problem State
  problem: Problem | null;
  setProblem: (problem: Problem) => void;

  // Exam back link (when opened from my-classroom exam)
  examId: string | null;
  examClassroomId: string | null;
  setExamBackLink: (examId: string | null, classroomId: string | null) => void;

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

  // Submission State (for refetching submission list after submit)
  submissionsRefreshKey: number;
  incrementSubmissionsRefresh: () => void;
  /** Cache of submission history list for current workspace; invalidated when submissionsRefreshKey changes. */
  submissionsCache: { key: string; list: SubmissionResponse[]; refreshKeyWhenFetched: number } | null;
  setSubmissionsCache: (key: string, list: SubmissionResponse[], refreshKey: number) => void;

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
  submitCode: () => Promise<SubmissionResponse | null>;
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
  const { user } = useAuth();
  const { saveSubmission } = useSubmissionStudent();

  // Editor State – language is overwritten by examination.programmingLanguage when exam loads
  const [editorState, setEditorState] = useState<EditorState>({
    code: '',
    language: DEFAULT_PROGRAMMING_LANGUAGE,
    fontSize: 14,
    theme: 'vs-dark',
    tabSize: 4,
    wordWrap: false,
    minimapEnabled: true,
    fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
    cursorBlinking: 'smooth',
    cursorSmoothCaretAnimation: true,
  });

  // Problem State
  const [problem, setProblem] = useState<Problem | null>(null);
  const [selectedCompiler, setSelectedCompiler] = useState<Compiler | null>(null);
  const [examId, setExamIdState] = useState<string | null>(null);
  const [examClassroomId, setExamClassroomIdState] = useState<string | null>(null);

  // Test Cases
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [activeTestCaseId, setActiveTestCaseId] = useState<string | null>('1');

  // Custom Input & Console
  const [customInput, setCustomInput] = useState('');
  const [consoleOutput, setConsoleOutput] = useState('');

  // Submission list refresh trigger (increment after submit so SubmissionsTab refetches)
  const [submissionsRefreshKey, setSubmissionsRefreshKey] = useState(0);
  const incrementSubmissionsRefresh = useCallback(() => {
    setSubmissionsRefreshKey((k) => k + 1);
  }, []);

  // Cache submission history per (studentId_examId_problemId) to avoid repeated API calls in workspace
  const [submissionsCache, setSubmissionsCacheState] = useState<{
    key: string;
    list: SubmissionResponse[];
    refreshKeyWhenFetched: number;
  } | null>(null);
  const setSubmissionsCache = useCallback(
    (key: string, list: SubmissionResponse[], refreshKey: number) => {
      setSubmissionsCacheState({ key, list, refreshKeyWhenFetched: refreshKey });
    },
    []
  );

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
    setSelectedCompiler(language?.compilers?.[0] ?? null);
  }, [problem]);

  const setFontSize = useCallback((fontSize: number) => {
    setEditorState((prev) => ({ ...prev, fontSize }));
  }, []);

  const setTheme = useCallback((theme: 'vs-dark' | 'vs-light') => {
    setEditorState((prev) => ({ ...prev, theme }));
  }, []);

  const setTabSize = useCallback((tabSize: number) => {
    setEditorState((prev) => ({ ...prev, tabSize }));
  }, []);

  const setWordWrap = useCallback((wordWrap: boolean) => {
    setEditorState((prev) => ({ ...prev, wordWrap }));
  }, []);

  const setMinimapEnabled = useCallback((minimapEnabled: boolean) => {
    setEditorState((prev) => ({ ...prev, minimapEnabled }));
  }, []);

  const setFontFamily = useCallback((fontFamily: string) => {
    setEditorState((prev) => ({ ...prev, fontFamily }));
  }, []);

  const setCursorBlinking = useCallback((cursorBlinking: CursorBlinking) => {
    setEditorState((prev) => ({ ...prev, cursorBlinking }));
  }, []);

  const setCursorSmoothCaretAnimation = useCallback((cursorSmoothCaretAnimation: boolean) => {
    setEditorState((prev) => ({ ...prev, cursorSmoothCaretAnimation }));
  }, []);

  const setExamBackLink = useCallback((eid: string | null, cid: string | null) => {
    setExamIdState(eid);
    setExamClassroomIdState(cid);
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

  const submitCode = useCallback(async (): Promise<SubmissionResponse | null> => {
    const studentId = user?.id;
    if (!examId || !problem?.id || !studentId || !selectedCompiler) {
      console.warn('submitCode: missing examId, problemId, studentId, or selectedCompiler');
      return null;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        examId,
        problemId: problem.id,
        studentId,
        source: editorState.code,
        languageId: editorState.language?.id ?? '',
        compilerId: selectedCompiler.id,
      };
      const result = await saveSubmission(payload);
      if (result != null) {
        try {
          // Do not flush exam logs on submit; global finish will flush (latest per problem).
        } catch (err) {
          console.error('submitCode: post-submit side-effects failed:', err);
        }
        incrementSubmissionsRefresh();
      }
      return result;
    } catch (err) {
      console.error('submitCode failed:', err);
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, [
    examId,
    problem?.id,
    user?.id,
    selectedCompiler,
    editorState.code,
    editorState.language?.id,
    saveSubmission,
    incrementSubmissionsRefresh,
  ]);

  const value: EditorContextType = {
    editorState,
    setCode,
    setLanguage,
    selectedCompiler,
    setSelectedCompiler,
    setFontSize,
    setTheme,
    setTabSize,
    setWordWrap,
    setMinimapEnabled,
    setFontFamily,
    setCursorBlinking,
    setCursorSmoothCaretAnimation,
    toggleTheme,
    resetCode,
    problem,
    setProblem,
    examId,
    examClassroomId,
    setExamBackLink,
    testCases,
    setTestCases,
    updateTestCase,
    activeTestCaseId,
    setActiveTestCaseId,
    customInput,
    setCustomInput,
    consoleOutput,
    setConsoleOutput,
    submissionsRefreshKey,
    incrementSubmissionsRefresh,
    submissionsCache,
    setSubmissionsCache,
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

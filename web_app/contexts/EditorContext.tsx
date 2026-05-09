'use client';

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import { flushSync } from 'react-dom';
// import {
//   SubmissionStatus,
//   BOILERPLATE_CODE,
//   Problem,
//   Submission,
// } from '@/types/language';
import { useAuth } from '@/contexts/AuthContext';
import { ProgrammingLanguage, Compiler } from '@/types/language';
import { Problem, TestCase, getBoilerplateCode } from '@/types/examination';
import type { SubmissionResponse, AutoGradeSubmissionResult } from '@/types/submission';
import type * as monacoNS from 'monaco-editor';
import { useSubmissionStudent } from '@/hooks/submission/useSubmissionStudent';
import { useKeystrokeTracking, KeystrokeRecord } from '@/hooks/typing/useKeystrokeTracking';


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
  setLanguage: (language: ProgrammingLanguage, codeTemplate?: string) => void;
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
  isTimerExpired: boolean;
  startTimer: () => void;
  stopTimer: () => void;
  resetTimer: () => void;
  isExamMode: boolean;
  examDuration: number; // in seconds
  setExamMode: (isExam: boolean, endTime?: Date) => void;
  syncServerTime: (serverTimeStr: string) => void;
  timeOffset: number;

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
  submitCodeForce: () => Promise<SubmissionResponse | null>;
  submitAndGrade: () => Promise<AutoGradeSubmissionResult | null>;
  practiceTestResults: AutoGradeSubmissionResult | null;
  setPracticeTestResults: (result: AutoGradeSubmissionResult | null) => void;
  isRunning: boolean;
  isSubmitting: boolean;
  isPracticeSubmitting: boolean;
  submissionError: string | null;
  clearSubmissionError: () => void;

  // Anti-cheat (Keystrokes)
  keystrokeCount: number;
  batchLogs: KeystrokeRecord[];
  flushKeystrokes: (submissionId: string) => Promise<void>;

  // Monaco Editor Instance (for anti-cheat clipboard guard)
  monacoEditorRef: React.RefObject<monacoNS.editor.IStandaloneCodeEditor | null>;
  /**
   * Register a callback to be invoked when the Monaco editor mounts.
   * Safe to call before or after the editor has mounted.
   */
  registerOnEditorMount: (callback: (editor: monacoNS.editor.IStandaloneCodeEditor) => void) => void;
  /** Internal: called by EditorPanel when Monaco mounts, notifies registered callbacks. */
  handleEditorMountInternal: (editor: monacoNS.editor.IStandaloneCodeEditor) => void;

  /** ID of the most recently saved submission — used by code-editor-client to persist lastSubmissionId to localStorage. */
  lastSubmissionId: string | null;
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
  const { saveSubmission, forceSubmission, submitAndGrade: submitAndGradeApi } = useSubmissionStudent();

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

  // Keystroke Tracking
  const {
    keystrokeCount,
    batchLogs,
    flush: flushKeystrokes,
  } = useKeystrokeTracking(examId ?? '', user?.id ?? '', problem?.id ?? '', editorState.code);

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
  const [isTimerExpired, setIsTimerExpired] = useState(false);
  const [isExamMode, setIsExamModeState] = useState(false);
  const [examDuration, setExamDuration] = useState(3600); // 1 hour default (fallback)
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [timeOffset, setTimeOffset] = useState(0); // Difference between server and client time
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isTimerExpiredRef = useRef(false); // stable ref to avoid stale closure in code-editor-client
  // const submitCodeForceRef = useRef<(() => Promise<SubmissionResponse | null>) | null>(null);

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
  const [isPracticeSubmitting, setIsPracticeSubmitting] = useState(false);
  const [practiceTestResults, setPracticeTestResultsState] = useState<AutoGradeSubmissionResult | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  /** ID of the most recently saved submission — exposed via context so code-editor-client can persist it. */
  const [lastSubmissionId, setLastSubmissionId] = useState<string | null>(null);

  const clearSubmissionError = useCallback(() => setSubmissionError(null), []);

  // Monaco editor instance ref — used by useExamViolationGuard for internal clipboard detection
  const monacoEditorRef = useRef<monacoNS.editor.IStandaloneCodeEditor | null>(null);
  // Stores callbacks to invoke when the Monaco editor mounts
  const onEditorReadyCallbacksRef = useRef<((editor: monacoNS.editor.IStandaloneCodeEditor) => void)[]>([]);

  const registerOnEditorMount = useCallback((callback: (editor: monacoNS.editor.IStandaloneCodeEditor) => void) => {
    // If editor is already mounted, call immediately
    if (monacoEditorRef.current) {
      callback(monacoEditorRef.current);
    }
    // Otherwise register for later
    onEditorReadyCallbacksRef.current.push(callback);
  }, []);

  const handleEditorMountInternal = useCallback((editor: monacoNS.editor.IStandaloneCodeEditor) => {
    monacoEditorRef.current = editor;
    // Notify all registered callbacks
    onEditorReadyCallbacksRef.current.forEach((cb) => cb(editor));
    onEditorReadyCallbacksRef.current = [];
  }, []);

  const setPracticeTestResults = useCallback((result: AutoGradeSubmissionResult | null) => {
    setPracticeTestResultsState(result);
  }, []);

  // Timer Effect — only updates timerSeconds; force-submit-on-expiry is handled in code-editor-client.tsx
  // to keep the callback fresh (no stale-closure risk from ref-based patterns).
  useEffect(() => {
    // if (isTimerRunning) {
    //   if (isExamMode && endTime) {
    //     // Precise timer for exam mode based on endTime and server offset
    //     timerRef.current = setInterval(() => {
    //       const serverNow = Date.now() + timeOffset;
    //       const diff = Math.floor((endTime.getTime() - serverNow) / 1000);
          
    //       if (diff <= 0) {
    //         setTimerSeconds(0);
    //         setIsTimerRunning(false);
    //         if (timerRef.current) {
    //           clearInterval(timerRef.current);
    //           timerRef.current = null;
    //         }
    //         // Trigger auto-submit (force bypasses MaxAttempts)
    //         if (isExamMode) {
    //           console.log('Time is up! Auto-submitting (force)...');
    //           submitCodeForceRef.current?.();
    //         }
    //       } else {
    //         setTimerSeconds(diff);
    //       }
    //     }, 1000);
    //   } else {
    //     // Count up for practice mode
    //     timerRef.current = setInterval(() => {
    //       setTimerSeconds((prev) => prev + 1);
    //     }, 1000);
    //   }
    // }

    // Guard: skip if endTime has already passed (prevents immediate tick firing on mount).
    // Note: we intentionally do NOT check !Number.isFinite(timeOffset) here.
    // timeOffset starts at 0 (not synced) — if we treated 0 as invalid, the guard
    // would fire before syncServerTime is called and incorrectly expire the exam.
    // Instead, we use client time as fallback, and the effect will re-run with the
    // correct offset once syncServerTime is called.
    //
    // We also skip if the exam timer hasn't been started yet (isTimerRunning=false).
    // This prevents the guard from expiring the timer during the initial render,
    // before setExamMode/setEndTime have been called by CodeEditorClient.
    const nowForGuard = Number.isFinite(timeOffset) ? Date.now() + timeOffset : Date.now();
    const isExpired = !endTime || endTime.getTime() <= nowForGuard;
    console.log('[TimerEffect] guard check', {
      timeOffset,
      nowForGuard,
      endTimeMs: endTime?.getTime(),
      isExpired,
      isTimerRunning,
      isExamMode,
    });
    // Only expire if: (1) exam timer is running, AND (2) exam mode is active, AND (3) time has passed.
    // NEVER expire if the exam hasn't been started yet (isTimerRunning=false).
    // This prevents the timer from being incorrectly expired during the initial render
    // when setExamMode/endTime have not yet been called.
    if (isExpired) {
      if (!isTimerRunning) {
        console.log('[TimerEffect] Guard skipped — isTimerRunning=false, exam not started yet');
        return;
      }
      console.log('[TimerEffect] GUARD TRIGGERED — expiring timer', { reason: !endTime ? 'no endTime' : 'endTime passed' });
      setTimerSeconds(0);
      setIsTimerRunning(false);
      setIsTimerExpired(true);
      isTimerExpiredRef.current = true;
      return;
    }

    if (!isTimerRunning || !isExamMode || !endTime) return;

    const tick = () => {
      const serverNow = Date.now() + timeOffset;
      const diff = Math.floor((endTime.getTime() - serverNow) / 1000);
      if (diff <= 0) {
        // Exam has ended — clamp to 0 and stop.
        // Guard against negative diff (e.g. server clock behind client, or NaN from invalid HTTP date header).
        setTimerSeconds(0);
        setIsTimerRunning(false);
        setIsTimerExpired(true);
        isTimerExpiredRef.current = true;
        clearInterval(timerRef.current ?? undefined);
        timerRef.current = null;
      } else {
        setTimerSeconds(diff);
      }
    };

    tick(); // run immediately so the initial value is correct
    timerRef.current = setInterval(tick, 1000);

    return () => {
      clearInterval(timerRef.current ?? undefined);
      timerRef.current = null;
    };
  }, [isTimerRunning, isExamMode, endTime, timeOffset]);

  const setCode = useCallback((code: string) => {
    setEditorState((prev) => ({ ...prev, code }));
  }, []);

  const setLanguage = useCallback((language: ProgrammingLanguage, codeTemplate?: string) => {
    const template = codeTemplate ?? getBoilerplateCode(problem) ?? FALLBACK_BOILERPLATE[language?.id] ?? '';
    setEditorState((prev) => ({
      ...prev,
      language,
      code: template,
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
      const boilerplate = getBoilerplateCode(problem) ?? (FALLBACK_BOILERPLATE[prev.language?.id] ?? '');
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
    console.log('[startTimer] called');
    setIsTimerRunning(true);
  }, []);

  const stopTimer = useCallback(() => {
    // Use flushSync to immediately update state — important for React Strict Mode double-invoke
    // to prevent stale async blocks from running after cleanup.
    flushSync(() => {
      setIsTimerRunning(false);
    });
  }, []);

  const resetTimer = useCallback(() => {
    setIsTimerRunning(false);
    setIsTimerExpired(false);
    isTimerExpiredRef.current = false;
    setTimerSeconds(isExamMode ? examDuration : 0);
  }, [isExamMode, examDuration]);

  const syncServerTime = useCallback((serverTimeStr: string) => {
    const serverTime = new Date(serverTimeStr).getTime();
    const clientTime = Date.now();
    const newOffset = serverTime - clientTime;
    console.log('[syncServerTime] setting offset', { serverTime, clientTime, newOffset });
    setTimeOffset(serverTime - clientTime);
  }, []);

  const setExamMode = useCallback((isExam: boolean, end?: Date) => {
    console.log('[setExamMode] called', { isExam, endTime: end?.getTime() });
    setIsExamModeState(isExam);
    if (end) {
      setEndTime(end);
      // Use server time if offset is valid, otherwise client time.
      const serverNow = Number.isFinite(timeOffset) ? Date.now() + timeOffset : Date.now();
      const initialDiff = Math.max(0, Math.floor((end.getTime() - serverNow) / 1000));
      console.log('[setExamMode] setTimerSeconds to', initialDiff, { serverNow, timeOffset });
      setTimerSeconds(initialDiff);
    } else if (isExam) {
       // Fallback if no specific end time is provided but exam mode is on
      setTimerSeconds(examDuration);
    } else {
      setTimerSeconds(0);
    }
  }, [examDuration, timeOffset]);

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
        setLastSubmissionId(result.id);
        try {
          await flushKeystrokes(result.id);
        } catch (err) {
          console.error('submitCode: post-submit side-effects failed:', err);
        }
        incrementSubmissionsRefresh();
      }
      return result;
    } catch (err) {
      console.error('submitCode failed:', err);
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : null;
      setSubmissionError(message ?? 'Submission failed. Please try again.');
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
    flushKeystrokes,
  ]);

  const submitCodeForce = useCallback(async (): Promise<SubmissionResponse | null> => {
    const studentId = user?.id;
    if (!examId || !problem?.id || !studentId || !selectedCompiler) {
      console.warn('submitCodeForce: missing required fields');
      return null;
    }
    try {
      const payload = {
        examId,
        problemId: problem.id,
        studentId,
        source: editorState.code,
        languageId: editorState.language?.id ?? '',
        compilerId: selectedCompiler.id,
      };
      return await forceSubmission(payload);
    } catch (err) {
      console.error('submitCodeForce failed:', err);
      return null;
    }
  }, [
    examId,
    problem?.id,
    user?.id,
    selectedCompiler,
    editorState.code,
    editorState.language?.id,
    forceSubmission,
  ]);

  // Force-submit-on-expiry is handled in code-editor-client.tsx to avoid stale-closure issues.

  /** Submit and grade for PRACTICE mode — returns AutoGradeSubmissionResult with test results. */
  const submitAndGrade = useCallback(async (): Promise<AutoGradeSubmissionResult | null> => {
    const studentId = user?.id;
    if (!examId || !problem?.id || !studentId || !selectedCompiler) {
      console.warn('submitAndGrade: missing examId, problemId, studentId, or selectedCompiler');
      return null;
    }
    setIsPracticeSubmitting(true);
    try {
      const payload = {
        examId,
        problemId: problem.id,
        studentId,
        source: editorState.code,
        languageId: editorState.language?.id ?? '',
        compilerId: selectedCompiler.id,
      };
      const result = await submitAndGradeApi(payload);
      setPracticeTestResultsState(result);
      return result;
    } catch (err) {
      console.error('submitAndGrade failed:', err);
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : null;
      setSubmissionError(message ?? 'Submission failed. Please try again.');
      return null;
    } finally {
      setIsPracticeSubmitting(false);
    }
  }, [
    examId,
    problem?.id,
    user?.id,
    selectedCompiler,
    editorState.code,
    editorState.language?.id,
    submitAndGradeApi,
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
    isTimerExpired,
    startTimer,
    stopTimer,
    resetTimer,
    isExamMode,
    examDuration,
    setExamMode,
    syncServerTime,
    timeOffset,
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
    submitCodeForce,
    submitAndGrade,
    practiceTestResults,
    setPracticeTestResults,
    isRunning,
    isSubmitting,
    isPracticeSubmitting,
    submissionError,
    clearSubmissionError,
    keystrokeCount,
    batchLogs,
    flushKeystrokes,
    monacoEditorRef,
    registerOnEditorMount,
    handleEditorMountInternal,
    lastSubmissionId,
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

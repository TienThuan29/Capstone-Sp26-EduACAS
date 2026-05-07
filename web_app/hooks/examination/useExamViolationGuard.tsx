import type { RefObject } from 'react';
import { useEffect, useRef } from 'react';

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

export type LogEntry = {
  time: string;
  type: string;
  severity: 'info' | 'warning' | 'critical';
  isViolation: boolean;
  message: string;
  detail: Record<string, unknown>;
};

type ExamScreen = 'intro' | 'exam' | 'end';

export type ViolationOverlayAlertType = 'violation' | 'lock';

export type ViolationOverlay = {
  title: string;
  msg: string;
  sub: string;
  showBtn: boolean;
  /** Drives lucide icon + modal colors in WarningModal */
  alertType: ViolationOverlayAlertType;
};

type UseExamViolationGuardParams = {
  examStatusStorageKey: string;
  violationStorageKey: string;
  logsStorageKey: string;
  answerStorageKeys?: string[];
  answerStorageKey: string;
  maxTolerance: number;
  answer: string;
  violationCountRef: RefObject<number>;
  isInitializingRef: RefObject<boolean>;
  isReloadingRef: RefObject<boolean>;
  isExamFinishedRef: RefObject<boolean>;
  examStartTimeRef: RefObject<number>;
  setAnswer: (value: string) => void;
  restoreAnswers?: (getValue: (key: string) => string | null) => void;
  persistAnswers?: (setValue: (key: string, value: string) => void) => void;
  setLogs: (entries: LogEntry[]) => void;
  setScreen: (screen: ExamScreen) => void;
  setOverlay: (overlay: ViolationOverlay | null) => void;
  onLog: (
    type: string,
    severity: 'info' | 'warning' | 'critical',
    isViolation: boolean,
    message: string,
    detail: Record<string, unknown>,
  ) => void;
  onForceSubmit: () => void | Promise<void>;
  /**
   * Callback from EditorContext that fires when the Monaco editor mounts.
   * The anti-cheat guard registers its paste interceptor here.
   */
  onMonacoEditorMount?: (callback: (editor: import('monaco-editor').editor.IStandaloneCodeEditor) => void) => void;
  enableDevtoolsInDevelopment?: boolean;
  /** Ref to the Monaco editor instance, used to capture selection text for copy/cut detection. */
  monacoEditorRef?: RefObject<import('monaco-editor').editor.IStandaloneCodeEditor | null>;
};

type LatestParams = Omit<UseExamViolationGuardParams, 'enableDevtoolsInDevelopment' | 'monacoEditorRef'> & {
  monacoEditorRef: import('monaco-editor').editor.IStandaloneCodeEditor | null;
  onMonacoEditorMount?: (callback: (editor: import('monaco-editor').editor.IStandaloneCodeEditor) => void) => void;
};

// ═══════════════════════════════════════════════════════════════════
// HELPERS (module-level, no React state)
// ═══════════════════════════════════════════════════════════════════

/** Checks if the exam session is currently active by reading localStorage. */
const isExamInProgress = (params: { examStatusStorageKey: string }): boolean => {
  const status = localStorage.getItem(params.examStatusStorageKey);
  return status === 'in_progress' || status === 'active';
};

const parseStoredLogs = (rawValue: string | null): LogEntry[] => {
  if (!rawValue) return [];
  try {
    const parsed = JSON.parse(rawValue);
    return Array.isArray(parsed) ? (parsed as LogEntry[]) : [];
  } catch {
    return [];
  }
};

const parseViolationCount = (rawValue: string | null): number => {
  const parsed = Number.parseInt(rawValue ?? '0', 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
};

const findProblemId = (target: EventTarget | null): string | null => {
  let el = target as HTMLElement | null;
  while (el) {
    const pid = el.getAttribute?.('data-problem-id');
    if (pid) return pid;
    el = el.parentElement;
  }
  return null;
};

/** Extract selected text from a Monaco editor instance. Returns empty string if no editor or no selection. */
const getSelectedTextFromMonaco = (
  editor: import('monaco-editor').editor.IStandaloneCodeEditor | null
): string => {
  if (!editor) return '';
  const selection = editor.getSelection();
  if (!selection || selection.isEmpty()) {
    const position = editor.getPosition();
    if (position) {
      const model = editor.getModel();
      if (model) {
        const lineContent = model.getLineContent(position.lineNumber);
        return lineContent;
      }
    }
    return '';
  }
  const model = editor.getModel();
  if (!model) return '';
  return model.getValueInRange(selection);
};

const FULLSCREEN_VIEWPORT_TOLERANCE_PX = 4;
const FULLSCREEN_CHROME_TOLERANCE_PX = 12;

const isFullscreenActive = (): boolean => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return false;
  }

  const browserWindow = window as Window & { fullScreen?: boolean };
  if (typeof browserWindow.fullScreen === 'boolean' && browserWindow.fullScreen) {
    return true;
  }

  if (document.fullscreenElement) {
    return true;
  }

  const near = (a: number, b: number): boolean => Math.abs(a - b) <= FULLSCREEN_VIEWPORT_TOLERANCE_PX;
  const viewportWidth = window.visualViewport?.width ?? window.innerWidth;
  const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
  const matchesScreen = near(viewportWidth, window.screen.width)
    && near(viewportHeight, window.screen.height);
  const browserChromeHidden = Math.abs(window.outerHeight - window.innerHeight) <= FULLSCREEN_CHROME_TOLERANCE_PX;

  return matchesScreen && browserChromeHidden;
};

// ═══════════════════════════════════════════════════════════════════
// OVERLAY BUILDERS
// ═══════════════════════════════════════════════════════════════════

const buildViolationOverlay = (msg: string, maxTolerance: number, currentCount: number): ViolationOverlay => ({
  title: 'Exam rules violation',
  msg: `${msg} (Strike ${currentCount}/${maxTolerance}).`,
  sub: 'This behavior has been recorded. Please return to your exam immediately. If you exceed the allowed number of strikes, the exam will be locked.',
  showBtn: true,
  alertType: 'violation',
});

const buildCriticalLockOverlay = (reason: string): ViolationOverlay => ({
  title: 'Exam locked',
  msg: reason,
  sub: 'The exam has been locked due to a serious violation or exceeding the warning limit. Please contact the proctor.',
  showBtn: false,
  alertType: 'lock',
});

// ═══════════════════════════════════════════════════════════════════
// KEYBOARD SHORTCUT CONFIG
// ═══════════════════════════════════════════════════════════════════

type ShortcutRule = {
  ctrl?: boolean;
  shift?: boolean;
  key: string;
  intent: string;
};

const BLOCKED_SHORTCUTS: ShortcutRule[] = [
  { key: 'F12', intent: 'open_devtools' },
  { ctrl: true, shift: true, key: 'I', intent: 'open_devtools' },
  { ctrl: true, shift: true, key: 'J', intent: 'open_devtools' },
  { ctrl: true, shift: true, key: 'C', intent: 'open_devtools' },
  { ctrl: true, key: 'U', intent: 'view_source' },
  { ctrl: true, key: 'S', intent: 'save_page' },
  { ctrl: true, key: 'P', intent: 'print_page' },
];

const INTENT_LABELS: Record<string, string> = {
  open_devtools: 'open DevTools',
  save_page: 'save page',
  print_page: 'print page',
  view_source: 'view source',
  screenshot: 'screenshot',
};

// ═══════════════════════════════════════════════════════════════════
// MAIN HOOK
// ═══════════════════════════════════════════════════════════════════

export function useExamViolationGuard({
  examStatusStorageKey,
  violationStorageKey,
  logsStorageKey,
  answerStorageKeys = [],
  answerStorageKey,
  maxTolerance,
  answer,
  violationCountRef,
  isInitializingRef,
  isReloadingRef,
  isExamFinishedRef,
  examStartTimeRef,
  setAnswer,
  restoreAnswers,
  persistAnswers,
  setLogs,
  setScreen,
  setOverlay,
  onLog,
  onForceSubmit,
  enableDevtoolsInDevelopment = false,
  monacoEditorRef,
  onMonacoEditorMount,
}: UseExamViolationGuardParams) {
  const wasDevtoolsOpenRef = useRef(false);
  const blurLockTimeoutRef = useRef<number | null>(null);
  const monacoCleanupRef = useRef<(() => void) | null>(null);
  const tabHiddenAtRef = useRef<number | null>(null);
  const windowBlurAtRef = useRef<number | null>(null);
  const fullscreenExitAtRef = useRef<number | null>(null);
  const fullscreenViolationTimeoutRef = useRef<number | null>(null);
  const fullscreenViolationLoggedRef = useRef(false);
  const fullscreenWatchdogStartAtRef = useRef<number | null>(null);
  const fullscreenWatchdogWarningShownRef = useRef(false);
  /** Tracks whether the last copy/cut operation was a cut, so paste can log CUT_PASTE vs COPY_PASTE. */
  const lastCopyOperationWasCutRef = useRef(false);
  /** Tracks the problemId from which the last copy/cut was performed. */
  const lastCopyFromProblemIdRef = useRef<string | null>(null);
  /** Tracks drag context for DRAG_DROP detection. */
  const dragContextRef = useRef<{
    text: string;
    fromProblemId: string | null;
    capturedAt: number;
  } | null>(null);

  const FULLSCREEN_EXIT_GRACE_MS = 500;
  const FULLSCREEN_ENFORCEMENT_INTERVAL_MS = 500;
  const STARTUP_GUARD_GRACE_MS = 1200;
  const isSessionActiveStatus = (status: string | null): boolean => {
    const normalized = status?.trim().toLowerCase();
    return normalized === 'in_progress' || normalized === 'active';
  };
  const isWithinStartupGuardGrace = (current: LatestParams): boolean => {
    const startedAt = current.examStartTimeRef.current;
    if (startedAt <= 0) {
      current.examStartTimeRef.current = Date.now();
      return true;
    }
    return (Date.now() - startedAt) < STARTUP_GUARD_GRACE_MS;
  };
  const applyViolationOutcome = (
    current: LatestParams,
    eventType: string,
    reason: string,
    count: number,
    detail: Record<string, unknown> = {},
    forceLock: boolean = false,
    options: { includeLockedInDetail?: boolean } = {}
  ) => {
    const includeLockedInDetail = options.includeLockedInDetail ?? true;
    const isExceededTolerance = count >= current.maxTolerance;
    const shouldLock = forceLock || isExceededTolerance;

    if (shouldLock) {
      current.isExamFinishedRef.current = true;
      localStorage.setItem(current.examStatusStorageKey, 'locked');

      const criticalDetail = includeLockedInDetail
        ? { violationCount: count, locked: true, ...detail }
        : { violationCount: count, ...detail };

      current.onLog(
        eventType, 'critical', true,
        `${reason} — the exam has been locked`,
        criticalDetail,
      );

      current.setScreen('exam');
      current.setOverlay(buildCriticalLockOverlay(reason));
      try {
        void Promise.resolve(current.onForceSubmit()).catch((err) => {
          current.onLog(
            'FORCE_SUBMIT_FAILED',
            'critical',
            false,
            'Force submit failed after exam lock',
            { error: String(err) },
          );
        });
      } catch (err) {
        current.onLog(
          'FORCE_SUBMIT_FAILED',
          'critical',
          false,
          'Force submit threw synchronously after exam lock',
          { error: String(err) },
        );
      }
      return;
    }

    const warningDetail = includeLockedInDetail
      ? { violationCount: count, locked: false, ...detail }
      : { violationCount: count, ...detail };

    current.onLog(
      eventType, 'warning', false,
      `${reason} — warning strike ${count}`,
      warningDetail,
    );
    current.setOverlay(buildViolationOverlay(reason, current.maxTolerance, count));
  };

  const consumeAwayDuration = (timestampRef: RefObject<number | null>): number => {
    const startedAt = timestampRef.current;
    timestampRef.current = null;
    if (startedAt === null) return 0;
    return Math.max(0, Date.now() - startedAt);
  };

  const latestRef = useRef<LatestParams>({
    examStatusStorageKey, violationStorageKey, logsStorageKey, answerStorageKeys, answerStorageKey,
    maxTolerance, answer, violationCountRef, isInitializingRef, isReloadingRef,
    isExamFinishedRef, examStartTimeRef, setAnswer, restoreAnswers, persistAnswers, setLogs, setScreen, setOverlay,
    onLog, onForceSubmit,
    onMonacoEditorMount,
    monacoEditorRef: monacoEditorRef?.current ?? null,
  });

  useEffect(() => {
    latestRef.current = {
      examStatusStorageKey, violationStorageKey, logsStorageKey, answerStorageKeys, answerStorageKey,
      maxTolerance, answer, violationCountRef, isInitializingRef, isReloadingRef,
      isExamFinishedRef, examStartTimeRef, setAnswer, restoreAnswers, persistAnswers, setLogs, setScreen, setOverlay,
      onLog, onForceSubmit,
      onMonacoEditorMount,
      monacoEditorRef: monacoEditorRef?.current ?? null,
    };
  }, [
    examStatusStorageKey, violationStorageKey, logsStorageKey, answerStorageKeys, answerStorageKey,
    maxTolerance, answer, violationCountRef, isInitializingRef, isReloadingRef,
    isExamFinishedRef, examStartTimeRef, setAnswer, restoreAnswers, persistAnswers, setLogs, setScreen, setOverlay,
    onLog, onForceSubmit, onMonacoEditorMount,
  ]);

  // ─────────────────────────────────────────────────────────────
  // EFFECT 1: Khôi phục trạng thái khi reload + beforeunload
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const current = latestRef.current;
    current.isReloadingRef.current = false;

    if (!current.examStatusStorageKey) {
      return;
    }

    if (current.violationStorageKey) {
      if (!localStorage.getItem(current.violationStorageKey)) {
        localStorage.setItem(current.violationStorageKey, '0');
      }
      current.violationCountRef.current = parseViolationCount(localStorage.getItem(current.violationStorageKey));
    } else {
      current.violationCountRef.current = 0;
    }

    if (current.logsStorageKey) {
      current.setLogs(parseStoredLogs(localStorage.getItem(current.logsStorageKey)));
    } else {
      current.setLogs([]);
    }

    const status = localStorage.getItem(current.examStatusStorageKey);
    const isSessionActive = status === 'in_progress' || status === 'active';

    if (isSessionActive) {
      if (current.restoreAnswers) {
        current.restoreAnswers((key) => localStorage.getItem(key));
      } else {
        const preferredKeys = current.answerStorageKeys?.length
          ? current.answerStorageKeys
          : [current.answerStorageKey];
        const firstAnswerKey = preferredKeys[0];
        if (firstAnswerKey) {
          const savedAnswer = localStorage.getItem(firstAnswerKey);
          if (savedAnswer) current.setAnswer(savedAnswer);
        }
      }

      current.setScreen('exam');
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      const latest = latestRef.current;
      const s = localStorage.getItem(latest.examStatusStorageKey);
      if (s === 'in_progress' || s === 'active') {
        latest.isReloadingRef.current = true;
        event.preventDefault();
        (event as any).returnValue = '';
        setTimeout(() => {
          latest.isReloadingRef.current = false;
        }, 100);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // ─────────────────────────────────────────────────────────────
  // EFFECT 2: Tất cả event listeners (violation detection)
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    let isEffectDisposed = false;
    let removeDevtoolsListener: (() => void) | null = null;
    let disableDetector: (() => void) | null = null;

    const processViolation = (
      current: LatestParams,
      eventType: string,
      reason: string,
      detail: Record<string, unknown> = {},
      forceLock: boolean = false,
      options: { includeLockedInDetail?: boolean } = {}
    ) => {
      const includeLockedInDetail = options.includeLockedInDetail ?? true;

      if (!current.examStatusStorageKey?.trim() || !current.violationStorageKey?.trim()) {
        return;
      }

      current.violationCountRef.current += 1;
      const count = current.violationCountRef.current;
      localStorage.setItem(current.violationStorageKey, String(count));
      applyViolationOutcome(current, eventType, reason, count, detail, forceLock, { includeLockedInDetail });
    };

    // ── FULLSCREEN ──────────────────────────────────────────
    const handleFullscreenChange = () => {
      const current = latestRef.current;
      if (!isExamInProgress(current) || current.isInitializingRef.current || current.isReloadingRef.current) return;
      if (isWithinStartupGuardGrace(current)) return;

      if (!isFullscreenActive()) {
        if (fullscreenExitAtRef.current === null) {
          fullscreenExitAtRef.current = Date.now();
          fullscreenViolationLoggedRef.current = false;
        }

        if (fullscreenWatchdogStartAtRef.current === null) {
          fullscreenWatchdogStartAtRef.current = Date.now();
        }

        if (fullscreenViolationTimeoutRef.current !== null) {
          window.clearTimeout(fullscreenViolationTimeoutRef.current);
        }

        fullscreenViolationTimeoutRef.current = window.setTimeout(() => {
          const latest = latestRef.current;

          if (
            isFullscreenActive()
            || fullscreenViolationLoggedRef.current
            || !isExamInProgress(latest)
            || latest.isInitializingRef.current
            || latest.isReloadingRef.current
          ) {
            return;
          }

          const durationAwayMs = consumeAwayDuration(fullscreenExitAtRef);
          if (durationAwayMs <= 0) return;

          fullscreenViolationLoggedRef.current = true;
          processViolation(
            latest,
            'FULLSCREEN_EXIT',
            'Exited fullscreen mode',
            { durationAwayMs },
            false,
            { includeLockedInDetail: false },
          );

          fullscreenViolationTimeoutRef.current = null;
        }, FULLSCREEN_EXIT_GRACE_MS);

        return;
      }

      if (fullscreenViolationTimeoutRef.current !== null) {
        window.clearTimeout(fullscreenViolationTimeoutRef.current);
        fullscreenViolationTimeoutRef.current = null;
      }

      const durationAwayMs = consumeAwayDuration(fullscreenExitAtRef);
      if (durationAwayMs >= FULLSCREEN_EXIT_GRACE_MS && !fullscreenViolationLoggedRef.current) {
        processViolation(
          current,
          'FULLSCREEN_EXIT',
          'Exited fullscreen mode',
          { durationAwayMs },
          false,
          { includeLockedInDetail: false },
        );
      }

      fullscreenWatchdogStartAtRef.current = null;
      fullscreenWatchdogWarningShownRef.current = false;
      fullscreenViolationLoggedRef.current = false;
    };

    // ── TAB VISIBILITY ──────────────────────────────────────
    const handleVisibilityChange = () => {
      const current = latestRef.current;
      if (!isExamInProgress(current) || current.isReloadingRef.current || current.isInitializingRef.current) return;
      if (isWithinStartupGuardGrace(current)) return;

      if (document.hidden) {
        if (tabHiddenAtRef.current === null) {
          tabHiddenAtRef.current = Date.now();
        }

        if (blurLockTimeoutRef.current !== null) {
          window.clearTimeout(blurLockTimeoutRef.current);
          blurLockTimeoutRef.current = null;
        }
        windowBlurAtRef.current = null;
        return;
      }

      const durationAwayMs = consumeAwayDuration(tabHiddenAtRef);
      if (durationAwayMs > 0) {
        processViolation(
          current,
          'TAB_LEAVE',
          'Left the exam tab',
          { durationAwayMs },
          false,
          { includeLockedInDetail: false },
        );
        windowBlurAtRef.current = null;
      }
    };

    // ── COPY / CUT ──────────────────────────────────────────
    // Track operation type and source problemId so paste can log COPY_PASTE/CUT_PASTE with from/to.
    const handleCopy = () => {
      const current = latestRef.current;
      if (!isExamInProgress(current)) return;
      lastCopyOperationWasCutRef.current = false;
      lastCopyFromProblemIdRef.current = findProblemId(document.activeElement);
    };

    const handleCut = () => {
      const current = latestRef.current;
      if (!isExamInProgress(current)) return;
      lastCopyOperationWasCutRef.current = true;
      lastCopyFromProblemIdRef.current = findProblemId(document.activeElement);
    };

    // ── RESET SYSTEM CLIPBOARD ────────────────────────────────
    /** Clears the system clipboard when the exam starts. This is called from
     *  page.tsx via a custom event before the exam begins. */
    const handleResetClipboard = async () => {
      if (typeof navigator !== 'undefined' && typeof ClipboardItem !== 'undefined') {
        try {
          const item = new ClipboardItem({ 'text/plain': new Blob([' '], { type: 'text/plain' }) });
          await navigator.clipboard.write([item]);
        } catch {
          // Clipboard API unavailable or permission denied — ignore silently.
        }
      }
    };

    // ── WINDOW BLUR / FOCUS ─────────────────────────────────
    const handleBlur = () => {
      const current = latestRef.current;

      if (document.activeElement?.tagName === 'IFRAME') return;
      if (isWithinStartupGuardGrace(current)) return;

      if (!document.hidden && isExamInProgress(current) && !current.isReloadingRef.current && !current.isInitializingRef.current) {
        if (windowBlurAtRef.current === null) {
          windowBlurAtRef.current = Date.now();
        }

        if (blurLockTimeoutRef.current !== null) {
          window.clearTimeout(blurLockTimeoutRef.current);
        }

        blurLockTimeoutRef.current = window.setTimeout(() => {
          const latest = latestRef.current;
          if (document.hidden || !isExamInProgress(latest) || latest.isReloadingRef.current || latest.isInitializingRef.current) {
            windowBlurAtRef.current = null;
          }
          blurLockTimeoutRef.current = null;
        }, 150);
      }
    };

    const handleFocus = () => {
      if (blurLockTimeoutRef.current !== null) {
        window.clearTimeout(blurLockTimeoutRef.current);
        blurLockTimeoutRef.current = null;
      }

      const current = latestRef.current;
      if (isWithinStartupGuardGrace(current)) {
        windowBlurAtRef.current = null;
        return;
      }

      if (tabHiddenAtRef.current !== null) {
        windowBlurAtRef.current = null;
        return;
      }

      if (windowBlurAtRef.current === null) return;

      if (document.hidden || !isExamInProgress(current) || current.isReloadingRef.current || current.isInitializingRef.current) {
        windowBlurAtRef.current = null;
        return;
      }

      const durationAwayMs = consumeAwayDuration(windowBlurAtRef);
      if (durationAwayMs < 150) return;

      processViolation(
        current,
        'WINDOW_BLUR',
        'Focus left the exam window (click outside or another application)',
        { durationAwayMs },
        false,
        { includeLockedInDetail: false },
      );
    };

    // ── RIGHT CLICK ─────────────────────────────────────────
    const handleContextMenu = (event: MouseEvent) => {
      const current = latestRef.current;
      if (!isExamInProgress(current)) return;

      event.preventDefault();
      current.onLog(
        'RIGHT_CLICK', 'warning', false,
        'Right-click — blocked',
        { targetTag: (event.target as HTMLElement).tagName, x: event.clientX, y: event.clientY },
      );
    };

    // ── KEYBOARD SHORTCUTS ──────────────────────────────────
    const handleKeyDown = (event: KeyboardEvent) => {
      const current = latestRef.current;
      if (!isExamInProgress(current)) return;

      // Let Ctrl+V pass through so the paste handler in EFFECT 6 can detect it.
      if ((event.ctrlKey || event.metaKey) && !event.shiftKey && event.key.toUpperCase() === 'V') {
        return;
      }

      if (event.key === 'PrintScreen') {
        event.preventDefault();
        processViolation(current, 'KEYBOARD_SHORTCUT', `Blocked keyboard shortcut: PrintScreen (${INTENT_LABELS.screenshot})`);
        return;
      }

      for (const rule of BLOCKED_SHORTCUTS) {
        const ctrlMatch = rule.ctrl ? (event.ctrlKey || event.metaKey) : !event.ctrlKey && !event.metaKey;
        const shiftMatch = rule.shift ? event.shiftKey : !event.shiftKey;
        const keyMatch = event.key.toUpperCase() === rule.key.toUpperCase();

        if (ctrlMatch && shiftMatch && keyMatch) {
          event.preventDefault();
          const keyCombo = [
            rule.ctrl ? 'Ctrl' : '',
            rule.shift ? 'Shift' : '',
            rule.key,
          ].filter(Boolean).join('+');

          processViolation(current, 'KEYBOARD_SHORTCUT', `Blocked keyboard shortcut: ${keyCombo} (${INTENT_LABELS[rule.intent] || rule.intent})`);
          return;
        }
      }
    };

    // ── DEVTOOLS ────────────────────────────────────────────
    const handleDevtoolsDetect = (isDevtoolOpen: boolean) => {
      const current = latestRef.current;
      if (!isExamInProgress(current) || current.isInitializingRef.current || current.isReloadingRef.current) {
        wasDevtoolsOpenRef.current = isDevtoolOpen;
        return;
      }

      if (isDevtoolOpen && !wasDevtoolsOpenRef.current) {
        processViolation(
          current,
          'DEVTOOLS_OPEN',
          'Developer tools (DevTools) opened',
          { durationAwayMs: 0 },
          true,
          { includeLockedInDetail: false },
        );
      }

      wasDevtoolsOpenRef.current = isDevtoolOpen;
    };

    void import('devtool-detector')
      .then(({ addDetectListener, getDetector, removeDetectListener }) => {
        if (isEffectDisposed) return;
        const detector = getDetector();
        detector.setEnable(enableDevtoolsInDevelopment || process.env.NODE_ENV !== 'development');
        detector.setting.nextScopeInterval = 350;
        if ('clearConsole' in detector.setting) {
          detector.setting.clearConsole = false;
        }
        addDetectListener(handleDevtoolsDetect);
        removeDevtoolsListener = () => removeDetectListener(handleDevtoolsDetect);
        disableDetector = () => detector.setEnable(false);
      })
      .catch((err) => {
        if (isEffectDisposed) return;
        const current = latestRef.current;
        current.onLog(
          'DEVTOOLS_DETECTOR_LOAD_FAILED',
          'warning',
          false,
          'DevTools detector failed to load; DevTools violations may not be detected',
          { error: String(err) },
        );
      });

    // ── REGISTER GLOBAL LISTENERS ─────────────────────────────
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('cut', handleCut);
    window.addEventListener('exam:reset-clipboard', handleResetClipboard as EventListener);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    // ── CLEANUP ─────────────────────────────────────────────
    return () => {
      isEffectDisposed = true;
      if (blurLockTimeoutRef.current !== null) {
        window.clearTimeout(blurLockTimeoutRef.current);
      }
      if (fullscreenViolationTimeoutRef.current !== null) {
        window.clearTimeout(fullscreenViolationTimeoutRef.current);
      }
      removeDevtoolsListener?.();
      disableDetector?.();
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('cut', handleCut);
      window.removeEventListener('exam:reset-clipboard', handleResetClipboard as EventListener);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [enableDevtoolsInDevelopment]);

  // ─────────────────────────────────────────────────────────────
  // EFFECT 3: Heartbeat (30 giây)
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const heartbeat = window.setInterval(() => {
      const current = latestRef.current;
      if (!current.examStatusStorageKey || !current.violationStorageKey) return;
      const status = localStorage.getItem(current.examStatusStorageKey);
      if (
        current.examStartTimeRef.current > 0
        && !current.isExamFinishedRef.current
        && isSessionActiveStatus(status)
      ) {
        const idleMs = Date.now() - current.examStartTimeRef.current;
        current.onLog(
          'EXAM_HEARTBEAT', 'info', false,
          'Heartbeat',
          { hasFocus: document.hasFocus(), idleMs },
        );
      }
    }, 30_000);

    return () => window.clearInterval(heartbeat);
  }, []);

  // ─────────────────────────────────────────────────────────────
  // EFFECT 4: Watchdog — phát hiện can thiệp localStorage
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const watchdog = window.setInterval(() => {
      const current = latestRef.current;
      if (!current.examStatusStorageKey || !current.violationStorageKey) return;
      const status = localStorage.getItem(current.examStatusStorageKey);
      if (
        current.examStartTimeRef.current > 0
        && !current.isExamFinishedRef.current
        && isSessionActiveStatus(status)
      ) {
        const missingKeys: string[] = [];

        if (!localStorage.getItem(current.examStatusStorageKey)) missingKeys.push('exam_status');
        if (!localStorage.getItem(current.violationStorageKey)) missingKeys.push('exam_violations');

        if (missingKeys.length > 0) {
          localStorage.setItem(current.examStatusStorageKey, 'active');

          current.violationCountRef.current += 1;
          const count = current.violationCountRef.current;
          localStorage.setItem(current.violationStorageKey, String(count));

          if (current.persistAnswers) {
            current.persistAnswers((key, value) => localStorage.setItem(key, value));
          } else if (current.answer) {
            const preferredKeys = current.answerStorageKeys?.length
              ? current.answerStorageKeys
              : [current.answerStorageKey];
            const firstKey = preferredKeys[0];
            if (firstKey) {
              localStorage.setItem(firstKey, current.answer);
            }
          }
          applyViolationOutcome(
            current,
            'TAMPERING_DETECTED',
            'Exam data tampering detected',
            count,
            { missingKeys },
          );
        }
      }
    }, 3000);

    return () => window.clearInterval(watchdog);
  }, []);

  // ─────────────────────────────────────────────────────────────
  // EFFECT 5: Fullscreen state enforcement
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const check = window.setInterval(() => {
      const current = latestRef.current;
      if (!current.examStatusStorageKey || !current.violationStorageKey) return;
      if (current.isInitializingRef.current || current.isReloadingRef.current) return;
      if (isWithinStartupGuardGrace(current)) return;

      const status = localStorage.getItem(current.examStatusStorageKey);
      if (!isSessionActiveStatus(status)) return;

      if (!isFullscreenActive()) {
        if (fullscreenWatchdogStartAtRef.current === null) {
          fullscreenWatchdogStartAtRef.current = Date.now();
        }

        if (!fullscreenWatchdogWarningShownRef.current && !fullscreenViolationLoggedRef.current) {
          fullscreenWatchdogWarningShownRef.current = true;
          current.setOverlay({
            title: 'Fullscreen required',
            msg: 'You are not in fullscreen mode. Please return to fullscreen to continue your exam.',
            sub: 'If you do not return to fullscreen, this will be recorded as a violation.',
            showBtn: true,
            alertType: 'violation',
          });
          current.onLog(
            'FULLSCREEN_NOT_ACTIVE', 'warning', false,
            'Exam is active but fullscreen is not enabled (e.g. after page reload)',
            {},
          );
        }

        const durationAwayMs = Math.max(0, Date.now() - fullscreenWatchdogStartAtRef.current);
        if (
          durationAwayMs >= FULLSCREEN_EXIT_GRACE_MS
          && !fullscreenViolationLoggedRef.current
          && current.examStatusStorageKey.trim()
          && current.violationStorageKey.trim()
        ) {
          current.violationCountRef.current += 1;
          const count = current.violationCountRef.current;
          localStorage.setItem(current.violationStorageKey, String(count));
          fullscreenViolationLoggedRef.current = true;
          applyViolationOutcome(
            current,
            'FULLSCREEN_EXIT',
            'Exited fullscreen mode',
            count,
            { durationAwayMs, detectedBy: 'fullscreen_enforcement' },
            false,
            { includeLockedInDetail: false },
          );
        }

        return;
      }

      fullscreenWatchdogStartAtRef.current = null;
      fullscreenWatchdogWarningShownRef.current = false;
      fullscreenViolationLoggedRef.current = false;
    }, FULLSCREEN_ENFORCEMENT_INTERVAL_MS);

    return () => window.clearInterval(check);
  }, []);

  // ─────────────────────────────────────────────────────────────
  // EFFECT 6: Copy/Cut/Paste interceptor — registers via onMonacoEditorMount callback
  //
  // Copy and cut inside Monaco don't bubble to document, so we intercept
  // them here on the editor container. Paste is also intercepted here
  // so all three operations share the same scope and refs.
  // Uses latestRef to avoid stale closures.
  // ─────────────────────────────────────────────────────────────
  // EFFECT 6: Copy/Cut/Paste interceptor — registers via onMonacoEditorMount callback
  //
  // Monaco intercepts Ctrl+C/X/V at the container level.
  // Solution: capture-phase listener with stopImmediatePropagation to prevent Monaco's
  // own listener from also executing. Guard flag prevents double-logging.
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    // Prevent the same paste from being logged twice
    let pasteHandledByUs = false;

    const onMount = (editor: import('monaco-editor').editor.IStandaloneCodeEditor) => {
      const container = editor.getDomNode();
      if (!container) return;

      const captureCopyOperation = (isCut: boolean, target: EventTarget | null) => {
        lastCopyOperationWasCutRef.current = isCut;
        lastCopyFromProblemIdRef.current = findProblemId(target);
      };

      const handleContainerKeyDown = (e: KeyboardEvent) => {
        const current = latestRef.current;
        if (!isExamInProgress(current)) return;
        if (e.ctrlKey || e.metaKey) {
          if (e.key === 'c' || e.key === 'C') {
            e.preventDefault();
            e.stopImmediatePropagation();
            captureCopyOperation(false, e.target);
            // Delegate actual copy to browser
            const sel = editor.getSelection();
            if (sel) {
              const selectedText = editor.getModel()?.getValueInRange(sel) ?? '';
              navigator.clipboard.writeText(selectedText).catch(() => {});
            }
          } else if (e.key === 'x' || e.key === 'X') {
            e.preventDefault();
            e.stopImmediatePropagation();
            captureCopyOperation(true, e.target);
            // Delegate actual cut to browser
            const sel = editor.getSelection();
            if (sel) {
              const selectedText = editor.getModel()?.getValueInRange(sel) ?? '';
              navigator.clipboard.writeText(selectedText).catch(() => {});
              editor.executeEdits('exam-guard-cut', [{ range: sel, text: '' }]);
            }
          } else if (e.key === 'v' || e.key === 'V') {
            // Guard: Monaco's own listener would re-trigger us via model changes
            if (pasteHandledByUs) return;
            pasteHandledByUs = true;
            setTimeout(() => { pasteHandledByUs = false; }, 100);

            e.preventDefault();
            e.stopImmediatePropagation();

            void (async () => {
              const currentInner = latestRef.current;
              if (!isExamInProgress(currentInner)) return;

              let pastedText = '';
              try {
                pastedText = await navigator.clipboard.readText();
              } catch { /* clipboard read failed, ignore */ }

              if (!pastedText) return;

              const isCutOp = lastCopyOperationWasCutRef.current;
              const fromProblemId = lastCopyFromProblemIdRef.current;
              lastCopyOperationWasCutRef.current = false;
              lastCopyFromProblemIdRef.current = null;

              const selection = editor.getSelection();
              if (selection) {
                editor.executeEdits('exam-guard-paste', [
                  { range: selection, text: pastedText, forceMoveMarkers: true },
                ]);
                const newPos = selection.getEndPosition();
                editor.setPosition(newPos);
              }

              const toProblemId = findProblemId(container);

              currentInner.onLog(
                isCutOp ? 'CUT_PASTE' : 'COPY_PASTE', 'warning', false,
                `Pasted ${pastedText.length} character(s)${toProblemId ? ` into Problem ${toProblemId}` : ''}`,
                { length: pastedText.length, content: pastedText, from: fromProblemId, to: toProblemId },
              );
            })();
          }
        }
      };

      // ── DRAG START & DROP ───────────────────────────────────
      const handleDragStart = (event: DragEvent) => {
        const current = latestRef.current;
        if (!isExamInProgress(current)) return;

        event.stopImmediatePropagation();

        const draggedText = event.dataTransfer?.getData('text') || getSelectedTextFromMonaco(editor);
        if (draggedText.length === 0) return;

        dragContextRef.current = {
          text: draggedText,
          fromProblemId: findProblemId(event.target as EventTarget | null),
          capturedAt: Date.now(),
        };
      };

      const handleDrop = (event: DragEvent) => {
        const current = latestRef.current;
        if (!isExamInProgress(current)) return;

        event.stopImmediatePropagation();

        const droppedText = event.dataTransfer?.getData('text') || dragContextRef.current?.text || '';
        if (droppedText.length === 0) return;

        event.preventDefault();

        const selection = editor.getSelection();
        if (selection) {
          editor.executeEdits('exam-guard-drop', [
            { range: selection, text: droppedText, forceMoveMarkers: true },
          ]);
          const newPos = selection.getEndPosition();
          editor.setPosition(newPos);
        }

        const toProblemId = findProblemId(container);
        current.onLog(
          'DRAG_DROP', 'warning', false,
          `Drag-and-dropped ${droppedText.length} character(s)${toProblemId ? ` into Problem ${toProblemId}` : ''}`,
          {
            length: droppedText.length,
            content: droppedText,
            from: dragContextRef.current?.fromProblemId ?? null,
            to: toProblemId,
          },
        );
        dragContextRef.current = null;
      };

      const handleDragOver = (event: DragEvent) => {
        event.preventDefault();
      };

      container.addEventListener('keydown', handleContainerKeyDown, true);
      container.addEventListener('dragstart', handleDragStart, true);
      container.addEventListener('dragover', handleDragOver, true);
      container.addEventListener('drop', handleDrop, false);

      return () => {
        container.removeEventListener('keydown', handleContainerKeyDown, true);
        container.removeEventListener('dragstart', handleDragStart, true);
        container.removeEventListener('dragover', handleDragOver, true);
        container.removeEventListener('drop', handleDrop, false);
      };
    };

    const cleanup = latestRef.current.onMonacoEditorMount?.(onMount);
    monacoCleanupRef.current = cleanup ?? null;
  }, []);

  useEffect(() => {
    return () => {
      monacoCleanupRef.current?.();
    };
  }, []);
}

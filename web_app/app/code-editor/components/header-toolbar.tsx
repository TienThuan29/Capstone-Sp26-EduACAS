"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sun, Moon, Plus, Minus, RefreshCw, Clock } from "lucide-react";
import {
  Cog6ToothIcon,
  ArrowLeftIcon,
  PaperAirplaneIcon,
} from "@heroicons/react/24/outline";
import { useEditorContext } from "@/contexts/EditorContext";
import { useAuth } from "@/contexts/AuthContext";
import { EXAM_SESSION_SYNC_EVENT } from "@/utils/student-exam-session";
import { useStudentExamSession } from "@/hooks/examination/useStudentExamSession";
import type { StudentExamSessionPhase } from "@/types/student-exam-session";
import { ConfirmModal } from "./confirm-modal";
import { EditorSettingsModal } from "./editor-settings-modal";
import { WarningModal } from "./warning-modal";
import { Button, Dropdown, DropdownItem } from "flowbite-react";

export function HeaderToolbar() {
  const router = useRouter();
  const { user } = useAuth();
  const {
    editorState,
    setFontSize,
    toggleTheme,
    resetCode,
    submitCode,
    submitAndGrade,
    isSubmitting,
    isExamMode,
    isExaminationMode,
    examId,
    examClassroomId,
    selectedCompiler,
    setSelectedCompiler,
    timerSeconds,
    submissionError,
    clearSubmissionError,
    incrementSubmissionsRefresh,
    setPracticeTestResults,
    isPracticeSubmitting,
    isTimerExpired,
  } = useEditorContext();

  const formatTime = (s: number) => {
    const hrs = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = s % 60;
    return `${hrs > 0 ? hrs + ":" : ""}${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const lang = editorState.language;
  const compilers = lang?.compilers ?? [];
  const activeCompiler = selectedCompiler ?? compilers[0] ?? null;
  const dropdownLabel =
    compilers.length > 0 && activeCompiler
      ? `${lang?.name ?? "Language"} - ${activeCompiler.name?.trim() || activeCompiler.id}`
      : (lang?.name ?? "Language");

  const [showResetModal, setShowResetModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const { getByExam } = useStudentExamSession();
  const [serverPhase, setServerPhase] = useState<StudentExamSessionPhase | null | undefined>(undefined);
  const studentId = user?.id ?? "";

  useEffect(() => {
    if (!examId || !studentId) {
      setServerPhase(undefined);
      return;
    }
    const load = async () => {
      try {
        const s = await getByExam(examId);
        setServerPhase(s?.phase ?? null);
      } catch {
        setServerPhase(null);
      }
    };
    const onSync = () => {
      void load();
    };
    void load();
    window.addEventListener(EXAM_SESSION_SYNC_EVENT, onSync);
    return () => window.removeEventListener(EXAM_SESSION_SYNC_EVENT, onSync);
  }, [examId, studentId, getByExam]);

  // Only check session phase when in strict exam mode.
  // In PRACTICAL mode, examId may be present but there's no session to manage.
  const isExamEnded = isExaminationMode && (serverPhase === "LOCKED" || serverPhase === "COMPLETED");
  const isExamSessionLoading = isExaminationMode && Boolean(examId && serverPhase === undefined);

  return (
    <>
      <div className="flex items-center justify-between border-b border-gray-700 bg-gray-900 px-4 py-2">
        {/* Left Section - Back + Language Selector */}
        <div className="flex items-center gap-4">
          {/* Submit code for problem button */}
          <Button
            size="sm"
            color="green"
            onClick={() => setShowSubmitModal(true)}
            disabled={isSubmitting || isPracticeSubmitting || isExamEnded || isExamSessionLoading}
            className="flex cursor-pointer items-center gap-1.5"
          >
            <PaperAirplaneIcon className="h-4 w-4" />
            <span>{isSubmitting || isPracticeSubmitting ? "Submitting…" : "Submit"}</span>
          </Button>

          {/* Language - Compiler (from examination) */}
          <Dropdown
            size="sm"
            className="cursor-pointer border border-gray-400"
            label={dropdownLabel}
            dismissOnClick={true}
          >
            {compilers.length > 0 ? (
              compilers.map((compiler) => (
                <DropdownItem
                  key={compiler.id}
                  onClick={() => setSelectedCompiler(compiler)}
                  className={
                    activeCompiler?.id === compiler.id
                      ? "cursor-default bg-[#1F4E79] text-white"
                      : "cursor-pointer"
                  }
                >
                  {/* {lang?.name ?? "Language"} - {compiler.name}   */}
                  {lang?.name ?? "Language"} - {(compiler.name?.trim() || compiler.id)}
                </DropdownItem>
              ))
            ) : (
              <DropdownItem className="cursor-default bg-[#1F4E79] text-white">
                {lang?.name ?? "Language"}
              </DropdownItem>
            )}
          </Dropdown>

          {/* Font Size Controls - not change this button style */}
          <div className="flex items-center gap-1 rounded-md border border-gray-600 bg-gray-800">
            <button
              onClick={() => setFontSize(Math.max(1, editorState.fontSize - 2))}
              className="cursor-pointer p-1.5 text-gray-400 transition-colors hover:text-white"
              title="Decrease font size"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="min-w-12 text-center text-sm text-gray-300">
              {editorState.fontSize}px
            </span>
            <button
              onClick={() =>
                setFontSize(Math.min(32, editorState.fontSize + 2))
              }
              className="cursor-pointer p-1.5 text-gray-400 transition-colors hover:text-white"
              title="Increase font size"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          {/* Reset Code Button */}
          <Button
            size="sm"
            onClick={() => setShowResetModal(true)}
            className="flex cursor-pointer items-center gap-1.5 rounded-md border border-gray-600 bg-gray-800 px-3 py-1.5 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
            title="Reset to boilerplate code"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Reset</span>
          </Button>
        </div>

        {/* Center Section - Timer */}
        {(isExamMode || examId) && (
          <div className={`flex items-center gap-3 rounded-full px-6 py-2.5 font-mono font-bold border shadow-sm whitespace-nowrap ${
            isTimerExpired
              ? 'bg-red-500/20 text-red-400 border-red-500/30 animate-pulse'
              : isExamMode
              ? 'bg-red-500/10 text-red-500 border-red-500/20'
              : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
          }`}>
            <Clock className="h-6 w-6" />
            <span className="text-lg">{formatTime(timerSeconds)}</span>
          </div>
        )}

        {/* Right Section - Settings & Theme */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowSettingsModal(true)}
            className="cursor-pointer rounded-md border border-gray-600 bg-gray-800 p-2 text-gray-400 transition-colors hover:bg-gray-700 hover:text-white"
            title="Editor settings"
          >
            <Cog6ToothIcon className="h-5 w-5" />
          </button>
          <Button
            size="sm"
            onClick={toggleTheme}
            className="flex cursor-pointer items-center gap-1.5 rounded-md border border-gray-600 bg-gray-800 px-3 py-1.5 text-sm text-gray-300 transition-colors hover:bg-gray-700 hover:text-white"
            title={
              editorState.theme === "vs-dark"
                ? "Switch to light mode"
                : "Switch to dark mode"
            }
          >
            {editorState.theme === "vs-dark" ? (
              <>
                <Sun className="h-4 w-4" />
                <span>Light</span>
              </>
            ) : (
              <>
                <Moon className="h-4 w-4" />
                <span>Dark</span>
              </>
            )}
          </Button>

          {examId && examClassroomId && (
            <Button
              size="sm"
              color="red"
              onClick={() => setShowLeaveModal(true)}
              className="cursor-pointer"
              title="Back to exam problems"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              <span>Leave</span>
            </Button>
          )}
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      <ConfirmModal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        onConfirm={() => {
          resetCode();
          setShowResetModal(false);
        }}
        title="Reset Code"
        message="Are you sure you want to reset your code to the initial boilerplate? This action cannot be undone."
        confirmText="Reset Code"
      />

      {/* Leave / Back to exam – confirm before navigating away */}
      <ConfirmModal
        isOpen={showLeaveModal}
        onClose={() => setShowLeaveModal(false)}
        onConfirm={() => {
          setShowLeaveModal(false);
          if (examId && examClassroomId) {
            // Signal the guard to stop violation detection before navigating away.
            // This sets isExamFinishedRef = true so blur/focus events are ignored.
            window.dispatchEvent(new CustomEvent("exam:leave-problem"));
            router.push(`/my-classroom/${examClassroomId}/exam/${examId}`);
          }
        }}
        title="Leave editor?"
        message="Your code may not be saved. Are you sure you want to go back to the exam problems?"
        confirmText="Leave"
        cancelText="Stay"
      />

      {/* Editor Settings Modal */}
      <EditorSettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />

      {/* Submit code confirmation modal */}
      <ConfirmModal
        isOpen={showSubmitModal}
        onClose={() => !(isSubmitting || isPracticeSubmitting) && setShowSubmitModal(false)}
        onConfirm={async () => {
          if (isExaminationMode) {
            await submitCode();
          } else {
            clearSubmissionError();
            const result = await submitAndGrade();
            if (result) {
              setPracticeTestResults(null); // Clear so SubmissionsTab shows fresh data
              incrementSubmissionsRefresh();
            }
          }
          setShowSubmitModal(false);
        }}
        title={isExaminationMode ? "Submit code" : "Submit & Grade"}
        message={
          isExaminationMode
            ? "Are you sure you want to submit your code for this problem? You may not be able to resubmit depending on exam settings."
            : "Submit your code to run all test cases and get your score. This will not count against any exam attempt limits."
        }
        confirmText={isSubmitting || isPracticeSubmitting ? "Submitting…" : "Submit"}
        cancelText="Cancel"
        confirmVariant="green"
      />

      {/* Submission error modal (e.g. MaxAttempts exceeded) */}
      <WarningModal
        isOpen={!!submissionError}
        onClose={clearSubmissionError}
        title="Submission Failed"
        message={submissionError ?? ""}
        variant="error"
      />
    </>
  );
}

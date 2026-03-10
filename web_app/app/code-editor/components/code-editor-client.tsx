'use client';

import React, { useEffect, useRef } from 'react';
import { CodingWorkspace } from './coding-workspace';
import { useEditorContext } from '@/contexts/EditorContext';
import { ExaminationSpecificProblemResponse, Mode } from '@/types/examination';

interface CodeEditorClientProps {
  examination: ExaminationSpecificProblemResponse;
}

const DRAFT_SAVE_DEBOUNCE_MS = 1500;
const DRAFT_STORAGE_PREFIX = 'code-editor-draft-';

function getDraftStorageKey(problemId: string, examId: string | null): string {
  return `${DRAFT_STORAGE_PREFIX}${problemId}-${examId ?? 'practice'}`;
}

/**
 * Get the duration of the examination in minutes
 * @param startDatetime - The start datetime of the examination
 * @param endDatetime - The end datetime of the examination
 * @returns The duration of the examination in minutes
 */
function getExamDuration(startDatetime: string, endDatetime: string): number {
  const start = new Date(startDatetime);
  const end = new Date(endDatetime);
  return Math.floor((end.getTime() - start.getTime()) / (1000 * 60));
}

export function CodeEditorClient({
  examination,
}: CodeEditorClientProps) {
  const {
    editorState,
    setProblem,
    setExamMode,
    setTestCases,
    setLanguage,
    setCode,
    startTimer,
    setExamBackLink,
  } = useEditorContext();

  const problemId = examination.problem.id;
  const examId = examination.id;

  // Initialize from examination, then restore draft if one exists
  useEffect(() => {
    if (!examination) return;
    // console.log('Examination:', examination);
    setProblem(examination.problem);
    setExamBackLink(examination.id, examination.classroom?.id ?? null);
    setTestCases(examination.problem.testCases);
    setLanguage(examination.programmingLanguage);
    if (examination.problem.codeTemplate?.trim()) {
      setCode(examination.problem.codeTemplate);
    }

    const key = getDraftStorageKey(problemId, examId);
    try {
      const draft = typeof window !== 'undefined' ? localStorage.getItem(key) : null;
      if (draft !== null && draft.trim() !== '') {
        setCode(draft);
      }
    } catch {
      // ignore localStorage errors
    }

    if (examination.mode === Mode.EXAMINATION) {
      setExamMode(true, getExamDuration(examination.startDatetime, examination.endDatetime));
      startTimer();
    }
  }, [examination, setProblem, setExamMode, setTestCases, setLanguage, setCode, startTimer, setExamBackLink, problemId, examId]);

  // Debounced auto-save of code to localStorage so it survives refresh/navigation
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!problemId) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }

    saveTimeoutRef.current = setTimeout(() => {
      const key = getDraftStorageKey(problemId, examId);
      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem(key, editorState.code);
        }
      } catch {
        // ignore
      }
      saveTimeoutRef.current = null;
    }, DRAFT_SAVE_DEBOUNCE_MS);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [editorState.code, problemId, examId]);

  // Save immediately on leave/refresh so latest code is not lost
  useEffect(() => {
    if (!problemId || typeof window === 'undefined') return;
    const key = getDraftStorageKey(problemId, examId);
    const onBeforeUnload = () => {
      try {
        localStorage.setItem(key, editorState.code);
      } catch {
        // ignore
      }
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [problemId, examId, editorState.code]);

  return <CodingWorkspace />;
}

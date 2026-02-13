'use client';

import React, { useEffect } from 'react';
import { CodingWorkspace } from './coding-workspace';
import { useEditorContext } from '@/contexts/EditorContext';
import { ExaminationSpecificProblemResponse, Mode } from '@/types/examination';

interface CodeEditorClientProps {
  examination: ExaminationSpecificProblemResponse;
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
  const { setProblem, setExamMode, setTestCases, setLanguage, setCode, startTimer, setExamBackLink } = useEditorContext();

  useEffect(() => {
    if (!examination) return;

    console.log('Examination:', examination);

    setProblem(examination.problem);
    setExamBackLink(examination.id, examination.classroom?.id ?? null);
    setTestCases(examination.problem.testCases);

    // Use the examination's allowed programming language for the editor
    setLanguage(examination.programmingLanguage);
    if (examination.problem.codeTemplate?.trim()) {
      setCode(examination.problem.codeTemplate);
    }

    if (examination.mode === Mode.EXAMINATION) {
      setExamMode(true, getExamDuration(examination.startDatetime, examination.endDatetime));
      startTimer();
    }
  }, [examination, setProblem, setExamMode, setTestCases, setLanguage, setCode, startTimer, setExamBackLink]);

  return <CodingWorkspace />;
}

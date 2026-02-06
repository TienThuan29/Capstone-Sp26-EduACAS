'use client';

import React, { useEffect } from 'react';
import { CodingWorkspace } from './coding-workspace';
import { useEditorContext } from '../../../hooks/editor/EditorContext';
import { Problem } from '../types';
import { MOCK_PROBLEM, MOCK_TEST_CASES } from '../[problemId]/mockdata';

interface CodeEditorClientProps {
  problemId: string;
  isExamMode?: boolean;
  examDuration?: number;
}

export function CodeEditorClient({
  problemId,
  isExamMode = false,
  examDuration = 3600,
}: CodeEditorClientProps) {
  const { setProblem, setExamMode, setTestCases, startTimer } = useEditorContext();

  useEffect(() => {
    // console.log('Loading problem:', problemId);
    setProblem(MOCK_PROBLEM);
    setTestCases(MOCK_TEST_CASES);
    
    if (isExamMode) {
      setExamMode(true, examDuration);
      startTimer();
    }
  }, [problemId, isExamMode, examDuration, setProblem, setExamMode, setTestCases, startTimer]);

  return <CodingWorkspace />;
}

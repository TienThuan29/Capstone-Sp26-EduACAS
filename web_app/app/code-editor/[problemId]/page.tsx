'use client';

import { useState, useEffect, useMemo } from 'react';
import { CodeEditorClient } from '../components/code-editor-client';
import { useExamination } from '@/hooks/examination/useExamination';
import { useEditorContext } from '@/contexts/EditorContext';
import { ExaminationSpecificProblemResponse } from '@/types/examination';
import { FullPageLoader } from '@/components/loading-effect';
import { useAuth } from '@/contexts/AuthContext';
import { ExamSessionGuard } from '@/components/test-tracker/exam-session-guard';

interface PageProps {
  params: Promise<{problemId: string;}>;
  searchParams: Promise<{examId?: string;}>;
}

export default function CodeEditorPage({ params, searchParams }: PageProps) {
  const [problemId, setProblemId] = useState<string>('');
  const [examId, setExamId] = useState<string | undefined>(undefined);
  const [examWithSpecProblem, setExamWithSpecProblem] = useState<ExaminationSpecificProblemResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const { getExaminationWithSpecificProblem } = useExamination();
  const { syncServerTime } = useEditorContext();
  const { user } = useAuth();

  // Render ExamSessionGuard early so violation detection runs even during loading.
  // Guard renders when we have examId OR when still loading (params not yet resolved).
  const showLoadingGuard = useMemo(() => {
    return (!!examId || isLoading) && !!user?.id;
  }, [examId, user?.id, isLoading]);

  // Unwrap params and searchParams
  useEffect(() => {
    const unwrapParams = async () => {
      const resolvedParams = await params;
      const resolvedSearchParams = await searchParams;
      setProblemId(resolvedParams.problemId);
      setExamId(resolvedSearchParams.examId);
    };
    
    unwrapParams();
  }, [params, searchParams]);

  // Fetch examination data when examId and problemId are available
  useEffect(() => {
    const fetchExamData = async () => {
      if (examId && problemId) {
        try {
          setIsLoading(true);
          const result = await getExaminationWithSpecificProblem(examId, problemId);
          if (result && result.data) {
            setExamWithSpecProblem(result.data);
            if (result.serverDate) {
              console.log('[CodeEditorPage] Calling syncServerTime', { serverDate: result.serverDate });
              syncServerTime(result.serverDate);
            }
          } else {
            setExamWithSpecProblem(null);
          }
        } catch (error) {
          console.error('Error fetching examination data:', error);
          setExamWithSpecProblem(null);
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };

    if (problemId) {
      fetchExamData();
    }
  }, [examId, problemId, getExaminationWithSpecificProblem]);

  if (!problemId) {
    return (
      <>
        <FullPageLoader isLoading={isLoading} />
        {showLoadingGuard && <ExamSessionGuard examId={examId!} showOverlay={true} serverPhase={null} />}
      </>
    );
  }

  if (isLoading) {
    return (
      <>
        <FullPageLoader isLoading message="Loading problem..." />
        {showLoadingGuard && <ExamSessionGuard examId={examId!} showOverlay={true} serverPhase={null} />}
      </>
    );
  }

  if (!examWithSpecProblem) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950 p-8">
        <p className="text-center text-gray-400">
          Failed to load problem. The examination or problem may not exist.
        </p>
      </div>
    );
  }

  return <CodeEditorClient examination={examWithSpecProblem} />;
}

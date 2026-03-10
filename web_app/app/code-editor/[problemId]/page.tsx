'use client';

import { useState, useEffect } from 'react';
import { CodeEditorClient } from '../components/code-editor-client';
import { useExamination } from '@/hooks/exam/useExamination';
import { ExaminationSpecificProblemResponse } from '@/types/examination';
import { FullPageLoader } from '@/components/loading-effect';

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
          const data = await getExaminationWithSpecificProblem(examId, problemId);
          setExamWithSpecProblem(data);
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
    return <FullPageLoader isLoading={isLoading} />;
  }

  if (isLoading) {
    return <FullPageLoader isLoading message="Loading problem..." />;
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

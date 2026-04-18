'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { SubmissionResponse } from '@/types/submission';
import type { Problem, TestCase } from '@/types/examination';
import { useSubmission } from '@/hooks/submission/useSubmission';
import { useProblem } from '@/hooks/problem/useProblem';
import { useExamination } from '@/hooks/examination/useExamination';
import { useProgrammingLanguage } from '@/hooks/programming-language/useProgrammingLanguage';
import { useEditorContext } from '@/contexts/EditorContext';
import { FullPageLoader } from '@/components/loading-effect';
import { LecturerSubmissionWorkspace } from '../components/lecturer-submission-workspace';

export default function LecturerSubmissionPage() {
  const params = useParams();
  const router = useRouter();
  const submissionId = typeof params.submissionId === 'string' ? params.submissionId : '';

  const { getSubmissionById } = useSubmission();
  const { getProblemsByIds } = useProblem();
  const { getExaminationById } = useExamination();
  const { getEnabledProgrammingLanguages } = useProgrammingLanguage();
  const { setProblem, setTestCases, setLanguage, setCode } = useEditorContext();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadedSubmission, setLoadedSubmission] = useState<SubmissionResponse | null>(null);

  // Guard: only fetch once on mount, regardless of how submissionId resolves
  const hasFetched = useRef(false);

  useEffect(() => {
    if (!submissionId || hasFetched.current) return;
    hasFetched.current = true;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const submission = await getSubmissionById(submissionId);
        if (!submission) {
          setError('Submission not found.');
          setLoading(false);
          return;
        }

        const [exam, languages] = await Promise.all([
          getExaminationById(submission.examId),
          getEnabledProgrammingLanguages(),
        ]);

        // Resolve maxMark from the exam's problem list so the lecturer cannot override above it
        const examProblem = exam?.examProblems?.find((ep: any) => ep.problemId === submission.problemId);
        const maxMark = examProblem?.mark ?? 0;

        const [problems] = await Promise.all([
          getProblemsByIds([submission.problemId]),
        ]);

        const problem = problems.find((p: any) => p.id === submission.problemId) ?? null;
        const language = languages.find((l: any) => l.id === submission.languageId) ?? languages[0] ?? null;

        setLoadedSubmission({ ...submission, maxMark });

        if (problem) {
          setProblem(problem as unknown as Problem);
          setTestCases((problem.testCases ?? []) as unknown as TestCase[]);
        }

        if (language) {
          setLanguage(language as any);
        }

        setCode(submission.source ?? '');
      } catch (err) {
        console.error('Failed to load submission:', err);
        setError('Failed to load submission data.');
      } finally {
        setLoading(false);
      }
    };

    void load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submissionId]);

  if (!submissionId || loading) {
    return <FullPageLoader isLoading={true} message="Loading submission..." />;
  }

  if (error || !loadedSubmission) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950 p-8">
        <div className="text-center">
          <p className="mb-4 text-red-400">{error ?? 'Submission not found.'}</p>
          <button
            onClick={() => router.back()}
            className="rounded-lg bg-gray-800 px-4 py-2 text-gray-300 hover:bg-gray-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return <LecturerSubmissionWorkspace submission={loadedSubmission} submissionId={submissionId} />;
}

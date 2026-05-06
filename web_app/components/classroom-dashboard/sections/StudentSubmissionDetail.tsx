"use client";

import { useEffect, useState } from "react";
import { Spinner } from "flowbite-react";
import { ProblemScoreProgressChart } from "../charts/ProblemScoreProgressChart";
import { useExamination } from "@/hooks/examination/useExamination";
import { useProblem } from "@/hooks/problem/useProblem";
import { useSubmissionLecturer } from "@/hooks/submission/useSubmissionLecturer";
import type { SubmissionResponse } from "@/types/submission";

interface StudentSubmissionDetailProps {
  examId: string;
  studentId: string;
  studentName: string;
  onClose: () => void;
}

interface ExamProblemWithTitle {
  problemId: string;
  mark: number;
  title: string;
}

export function StudentSubmissionDetail({
  examId,
  studentId,
  studentName,
  onClose,
}: StudentSubmissionDetailProps) {
  const { getExaminationById } = useExamination();
  const { getProblemsByIds } = useProblem();
  const { getVersionsByStudentExamProblem } = useSubmissionLecturer();

  const [examProblems, setExamProblems] = useState<ExamProblemWithTitle[]>([]);
  const [problemsLoading, setProblemsLoading] = useState(false);
  const [selectedProblemId, setSelectedProblemId] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<SubmissionResponse[]>([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setProblemsLoading(true);

    void (async () => {
      try {
        const examination = await getExaminationById(examId);
        if (!examination || cancelled) return;

        const problemIds = examination.examProblems.map((ep) => ep.problemId);
        const markByProblemId = new Map(
          examination.examProblems.map((ep) => [ep.problemId, ep.mark] as const)
        );

        const problemDetails = await getProblemsByIds(problemIds);
        if (cancelled) return;

        const combined: ExamProblemWithTitle[] = problemDetails
          .map((p) => ({
            problemId: p.id,
            mark: markByProblemId.get(p.id) ?? 0,
            title: p.title,
          }))
          .filter((p) => markByProblemId.has(p.problemId));

        setExamProblems(combined);
        if (combined.length > 0 && !selectedProblemId) {
          setSelectedProblemId(combined[0].problemId);
        }
      } catch (err) {
        if (!cancelled) console.error("Failed to load exam problems:", err);
      } finally {
        if (!cancelled) setProblemsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [examId, getExaminationById, getProblemsByIds]);

  useEffect(() => {
    if (!selectedProblemId || !examId || !studentId) return;

    let cancelled = false;
    setSubmissionsLoading(true);

    void (async () => {
      try {
        const data = await getVersionsByStudentExamProblem(
          examId,
          selectedProblemId,
          studentId
        );
        if (!cancelled) setSubmissions(data);
      } catch (err) {
        if (!cancelled) console.error("Failed to load submission versions:", err);
      } finally {
        if (!cancelled) setSubmissionsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedProblemId, examId, studentId, getVersionsByStudentExamProblem]);

  const selectedProblem = examProblems.find((p) => p.problemId === selectedProblemId);

  return (
    <div className="rounded-md border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Submission Progress — {studentName}
          </h4>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            All submission versions across problems in this exam.
          </p>
        </div>
        <button
          onClick={onClose}
          className="shrink-0 rounded px-2 py-1 text-xs text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
        >
          Close
        </button>
      </div>

      {problemsLoading ? (
        <div className="flex h-40 items-center justify-center">
          <Spinner size="xl" color="info" />
        </div>
      ) : examProblems.length === 0 ? (
        <div className="flex h-40 items-center justify-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No problems found in this exam.
          </p>
        </div>
      ) : (
        <>
          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Select Problem
            </label>
            <select
              value={selectedProblemId ?? ""}
              onChange={(e) => setSelectedProblemId(e.target.value)}
              className="w-full max-w-md rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:w-auto"
            >
              <option value="" disabled>
                Choose a problem...
              </option>
              {examProblems.map((p) => (
                <option key={p.problemId} value={p.problemId}>
                  {p.title} (Max: {p.mark})
                </option>
              ))}
            </select>
          </div>

          {selectedProblemId && (
            submissionsLoading ? (
              <div className="flex h-64 items-center justify-center">
                <Spinner size="xl" color="info" />
              </div>
            ) : submissions.length === 0 ? (
              <div className="flex h-64 items-center justify-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No submissions found for this student in this problem.
                </p>
              </div>
            ) : (
              <ProblemScoreProgressChart
                submissions={submissions}
                maxMark={selectedProblem?.mark ?? 0}
                problemTitle={selectedProblem?.title ?? ""}
                loading={false}
              />
            )
          )}
        </>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Spinner,
  Badge,
  HR,
  Button,
} from "flowbite-react";
import { ArrowLeftIcon, ClockIcon, CheckIcon } from "@heroicons/react/24/outline";
import Sidebar from "@/components/sidebar";
import { useExamination } from "@/hooks/exam/useExamination";
import { useProblem } from "@/hooks/problem/useProblem";
import type { Examination, Problem } from "@/types/examination";
import { DefaultOutlineCustomButton } from "@/components/ui/custom-button";
import { CustomPagination } from "@/components/custom-pagination";
import { normalizeDifficulty } from "@/types/problem";
import { formatDate, formatDurationMs } from "@/utils/datetime-utils";
import { toExamProblem } from "@/utils/exam-problem";

const PROBLEMS_PER_PAGE = 5;

const MODE_LABELS: Record<number, string> = {
  0: "PRACTICAL",
  1: "EXAMINATION",
};

function ExamDetailContent() {
  const params = useParams();
  const router = useRouter();
  const { getExaminationById } = useExamination();
  const { getProblemsByIds } = useProblem();

  const classId = params.id as string;
  const examId = params.examId as string;

  const [examination, setExamination] = useState<Examination | null>(null);
  const [problems, setProblems] = useState<(Problem & { mark: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [problemsLoading, setProblemsLoading] = useState(false);
  const [problemsPage, setProblemsPage] = useState(1);

  const problemsTotalPages = Math.max(1, Math.ceil(problems.length / PROBLEMS_PER_PAGE));
  const currentProblemsPage = Math.min(Math.max(1, problemsPage), problemsTotalPages);
  const paginatedProblems = problems.slice(
    (currentProblemsPage - 1) * PROBLEMS_PER_PAGE,
    currentProblemsPage * PROBLEMS_PER_PAGE,
  );

  useEffect(() => {
    const fetchExamination = async () => {
      try {
        setLoading(true);
        const data = await getExaminationById(examId);
        if (data) {
          setExamination(data);
        }
      } catch (error) {
        console.error("Failed to fetch examination:", error);
      } finally {
        setLoading(false);
      }
    };

    if (examId) {
      fetchExamination();
    }
  }, [examId, getExaminationById]);

  useEffect(() => {
    const fetchProblems = async () => {
      if (!examination?.examProblems || examination.examProblems.length === 0) {
        setProblems([]);
        return;
      }

      setProblemsLoading(true);
      try {
        const problemIds = examination.examProblems.map((ep) => ep.problemId);
        const problemDetails = await getProblemsByIds(problemIds);
        const orderMap = new Map(
          examination.examProblems.map((ep, i) => [ep.problemId, i]),
        );
        const markByProblemId = new Map(
          examination.examProblems.map((ep) => [ep.problemId, ep.mark]),
        );
        const sorted = [...problemDetails].sort(
          (a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0),
        );
        const ordered = sorted
          .map((resp) => {
            const problem = toExamProblem(
              resp,
              examination.id,
              examination.programmingLanguage?.id,
            );
            const mark = markByProblemId.get(resp.id) ?? 0;
            return { ...problem, mark };
          })
          .filter((p): p is Problem & { mark: number } => p != null);
        setProblems(ordered);
        setProblemsPage(1);
      } catch (error) {
        console.error("Failed to fetch problems:", error);
      } finally {
        setProblemsLoading(false);
      }
    };

    fetchProblems();
  }, [examination?.id, examination?.examProblems, examination?.programmingLanguage?.id, getProblemsByIds]);

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="ml-20 flex flex-grow items-center justify-center bg-gray-50 lg:ml-64 dark:bg-gray-900">
          <Spinner size="xl" color="info" />
        </div>
      </div>
    );
  }

  if (!examination) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="container mx-auto ml-20 flex flex-grow flex-col items-center justify-center bg-gray-50 px-4 pt-24 pb-8 lg:ml-64 dark:bg-gray-900">
          <h2 className="mb-4 text-2xl font-bold text-gray-700 dark:text-gray-300">
            Examination not found
          </h2>
          <DefaultOutlineCustomButton
            label="Go Back"
            onClick={() => router.back()}
          />
        </div>
      </div>
    );
  }

  const startDate = new Date(examination.startDatetime);
  const endDate = new Date(examination.endDatetime);
  const durationMs = endDate.getTime() - startDate.getTime();
  const durationStr = formatDurationMs(durationMs);
  const modeLabel = MODE_LABELS[examination.mode as 0 | 1] ?? "PRACTICAL";

  const isUpcoming = startDate > new Date();
  const isExpired = endDate < new Date();
  const isActive = !isUpcoming && !isExpired;

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />

      <div className="ml-20 flex-grow p-4 lg:ml-64 lg:p-8">
        {/* Back button */}
        <div className="mb-6">
          <DefaultOutlineCustomButton
            label="Back to Exams"
            icon={<ArrowLeftIcon className="h-4 w-4" />}
            onClick={() => router.push(`/my-classroom/${classId}?tab=exams`)}
            className="group inline-flex w-fit cursor-pointer items-center gap-3 border border-gray-200 px-6 py-2.5 text-sm font-bold text-[#1F4E79] hover:border-[#1F4E79] hover:bg-[#1F4E79] hover:text-white dark:border-gray-700 dark:bg-gray-800 dark:text-[#C9A24D] dark:hover:border-[#C9A24D] dark:hover:bg-[#C9A24D] dark:hover:text-gray-900"
          />
        </div>
        {/* Exam Header */}
        <div className=" bg-white p-6 dark:bg-gray-800">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="mb-2 text-3xl font-black text-gray-900 dark:text-white">
                {examination.examName}
              </h1>
              <div className="flex flex-wrap items-center gap-2">
                {isActive && (
                  <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700 uppercase">
                    Ongoing
                  </span>
                )}
                {isUpcoming && (
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700 uppercase">
                    Upcoming
                  </span>
                )}
                {isExpired && (
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-700 uppercase">
                    Ended
                  </span>
                )}
                <Badge color="info">{modeLabel}</Badge>
                {examination.programmingLanguage && (
                  <Badge color="purple">
                    {examination.programmingLanguage?.name}
                  </Badge>
                )}
                {examination.isPublicResult && (
                  <Badge color="success">Public Result</Badge>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-[#1F4E79] dark:text-[#C9A24D]">
                {examination.totalMark} marks
              </div>
              <div className="text-sm text-gray-500">Total marks</div>
            </div>
          </div>

          {examination.description && (
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              {examination.description}
            </p>
          )}

          {/* Time info */}
          <div className="mt-3 grid grid-cols-1 gap-2 border-t border-gray-100 pt-6 md:grid-cols-3 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <ClockIcon className="h-5 w-5 text-gray-400" />
              <div>
                <div className="text-xs font-medium text-gray-500 uppercase">
                  Start
                </div>
                <div className="font-semibold text-gray-900 dark:text-white">
                  {formatDate(startDate)}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ClockIcon className="h-5 w-5 text-gray-400" />
              <div>
                <div className="text-xs font-medium text-gray-500 uppercase">
                  End
                </div>
                <div className="font-semibold text-gray-900 dark:text-white">
                  {formatDate(endDate)}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ClockIcon className="h-5 w-5 text-gray-400" />
              <div>
                <div className="text-xs font-medium text-gray-500 uppercase">
                  Duration
                </div>
                <div className="font-semibold text-gray-900 dark:text-white">
                  {durationStr}
                </div>
              </div>
            </div>
          </div>
        </div>
        <HR className="" />
        {/* Problems Section */}
        <div>
          <h2 className="mb-4 border-l-8 border-[#1F4E79] pl-4 text-2xl font-black text-gray-900 dark:border-[#C9A24D] dark:text-white">
            Problems ({problems.length})
          </h2>
          {problems.length > 0 && problemsTotalPages > 1 && (
            <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
              Showing {(currentProblemsPage - 1) * PROBLEMS_PER_PAGE + 1}–
              {Math.min(currentProblemsPage * PROBLEMS_PER_PAGE, problems.length)} of {problems.length}
            </p>
          )}

          {problemsLoading ? (
            <div className="flex justify-center py-12">
              <Spinner size="lg" />
              <span className="ml-3 text-gray-500">Loading problems...</span>
            </div>
          ) : problems.length === 0 ? (
            <div className="rounded-xs border-2 border-dashed border-gray-200 bg-white py-12 text-center dark:border-gray-700 dark:bg-gray-800">
              <p className="font-medium text-gray-500">
                No problems in this examination.
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {paginatedProblems.map((problem) => {
                  const normalized =
                    typeof problem.difficulty === "number"
                      ? normalizeDifficulty(problem.difficulty)
                      : (problem.difficulty as "EASY" | "MEDIUM" | "HARD");
                  const mark = problem.mark;

                  return (
                    <div
                      key={problem.id}
                      className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-700 dark:bg-gray-800"
                    >
                      {/* Left side - Problem info */}
                      <div>
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                          {problem.title}
                        </h3>
                        <p className="mt-1 text-sm text-green-600 dark:text-green-400">
                          {normalized}, {examination.programmingLanguage?.name ?? "Unknown"}, Max Score: {mark}
                        </p>
                      </div>

                      {/* Right side - Solve button */}
                      <div className="flex items-center gap-4">
                        <Button
                          className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                          onClick={() => {
                            router.push(`/code-editor/${problem.id}?examId=${examId}`);
                          }}
                        >
                          Solve
                          <CheckIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <CustomPagination
                currentPage={currentProblemsPage}
                totalPages={problemsTotalPages}
                onPageChange={setProblemsPage}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ExamDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Spinner size="xl" />
        </div>
      }
    >
      <ExamDetailContent />
    </Suspense>
  );
}

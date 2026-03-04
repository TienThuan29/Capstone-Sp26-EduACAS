"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
  Badge,
  Button,
  Tooltip,
  Label,
  Select,
  HR,
} from "flowbite-react";
import {
  CommandLineIcon,
  DocumentTextIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";
import type { Examination } from "@/types/examination";
import type { SubmissionResponse } from "@/types/submission";
import type { ClassroomStudentResponse } from "@/types/classroom";
import { useStudentClassroom } from "@/hooks/classroom/useStudentClassroom";
import { useSubmissionLecturer } from "@/hooks/submission/useSubmissionLecturer";
import { formatDate } from "@/utils/datetime-utils";
import { CustomPagination } from "@/components/custom-pagination";
import { DefaultCustomButton } from "@/components/ui/custom-button";

export type SubmissionsTabContentProps = {
  examination: Examination;
};

const SUBMISSIONS_PAGE_SIZE = 10;

/** Per-problem submissions; uses examProblems (problemId + mark) since list API does not return full Problem[]. */
type ProblemSubmissions = {
  problemId: string;
  mark: number;
  submissions: SubmissionResponse[];
};

export function SubmissionsTabContent({
  examination,
}: SubmissionsTabContentProps) {
  const { getStudentsByClassId } = useStudentClassroom();
  const { getLatestSubmissionsByExamAndProblem } = useSubmissionLecturer();

  const [students, setStudents] = useState<ClassroomStudentResponse[]>([]);
  const [problemSubmissions, setProblemSubmissions] = useState<
    ProblemSubmissions[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  /** Selected problem id; empty string means "All problems". */
  const [selectedProblemId, setSelectedProblemId] = useState<string>("");
  /** Current page (1-based) per problemId for table pagination. */
  const [currentPageByProblem, setCurrentPageByProblem] = useState<
    Record<string, number>
  >({});

  const classId = examination.classroom?.id;
  const examId = examination.id;
  /** Backend list API returns examProblems (problemId + mark), not full problems[]. Use this for submission queries. */
  const examProblems = useMemo(
    () => examination.examProblems ?? [],
    [examination.examProblems],
  );

  const studentIdToName = students.reduce<Record<string, string>>(
    (acc, s) => ({
      ...acc,
      [s.studentId]: s.fullname || s.email || s.studentId,
    }),
    {},
  );

  const displayedProblems = useMemo(() => {
    if (!selectedProblemId) return problemSubmissions;
    return problemSubmissions.filter((p) => p.problemId === selectedProblemId);
  }, [problemSubmissions, selectedProblemId]);

  const fetchData = useCallback(async () => {
    if (!classId || !examId) return;
    setLoading(true);
    setError(null);
    try {
      const [studentsRes, ...submissionResults] = await Promise.all([
        getStudentsByClassId(classId),
        ...examProblems.map((ep) =>
          getLatestSubmissionsByExamAndProblem(examId, ep.problemId),
        ),
      ]);
      setStudents(studentsRes);
      setProblemSubmissions(
        examProblems.map((ep, i) => ({
          problemId: ep.problemId,
          mark: ep.mark,
          submissions: submissionResults[i] ?? [],
        })),
      );
    } catch (err) {
      console.error("Failed to load submissions", err);
      setError("Failed to load submissions. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [
    classId,
    examId,
    examProblems,
    getStudentsByClassId,
    getLatestSubmissionsByExamAndProblem,
  ]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
        <p>{error}</p>
        <Button
          color="failure"
          size="sm"
          className="mt-3 cursor-pointer"
          onClick={fetchData}
        >
          Retry
        </Button>
      </div>
    );
  }

  if (examProblems.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 py-16 text-center dark:border-gray-700 dark:bg-gray-800/50">
        <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
        <p className="mt-3 text-gray-500 dark:text-gray-400">
          This examination has no problems. Add problems in the Problems tab
          first.
        </p>
      </div>
    );
  }

  return (
    <div className="">
      <div className="flex flex-wrap items-end gap-4">
        <div className="min-w-[200px]">
          <Label htmlFor="submission-problem-select" className="mb-1 block">
            Problem
          </Label>
          <Select
            id="submission-problem-select"
            value={selectedProblemId}
            onChange={(e) => setSelectedProblemId(e.target.value)}
            className="w-full cursor-pointer"
          >
            <option value="">All problems</option>
            {problemSubmissions.map(({ problemId, submissions }) => {
              const label = submissions[0]?.problem?.title ?? problemId;
              return (
                <option key={problemId} value={problemId}>
                  {label}
                </option>
              );
            })}
          </Select>
        </div>
      </div>
      <HR />

      {displayedProblems.map(({ problemId, mark, submissions }, index) => {
        const problemTitle = submissions[0]?.problem?.title ?? problemId;
        const currentPage = currentPageByProblem[problemId] ?? 1;
        const totalPages = Math.max(
          1,
          Math.ceil(submissions.length / SUBMISSIONS_PAGE_SIZE),
        );
        const paginatedSubmissions = submissions.slice(
          (currentPage - 1) * SUBMISSIONS_PAGE_SIZE,
          currentPage * SUBMISSIONS_PAGE_SIZE,
        );
        const onPageChange = (page: number) => {
          setCurrentPageByProblem((prev) => ({ ...prev, [problemId]: page }));
        };
        return (
          <div key={problemId}>
            {index > 0 && (
              <hr className="my-8 border-gray-200 dark:border-gray-600" />
            )}
            <section>
              <h4 className="font-semibold text-gray-900 dark:text-white">
                {problemTitle}
              </h4>
              <p className="mt-0.5 mb-4 text-xs text-gray-500 dark:text-gray-400">
                Max mark: {mark}
              </p>
              {submissions.length === 0 ? (
                <p className="rounded-lg border border-gray-200 bg-gray-50 py-6 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-400">
                  No submissions yet for this problem.
                </p>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table hoverable>
                      <TableHead>
                        <TableRow>
                          <TableHeadCell>Student</TableHeadCell>
                          <TableHeadCell>Version</TableHeadCell>
                          <TableHeadCell>Submitted</TableHeadCell>
                          <TableHeadCell>Score</TableHeadCell>
                          <TableHeadCell>Action</TableHeadCell>
                          <TableHeadCell>
                            <span className="sr-only">Actions</span>
                          </TableHeadCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {paginatedSubmissions.map((sub) => (
                          <TableRow key={sub.id}>
                            <TableCell className="font-medium text-gray-900 dark:text-white">
                              {studentIdToName[sub.studentId] ?? sub.studentId}
                            </TableCell>
                            <TableCell>
                              <Badge color="gray" size="sm">
                                v{sub.version}
                              </Badge>
                            </TableCell>
                            <TableCell className="whitespace-nowrap text-gray-600 dark:text-gray-400">
                              {formatDate(sub.submittedDate)}
                            </TableCell>
                            <TableCell>
                              <span className="font-medium text-gray-900 dark:text-white">
                                {sub.finalScore}
                              </span>
                            </TableCell>
                            <TableCell className="flex items-center gap-2">
                              {/* for manual grading */}
                              <Tooltip content="View in editor">
                                <Button
                                  size="xs"
                                  color="light"
                                  className="cursor-pointer"
                                >
                                  <CommandLineIcon className="h-4 w-4" />
                                </Button>
                              </Tooltip>
                              {/* View detail submission of student */}
                              <Tooltip content="View detail">
                                <DefaultCustomButton
                                  label=""
                                  icon={<EyeIcon className="h-4 w-4" />}
                                  size="xs"
                                  className="cursor-pointer"
                                />
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {totalPages > 1 && (
                    <div className="mt-4 border-t border-gray-200 pt-4 dark:border-gray-700">
                      <CustomPagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={onPageChange}
                      />
                    </div>
                  )}
                </>
              )}
            </section>
          </div>
        );
      })}
    </div>
  );
}

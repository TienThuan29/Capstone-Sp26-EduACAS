"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Badge, Select } from "flowbite-react";
import { useStudentDashboard } from "@/hooks/dashboard/useStudentDashboard";
import { formatDate } from "@/utils/datetime-utils";
import type { StudentExamScore } from "@/types/dashboard/StudentDashboardStats";
import { AcademicCapIcon, TrophyIcon } from "@heroicons/react/24/outline";

type CompletedExamMode = "ALL" | "EXAMINATION" | "PRACTICAL";

interface CompletedExamsTabProps {
  classroomId: string;
  studentId?: string;
  classroomName?: string;
}

const MODE_OPTIONS = [
  { value: "ALL", label: "All Modes" },
  { value: "EXAMINATION", label: "Examination" },
  { value: "PRACTICAL", label: "Practical" },
];

const MODE_BADGE_COLOR: Record<string, "info" | "warning" | "purple" | "failure" | "success" | "gray"> = {
  EXAMINATION: "info",
  PRACTICAL: "warning",
};

export function CompletedExamsTab({
  classroomId,
  studentId,
  classroomName,
}: CompletedExamsTabProps) {
  const { loading, getExamScores } = useStudentDashboard(classroomId, studentId);
  const router = useRouter();

  const [allScores, setAllScores] = useState<StudentExamScore[]>([]);
  const [filteredScores, setFilteredScores] = useState<StudentExamScore[]>([]);
  const [selectedMode, setSelectedMode] = useState<CompletedExamMode>("ALL");

  const fetchScores = useCallback(async () => {
    try {
      const data = await getExamScores();
      const completed = data.filter((s) => s.submittedAt !== null);
      setAllScores(completed);
    } catch (err) {
      console.error("Failed to fetch exam scores:", err);
    }
  }, [getExamScores]);

  useEffect(() => {
    void fetchScores();
  }, [fetchScores]);

  useEffect(() => {
    const sorted = [...allScores].sort((a, b) => {
      const dateA = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
      const dateB = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
      return dateB - dateA;
    });

    if (selectedMode === "ALL") {
      setFilteredScores(sorted);
    } else {
      setFilteredScores(
        sorted.filter(
          (s) => s.mode.toUpperCase() === selectedMode
        )
      );
    }
  }, [allScores, selectedMode]);

  const scorePercentage = (score: number, total: number) =>
    total > 0 ? ((score / total) * 100).toFixed(1) : "0.0";

  const scoreColor = (percentage: number) => {
    if (percentage >= 80) return "text-green-600 dark:text-green-400";
    if (percentage >= 60) return "text-yellow-600 dark:text-yellow-400";
    if (percentage >= 40) return "text-orange-600 dark:text-orange-400";
    return "text-red-600 dark:text-red-400";
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="border-l-8 border-[#1F4E79] pl-4 text-3xl font-black text-gray-900 dark:border-[#C9A24D] dark:text-white">
          Completed Exams
        </h2>
        {classroomName && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {classroomName}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <label
            htmlFor="mode-filter"
            className="text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Filter by mode:
          </label>
          <Select
            id="mode-filter"
            value={selectedMode}
            onChange={(e) => setSelectedMode(e.target.value as CompletedExamMode)}
            className="w-48"
          >
            {MODE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </div>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {filteredScores.length} result{filteredScores.length !== 1 ? "s" : ""}
        </span>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
            Loading exam results...
          </p>
        </div>
      ) : filteredScores.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-md border-2 border-dashed border-gray-200 py-16 dark:border-gray-700 dark:bg-gray-800">
          <TrophyIcon className="h-14 w-14 text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            No Completed Exams
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {selectedMode === "ALL"
              ? "You have no completed exams in this classroom yet."
              : `You have no completed ${selectedMode.toLowerCase()} exams in this classroom yet.`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredScores.map((score) => {
            const percentage = Number(scorePercentage(score.score, score.totalMark));
            const badgeColor = MODE_BADGE_COLOR[score.mode.toUpperCase()] ?? "gray";

            return (
              <Card
                key={`${score.examId}-${score.version}`}
                className="border border-gray-100 transition-all duration-300 hover:shadow-md dark:border-gray-700"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        {score.examName}
                      </h3>
                      <Badge color={badgeColor}>
                        {score.mode === "EXAMINATION" ? "Exam" : "Practical"}
                      </Badge>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-1.5">
                        <AcademicCapIcon className="h-4 w-4" />
                        <span>
                          Submitted:{" "}
                          <span className="font-medium text-gray-900 dark:text-white">
                            {score.submittedAt
                              ? formatDate(score.submittedAt)
                              : "N/A"}
                          </span>
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span>
                          Total Mark:{" "}
                          <span className="font-medium text-gray-900 dark:text-white">
                            {score.totalMark}
                          </span>
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span>
                          Class Average:{" "}
                          <span className="font-medium text-gray-900 dark:text-white">
                            {score.classAverage}
                          </span>
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <TrophyIcon className="h-4 w-4" />
                        <span>
                          Rank:{" "}
                          <span className="font-medium text-gray-900 dark:text-white">
                            #{score.rank}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-row items-center gap-6 sm:flex-col sm:items-end">
                    <div className="text-right">
                      <div
                        className={`text-3xl font-black ${scoreColor(percentage)}`}
                      >
                        {score.score}
                        <span className="text-lg font-normal text-gray-400 dark:text-gray-500">
                          /{score.totalMark}
                        </span>
                      </div>
                      <div
                        className={`text-sm font-bold ${scoreColor(percentage)}`}
                      >
                        {percentage}%
                      </div>
                    </div>

                    <Button
                      size="sm"
                      color="gray"
                      className="cursor-pointer"
                      onClick={() =>
                        router.push(`/my-classroom/${classroomId}/exam/${score.examId}`)
                      }
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

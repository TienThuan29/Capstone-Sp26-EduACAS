"use client";

import { useEffect, useState } from "react";
import { Spinner } from "flowbite-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { StudentSubmissionDetail } from "./StudentSubmissionDetail";
import { useClassroomDashboard } from "@/hooks/dashboard/useClassroomDashboard";
import { useSubmissionLecturer } from "@/hooks/submission/useSubmissionLecturer";
import type { ExamScoreStatistics } from "@/types/dashboard/DashboardStats";
import type { ClassroomStudentResponse } from "@/types/classroom";

interface PracticalStatisticsSectionProps {
  classId: string;
  students: ClassroomStudentResponse[];
}

export function PracticalStatisticsSection({
  classId,
  students,
}: PracticalStatisticsSectionProps) {
  const { getExamStatistics } = useClassroomDashboard(classId);
  const { getLatestSubmissionsByExam } =
    useSubmissionLecturer();

  const [practicalExamStatistics, setPracticalExamStatistics] = useState<ExamScoreStatistics[]>([]);
  const [selectedPracticalExamId, setSelectedPracticalExamId] = useState<string | null>(null);
  const [practicalStatsLoading, setPracticalStatsLoading] = useState(false);

  const [practicalStudentScores, setPracticalStudentScores] = useState<
    Record<string, { problemId: string; averageScore: number }[]>
  >({});
  const [practicalStudentScoresLoading, setPracticalStudentScoresLoading] = useState(false);

  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  // Load PRACTICAL exam list when section mounts
  useEffect(() => {
    if (!classId) return;

    let cancelled = false;
    setPracticalStatsLoading(true);

    void (async () => {
      try {
        const data = await getExamStatistics(classId, undefined, "PRACTICAL");
        if (!cancelled) {
          setPracticalExamStatistics(data);
          if (data.length > 0) {
            setSelectedPracticalExamId(data[0].examId);
          }
        }
      } catch (err) {
        if (!cancelled) console.error("Failed to load PRACTICAL exam statistics:", err);
      } finally {
        if (!cancelled) setPracticalStatsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [classId, getExamStatistics]);

  // Load student scores when a PRACTICAL exam is selected
  useEffect(() => {
    if (!selectedPracticalExamId) return;

    let cancelled = false;
    setPracticalStudentScoresLoading(true);

    void (async () => {
      try {
        const submissions = await getLatestSubmissionsByExam(selectedPracticalExamId);
        if (!cancelled) {
          const scores: Record<string, { problemId: string; averageScore: number }[]> = {};
          for (const ps of submissions) {
            for (const sub of ps.submissions) {
              if (!scores[sub.studentId]) {
                scores[sub.studentId] = [];
              }
              scores[sub.studentId].push({
                problemId: ps.problemId,
                averageScore: sub.finalScore,
              });
            }
          }
          setPracticalStudentScores(scores);
        }
      } catch (err) {
        if (!cancelled) console.error("Failed to load PRACTICAL student scores:", err);
      } finally {
        if (!cancelled) setPracticalStudentScoresLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedPracticalExamId, getLatestSubmissionsByExam]);

  return (
    <div className="mt-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            PRACTICAL Statistics
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Per-student average scores and submission progress across PRACTICAL exams.
          </p>
        </div>
        <select
          value={selectedPracticalExamId ?? ""}
          onChange={(e) => {
            setSelectedPracticalExamId(e.target.value);
            setSelectedStudentId(null);
          }}
          disabled={practicalStatsLoading}
          className="max-w-xs rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white disabled:opacity-50"
        >
          <option value="" disabled>
            {practicalStatsLoading ? "Loading..." : "Select a PRACTICAL exam..."}
          </option>
          {practicalExamStatistics.map((exam) => (
            <option key={exam.examId} value={exam.examId}>
              {exam.examName}
            </option>
          ))}
        </select>
      </div>

      {practicalStatsLoading ? (
        <div className="flex h-40 items-center justify-center">
          <Spinner size="xl" color="info" />
        </div>
      ) : !selectedPracticalExamId ? (
        <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No PRACTICAL exams available for this classroom.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Bar Chart — Average Score per Student */}
          <div className="rounded-md border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h4 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
              Average Score per Student
            </h4>
            {practicalStudentScoresLoading ? (
              <div className="flex h-48 items-center justify-center">
                <Spinner size="lg" color="info" />
              </div>
            ) : Object.keys(practicalStudentScores).length === 0 ? (
              <div className="flex h-48 items-center justify-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No submissions found for this exam.
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={Object.entries(practicalStudentScores).map(([studentId, entries]) => {
                    const avg =
                      entries.length > 0
                        ? entries.reduce((sum, e) => sum + e.averageScore, 0) / entries.length
                        : 0;
                    const student = students.find((s) => s.studentId === studentId);
                    return {
                      studentId,
                      studentName: student?.fullname ?? studentId,
                      averageScore: Number(avg.toFixed(2)),
                    };
                  })}
                  margin={{ top: 8, right: 8, left: -16, bottom: 40 }}
                >
                  <XAxis
                    dataKey="studentName"
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    angle={-30}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis
                    domain={[0, 10]}
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload || payload.length === 0) return null;
                      const d = payload[0].payload;
                      return (
                        <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-md dark:border-gray-700 dark:bg-gray-800">
                          <p className="text-xs font-semibold text-gray-900 dark:text-white">
                            {d.studentName}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            Avg Score: <span className="font-bold">{d.averageScore}</span>
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            Click to view submission breakdown
                          </p>
                        </div>
                      );
                    }}
                  />
                  <Bar
                    dataKey="averageScore"
                    fill="#3B82F6"
                    radius={[4, 4, 0, 0]}
                    cursor="pointer"
                    onClick={(data) => {
                      if (!data) return;
                      const d = data as unknown as { payload: { studentId: string } };
                      if (d?.payload?.studentId) {
                        setSelectedStudentId(d.payload.studentId);
                      }
                    }}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Student Submission Detail */}
          {selectedStudentId && (
            <StudentSubmissionDetail
              examId={selectedPracticalExamId}
              studentId={selectedStudentId}
              studentName={
                students.find((s) => s.studentId === selectedStudentId)?.fullname ??
                selectedStudentId
              }
              onClose={() => setSelectedStudentId(null)}
            />
          )}
        </div>
      )}
    </div>
  );
}

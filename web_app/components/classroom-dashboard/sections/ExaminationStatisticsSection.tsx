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

interface ExaminationStatisticsSectionProps {
  classId: string;
  students: ClassroomStudentResponse[];
}

export function ExaminationStatisticsSection({
  classId,
  students,
}: ExaminationStatisticsSectionProps) {
  const { getExamStatistics } = useClassroomDashboard(classId);
  const { getLatestSubmissionsByExam } =
    useSubmissionLecturer();

  const [examStatistics, setExamStatistics] = useState<ExamScoreStatistics[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [isAllExamsSelected, setIsAllExamsSelected] = useState(false);
  const [examStatsLoading, setExamStatsLoading] = useState(false);

  const [studentScores, setStudentScores] = useState<
    Record<string, { examId: string; examName: string; totalScore: number }[]>
  >({});
  const [studentScoresLoading, setStudentScoresLoading] = useState(false);

  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  useEffect(() => {
    if (!classId) return;

    let cancelled = false;
    setExamStatsLoading(true);

    void (async () => {
      try {
        const data = await getExamStatistics(classId, undefined, "EXAMINATION");
        if (!cancelled) {
          setExamStatistics(data);
          if (data.length > 0) {
            setSelectedExamId(data[0].examId);
          }
        }
      } catch (err) {
        if (!cancelled) console.error("Failed to load EXAMINATION exam statistics:", err);
      } finally {
        if (!cancelled) setExamStatsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [classId, getExamStatistics]);

  useEffect(() => {
    if (!selectedExamId && !isAllExamsSelected) return;
    if (isAllExamsSelected && examStatistics.length === 0) return;

    let cancelled = false;
    setStudentScoresLoading(true);

    void (async () => {
      try {
        if (isAllExamsSelected) {
          const allScores: Record<string, { examId: string; examName: string; totalScore: number }[]> = {};

          for (const exam of examStatistics) {
            const submissions = await getLatestSubmissionsByExam(exam.examId);
            if (cancelled) return;

            for (const ps of submissions) {
              for (const sub of ps.submissions) {
                if (!allScores[sub.studentId]) {
                  allScores[sub.studentId] = [];
                }
                allScores[sub.studentId].push({
                  examId: exam.examId,
                  examName: exam.examName,
                  totalScore: sub.finalScore,
                });
              }
            }
          }

          if (!cancelled) {
            setStudentScores(allScores);
          }
        } else if (selectedExamId) {
          const submissions = await getLatestSubmissionsByExam(selectedExamId);
          if (!cancelled) {
            const scores: Record<string, { examId: string; examName: string; totalScore: number }[]> = {};
            const selectedExam = examStatistics.find((e) => e.examId === selectedExamId);

            for (const ps of submissions) {
              for (const sub of ps.submissions) {
                if (!scores[sub.studentId]) {
                  scores[sub.studentId] = [];
                }
                scores[sub.studentId].push({
                  examId: selectedExamId,
                  examName: selectedExam?.examName ?? selectedExamId,
                  totalScore: sub.finalScore,
                });
              }
            }
            setStudentScores(scores);
          }
        }
      } catch (err) {
        if (!cancelled) console.error("Failed to load EXAMINATION student scores:", err);
      } finally {
        if (!cancelled) setStudentScoresLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedExamId, isAllExamsSelected, examStatistics, getLatestSubmissionsByExam]);

  return (
    <div className="mt-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            EXAMINATION Statistics
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {isAllExamsSelected
              ? "Average score across all EXAMINATION exams."
              : "Total score per student for selected EXAMINATION exam."}
          </p>
        </div>
        <select
          value={isAllExamsSelected ? "__all__" : (selectedExamId ?? "")}
          onChange={(e) => {
            if (e.target.value === "__all__") {
              setIsAllExamsSelected(true);
              setSelectedExamId(null);
            } else {
              setIsAllExamsSelected(false);
              setSelectedExamId(e.target.value);
            }
            setSelectedStudentId(null);
          }}
          disabled={examStatsLoading}
          className="max-w-xs rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white disabled:opacity-50"
        >
          <option value="" disabled>
            {examStatsLoading ? "Loading..." : "Select an EXAMINATION exam..."}
          </option>
          <option value="__all__">Average All Exams</option>
          {examStatistics.map((exam) => (
            <option key={exam.examId} value={exam.examId}>
              {exam.examName}
            </option>
          ))}
        </select>
      </div>

      {examStatsLoading ? (
        <div className="flex h-40 items-center justify-center">
          <Spinner size="xl" color="info" />
        </div>
      ) : examStatistics.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No EXAMINATION exams available for this classroom.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-md border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h4 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
              {isAllExamsSelected ? "Average Score per Student (All Exams)" : "Total Score per Student"}
            </h4>
            {studentScoresLoading ? (
              <div className="flex h-48 items-center justify-center">
                <Spinner size="lg" color="info" />
              </div>
            ) : Object.keys(studentScores).length === 0 ? (
              <div className="flex h-48 items-center justify-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No submissions found for this exam.
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={Object.entries(studentScores).map(([studentId, entries]) => {
                    const student = students.find((s) => s.studentId === studentId);
                    let displayValue: number;
                    let displayLabel: string;

                    if (isAllExamsSelected) {
                      const avg =
                        entries.length > 0
                          ? entries.reduce((sum, e) => sum + e.totalScore, 0) / entries.length
                          : 0;
                      displayValue = Number(avg.toFixed(2));
                      displayLabel = "Avg Score";
                    } else {
                      const total =
                        entries.reduce((sum, e) => sum + e.totalScore, 0);
                      displayValue = Number(total.toFixed(2));
                      displayLabel = "Total Score";
                    }

                    return {
                      studentId,
                      studentName: student?.fullname ?? studentId,
                      displayValue,
                      displayLabel,
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
                    domain={[0, isAllExamsSelected ? 10 : "auto"]}
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
                            {d.displayLabel}: <span className="font-bold">{d.displayValue}</span>
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            Click to view submission breakdown
                          </p>
                        </div>
                      );
                    }}
                  />
                  <Bar
                    dataKey="displayValue"
                    fill="#10B981"
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

          {/* Student Submission Detail - Only show when specific exam is selected */}
          {selectedStudentId && !isAllExamsSelected && selectedExamId && (
            <StudentSubmissionDetail
              examId={selectedExamId}
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

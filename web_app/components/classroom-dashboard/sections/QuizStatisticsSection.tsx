"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "flowbite-react";
import {
  UserGroupIcon,
  AcademicCapIcon,
  ChartBarIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { LineChart } from "@/components/classroom-dashboard/charts/LineChart";
import { ScoreDistributionChart } from "@/components/classroom-dashboard/charts/ScoreDistributionChart";
import { QuizHeatmapChart } from "@/components/classroom-dashboard/charts/QuizHeatmapChart";
import { QuizCompletionRateChart } from "@/components/classroom-dashboard/charts/QuizCompletionRateChart";
import { useQuizStatistics } from "@/hooks/dashboard/useQuizStatistics";
import type { ClassroomQuiz, QuizAttemptResponse } from "@/types/quiz";
import type { ClassroomStudentResponse } from "@/types/classroom";
import type { ScoreDistribution, QuizScoreStatistics } from "@/types/dashboard/DashboardStats";
import { StudentQuizAttemptDetail } from "./StudentQuizAttemptDetail";

type StudentScoreSeries = {
  studentId: string;
  studentName: string;
  points: Array<number | null>;
  submittedCount: number;
  averageScore: number;
};

interface QuizStatisticsSectionProps {
  classId: string;
  classroomQuizzes: ClassroomQuiz[];
  attemptsByStudent: Record<string, QuizAttemptResponse[]>;
  students: ClassroomStudentResponse[];
  quizNameMap: Record<string, string>;
  loading?: boolean;
}

const PASS_THRESHOLD = 5.0; // out of 10

export function QuizStatisticsSection({
  classId,
  classroomQuizzes,
  attemptsByStudent,
  students,
  quizNameMap,
  loading = false,
}: QuizStatisticsSectionProps) {
  const [selectedQuizIndex, setSelectedQuizIndex] = useState(0);
  const { getQuizStatistics } = useQuizStatistics();
  const [quizStats, setQuizStats] = useState<QuizScoreStatistics[]>([]);
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    if (!classId) return;
    setStatsLoading(true);
    getQuizStatistics(classId)
      .then((data) => {
        setQuizStats(data);
      })
      .finally(() => {
        setStatsLoading(false);
      });
  }, [classId, getQuizStatistics]);

  const filteredClassroomQuizzes = useMemo(
    () =>
      [...classroomQuizzes].sort(
        (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      ),
    [classroomQuizzes]
  );

  const studentSeries = useMemo<StudentScoreSeries[]>(() => {
    const classroomQuizIds = new Set(filteredClassroomQuizzes.map((q) => q.id));

    return students
      .map((student) => {
        const attempts = attemptsByStudent[student.studentId] ?? [];
        const attemptsByClassroomQuiz = attempts.reduce<Record<string, QuizAttemptResponse[]>>(
          (acc, attempt) => {
            if (!classroomQuizIds.has(attempt.classroomQuizId)) return acc;
            if (!acc[attempt.classroomQuizId]) acc[attempt.classroomQuizId] = [];
            acc[attempt.classroomQuizId].push(attempt);
            return acc;
          },
          {}
        );

        const points = filteredClassroomQuizzes.map((classroomQuiz) => {
          const quizAttempts = (attemptsByClassroomQuiz[classroomQuiz.id] ?? [])
            .filter(
              (attempt) =>
                attempt.status === "SUBMITTED" && attempt.score != null
            )
            .sort((a, b) => b.attemptNumber - a.attemptNumber);
          if (quizAttempts.length === 0) return null;
          return Number(quizAttempts[0].score);
        });

        const valid = points.filter((score): score is number => score != null);
        return {
          studentId: student.studentId,
          studentName: student.fullname,
          points,
          submittedCount: valid.length,
          averageScore:
            valid.length === 0
              ? 0
              : valid.reduce((sum, score) => sum + score, 0) / valid.length,
        };
      })
      .sort((a, b) => b.averageScore - a.averageScore);
  }, [attemptsByStudent, filteredClassroomQuizzes, students]);

  const globalMaxScore = useMemo(() => {
    const values = studentSeries.flatMap((s) =>
      s.points.filter((score): score is number => score != null)
    );
    return values.length > 0 ? Math.max(...values, 10) : 10;
  }, [studentSeries]);

  const classAverageSeries = useMemo(() => {
    if (filteredClassroomQuizzes.length === 0) return [] as Array<number | null>;
    return filteredClassroomQuizzes.map((_, index) => {
      const col = studentSeries
        .map((s) => s.points[index])
        .filter((score): score is number => score != null);
      if (col.length === 0) return null;
      return col.reduce((sum, score) => sum + score, 0) / col.length;
    });
  }, [filteredClassroomQuizzes, studentSeries]);

  const classAverage = useMemo(() => {
    const valid = classAverageSeries.filter((x): x is number => x != null);
    return valid.length > 0
      ? valid.reduce((sum, s) => sum + s, 0) / valid.length
      : 0;
  }, [classAverageSeries]);

  // --- Quiz-level stats ---
  const quizStatsData = useMemo(() => {
    return filteredClassroomQuizzes.map((quiz) => {
      const submissions = studentSeries
        .map((s) => s.points[filteredClassroomQuizzes.indexOf(quiz)])
        .filter((p): p is number => p != null);
      const studentCount = students.length;
      return {
        quizName: truncate(quizNameMap[quiz.quizId] ?? quiz.quizId, 12),
        quizFullName: quizNameMap[quiz.quizId] ?? quiz.quizId,
        submissionCount: submissions.length,
        studentCount,
        completionRate:
          studentCount > 0 ? (submissions.length / studentCount) * 100 : 0,
        avgScore:
          submissions.length > 0
            ? submissions.reduce((a, b) => a + b, 0) / submissions.length
            : null,
      };
    });
  }, [filteredClassroomQuizzes, studentSeries, students, quizNameMap]);

  // --- Score distribution from API (aggregated across all quizzes) ---
  const quizScoreDistribution = useMemo<ScoreDistribution[]>(() => {
    if (quizStats.length === 0) return [];

    const rangeMap: Record<string, number> = {
      "9-10": 0,
      "7-8": 0,
      "5-6": 0,
      "3-4": 0,
      "0-2": 0,
    };
    let totalCount = 0;

    for (const qs of quizStats) {
      for (const item of qs.scoreDistribution) {
        const range = item.range;
        if (range in rangeMap) {
          rangeMap[range] += item.count;
          totalCount += item.count;
        }
      }
    }

    return Object.entries(rangeMap).map(([range, count]) => ({
      range,
      count,
      percentage: totalCount > 0 ? (count / totalCount) * 100 : 0,
    }));
  }, [quizStats]);

  // --- Pass/Fail counts across all quizzes ---
  const passFailData = useMemo(() => {
    const passCount = studentSeries.filter((s) => s.averageScore >= PASS_THRESHOLD).length;
    const failCount = studentSeries.length - passCount;
    return [
      { name: "Passing (≥5)", value: passCount, color: "#10B981" },
      { name: "Failing (<5)", value: failCount, color: "#EF4444" },
    ];
  }, [studentSeries]);

  // --- Heatmap data ---
  const heatmapData = useMemo(() => {
    return studentSeries.map((s) => ({
      studentName: s.studentName,
      scores: filteredClassroomQuizzes.map((quiz) => ({
        quizName: truncate(quizNameMap[quiz.quizId] ?? quiz.quizId, 10),
        score: s.points[filteredClassroomQuizzes.indexOf(quiz)],
      })),
    }));
  }, [studentSeries, filteredClassroomQuizzes, quizNameMap]);

  // --- Top 10 / Bottom 5 performers ---
  const topPerformers = useMemo(
    () => studentSeries.slice(0, 10),
    [studentSeries]
  );

  // --- Per-quiz pass rate ---
  const selectedQuiz = filteredClassroomQuizzes[selectedQuizIndex];
  const selectedQuizStats = selectedQuiz ? quizStatsData[selectedQuizIndex] : null;
  const perQuizPassFail = useMemo(() => {
    if (!selectedQuiz) return [];
    return studentSeries.map((s) => {
      const score = s.points[selectedQuizIndex];
      return {
        studentId: s.studentId,
        studentName: s.studentName,
        score,
        passed: score !== null && score >= PASS_THRESHOLD,
      };
    });
  }, [selectedQuiz, selectedQuizIndex, studentSeries]);

  // Attempts for selected quiz, keyed by studentId (used for modal)
  const attemptsByStudentForQuiz = useMemo(() => {
    if (!selectedQuiz) return {};
    const result: Record<string, QuizAttemptResponse[]> = {};
    for (const student of students) {
      const attempts = (attemptsByStudent[student.studentId] ?? [])
        .filter((a) => a.classroomQuizId === selectedQuiz.id)
        .sort((a, b) => a.attemptNumber - b.attemptNumber);
      if (attempts.length > 0) result[student.studentId] = attempts;
    }
    return result;
  }, [selectedQuiz, students, attemptsByStudent]);

  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  const passedInQuiz = perQuizPassFail.filter((s) => s.passed).length;
  const failedInQuiz = perQuizPassFail.filter((s) => !s.passed && s.score !== null).length;
  const noSubmissionInQuiz = perQuizPassFail.filter((s) => s.score === null).length;

  return (
    <>
      {/* Loading overlay while fetching quiz attempts */}
      {loading && (
        <div className="mb-4 flex items-center justify-center gap-3 rounded-lg border border-blue-200 bg-blue-50 py-4 text-sm text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          Loading quiz attempt data…
        </div>
      )}

      {/* === Metric Cards === */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          icon={<UserGroupIcon className="h-5 w-5" />}
          label="Active Students"
          value={students.length.toString()}
          subtext={`${studentSeries.length} submitted at least once`}
          accent="text-[#1F4E79]"
          bgClass="bg-blue-50 dark:bg-blue-950"
        />
        <MetricCard
          icon={<AcademicCapIcon className="h-5 w-5" />}
          label="Total Quizzes"
          value={filteredClassroomQuizzes.length.toString()}
          subtext={`${quizStatsData.filter((q) => q.submissionCount > 0).length} with submissions`}
          accent="text-[#C9A24D]"
          bgClass="bg-amber-50 dark:bg-amber-950"
        />
        <MetricCard
          icon={<ChartBarIcon className="h-5 w-5" />}
          label="Class Average"
          value={
            classAverageSeries.filter((x): x is number => x != null).length > 0
              ? classAverage.toFixed(2)
              : "N/A"
          }
          subtext="Overall mean score"
          accent="text-emerald-600"
          bgClass="bg-emerald-50 dark:bg-emerald-950"
        />
      </div>

      {/* === Row: Class Trend + Quiz Pass/Fail Distribution === */}
      {/* <div className="">Ư
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800 lg:col-span-3">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                Class Average Trend
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Average score per quiz across all students
              </p>
            </div>
          </div>
          <LineChart
            points={classAverageSeries}
            labels={filteredClassroomQuizzes.map(
              (item) => quizNameMap[item.quizId] ?? item.quizId
            )}
            maxY={globalMaxScore}
            strokeClassName="stroke-emerald-500"
          />
        </div>
      </div> */}

      {/* === Score Distribution === */}
      <ScoreDistributionChart
        data={quizScoreDistribution}
        selectedMode="QUIZ"
        onModeChange={() => {}}
        loading={statsLoading}
        showModeSelector={false}
      />

      {/* === Quiz Completion Rate & Avg Score === */}
      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-4">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            Quiz Completion & Average Score
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Submission rate and mean score for each quiz
          </p>
        </div>
        <QuizCompletionRateChart data={quizStatsData} />
      </div>

      {/* === Student Performance Heatmap === */}
      {/* {heatmapData.length > 0 && heatmapData[0].scores.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              Student Performance Heatmap
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Score per student per quiz — color intensity shows mastery level
            </p>
          </div>
          <QuizHeatmapChart data={heatmapData} maxScore={globalMaxScore} />
        </div>
      )} */}

      {/* === Selected Quiz Detail === */}
      {filteredClassroomQuizzes.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                Quiz Detail
              </h3>
              <select
                value={selectedQuizIndex}
                onChange={(e) => setSelectedQuizIndex(Number(e.target.value))}
                className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
              >
                {filteredClassroomQuizzes.map((quiz, idx) => (
                  <option key={quiz.id} value={idx}>
                    {quizNameMap[quiz.quizId] ?? quiz.quizId}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                <CheckCircleIcon className="h-4 w-4" />
                {">="} 5: {passedInQuiz}
              </div>
              <div className="flex items-center gap-1 text-xs text-red-500 dark:text-red-400">
                <XCircleIcon className="h-4 w-4" />
                {"<"} 5: {failedInQuiz}
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-400">
                No sub: {noSubmissionInQuiz}
              </div>
            </div>
          </div>
          <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
            Click on a bar to view attempt history
          </p>
          {perQuizPassFail.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">No students.</p>
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(200, perQuizPassFail.length * 28 + 80)}>
              <BarChart
                data={perQuizPassFail}
                layout="vertical"
                margin={{ top: 0, right: 30, left: 120, bottom: 0 }}
              >
                <XAxis
                  type="number"
                  domain={[0, 10]}
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="studentName"
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  width={115}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-md dark:border-gray-700 dark:bg-gray-800">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {d.studentName}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-300">
                          Score:{" "}
                          <span
                            className={`font-bold ${d.passed ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400"}`}
                          >
                            {d.score !== null ? d.score.toFixed(2) : "No submission"}
                          </span>
                        </p>
                        <p className="text-xs text-gray-500">
                          {d.passed ? "Passing" : d.score !== null ? "Failing" : "No submission"}
                        </p>
                        {d.score !== null && (
                          <p className="mt-1 text-xs text-blue-500">Click to view attempts</p>
                        )}
                      </div>
                    );
                  }}
                />
                  <Bar
                    dataKey="score"
                    radius={[0, 4, 4, 0]}
                  >
                  {perQuizPassFail.map((entry) => (
                    <Cell
                      key={entry.studentName}
                      cursor={entry.score !== null ? "pointer" : "default"}
                      fill={
                        entry.score === null
                          ? "#D1D5DB"
                          : entry.passed
                            ? "#10B981"
                            : "#EF4444"
                      }
                      onClick={() => {
                        if (entry.score !== null) {
                          setSelectedStudentId(entry.studentId);
                        }
                      }}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      )}

      {selectedStudentId && selectedQuiz && (
        <StudentQuizAttemptDetail
          studentName={
            perQuizPassFail.find((s) => s.studentId === selectedStudentId)?.studentName ?? ""
          }
          quizName={quizNameMap[selectedQuiz.quizId] ?? selectedQuiz.quizId}
          attempts={attemptsByStudentForQuiz[selectedStudentId] ?? []}
          onClose={() => setSelectedStudentId(null)}
        />
      )}
    </>
  );
}

function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 1) + "…";
}

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtext?: string;
  accent: string;
  bgClass?: string;
}

function MetricCard({
  icon,
  label,
  value,
  subtext,
  accent,
  bgClass = "bg-gray-50 dark:bg-gray-800",
}: MetricCardProps) {
  return (
    <div
      className={`flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 ${bgClass}`}
    >
      <div className={`rounded-full bg-white p-3 dark:bg-gray-700 ${accent}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</p>
        <p className={`text-2xl font-bold ${accent}`}>{value}</p>
        {subtext && (
          <p className="mt-0.5 text-[10px] text-gray-400 dark:text-gray-500">{subtext}</p>
        )}
      </div>
    </div>
  );
}

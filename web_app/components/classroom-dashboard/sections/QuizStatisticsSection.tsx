"use client";

import { useMemo, useState } from "react";
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
import type { ClassroomQuiz } from "@/types/quiz";
import type { QuizAttempt } from "@/types/quiz-attempt";
import type { ClassroomStudentResponse } from "@/types/classroom";
import type { ScoreDistribution } from "@/types/dashboard/DashboardStats";

type StudentScoreSeries = {
  studentId: string;
  studentName: string;
  points: Array<number | null>;
  submittedCount: number;
  averageScore: number;
};

interface QuizStatisticsSectionProps {
  classroomQuizzes: ClassroomQuiz[];
  attemptsByStudent: Record<string, QuizAttempt[]>;
  students: ClassroomStudentResponse[];
  scoreDistribution: ScoreDistribution[];
  scoreDistLoading: boolean;
  quizNameMap: Record<string, string>;
}

const PASS_THRESHOLD = 5.0; // out of 10

export function QuizStatisticsSection({
  classroomQuizzes,
  attemptsByStudent,
  students,
  scoreDistribution,
  scoreDistLoading,
  quizNameMap,
}: QuizStatisticsSectionProps) {
  const [selectedQuizIndex, setSelectedQuizIndex] = useState(0);

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
        const attemptsByClassroomQuiz = attempts.reduce<Record<string, QuizAttempt[]>>(
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
                attempt.status === "SUBMITTED" && attempt.finalScore != null
            )
            .sort((a, b) => b.attemptNumber - a.attemptNumber);
          if (quizAttempts.length === 0) return null;
          return Number(quizAttempts[0].finalScore);
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
        studentName: s.studentName,
        score,
        passed: score !== null && score >= PASS_THRESHOLD,
      };
    });
  }, [selectedQuiz, selectedQuizIndex, studentSeries]);

  const passedInQuiz = perQuizPassFail.filter((s) => s.passed).length;
  const failedInQuiz = perQuizPassFail.filter((s) => !s.passed && s.score !== null).length;
  const noSubmissionInQuiz = perQuizPassFail.filter((s) => s.score === null).length;

  return (
    <>
      {/* === Metric Cards === */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
        <MetricCard
          icon={<CheckCircleIcon className="h-5 w-5" />}
          label="Pass Rate"
          value={
            studentSeries.length > 0
              ? `${((passFailData[0].value / studentSeries.length) * 100).toFixed(0)}%`
              : "N/A"
          }
          subtext={`${passFailData[0].value} passing / ${passFailData[1].value} failing`}
          accent="text-violet-600"
          bgClass="bg-violet-50 dark:bg-violet-950"
        />
      </div>

      {/* === Row: Class Trend + Quiz Pass/Fail Distribution === */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Class Average Trend */}
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
            <Badge color="info">Phase 1</Badge>
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

        {/* Pass / Fail Distribution */}
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800 lg:col-span-2">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              Pass / Fail Distribution
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Based on overall average (threshold: ≥{PASS_THRESHOLD})
            </p>
          </div>
          {studentSeries.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">No data.</p>
          ) : (
            <div className="space-y-4">
              {passFailData.map(({ name, value, color }) => (
                <div key={name}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">{name}</span>
                    <span className="font-bold text-gray-800 dark:text-gray-200">
                      {value} ({((value / studentSeries.length) * 100).toFixed(0)}%)
                    </span>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${(value / studentSeries.length) * 100}%`,
                        backgroundColor: color,
                      }}
                    />
                  </div>
                </div>
              ))}

              {/* Pass/Fail Pie */}
              <div className="flex justify-center">
                <ResponsiveContainer width="100%" height={140}>
                  <BarChart
                    data={passFailData}
                    layout="vertical"
                    margin={{ top: 0, right: 40, left: 0, bottom: 0 }}
                  >
                    <XAxis type="number" hide />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                      width={90}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const d = payload[0].payload;
                        return (
                          <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-md dark:border-gray-700 dark:bg-gray-800">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                              {d.name}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-300">
                              {d.value} students ({(d.value / studentSeries.length * 100).toFixed(0)}%)
                            </p>
                          </div>
                        );
                      }}
                    />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {passFailData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </div>

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
      {heatmapData.length > 0 && heatmapData[0].scores.length > 0 && (
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
      )}

      {/* === Selected Quiz Detail: Pass/Fail breakdown === */}
      {selectedQuiz && (
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                Quiz Detail: {selectedQuizStats?.quizFullName}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Pass/Fail breakdown per student for this quiz
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                <CheckCircleIcon className="h-4 w-4" />
                Pass: {passedInQuiz}
              </div>
              <div className="flex items-center gap-1 text-xs text-red-500 dark:text-red-400">
                <XCircleIcon className="h-4 w-4" />
                Fail: {failedInQuiz}
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-400">
                No sub: {noSubmissionInQuiz}
              </div>
            </div>
          </div>
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
                      fill={
                        entry.score === null
                          ? "#D1D5DB"
                          : entry.passed
                            ? "#10B981"
                            : "#EF4444"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      )}

      {/* === Score Distribution === */}
      <ScoreDistributionChart
        data={scoreDistribution}
        selectedMode="QUIZ"
        onModeChange={() => {}}
        loading={scoreDistLoading}
        showModeSelector={false}
      />
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

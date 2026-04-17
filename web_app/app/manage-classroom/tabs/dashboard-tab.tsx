"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Badge, Spinner } from "flowbite-react";
import { ChartBarIcon, AcademicCapIcon, UserGroupIcon, DocumentArrowDownIcon, Cog6ToothIcon } from "@heroicons/react/24/outline";
import { useStudentClassroom } from "@/hooks/classroom/useStudentClassroom";
import { useClassroomQuiz } from "@/hooks/quiz/useClassroomQuiz";
import { useQuiz } from "@/hooks/quiz/useQuiz";
import { useQuizAttempt } from "@/hooks/quiz/useQuizAttempt";
import { useClassroomDashboard } from "@/hooks/dashboard/useClassroomDashboard";
import { DefaultOutlineCustomButton } from "@/components/ui/custom-button";
import { StatsCard } from "@/components/classroom-dashboard/cards/StatsCard";
import { ScoreDistributionChart, ExamMode } from "@/components/classroom-dashboard/charts/ScoreDistributionChart";
import { ExamScoreStatisticsChart } from "@/components/classroom-dashboard/charts/ExamScoreStatisticsChart";
import { AtRiskStudentsList } from "@/components/classroom-dashboard/lists/AtRiskStudentsList";
import { RecentWarningsList } from "@/components/classroom-dashboard/lists/RecentWarningsList";
import type { ClassroomStudentResponse } from "@/types/classroom";
import type { ClassroomQuiz } from "@/types/quiz";
import type { QuizAttempt } from "@/types/quiz-attempt";
import type {
  ScoreDistribution,
  AtRiskStudent,
  RecentWarning,
  ClassStats,
  ExamScoreStatistics,
} from "@/types/dashboard/DashboardStats";

type DashboardTabProps = {
  classId: string;
  classroomName?: string;
};

type StudentScoreSeries = {
  studentId: string;
  studentName: string;
  points: Array<number | null>;
  submittedCount: number;
  averageScore: number;
};

export function DashboardTab({ classId, classroomName }: DashboardTabProps) {
  const { getStudentsByClassId } = useStudentClassroom();
  const { getClassroomQuizzesByClassroom } = useClassroomQuiz();
  const { getAllQuizzes } = useQuiz();
  const { getAttemptsByStudent } = useQuizAttempt();

  const {
    loading: legacyLoading,
    error: legacyError,
    getScoreDistribution,
    getAtRiskStudents,
    getRecentWarnings,
    getClassStats,
    getExamStatistics,
  } = useClassroomDashboard(classId);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [students, setStudents] = useState<ClassroomStudentResponse[]>([]);
  const [classroomQuizzes, setClassroomQuizzes] = useState<ClassroomQuiz[]>([]);
  const [quizNameMap, setQuizNameMap] = useState<Record<string, string>>({});
  const [attemptsByStudent, setAttemptsByStudent] = useState<Record<string, QuizAttempt[]>>({});

  // Legacy dashboard state (incoming HEAD version)
  const [scoreDistribution, setScoreDistribution] = useState<ScoreDistribution[]>([]);
  const [selectedMode, setSelectedMode] = useState<ExamMode | "ALL">("ALL");
  const [scoreDistLoading, setScoreDistLoading] = useState(false);
  const [atRiskStudents, setAtRiskStudents] = useState<AtRiskStudent[]>([]);
  const [recentWarnings, setRecentWarnings] = useState<RecentWarning[]>([]);
  const [classStats, setClassStats] = useState<ClassStats[]>([]);
  const [examStatistics, setExamStatistics] = useState<ExamScoreStatistics[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [examStatsLoading, setExamStatsLoading] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  // Calculate overview stats from classStats
  const totalStudents = classStats.reduce((sum, cls) => sum + cls.totalStudents, 0);
  const classAverage =
    classStats.length > 0
      ? classStats.reduce((sum, cls) => sum + cls.classAverage, 0) / classStats.length
      : 0;
  const totalAtRisk = classStats.reduce((sum, cls) => sum + cls.atRiskCount, 0);
  const atRiskPercentage = totalStudents > 0 ? (totalAtRisk / totalStudents) * 100 : 0;
  const totalWarnings = recentWarnings.length;

  // Load score distribution when mode changes
  const loadScoreDistribution = async (mode: ExamMode | "ALL") => {
    setScoreDistLoading(true);
    try {
      const modeParam = mode === "ALL" ? undefined : mode;
      const data = await getScoreDistribution(classId, modeParam);
      setScoreDistribution(data);
    } finally {
      setScoreDistLoading(false);
    }
  };

  // Handle mode change
  const handleModeChange = (mode: ExamMode | "ALL") => {
    setSelectedMode(mode);
    loadScoreDistribution(mode);
  };

  useEffect(() => {
    let active = true;

    const fetchDashboard = async () => {
      if (!classId) {
        if (!active) {
          return;
        }
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        setHasLoadedOnce(true);

        const [
          studentList,
          classroomQuizList,
          allQuizzes,
          distData,
          riskData,
          warningsData,
          statsData,
          examStatsData,
        ] = await Promise.all([
          getStudentsByClassId(classId),
          getClassroomQuizzesByClassroom(classId),
          getAllQuizzes(true),
          getScoreDistribution(),
          getAtRiskStudents(5),
          getRecentWarnings(5),
          getClassStats(classId),
          getExamStatistics(classId),
        ]);

        if (!active) {
          return;
        }

        const sortedClassroomQuizzes = [...classroomQuizList].sort(
          (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
        );

        const attemptsEntries = await Promise.all(
          studentList
            .filter((student) => student.isJoining)
            .map(async (student) => {
              const attempts = await getAttemptsByStudent(student.studentId);
              return [student.studentId, attempts] as const;
            }),
        );

        if (!active) {
          return;
        }

        const nameMap = allQuizzes.reduce<Record<string, string>>((acc, quiz) => {
          acc[quiz.id] = quiz.title;
          return acc;
        }, {});

        // Set legacy dashboard data (incoming HEAD version)
        setScoreDistribution(distData);
        setAtRiskStudents(riskData);
        setRecentWarnings(warningsData);
        setClassStats(statsData);
        setExamStatistics(examStatsData);
        if (examStatsData.length > 0 && !selectedExamId) {
          setSelectedExamId(examStatsData[0].examId);
        }

        // Set current version data
        setStudents(studentList.filter((student) => student.isJoining));
        setClassroomQuizzes(sortedClassroomQuizzes);
        setAttemptsByStudent(Object.fromEntries(attemptsEntries));
        setQuizNameMap(nameMap);
      } catch (err: unknown) {
        if (!active) {
          return;
        }

        const message =
          err && typeof err === "object" && "response" in err
            ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
            : null;

        setError(message || "Failed to load dashboard analytics");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void fetchDashboard();

    return () => {
      active = false;
    };
  }, [
    classId,
    getAllQuizzes,
    getAttemptsByStudent,
    getAtRiskStudents,
    getClassStats,
    getClassroomQuizzesByClassroom,
    getExamStatistics,
    getRecentWarnings,
    getScoreDistribution,
    getStudentsByClassId,
    selectedExamId,
  ]);

  const filteredClassroomQuizzes = useMemo(() => classroomQuizzes, [classroomQuizzes]);

  const studentSeries = useMemo<StudentScoreSeries[]>(() => {
    const classroomQuizIds = new Set(filteredClassroomQuizzes.map((q) => q.id));

    return students
      .map((student) => {
        const attempts = attemptsByStudent[student.studentId] ?? [];
        const attemptsByClassroomQuiz = attempts.reduce<Record<string, QuizAttempt[]>>((acc, attempt) => {
          if (!classroomQuizIds.has(attempt.classroomQuizId)) {
            return acc;
          }
          if (!acc[attempt.classroomQuizId]) {
            acc[attempt.classroomQuizId] = [];
          }
          acc[attempt.classroomQuizId].push(attempt);
          return acc;
        }, {});

        const points = filteredClassroomQuizzes.map((classroomQuiz) => {
          const quizAttempts = (attemptsByClassroomQuiz[classroomQuiz.id] ?? [])
            .filter((attempt) => attempt.status === "SUBMITTED" && attempt.finalScore != null)
            .sort((a, b) => b.attemptNumber - a.attemptNumber);

          if (quizAttempts.length === 0) {
            return null;
          }

          return Number(quizAttempts[0].finalScore);
        });

        const valid = points.filter((score): score is number => score != null);
        return {
          studentId: student.studentId,
          studentName: student.fullname,
          points,
          submittedCount: valid.length,
          averageScore:
            valid.length === 0 ? 0 : valid.reduce((sum, score) => sum + score, 0) / valid.length,
        };
      })
      .sort((a, b) => b.averageScore - a.averageScore);
  }, [attemptsByStudent, filteredClassroomQuizzes, students]);

  const globalMaxScore = useMemo(() => {
    const values = studentSeries.flatMap((series) =>
      series.points.filter((score): score is number => score != null),
    );
    const maxValue = values.length ? Math.max(...values) : 10;
    return Math.max(maxValue, 10);
  }, [studentSeries]);

  const classAverageSeries = useMemo(() => {
    if (filteredClassroomQuizzes.length === 0) {
      return [] as Array<number | null>;
    }

    return filteredClassroomQuizzes.map((_, index) => {
      const column = studentSeries
        .map((series) => series.points[index])
        .filter((score): score is number => score != null);

      if (column.length === 0) {
        return null;
      }

      return column.reduce((sum, score) => sum + score, 0) / column.length;
    });
  }, [filteredClassroomQuizzes, studentSeries]);

  // Show initial loading spinner only before first load attempt
  if (!hasLoadedOnce && (loading || legacyLoading)) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="xl" color="info" />
      </div>
    );
  }

  if (error || legacyError) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-900/20">
        <h3 className="mb-2 text-lg font-semibold text-red-700 dark:text-red-300">
          Dashboard Error
        </h3>
        <p className="text-sm text-red-600 dark:text-red-200">{error || legacyError}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-1">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {classroomName ? `${classroomName} Dashboard` : "Classroom Dashboard"}
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Overview of student performance and academic warnings
          </p>
        </div>
        <div className="flex items-center gap-3">
          <DefaultOutlineCustomButton
            label="Export Report"
            icon={<DocumentArrowDownIcon className="h-4 w-4" />}
          />
          <DefaultOutlineCustomButton
            label="Settings"
            icon={<Cog6ToothIcon className="h-4 w-4" />}
          />
        </div>
      </div>

      {/* Stats Cards (incoming HEAD version) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Students"
          value={totalStudents || students.length}
          changeLabel="in this class"
          trend="stable"
          className="bg-white dark:bg-gray-800"
        />
        <StatsCard
          title="Class Average"
          value={`${classAverage.toFixed(1)}/10`}
          changeLabel="overall"
          trend={
            classAverage >= 7
              ? "up"
              : classAverage >= 5
                ? "stable"
                : "down"
          }
          className="bg-white dark:bg-gray-800"
        />
        <StatsCard
          title="At Risk"
          value={`${totalAtRisk} (${atRiskPercentage.toFixed(0)}%)`}
          changeLabel="in this class"
          trend={totalAtRisk > 0 ? "down" : "stable"}
          variant={totalAtRisk > 0 ? "warning" : "default"}
          className="bg-white dark:bg-gray-800"
        />
        <StatsCard
          title="Warnings"
          value={totalWarnings}
          changeLabel="recent"
          trend="stable"
          className="bg-white dark:bg-gray-800"
        />
      </div>

      {/* Additional Metric Cards (current version) */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <MetricCard
          icon={<UserGroupIcon className="h-5 w-5" />}
          label="Active Students"
          value={students.length.toString()}
          accent="text-[#1F4E79]"
        />
        <MetricCard
          icon={<AcademicCapIcon className="h-5 w-5" />}
          label="Assessments (Quiz Phase 1)"
          value={filteredClassroomQuizzes.length.toString()}
          accent="text-[#C9A24D]"
        />
        <MetricCard
          icon={<ChartBarIcon className="h-5 w-5" />}
          label="Class Average (Attempts)"
          value={
            classAverageSeries.filter((x): x is number => x != null).length > 0
              ? (
                  classAverageSeries.filter((x): x is number => x != null).reduce((sum, score) => sum + score, 0) /
                  classAverageSeries.filter((x): x is number => x != null).length
                ).toFixed(2)
              : "N/A"
          }
          accent="text-emerald-600"
        />
      </div>

      {/* Score Distribution Chart (incoming HEAD version) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-1">
        <ScoreDistributionChart
          data={scoreDistribution}
          selectedMode={selectedMode}
          onModeChange={handleModeChange}
          loading={scoreDistLoading}
        />
      </div>

      {/* At Risk Students and Recent Warnings (incoming HEAD version) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <AtRiskStudentsList students={atRiskStudents} />
        <RecentWarningsList warnings={recentWarnings} />
      </div>

      {/* Exams statistics (incoming HEAD version) */}
      <ExamScoreStatisticsChart
        data={examStatistics}
        selectedExamId={selectedExamId}
        onExamChange={setSelectedExamId}
        loading={examStatsLoading}
      />

      {/* Class Average Trend Chart (current version) */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            Class Average Trend (Quiz Attempt FinalScore)
          </h3>
          <Badge color="info">Phase 1</Badge>
        </div>
        <LineChart
          points={classAverageSeries}
          labels={filteredClassroomQuizzes.map((item) => quizNameMap[item.quizId] ?? item.quizId)}
          maxY={globalMaxScore}
          strokeClassName="stroke-emerald-500"
        />
      </div>

      {/* Student Series Charts (current version) */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {studentSeries.map((series) => (
          <div
            key={series.studentId}
            className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800"
          >
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h4 className="text-base font-semibold text-gray-900 dark:text-white">
                  {series.studentName}
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {series.submittedCount} submitted / {filteredClassroomQuizzes.length} assessments
                </p>
              </div>
              <Badge color="purple">Avg: {series.averageScore.toFixed(2)}</Badge>
            </div>

            <LineChart
              points={series.points}
              labels={filteredClassroomQuizzes.map((item) => quizNameMap[item.quizId] ?? item.quizId)}
              maxY={globalMaxScore}
            />
          </div>
        ))}
      </div>

      {studentSeries.length === 0 && (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white py-10 text-center dark:border-gray-700 dark:bg-gray-800">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            No active student data found for this classroom.
          </p>
        </div>
      )}
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-2 flex items-center gap-2">
        <span className={accent}>{icon}</span>
        <span className="text-xs font-semibold tracking-wide text-gray-500 uppercase dark:text-gray-400">
          {label}
        </span>
      </div>
      <p className="text-2xl font-black text-gray-900 dark:text-white">{value}</p>
    </div>
  );
}

function LineChart({
  points,
  labels,
  maxY,
  strokeClassName = "stroke-[#1F4E79]",
}: {
  points: Array<number | null>;
  labels: string[];
  maxY: number;
  strokeClassName?: string;
}) {
  const width = 720;
  const height = 220;
  const padding = 24;
  const innerWidth = width - padding * 2;
  const innerHeight = height - padding * 2;

  if (points.length === 0) {
    return <p className="text-sm text-gray-500 dark:text-gray-400">No chart data.</p>;
  }

  const stepX = points.length === 1 ? 0 : innerWidth / (points.length - 1);
  const pointsWithCoord = points.map((score, index) => {
    const x = padding + index * stepX;
    if (score == null) {
      return { x, y: null as number | null, score: null as number | null };
    }
    const ratio = maxY <= 0 ? 0 : score / maxY;
    const y = padding + innerHeight - ratio * innerHeight;
    return { x, y, score };
  });

  const segments: Array<string> = [];
  let current: Array<{ x: number; y: number }> = [];
  for (const point of pointsWithCoord) {
    if (point.y == null) {
      if (current.length >= 2) {
        segments.push(current.map((p) => `${p.x},${p.y}`).join(" "));
      }
      current = [];
      continue;
    }
    current.push({ x: point.x, y: point.y });
  }
  if (current.length >= 2) {
    segments.push(current.map((p) => `${p.x},${p.y}`).join(" "));
  }

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-52 min-w-160 w-full">
        <line
          x1={padding}
          y1={height - padding}
          x2={width - padding}
          y2={height - padding}
          className="stroke-gray-300 dark:stroke-gray-600"
          strokeWidth="1"
        />
        <line
          x1={padding}
          y1={padding}
          x2={padding}
          y2={height - padding}
          className="stroke-gray-300 dark:stroke-gray-600"
          strokeWidth="1"
        />

        {segments.map((segment, idx) => (
          <polyline
            key={idx}
            points={segment}
            fill="none"
            strokeWidth="2.5"
            className={strokeClassName}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}

        {pointsWithCoord.map((point, idx) => {
          if (point.y == null) {
            return null;
          }
          return (
            <g key={idx}>
              <circle
                cx={point.x}
                cy={point.y}
                r="3.4"
                className="fill-white stroke-[#1F4E79] dark:fill-gray-900"
                strokeWidth="2"
              />
              <title>{`${labels[idx] ?? `Assessment ${idx + 1}`}: ${point.score?.toFixed(2)}`}</title>
            </g>
          );
        })}

        {labels.map((label, idx) => {
          const x = padding + idx * stepX;
          return (
            <text
              key={idx}
              x={x}
              y={height - 8}
              textAnchor="middle"
              className="fill-gray-500 text-[9px] dark:fill-gray-400"
            >
              {truncateLabel(label)}
            </text>
          );
        })}

        <text
          x={padding - 6}
          y={padding + 4}
          textAnchor="end"
          className="fill-gray-500 text-[10px] dark:fill-gray-400"
        >
          {maxY.toFixed(0)}
        </text>
        <text
          x={padding - 6}
          y={height - padding + 4}
          textAnchor="end"
          className="fill-gray-500 text-[10px] dark:fill-gray-400"
        >
          0
        </text>
      </svg>
    </div>
  );
}

function truncateLabel(label: string): string {
  if (label.length <= 10) {
    return label;
  }
  return `${label.slice(0, 9)}…`;
}

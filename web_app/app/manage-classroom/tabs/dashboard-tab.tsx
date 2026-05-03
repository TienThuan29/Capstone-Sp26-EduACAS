"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Badge } from "flowbite-react";
import {
  ChartBarIcon,
  AcademicCapIcon,
  UserGroupIcon,
  DocumentArrowDownIcon,
  Cog6ToothIcon,
  TableCellsIcon,
} from "@heroicons/react/24/outline";
import { useStudentClassroom } from "@/hooks/classroom/useStudentClassroom";
import { useClassroomQuiz } from "@/hooks/quiz/useClassroomQuiz";
import { useQuiz } from "@/hooks/quiz/useQuiz";
import { useQuizAttempt } from "@/hooks/quiz/useQuizAttempt";
import { useClassroomDashboard } from "@/hooks/dashboard/useClassroomDashboard";
import { DefaultOutlineCustomButton } from "@/components/ui/custom-button";
import { StatsCard } from "@/components/classroom-dashboard/cards/StatsCard";
import { ScoreDistributionChart } from "@/components/classroom-dashboard/charts/ScoreDistributionChart";
import type { ScoreMode } from "@/components/classroom-dashboard/charts/ScoreDistributionChart";
import { ExamScoreStatisticsChart } from "@/components/classroom-dashboard/charts/ExamScoreStatisticsChart";
import { LineChart } from "@/components/classroom-dashboard/charts/LineChart";
import { PracticalStatisticsSection } from "@/components/classroom-dashboard/sections/PracticalStatisticsSection";
import { ExaminationStatisticsSection } from "@/components/classroom-dashboard/sections/ExaminationStatisticsSection";
import { QuizStatisticsSection } from "@/components/classroom-dashboard/sections/QuizStatisticsSection";
import { AtRiskStudentsList } from "@/components/classroom-dashboard/lists/AtRiskStudentsList";
import { RecentWarningsList } from "@/components/classroom-dashboard/lists/RecentWarningsList";
import { StudentDashboardSkeleton } from "@/components/ui/skeletons";
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

type DashboardSubTab = "overview" | "exam" | "quiz";

const SUB_TABS: { id: DashboardSubTab; label: string; icon: ReactNode }[] = [
  { id: "overview", label: "Overview", icon: <ChartBarIcon className="h-4 w-4" /> },
  { id: "exam", label: "Exam Statistics", icon: <TableCellsIcon className="h-4 w-4" /> },
  { id: "quiz", label: "Quiz Statistics", icon: <AcademicCapIcon className="h-4 w-4" /> },
];

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
  const [selectedMode, setSelectedMode] = useState<ScoreMode>("ALL");
  const [scoreDistLoading, setScoreDistLoading] = useState(false);
  const [atRiskStudents, setAtRiskStudents] = useState<AtRiskStudent[]>([]);
  const [recentWarnings, setRecentWarnings] = useState<RecentWarning[]>([]);
  const [classStats, setClassStats] = useState<ClassStats[]>([]);
  const [examStatistics, setExamStatistics] = useState<ExamScoreStatistics[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [examStatsLoading, setExamStatsLoading] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<DashboardSubTab>("overview");

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
  const loadScoreDistribution = async (mode: ScoreMode) => {
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
  const handleModeChange = (mode: ScoreMode) => {
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
          getExamStatistics(classId, undefined, "EXAMINATION"),
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
    return <StudentDashboardSkeleton />;
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

      {/* Sub-tab navigation */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-700 pb-px">
        {SUB_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              activeSubTab === tab.id
                ? "border-b-2 border-[#1F4E79] text-[#1F4E79] dark:border-[#C9A24D] dark:text-[#C9A24D]"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* ===== Overview Tab ===== */}
      {activeSubTab === "overview" && (
        <>
          {/* Stats Cards */}
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

          {/* Additional Metric Cards */}
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
            {/* <MetricCard
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
            /> */}
          </div>

          {/* Score Distribution Chart (ALL modes) */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-1">
            <ScoreDistributionChart
              data={scoreDistribution}
              selectedMode={selectedMode}
              onModeChange={handleModeChange}
              loading={scoreDistLoading}
            />
          </div>

          {/* At Risk Students and Recent Warnings */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <AtRiskStudentsList students={atRiskStudents} />
            <RecentWarningsList warnings={recentWarnings} />
          </div>
        </>
      )}

      {/* ===== Exam Tab ===== */}
      {activeSubTab === "exam" && (
        <>
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
              trend={classAverage >= 7 ? "up" : classAverage >= 5 ? "stable" : "down"}
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

          {/* Exams statistics */}
          <ExamScoreStatisticsChart
            data={examStatistics}
            selectedExamId={selectedExamId}
            onExamChange={setSelectedExamId}
            loading={examStatsLoading}
          />

          {/* Score Distribution (filtered EXAM) */}
          <ScoreDistributionChart
            data={scoreDistribution}
            selectedMode="EXAMINATION"
            onModeChange={() => {}}
            loading={scoreDistLoading}
            showModeSelector={false}
          />

          {/* EXAMINATION Statistics Section */}
          <ExaminationStatisticsSection classId={classId} students={students} />

          {/* PRACTICAL Statistics Section */}
          <PracticalStatisticsSection classId={classId} students={students} />
        </>
      )}

      {/* ===== Quiz Tab ===== */}
      {activeSubTab === "quiz" && (
        <QuizStatisticsSection
          classroomQuizzes={classroomQuizzes}
          attemptsByStudent={attemptsByStudent}
          students={students}
          scoreDistribution={scoreDistribution}
          scoreDistLoading={scoreDistLoading}
          quizNameMap={quizNameMap}
        />
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



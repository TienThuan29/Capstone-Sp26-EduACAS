"use client";

import { useEffect, useState } from "react";
import { Badge } from "flowbite-react";
import {
  ChartBarIcon,
  AcademicCapIcon,
  UserGroupIcon,
  DocumentArrowDownIcon,
} from "@heroicons/react/24/outline";
import { useClassroomDashboard } from "@/hooks/dashboard/useClassroomDashboard";
import { StatsCard } from "@/components/classroom-dashboard/cards/StatsCard";
import { ScoreDistributionChart, ExamMode } from "@/components/classroom-dashboard/charts/ScoreDistributionChart";
import { ExamScoreStatisticsChart } from "@/components/classroom-dashboard/charts/ExamScoreStatisticsChart";
import { AtRiskStudentsList } from "@/components/classroom-dashboard/lists/AtRiskStudentsList";
import { RecentWarningsList } from "@/components/classroom-dashboard/lists/RecentWarningsList";
import { DashboardTabSkeleton } from "@/components/ui/skeletons/DashboardTabSkeleton";
import type {
  ScoreDistribution,
  AtRiskStudent,
  RecentWarning,
  ClassStats,
  ExamScoreStatistics,
} from "@/types/dashboard/DashboardStats";

type AdminClassDashboardTabProps = {
  classId: string;
  classroomName?: string;
};

export function AdminClassDashboardTab({
  classId,
  classroomName,
}: AdminClassDashboardTabProps) {
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
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  const [scoreDistribution, setScoreDistribution] = useState<ScoreDistribution[]>([]);
  const [selectedMode, setSelectedMode] = useState<ExamMode | "ALL">("ALL");
  const [scoreDistLoading, setScoreDistLoading] = useState(false);
  const [atRiskStudents, setAtRiskStudents] = useState<AtRiskStudent[]>([]);
  const [recentWarnings, setRecentWarnings] = useState<RecentWarning[]>([]);
  const [classStats, setClassStats] = useState<ClassStats[]>([]);
  const [examStatistics, setExamStatistics] = useState<ExamScoreStatistics[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [examStatsLoading, setExamStatsLoading] = useState(false);

  const totalStudents = classStats.reduce((sum, cls) => sum + cls.totalStudents, 0);
  const classAverage =
    classStats.length > 0
      ? classStats.reduce((sum, cls) => sum + cls.classAverage, 0) / classStats.length
      : 0;
  const totalAtRisk = classStats.reduce((sum, cls) => sum + cls.atRiskCount, 0);
  const atRiskPercentage = totalStudents > 0 ? (totalAtRisk / totalStudents) * 100 : 0;
  const totalWarnings = recentWarnings.length;

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

  const handleModeChange = (mode: ExamMode | "ALL") => {
    setSelectedMode(mode);
    void loadScoreDistribution(mode);
  };

  useEffect(() => {
    let active = true;

    const fetchDashboard = async () => {
      if (!classId) {
        if (!active) return;
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        setHasLoadedOnce(true);

        const [distData, riskData, warningsData, statsData, examStatsData] =
          await Promise.all([
            getScoreDistribution(),
            getAtRiskStudents(10),
            getRecentWarnings(10),
            getClassStats(classId),
            getExamStatistics(classId),
          ]);

        if (!active) return;

        setScoreDistribution(distData);
        setAtRiskStudents(riskData);
        setRecentWarnings(warningsData);
        setClassStats(statsData);
        setExamStatistics(examStatsData);

        if (examStatsData.length > 0 && !selectedExamId) {
          setSelectedExamId(examStatsData[0].examId);
        }
      } catch (err: unknown) {
        if (!active) return;

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
  }, [classId, getAtRiskStudents, getClassStats, getExamStatistics, getRecentWarnings, getScoreDistribution, selectedExamId]);

  if (!hasLoadedOnce && (loading || legacyLoading)) {
    return <DashboardTabSkeleton />;
  }

  if (error || legacyError) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-900/20">
        <h3 className="mb-2 text-lg font-semibold text-red-700 dark:text-red-300">
          Dashboard Error
        </h3>
        <p className="text-sm text-red-600 dark:text-red-200">
          {error || legacyError}
        </p>
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
          <button className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700">
            <DocumentArrowDownIcon className="h-4 w-4" />
            Export Report
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Students"
          value={totalStudents}
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
          value={totalStudents.toString()}
          accent="text-[#1F4E79]"
        />
        <MetricCard
          icon={<AcademicCapIcon className="h-5 w-5" />}
          label="Total Exams"
          value={examStatistics.length.toString()}
          accent="text-[#C9A24D]"
        />
        <MetricCard
          icon={<ChartBarIcon className="h-5 w-5" />}
          label="Overall Pass Rate"
          value={
            examStatistics.length > 0
              ? (
                  examStatistics.reduce((sum, e) => sum + e.passRate, 0) /
                  examStatistics.length
                ).toFixed(1)
              : "N/A"
          }
          accent="text-emerald-600"
        />
      </div>

      {/* Score Distribution Chart */}
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

      {/* Exam Statistics */}
      <ExamScoreStatisticsChart
        data={examStatistics}
        selectedExamId={selectedExamId}
        onExamChange={setSelectedExamId}
        loading={examStatsLoading}
      />
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
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

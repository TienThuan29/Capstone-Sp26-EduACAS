"use client";

import { useEffect, useState, useCallback } from "react";
import { Spinner } from "flowbite-react";
import { StatsCard } from "@/components/classroom-dashboard/cards/StatsCard";
import { ScoreDistributionChart, ExamMode } from "@/components/classroom-dashboard/charts/ScoreDistributionChart";
import { ExamScoreStatisticsChart } from "@/components/classroom-dashboard/charts/ExamScoreStatisticsChart";
import { AtRiskStudentsList } from "@/components/classroom-dashboard/lists/AtRiskStudentsList";
import { RecentWarningsList } from "@/components/classroom-dashboard/lists/RecentWarningsList";
import { useClassroomDashboard } from "@/hooks/dashboard/useClassroomDashboard";
import { DefaultOutlineCustomButton } from "@/components/ui/custom-button";
import { DocumentArrowDownIcon, Cog6ToothIcon } from "@heroicons/react/24/outline";
import {
  ScoreDistribution,
  AtRiskStudent,
  RecentWarning,
  ClassStats,
  ExamScoreStatistics,
} from "@/types/dashboard/DashboardStats";

interface DashboardTabProps {
  classroomId: string;
  classroomName?: string;
}

export function DashboardTab({ classroomId, classroomName }: DashboardTabProps) {
  const {
    loading,
    error,
    getScoreDistribution,
    getAtRiskStudents,
    getRecentWarnings,
    getClassStats,
    getExamStatistics,
  } = useClassroomDashboard(classroomId);

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
  const loadScoreDistribution = useCallback(async (mode: ExamMode | "ALL") => {
    setScoreDistLoading(true);
    try {
      const modeParam = mode === "ALL" ? undefined : mode;
      const data = await getScoreDistribution(classroomId, modeParam);
      setScoreDistribution(data);
    } finally {
      setScoreDistLoading(false);
    }
  }, [classroomId, getScoreDistribution]);

  useEffect(() => {
    const loadData = async () => {
      setHasLoadedOnce(true);

      const [distData, riskData, warningsData, statsData] = await Promise.all([
        getScoreDistribution(),
        getAtRiskStudents(5),
        getRecentWarnings(5),
        getClassStats(classroomId),
      ]);

      setScoreDistribution(distData);
      setAtRiskStudents(riskData);
      setRecentWarnings(warningsData);
      setClassStats(statsData);
    };

    if (classroomId) {
      loadData();
    }
  }, [classroomId, getScoreDistribution, getAtRiskStudents, getRecentWarnings, getClassStats]);

  // Handle mode change
  const handleModeChange = useCallback((mode: ExamMode | "ALL") => {
    setSelectedMode(mode);
    loadScoreDistribution(mode);
  }, [loadScoreDistribution]);

  useEffect(() => {
    const loadExamStatistics = async () => {
      setExamStatsLoading(true);
      try {
        const data = await getExamStatistics(classroomId);
        setExamStatistics(data);
        if (data.length > 0 && !selectedExamId) {
          setSelectedExamId(data[0].examId);
        }
      } finally {
        setExamStatsLoading(false);
      }
    };

    if (classroomId) {
      loadExamStatistics();
    }
  }, [classroomId, getExamStatistics]);

  // Show initial loading spinner only before first load attempt
  if (!hasLoadedOnce && loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="xl" color="info" />
      </div>
    );
  }

  // Show error if there's an error
  if (error) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-red-600 dark:text-red-400">{error}</p>
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

      {/* Exams statistics */}
      <ExamScoreStatisticsChart
        data={examStatistics}
        selectedExamId={selectedExamId}
        onExamChange={setSelectedExamId}
        loading={examStatsLoading}
      />
    </div>
  );
}

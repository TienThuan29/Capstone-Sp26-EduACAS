"use client";

import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import {
  UsersIcon,
  CheckCircleIcon,
  TrophyIcon,
  ArrowTrendingUpIcon,
} from "@heroicons/react/24/outline";
import { Spinner } from "flowbite-react";
import { getScoreColor } from "@/types/dashboard/scoreColors";
import type { ExamScoreStatistics } from "@/types/dashboard/DashboardStats";

interface ExamScoreStatisticsChartProps {
  data: ExamScoreStatistics[];
  selectedExamId: string | null;
  onExamChange: (examId: string | null) => void;
  loading?: boolean;
}

export function ExamScoreStatisticsChart({
  data,
  selectedExamId,
  onExamChange,
  loading = false,
}: ExamScoreStatisticsChartProps) {
  const selectedExam = data.find((exam) => exam.examId === selectedExamId) || data[0];

  const radarData = selectedExam
    ? [
        { metric: "Average", value: (selectedExam.averageScore / selectedExam.totalMark) * 100 },
        { metric: "Highest", value: (selectedExam.highestScore / selectedExam.totalMark) * 100 },
        { metric: "Median", value: (selectedExam.medianScore / selectedExam.totalMark) * 100 },
        { metric: "Pass Rate", value: selectedExam.passRate },
        { metric: "Submission", value: selectedExam.submissionRate },
      ]
    : [];

  return (
    <div className="rounded-md border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      {/* Header with Select */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Exam Score Statistics
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Detailed performance metrics for each examination
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Select Exam:
          </label>
          <select
            value={selectedExamId || ""}
            onChange={(e) => onExamChange(e.target.value || null)}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          >
            <option value="">All Exams</option>
            {data.map((exam) => (
              <option key={exam.examId} value={exam.examId}>
                {exam.examName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Spinner size="xl" color="info" />
        </div>
      ) : data.length === 0 ? (
        <div className="flex h-64 items-center justify-center">
          <p className="text-gray-500 dark:text-gray-400">
            No exam statistics available
          </p>
        </div>
      ) : !selectedExam ? (
        <div className="flex h-64 items-center justify-center">
          <p className="text-gray-500 dark:text-gray-400">
            Select an exam to view statistics
          </p>
        </div>
      ) : (
        <>
          {/* Stats Cards Row */}
          <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-md border border-gray-100 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-700/30">
              <div className="flex items-center gap-2">
                <UsersIcon className="h-5 w-5 text-gray-400" />
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Submissions
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {selectedExam.totalSubmissions}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  / {selectedExam.totalStudents}
                </span>
              </div>
              <div className="mt-1">
                <span className="text-xs font-medium text-green-600 dark:text-green-400">
                  {selectedExam.submissionRate}% submitted
                </span>
              </div>
            </div>

            <div className="rounded-md border border-gray-100 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-700/30">
              <div className="flex items-center gap-2">
                <ArrowTrendingUpIcon className="h-5 w-5 text-blue-400" />
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Average Score
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {selectedExam.averageScore.toFixed(1)}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  / {selectedExam.totalMark}
                </span>
              </div>
              <div className="mt-1">
                <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                  Median: {selectedExam.medianScore.toFixed(1)}
                </span>
              </div>
            </div>

            <div className="rounded-md border border-gray-100 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-700/30">
              <div className="flex items-center gap-2">
                <TrophyIcon className="h-5 w-5 text-yellow-500" />
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Highest Score
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {selectedExam.highestScore.toFixed(1)}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  / {selectedExam.totalMark}
                </span>
              </div>
              <div className="mt-1">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Lowest: {selectedExam.lowestScore.toFixed(1)}
                </span>
              </div>
            </div>

            <div className="rounded-md border border-gray-100 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-700/30">
              <div className="flex items-center gap-2">
                <CheckCircleIcon className="h-5 w-5 text-green-500" />
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Pass Rate
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {selectedExam.passRate.toFixed(1)}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">%</span>
              </div>
              <div className="mt-1">
                <span
                  className={`text-xs font-medium ${
                    selectedExam.passRate >= 70
                      ? "text-green-600 dark:text-green-400"
                      : selectedExam.passRate >= 50
                        ? "text-yellow-600 dark:text-yellow-400"
                        : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {selectedExam.passRate >= 70
                    ? "Good"
                    : selectedExam.passRate >= 50
                      ? "Needs Improvement"
                      : "Critical"}
                </span>
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Score Distribution Bar Chart */}
            <div>
              <h4 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                Score Distribution
              </h4>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart
                  data={selectedExam.scoreDistribution}
                  margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
                >
                  <XAxis
                    dataKey="range"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    formatter={(value) => [`${value} students`, "Students"]}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "none",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {selectedExam.scoreDistribution.map((entry, index) => (
                      <Cell key={index} fill={getScoreColor(entry.range)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              {/* Legend */}
              <div className="mt-3 flex flex-wrap justify-center gap-4">
                {selectedExam.scoreDistribution.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-md"
                      style={{ backgroundColor: getScoreColor(item.range) }}
                    />
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {item.range}: {item.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Performance Radar Chart */}
            <div>
              <h4 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                Performance Overview
              </h4>
              <ResponsiveContainer width="100%" height={240}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#374151" />
                  <PolarAngleAxis
                    dataKey="metric"
                    tick={{ fontSize: 12, fill: "#9CA3AF" }}
                  />
                  <PolarRadiusAxis
                    angle={90}
                    domain={[0, 100]}
                    tick={{ fontSize: 10, fill: "#9CA3AF" }}
                  />
                  <Radar
                    name="Performance"
                    dataKey="value"
                    stroke="#3B82F6"
                    fill="#3B82F6"
                    fillOpacity={0.4}
                  />
                  <Tooltip
                    formatter={(value) => [`${Number(value).toFixed(1)}%`, "Performance"]}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "none",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
              {/* Legend */}
              <div className="mt-3 flex flex-wrap justify-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-md bg-blue-500" />
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    Performance Score
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Exam Info */}
          <div className="mt-6 rounded-md border border-gray-100 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-700/30">
            <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
              <div>
                <span className="text-gray-500 dark:text-gray-400">Exam Name:</span>
                <p className="mt-1 font-medium text-gray-900 dark:text-white">
                  {selectedExam.examName}
                </p>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Total Mark:</span>
                <p className="mt-1 font-medium text-gray-900 dark:text-white">
                  {selectedExam.totalMark}
                </p>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Start Date:</span>
                <p className="mt-1 font-medium text-gray-900 dark:text-white">
                  {new Date(selectedExam.startDatetime).toLocaleDateString()}
                </p>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">End Date:</span>
                <p className="mt-1 font-medium text-gray-900 dark:text-white">
                  {new Date(selectedExam.endDatetime).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

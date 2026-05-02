"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { ArrowTrendingUpIcon, TrophyIcon, FireIcon } from "@heroicons/react/24/outline";
import { Spinner } from "flowbite-react";
import type { SubmissionResponse } from "@/types/submission";

interface ProblemScoreProgressChartProps {
  submissions: SubmissionResponse[];
  maxMark: number;
  problemTitle: string;
  loading?: boolean;
}

export function ProblemScoreProgressChart({
  submissions,
  maxMark,
  problemTitle,
  loading = false,
}: ProblemScoreProgressChartProps) {
  const chartData = [...submissions]
    .reverse()
    .map((sub, index) => ({
      attempt: index + 1,
      score: sub.finalScore,
      submittedDate: new Date(sub.submittedDate).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      }),
      status: sub.status,
    }));

  const maxScore = submissions.length > 0
    ? Math.max(...submissions.map((s) => s.finalScore))
    : 0;
  const firstScore = submissions.length > 0 ? submissions[submissions.length - 1].finalScore : 0;
  const latestScore = submissions.length > 0 ? submissions[0].finalScore : 0;
  const isImproving = latestScore > firstScore;
  const isPerfect = submissions.some((s) => s.finalScore >= maxMark);

  if (loading) {
    return (
      <div className="flex h-80 items-center justify-center">
        <Spinner size="xl" color="info" />
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
      <div className="flex h-80 flex-col items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
        <ArrowTrendingUpIcon className="h-12 w-12 text-gray-300 dark:text-gray-600" />
        <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
          No submissions yet for this problem.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">
          {problemTitle}
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Score progression across {submissions.length} submission{submissions.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Stats Row */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-3 rounded-md border border-gray-100 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-700/30">
          <ArrowTrendingUpIcon className="h-5 w-5 text-gray-400" />
          <div>
            <div className="text-xs font-medium text-gray-500 uppercase dark:text-gray-400">
              Best Score
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                {maxScore.toFixed(1)}
              </span>
              <span className="text-sm text-gray-500">/ {maxMark}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-md border border-gray-100 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-700/30">
          <FireIcon className="h-5 w-5 text-orange-400" />
          <div>
            <div className="text-xs font-medium text-gray-500 uppercase dark:text-gray-400">
              Latest Score
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                {latestScore.toFixed(1)}
              </span>
              <span className="text-sm text-gray-500">/ {maxMark}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-md border border-gray-100 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-700/30">
          <TrophyIcon
            className={`h-5 w-5 ${
              isPerfect ? "text-yellow-500" : "text-gray-400"
            }`}
          />
          <div>
            <div className="text-xs font-medium text-gray-500 uppercase dark:text-gray-400">
              Progress
            </div>
            <div className="flex items-baseline gap-1">
              {isImproving ? (
                <span className="text-lg font-bold text-green-600 dark:text-green-400">
                  +{(latestScore - firstScore).toFixed(1)}
                </span>
              ) : (
                <span className="text-lg font-bold text-gray-900 dark:text-white">
                  {(latestScore - firstScore).toFixed(1)}
                </span>
              )}
              <span className="text-sm text-gray-500">points</span>
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={280}>
        <LineChart
          data={chartData}
          margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#E5E7EB"
            className="dark:opacity-30"
          />
          <XAxis
            dataKey="attempt"
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            label={{
              value: "Submission #",
              position: "insideBottomRight",
              offset: -8,
              fontSize: 11,
              fill: "#9CA3AF",
            }}
          />
          <YAxis
            domain={[0, maxMark]}
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            label={{
              value: "Score",
              angle: -90,
              position: "insideLeft",
              fontSize: 11,
              fill: "#9CA3AF",
            }}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload || payload.length === 0) return null;
              const data = payload[0].payload;
              return (
                <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-md dark:border-gray-700 dark:bg-gray-800">
                  <p className="text-xs font-semibold text-gray-900 dark:text-white">
                    Attempt #{data.attempt}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Score: <span className="font-bold">{data.score.toFixed(1)}</span> / {maxMark}
                  </p>
                  <p className="text-xs text-gray-500">{data.submittedDate}</p>
                  <p className="text-xs text-gray-500 capitalize">
                    Status: <span className="font-medium">{data.status.toLowerCase()}</span>
                  </p>
                </div>
              );
            }}
          />
          <ReferenceLine
            y={maxMark}
            stroke="#22C55E"
            strokeDasharray="5 5"
            strokeWidth={1.5}
            label={{
              value: `Max: ${maxMark}`,
              position: "right",
              fontSize: 11,
              fill: "#22C55E",
            }}
          />
          <Line
            type="monotone"
            dataKey="score"
            stroke="#3B82F6"
            strokeWidth={2.5}
            dot={{ fill: "#3B82F6", strokeWidth: 0, r: 4 }}
            activeDot={{ r: 6, fill: "#2563EB" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

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
import { ArrowTrendingUpIcon, TrophyIcon } from "@heroicons/react/24/outline";
import type { QuizAttemptResponse } from "@/types/quiz";

interface QuizAttemptProgressChartProps {
  attempts: QuizAttemptResponse[];
  studentName: string;
  quizName: string;
}

export function QuizAttemptProgressChart({
  attempts,
  studentName,
  quizName,
}: QuizAttemptProgressChartProps) {
  const chartData = [...attempts]
    .reverse()
    .map((attempt, index) => ({
      attempt: index + 1,
      score: attempt.score ?? 0,
      submittedDate: attempt.endTime
        ? new Date(attempt.endTime).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          })
        : "—",
      status: attempt.status,
    }));

  const maxScore = attempts.length > 0
    ? Math.max(...attempts.map((a) => a.score ?? 0), 10)
    : 10;

  const sortedByNumber = [...attempts].sort((a, b) => a.attemptNumber - b.attemptNumber);
  const bestScore = attempts.length > 0
    ? Math.max(...attempts.map((a) => a.score ?? 0))
    : 0;
  const latestScore = sortedByNumber.length > 0
    ? sortedByNumber[sortedByNumber.length - 1].score ?? 0
    : 0;
  const firstScore = sortedByNumber.length > 0
    ? sortedByNumber[0].score ?? 0
    : 0;
  const isImproving = latestScore > firstScore;
  const isPerfect = attempts.some((a) => (a.score ?? 0) >= 10);

  if (attempts.length === 0) {
    return (
      <div className="flex h-48 flex-col items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
        <ArrowTrendingUpIcon className="h-10 w-10 text-gray-300 dark:text-gray-600" />
        <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
          No attempts yet for this quiz.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">
          {quizName}
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Score progression across {attempts.length} attempt{attempts.length !== 1 ? "s" : ""} — {studentName}
        </p>
      </div>

      {/* Stats Row */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-3 rounded-md border border-gray-100 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-700/30">
          <ArrowTrendingUpIcon className="h-5 w-5 text-gray-400" />
          <div>
            <div className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
              Best Score
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                {bestScore.toFixed(1)}
              </span>
              <span className="text-sm text-gray-500">/ 10</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-md border border-gray-100 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-700/30">
          <svg className="h-5 w-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <div className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
              Latest Score
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                {latestScore.toFixed(1)}
              </span>
              <span className="text-sm text-gray-500">/ 10</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-md border border-gray-100 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-700/30">
          <TrophyIcon
            className={`h-5 w-5 ${isPerfect ? "text-yellow-500" : "text-gray-400"}`}
          />
          <div>
            <div className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
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
              value: "Attempt #",
              position: "insideBottomRight",
              offset: -8,
              fontSize: 11,
              fill: "#9CA3AF",
            }}
          />
          <YAxis
            domain={[0, maxScore]}
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
                    Score: <span className="font-bold">{data.score.toFixed(1)}</span> / 10
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
            y={10}
            stroke="#22C55E"
            strokeDasharray="5 5"
            strokeWidth={1.5}
            label={{
              value: "Max: 10",
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

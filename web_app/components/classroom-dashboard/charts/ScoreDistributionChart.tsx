"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { getScoreColor } from "@/types/dashboard/scoreColors";
import type { ScoreDistribution } from "@/types/dashboard/DashboardStats";

export type ExamMode = "EXAMINATION" | "PRACTICAL" | "QUIZ";
export type ScoreMode = ExamMode | "ALL";

interface ScoreDistributionChartProps {
  data: ScoreDistribution[];
  title?: string;
  selectedMode: ScoreMode;
  onModeChange: (mode: ScoreMode) => void;
  loading?: boolean;
  showModeSelector?: boolean;
}

const MODE_OPTIONS: { value: ScoreMode; label: string }[] = [
  { value: "ALL", label: "All Submissions" },
  { value: "EXAMINATION", label: "Examination" },
  { value: "PRACTICAL", label: "Practical" },
  { value: "QUIZ", label: "Quiz" },
];

export function ScoreDistributionChart({
  data,
  title = "Score Distribution",
  selectedMode,
  onModeChange,
  loading = false,
  showModeSelector = true,
}: ScoreDistributionChartProps) {
  return (
    <div className="rounded-md border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      {/* Header with Select */}
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {title}
        </h3>
        {showModeSelector && (
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Mode:
            </label>
            <select
              value={selectedMode}
              onChange={(e) => onModeChange(e.target.value as ScoreMode)}
              disabled={loading}
              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              {MODE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={192}>
            <BarChart data={data} margin={{ top: 0, right: 0, left: -24, bottom: 0 }}>
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
                {data.map((entry, index) => (
                  <Cell key={index} fill={getScoreColor(entry.range)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 flex flex-wrap gap-4">
            {data.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div
                  className="h-3 w-3 rounded-md"
                  style={{ backgroundColor: getScoreColor(item.range) }}
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {item.range}: {item.count}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

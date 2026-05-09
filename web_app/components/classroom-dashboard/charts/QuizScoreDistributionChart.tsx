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

interface QuizScoreDistributionChartProps {
  data: ScoreDistribution[];
  title?: string;
  loading?: boolean;
}

export function QuizScoreDistributionChart({
  data,
  title = "Quiz Score Distribution",
  loading = false,
}: QuizScoreDistributionChartProps) {
  const hasData = data.length > 0 && data.some((d) => d.count > 0);

  return (
    <div className="rounded-md border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
        {title}
      </h3>

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
        </div>
      ) : !hasData ? (
        <div className="flex h-48 items-center justify-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No quiz submissions to display.
          </p>
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

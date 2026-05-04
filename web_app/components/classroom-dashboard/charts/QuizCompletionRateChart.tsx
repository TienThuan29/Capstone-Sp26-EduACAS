"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface QuizDataPoint {
  quizName: string;
  submissionCount: number;
  studentCount: number;
  completionRate: number;
  avgScore: number | null;
}

interface QuizCompletionRateChartProps {
  data: QuizDataPoint[];
  loading?: boolean;
}

export function QuizCompletionRateChart({
  data,
  loading = false,
}: QuizCompletionRateChartProps) {
  if (loading) {
    return (
      <div className="flex h-56 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <p className="flex h-56 items-center justify-center text-sm text-gray-500 dark:text-gray-400">
        No quiz data available.
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart
        data={data}
        margin={{ top: 8, right: 8, left: -16, bottom: 60 }}
        barCategoryGap="25%"
      >
        <XAxis
          dataKey="quizName"
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          angle={-30}
          textAnchor="end"
          height={60}
        />
        <YAxis
          yAxisId="left"
          domain={[0, 100]}
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `${v}%`}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          domain={[0, 10]}
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          content={({ active, payload, label }) => {
            if (!active || !payload || payload.length === 0) return null;
            const d = payload[0].payload as QuizDataPoint;
            return (
              <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                <p className="mb-1 font-semibold text-gray-900 dark:text-white">{label}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Completion: <span className="font-bold">{d.completionRate.toFixed(0)}%</span> ({d.submissionCount}/{d.studentCount})
                </p>
                {d.avgScore !== null && (
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Avg Score: <span className="font-bold">{d.avgScore.toFixed(2)}</span>
                  </p>
                )}
              </div>
            );
          }}
        />
        <Legend
          wrapperStyle={{ fontSize: 12 }}
          formatter={(value) =>
            value === "completionRate" ? "Completion Rate (%)" : "Avg Score (out of 10)"
          }
        />
        <Bar
          yAxisId="left"
          dataKey="completionRate"
          fill="#6366F1"
          radius={[4, 4, 0, 0]}
          name="completionRate"
        />
        <Bar
          yAxisId="right"
          dataKey="avgScore"
          fill="#F59E0B"
          radius={[4, 4, 0, 0]}
          name="avgScore"
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import { useThemeContext } from "@/components/theme-provider";
import type { SubmissionByLanguageResponse } from "@/types/admin/admin-stats";

interface SubmissionByLanguageChartProps {
  data: SubmissionByLanguageResponse | null;
  loading?: boolean;
}

const LANGUAGE_COLORS = [
  "#3B82F6",
  "#22C55E",
  "#F97316",
  "#8B5CF6",
  "#EF4444",
  "#FACC15",
  "#06B6D4",
  "#EC4899",
  "#10B981",
  "#6366F1",
];

export function SubmissionByLanguageChart({
  data,
  loading = false,
}: SubmissionByLanguageChartProps) {
  const { isDark } = useThemeContext();

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-500 border-t-transparent" />
      </div>
    );
  }

  if (!data || data.totalSubmissions === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>
          No submission data available
        </p>
      </div>
    );
  }

  const pieData = data.languageBreakdown.slice(0, 6).map((item, index) => ({
    name: item.languageName,
    value: item.totalSubmissions,
    fill: LANGUAGE_COLORS[index % LANGUAGE_COLORS.length],
  }));

  const barData = data.languageBreakdown.map((item, index) => ({
    name: item.languageName.length > 12 ? item.languageName.slice(0, 12) + "..." : item.languageName,
    submissions: item.totalSubmissions,
    percentage: item.percentage,
    fill: LANGUAGE_COLORS[index % LANGUAGE_COLORS.length],
  }));

  const tooltipStyle = {
    borderRadius: "8px",
    border: "none",
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Pie Chart - Distribution */}
        <div
          className={`rounded-xl border p-5 ${
            isDark
              ? "border-gray-700 bg-gray-800"
              : "border-gray-200 bg-white"
          }`}
        >
          <h4
            className={`mb-4 text-sm font-semibold ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            Language Distribution
          </h4>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={75}
                paddingAngle={3}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={index} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name) => [`${value} submissions`, name]}
                contentStyle={tooltipStyle}
              />
            </PieChart>
          </ResponsiveContainer>
          {/* Legend */}
          <div className="mt-3 flex flex-wrap justify-center gap-3">
            {pieData.map((item) => (
              <div key={item.name} className="flex items-center gap-1.5">
                <div
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: item.fill }}
                />
                <span
                  className={`text-xs ${isDark ? "text-gray-400" : "text-gray-600"}`}
                >
                  {item.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Bar Chart - Submissions Count */}
        <div
          className={`rounded-xl border p-5 ${
            isDark
              ? "border-gray-700 bg-gray-800"
              : "border-gray-200 bg-white"
          }`}
        >
          <h4
            className={`mb-4 text-sm font-semibold ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            Submissions by Language
          </h4>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barData} layout="vertical" margin={{ left: 10, right: 10 }}>
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 11 }}
                width={90}
              />
              <Tooltip
                formatter={(value) => [`${value} submissions`, "Count"]}
                contentStyle={tooltipStyle}
              />
              <Bar dataKey="submissions" radius={[0, 4, 4, 0]}>
                {barData.map((entry, index) => (
                  <Cell key={index} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Table */}
      {data.languageBreakdown.length > 0 && (
        <div
          className={`rounded-xl border ${
            isDark ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"
          }`}
        >
          <div className="p-5 pb-3">
            <h4
              className={`text-sm font-semibold ${
                isDark ? "text-white" : "text-gray-900"
              }`}
            >
              Language Performance Details
            </h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead
                className={
                  isDark ? "bg-gray-700/50 text-gray-400" : "bg-gray-50 text-gray-500"
                }
              >
                <tr>
                  <th className="px-5 py-2 font-medium">#</th>
                  <th className="px-5 py-2 font-medium">Language</th>
                  <th className="px-5 py-2 font-medium text-right">Submissions</th>
                  <th className="px-5 py-2 font-medium text-right">% Share</th>
                  <th className="px-5 py-2 font-medium text-right">Students</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {data.languageBreakdown.map((item, index) => (
                  <tr
                    key={item.languageId}
                    className={`${
                      isDark ? "hover:bg-gray-700/50" : "hover:bg-gray-50"
                    } transition-colors`}
                  >
                    <td
                      className={`px-5 py-3 ${
                        isDark ? "text-gray-500" : "text-gray-400"
                      }`}
                    >
                      {index + 1}
                    </td>
                    <td className={`px-5 py-3 ${isDark ? "text-gray-200" : "text-gray-900"}`}>
                      <div className="flex items-center gap-2">
                        <div
                          className="h-2.5 w-2.5 rounded-full"
                          style={{
                            backgroundColor:
                              LANGUAGE_COLORS[index % LANGUAGE_COLORS.length],
                          }}
                        />
                        <span className="font-medium">{item.languageName}</span>
                      </div>
                    </td>
                    <td className={`px-5 py-3 text-right tabular-nums ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                      {item.totalSubmissions.toLocaleString("vi-VN")}
                    </td>
                    <td className={`px-5 py-3 text-right tabular-nums ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                      {item.percentage.toFixed(1)}%
                    </td>
                    <td className={`px-5 py-3 text-right tabular-nums ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                      {item.uniqueStudents.toLocaleString("vi-VN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

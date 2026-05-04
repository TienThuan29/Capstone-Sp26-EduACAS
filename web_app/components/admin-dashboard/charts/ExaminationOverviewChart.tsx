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
  Legend,
} from "recharts";
import { useThemeContext } from "@/components/theme-provider";
import type {
  AdminExaminationStatistics,
  ExaminationListItem,
} from "@/types/admin/admin-stats";

interface ExaminationOverviewChartProps {
  data: AdminExaminationStatistics | null;
  loading?: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  ONGOING: "#22C55E",
  COMPLETED: "#3B82F6",
  PENDING: "#FACC15",
};

const MODE_COLORS: Record<string, string> = {
  PRACTICAL: "#8B5CF6",
  EXAMINATION: "#F97316",
};

const STATUS_ORDER = ["ONGOING", "COMPLETED", "PENDING"];

export function ExaminationOverviewChart({
  data,
  loading = false,
}: ExaminationOverviewChartProps) {
  const { isDark } = useThemeContext();

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>
          No examination data available
        </p>
      </div>
    );
  }

  const statusData = STATUS_ORDER.map((status) => ({
    name: status.charAt(0) + status.slice(1).toLowerCase(),
    count:
      status === "ONGOING"
        ? data.activeExaminations
        : status === "COMPLETED"
          ? data.completedExaminations
          : data.pendingExaminations,
    fill: STATUS_COLORS[status],
  }));

  const modeData = [
    {
      name: "Practical",
      count: data.practicalExaminations,
      fill: MODE_COLORS.PRACTICAL,
    },
    {
      name: "Examination",
      count: data.examinationModeExaminations,
      fill: MODE_COLORS.EXAMINATION,
    },
  ];

  const total = data.totalExaminations || 1;

  return (
    <div className="space-y-6">
      {/* Status and Mode Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Status Breakdown */}
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
            Examination Status
          </h4>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={statusData} layout="vertical" margin={{ left: 20 }}>
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={90} />
              <Tooltip
                formatter={(value) => [`${value} exams`, "Count"]}
                contentStyle={{
                  borderRadius: "8px",
                  border: "none",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                }}
              />
              <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                {statusData.map((entry, index) => (
                  <Cell key={index} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          {/* Legend */}
          <div className="mt-3 flex flex-wrap justify-center gap-4">
            {statusData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div
                  className="h-3 w-3 rounded-sm"
                  style={{ backgroundColor: item.fill }}
                />
                <span
                  className={`text-xs ${isDark ? "text-gray-400" : "text-gray-600"}`}
                >
                  {item.name}: {item.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Mode Breakdown */}
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
            Examination Mode
          </h4>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={modeData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={4}
                dataKey="count"
              >
                {modeData.map((entry, index) => (
                  <Cell key={index} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => [`${value} exams`, "Count"]}
                contentStyle={{
                  borderRadius: "8px",
                  border: "none",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          {/* Legend */}
          <div className="mt-3 flex flex-wrap justify-center gap-4">
            {modeData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div
                  className="h-3 w-3 rounded-sm"
                  style={{ backgroundColor: item.fill }}
                />
                <span
                  className={`text-xs ${isDark ? "text-gray-400" : "text-gray-600"}`}
                >
                  {item.name}: {item.count} (
                  {total > 0
                    ? Math.round((item.count / total) * 100)
                    : 0}
                  %)
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}

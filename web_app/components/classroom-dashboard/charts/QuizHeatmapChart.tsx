"use client";

interface QuizHeatmapChartProps {
  data: Array<{
    studentName: string;
    scores: Array<{ quizName: string; score: number | null }>;
  }>;
  maxScore: number;
}

function getHeatmapColor(score: number | null, maxScore: number): string {
  if (score === null) return "bg-gray-100 dark:bg-gray-700";
  const ratio = score / maxScore;
  if (ratio >= 0.9) return "bg-green-600";
  if (ratio >= 0.75) return "bg-green-400";
  if (ratio >= 0.6) return "bg-yellow-400";
  if (ratio >= 0.4) return "bg-orange-400";
  if (ratio >= 0.2) return "bg-orange-600";
  return "bg-red-500";
}

function getTextColor(score: number | null): string {
  if (score === null) return "text-gray-400 dark:text-gray-500";
  return "text-white font-semibold";
}

export function QuizHeatmapChart({ data, maxScore }: QuizHeatmapChartProps) {
  if (data.length === 0 || data[0].scores.length === 0) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400">No data available.</p>
    );
  }

  const quizNames = data[0].scores.map((s) => s.quizName);

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr>
            <th className="min-w-[120px] p-2 text-left font-semibold text-gray-700 dark:text-gray-300">
              Student
            </th>
            {quizNames.map((name) => (
              <th
                key={name}
                className="min-w-[70px] p-1 text-center font-medium text-gray-600 dark:text-gray-400"
              >
                <span className="block max-w-[70px] truncate" title={name}>
                  {name.length > 10 ? `${name.slice(0, 9)}…` : name}
                </span>
              </th>
            ))}
            <th className="min-w-[60px] p-2 text-center font-semibold text-gray-700 dark:text-gray-300">
              Avg
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => {
            const validScores = row.scores.filter((s) => s.score !== null);
            const avg =
              validScores.length > 0
                ? validScores.reduce((sum, s) => sum + (s.score ?? 0), 0) / validScores.length
                : null;

            return (
              <tr key={i} className="border-t border-gray-100 dark:border-gray-700">
                <td className="max-w-[150px] truncate p-2 font-medium text-gray-800 dark:text-gray-200">
                  {row.studentName}
                </td>
                {row.scores.map((cell, j) => (
                  <td key={j} className="p-1 text-center">
                    <div
                      className={`mx-auto flex h-8 w-full min-w-[50px] max-w-[70px] items-center justify-center rounded text-[10px] ${getHeatmapColor(cell.score, maxScore)} ${getTextColor(cell.score)}`}
                      title={`${row.studentName} — ${quizNames[j]}: ${
                        cell.score !== null ? cell.score.toFixed(1) : "No submission"
                      }`}
                    >
                      {cell.score !== null ? cell.score.toFixed(0) : "—"}
                    </div>
                  </td>
                ))}
                <td className="p-2 text-center">
                  {avg !== null ? (
                    <span className="rounded bg-blue-100 px-1.5 py-0.5 text-xs font-bold text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                      {avg.toFixed(1)}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">N/A</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
        <span>Score scale:</span>
        {[
          { label: "0–20%", color: "bg-red-500" },
          { label: "20–40%", color: "bg-orange-600" },
          { label: "40–60%", color: "bg-orange-400" },
          { label: "60–75%", color: "bg-yellow-400" },
          { label: "75–90%", color: "bg-green-400" },
          { label: "90–100%", color: "bg-green-600" },
          { label: "No sub", color: "bg-gray-100 dark:bg-gray-700" },
        ].map(({ label, color }) => (
          <span key={label} className="flex items-center gap-1">
            <span className={`inline-block h-3 w-3 rounded ${color}`} />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

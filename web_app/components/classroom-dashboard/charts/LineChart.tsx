"use client";

interface LineChartProps {
  points: Array<number | null>;
  labels: string[];
  maxY: number;
  strokeClassName?: string;
}

function truncateLabel(label: string): string {
  if (label.length <= 10) {
    return label;
  }
  return `${label.slice(0, 9)}…`;
}

export function LineChart({
  points,
  labels,
  maxY,
  strokeClassName = "stroke-[#1F4E79]",
}: LineChartProps) {
  const width = 720;
  const height = 220;
  const padding = 24;
  const innerWidth = width - padding * 2;
  const innerHeight = height - padding * 2;

  if (points.length === 0) {
    return <p className="text-sm text-gray-500 dark:text-gray-400">No chart data.</p>;
  }

  const stepX = points.length === 1 ? 0 : innerWidth / (points.length - 1);
  const pointsWithCoord = points.map((score, index) => {
    const x = padding + index * stepX;
    if (score == null) {
      return { x, y: null as number | null, score: null as number | null };
    }
    const ratio = maxY <= 0 ? 0 : score / maxY;
    const y = padding + innerHeight - ratio * innerHeight;
    return { x, y, score };
  });

  const segments: Array<string> = [];
  let current: Array<{ x: number; y: number }> = [];
  for (const point of pointsWithCoord) {
    if (point.y == null) {
      if (current.length >= 2) {
        segments.push(current.map((p) => `${p.x},${p.y}`).join(" "));
      }
      current = [];
      continue;
    }
    current.push({ x: point.x, y: point.y });
  }
  if (current.length >= 2) {
    segments.push(current.map((p) => `${p.x},${p.y}`).join(" "));
  }

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-52 min-w-160 w-full">
        <line
          x1={padding}
          y1={height - padding}
          x2={width - padding}
          y2={height - padding}
          className="stroke-gray-300 dark:stroke-gray-600"
          strokeWidth="1"
        />
        <line
          x1={padding}
          y1={padding}
          x2={padding}
          y2={height - padding}
          className="stroke-gray-300 dark:stroke-gray-600"
          strokeWidth="1"
        />

        {segments.map((segment, idx) => (
          <polyline
            key={idx}
            points={segment}
            fill="none"
            strokeWidth="2.5"
            className={strokeClassName}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}

        {pointsWithCoord.map((point, idx) => {
          if (point.y == null) {
            return null;
          }
          return (
            <g key={idx}>
              <circle
                cx={point.x}
                cy={point.y}
                r="3.4"
                className="fill-white stroke-[#1F4E79] dark:fill-gray-900"
                strokeWidth="2"
              />
              <title>{`${labels[idx] ?? `Assessment ${idx + 1}`}: ${point.score?.toFixed(2)}`}</title>
            </g>
          );
        })}

        {labels.map((label, idx) => {
          const x = padding + idx * stepX;
          return (
            <text
              key={idx}
              x={x}
              y={height - 8}
              textAnchor="middle"
              className="fill-gray-500 text-[9px] dark:fill-gray-400"
            >
              {truncateLabel(label)}
            </text>
          );
        })}

        <text
          x={padding - 6}
          y={padding + 4}
          textAnchor="end"
          className="fill-gray-500 text-[10px] dark:fill-gray-400"
        >
          {maxY.toFixed(0)}
        </text>
        <text
          x={padding - 6}
          y={height - padding + 4}
          textAnchor="end"
          className="fill-gray-500 text-[10px] dark:fill-gray-400"
        >
          0
        </text>
      </svg>
    </div>
  );
}

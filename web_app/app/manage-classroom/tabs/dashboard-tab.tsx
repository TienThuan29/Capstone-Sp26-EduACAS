"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Badge, Spinner } from "flowbite-react";
import { ChartBarIcon, AcademicCapIcon, UserGroupIcon } from "@heroicons/react/24/outline";
import { useStudentClassroom } from "@/hooks/classroom/useStudentClassroom";
import { useClassroomQuiz } from "@/hooks/quiz/useClassroomQuiz";
import { useQuiz } from "@/hooks/quiz/useQuiz";
import { useQuizAttempt } from "@/hooks/quiz/useQuizAttempt";
import type { ClassroomStudentResponse } from "@/types/classroom";
import type { ClassroomQuiz } from "@/types/quiz";
import type { QuizAttempt } from "@/types/quiz-attempt";

type DashboardTabProps = {
  classId: string;
};

type StudentScoreSeries = {
  studentId: string;
  studentName: string;
  points: Array<number | null>;
  submittedCount: number;
  averageScore: number;
};

export function DashboardTab({ classId }: DashboardTabProps) {
  const { getStudentsByClassId } = useStudentClassroom();
  const { getClassroomQuizzesByClassroom } = useClassroomQuiz();
  const { getAllQuizzes } = useQuiz();
  const { getAttemptsByStudent } = useQuizAttempt();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [students, setStudents] = useState<ClassroomStudentResponse[]>([]);
  const [classroomQuizzes, setClassroomQuizzes] = useState<ClassroomQuiz[]>([]);
  const [quizNameMap, setQuizNameMap] = useState<Record<string, string>>({});
  const [attemptsByStudent, setAttemptsByStudent] = useState<Record<string, QuizAttempt[]>>({});

  useEffect(() => {
    let active = true;

    const fetchDashboard = async () => {
      if (!classId) {
        if (!active) {
          return;
        }
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const [studentList, classroomQuizList, allQuizzes] = await Promise.all([
          getStudentsByClassId(classId),
          getClassroomQuizzesByClassroom(classId),
          getAllQuizzes(true),
        ]);

        if (!active) {
          return;
        }

        const sortedClassroomQuizzes = [...classroomQuizList].sort(
          (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
        );

        const attemptsEntries = await Promise.all(
          studentList
              .filter((student) => student.isJoining)
              .map(async (student) => {
                const attempts = await getAttemptsByStudent(student.studentId);
                return [student.studentId, attempts] as const;
              }),
        );

        if (!active) {
          return;
        }

        const nameMap = allQuizzes.reduce<Record<string, string>>((acc, quiz) => {
          acc[quiz.id] = quiz.title;
          return acc;
        }, {});

        setStudents(studentList.filter((student) => student.isJoining));
        setClassroomQuizzes(sortedClassroomQuizzes);
        setAttemptsByStudent(Object.fromEntries(attemptsEntries));
        setQuizNameMap(nameMap);
      } catch (err: unknown) {
        if (!active) {
          return;
        }

        const message =
          err && typeof err === "object" && "response" in err
            ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
            : null;

        setError(message || "Failed to load dashboard analytics");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void fetchDashboard();

    return () => {
      active = false;
    };
  }, [classId, getAllQuizzes, getAttemptsByStudent, getClassroomQuizzesByClassroom, getStudentsByClassId]);

  const filteredClassroomQuizzes = useMemo(() => classroomQuizzes, [classroomQuizzes]);

  const studentSeries = useMemo<StudentScoreSeries[]>(() => {
    const classroomQuizIds = new Set(filteredClassroomQuizzes.map((q) => q.id));

    return students
      .map((student) => {
        const attempts = attemptsByStudent[student.studentId] ?? [];
        const attemptsByClassroomQuiz = attempts.reduce<Record<string, QuizAttempt[]>>((acc, attempt) => {
          if (!classroomQuizIds.has(attempt.classroomQuizId)) {
            return acc;
          }
          if (!acc[attempt.classroomQuizId]) {
            acc[attempt.classroomQuizId] = [];
          }
          acc[attempt.classroomQuizId].push(attempt);
          return acc;
        }, {});

        const points = filteredClassroomQuizzes.map((classroomQuiz) => {
          const quizAttempts = (attemptsByClassroomQuiz[classroomQuiz.id] ?? [])
            .filter((attempt) => attempt.status === "SUBMITTED" && attempt.finalScore != null)
            .sort((a, b) => b.attemptNumber - a.attemptNumber);

          if (quizAttempts.length === 0) {
            return null;
          }

          return Number(quizAttempts[0].finalScore);
        });

        const valid = points.filter((score): score is number => score != null);
        return {
          studentId: student.studentId,
          studentName: student.fullname,
          points,
          submittedCount: valid.length,
          averageScore:
            valid.length === 0 ? 0 : valid.reduce((sum, score) => sum + score, 0) / valid.length,
        };
      })
      .sort((a, b) => b.averageScore - a.averageScore);
  }, [attemptsByStudent, filteredClassroomQuizzes, students]);

  const globalMaxScore = useMemo(() => {
    const values = studentSeries.flatMap((series) =>
      series.points.filter((score): score is number => score != null),
    );
    const maxValue = values.length ? Math.max(...values) : 10;
    return Math.max(maxValue, 10);
  }, [studentSeries]);

  const classAverageSeries = useMemo(() => {
    if (filteredClassroomQuizzes.length === 0) {
      return [] as Array<number | null>;
    }

    return filteredClassroomQuizzes.map((_, index) => {
      const column = studentSeries
        .map((series) => series.points[index])
        .filter((score): score is number => score != null);

      if (column.length === 0) {
        return null;
      }

      return column.reduce((sum, score) => sum + score, 0) / column.length;
    });
  }, [filteredClassroomQuizzes, studentSeries]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="xl" color="info" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-900/20">
        <h3 className="mb-2 text-lg font-semibold text-red-700 dark:text-red-300">
          Dashboard Error
        </h3>
        <p className="text-sm text-red-600 dark:text-red-200">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <MetricCard
          icon={<UserGroupIcon className="h-5 w-5" />}
          label="Active Students"
          value={students.length.toString()}
          accent="text-[#1F4E79]"
        />
        <MetricCard
          icon={<AcademicCapIcon className="h-5 w-5" />}
          label="Assessments (Quiz Phase 1)"
          value={filteredClassroomQuizzes.length.toString()}
          accent="text-[#C9A24D]"
        />
        <MetricCard
          icon={<ChartBarIcon className="h-5 w-5" />}
          label="Class Average"
          value={
            classAverageSeries.filter((x): x is number => x != null).length > 0
              ? (classAverageSeries
                  .filter((x): x is number => x != null)
                  .reduce((sum, score) => sum + score, 0) /
                  classAverageSeries.filter((x): x is number => x != null).length
                ).toFixed(2)
              : "N/A"
          }
          accent="text-emerald-600"
        />
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            Class Average Trend (Quiz Attempt FinalScore)
          </h3>
          <Badge color="info">Phase 1</Badge>
        </div>
        <LineChart
          points={classAverageSeries}
          labels={filteredClassroomQuizzes.map((item) => quizNameMap[item.quizId] ?? item.quizId)}
          maxY={globalMaxScore}
          strokeClassName="stroke-emerald-500"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {studentSeries.map((series) => (
          <div
            key={series.studentId}
            className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800"
          >
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h4 className="text-base font-semibold text-gray-900 dark:text-white">
                  {series.studentName}
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {series.submittedCount} submitted / {filteredClassroomQuizzes.length} assessments
                </p>
              </div>
              <Badge color="purple">Avg: {series.averageScore.toFixed(2)}</Badge>
            </div>

            <LineChart
              points={series.points}
              labels={filteredClassroomQuizzes.map((item) => quizNameMap[item.quizId] ?? item.quizId)}
              maxY={globalMaxScore}
            />
          </div>
        ))}
      </div>

      {studentSeries.length === 0 && (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white py-10 text-center dark:border-gray-700 dark:bg-gray-800">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            No active student data found for this classroom.
          </p>
        </div>
      )}
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-2 flex items-center gap-2">
        <span className={accent}>{icon}</span>
        <span className="text-xs font-semibold tracking-wide text-gray-500 uppercase dark:text-gray-400">
          {label}
        </span>
      </div>
      <p className="text-2xl font-black text-gray-900 dark:text-white">{value}</p>
    </div>
  );
}

function LineChart({
  points,
  labels,
  maxY,
  strokeClassName = "stroke-[#1F4E79]",
}: {
  points: Array<number | null>;
  labels: string[];
  maxY: number;
  strokeClassName?: string;
}) {
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

function truncateLabel(label: string): string {
  if (label.length <= 10) {
    return label;
  }
  return `${label.slice(0, 9)}…`;
}
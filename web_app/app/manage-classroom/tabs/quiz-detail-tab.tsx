"use client";

import { useState, useEffect, useCallback } from "react";
import { Badge, Button, Spinner, Tabs, TabItem, Tooltip } from "flowbite-react";
import {
  ArrowLeftIcon,
  ClockIcon,
  ShieldCheckIcon,
  ArrowPathIcon,
  LockClosedIcon,
  CalendarDaysIcon,
  QuestionMarkCircleIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
  ClipboardDocumentIcon,
} from "@heroicons/react/24/outline";
import { useQuiz } from "@/hooks/quiz/useQuiz";
import { useSubject } from "@/hooks/subject/useSubject";
import { useToast } from "@/hooks/useToast";
import type { ClassroomQuiz, Quiz, QuizQuestion } from "@/types/quiz";
import {
  formatDate,
  formatDateOnly,
  formatDurationMs,
  formatTime,
} from "@/utils/datetime-utils";

// ─────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────

const STATUS_COLOR: Record<string, string> = {
  DRAFT: "warning",
  PUBLISHED: "success",
  CLOSED: "failure",
};

function DetailRow({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ElementType;
}) {
  return (
    <div className="flex items-start gap-4 border-b border-gray-100 py-4 last:border-0 dark:border-gray-700">
      {Icon && (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#1F4E79]/10 text-[#1F4E79] dark:bg-[#C9A24D]/10 dark:text-[#C9A24D]">
          <Icon className="h-5 w-5" />
        </div>
      )}
      <div className="flex flex-col gap-0.5">
        <span className="text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400">
          {label}
        </span>
        <span className="text-gray-900 dark:text-white">{value}</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Overview sub-tab
// ─────────────────────────────────────────────────────────

function OverviewContent({
  classroomQuiz,
  quizTitle,
  quizDetail,
  subjectName,
}: {
  classroomQuiz: ClassroomQuiz;
  quizTitle: string;
  quizDetail: Quiz | null;
  subjectName: string;
}) {
  const { showSuccess } = useToast();
  const [showPasscode, setShowPasscode] = useState(false);

  const start = new Date(classroomQuiz.startTime);
  const end = new Date(classroomQuiz.endTime);
  const durationMs = end.getTime() - start.getTime();

  const handleCopyPasscode = () => {
    if (classroomQuiz.passcode) {
      navigator.clipboard.writeText(classroomQuiz.passcode);
      showSuccess("Passcode copied to clipboard");
    }
  };

  return (
    <div className="grid grid-cols-1 gap-8 pt-4 lg:grid-cols-3">
      {/* Main info */}
      <div className="space-y-0 lg:col-span-2">
        <DetailRow
          label="Quiz Title"
          value={
            <span className="text-lg font-bold">{quizTitle}</span>
          }
          icon={QuestionMarkCircleIcon}
        />
        <DetailRow
          label="Status"
          value={
            <span className="inline-block w-fit">
              <Badge
                color={STATUS_COLOR[classroomQuiz.status] ?? "warning"}
              >
                {classroomQuiz.status}
              </Badge>
            </span>
          }
          icon={ShieldCheckIcon}
        />
        <DetailRow
          label="Start – End"
          value={
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <div className="flex items-center gap-2">
                <ClockIcon className="h-4 w-4 shrink-0 text-gray-400 dark:text-gray-500" />
                <span className="text-sm font-medium">
                  {formatDate(classroomQuiz.startTime)}
                </span>
              </div>
              <span className="text-gray-400 dark:text-gray-500">→</span>
              <div className="flex items-center gap-2">
                <ClockIcon className="h-4 w-4 shrink-0 text-gray-400 dark:text-gray-500" />
                <span className="text-sm font-medium">
                  {formatDate(classroomQuiz.endTime)}
                </span>
              </div>
              <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-600 dark:text-gray-300">
                {formatDurationMs(durationMs)}
              </span>
            </div>
          }
          icon={CalendarDaysIcon}
        />
        <DetailRow
          label="Max Attempts"
          value={String(classroomQuiz.maxOfAttempts)}
          icon={ArrowPathIcon}
        />
        <div className="flex items-start gap-4 border-b border-gray-100 py-4 last:border-0 dark:border-gray-700">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#1F4E79]/10 text-[#1F4E79] dark:bg-[#C9A24D]/10 dark:text-[#C9A24D]">
            <LockClosedIcon className="h-5 w-5" />
          </div>
          <div className="flex flex-1 items-center justify-between">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400">
                Passcode
              </span>
              <span className="font-mono text-gray-900 dark:text-white">
                {!classroomQuiz.passcode ? (
                  "No passcode required"
                ) : showPasscode ? (
                  classroomQuiz.passcode
                ) : (
                  "●●●●●●●●"
                )}
              </span>
            </div>
            {classroomQuiz.passcode && (
              <div className="flex items-center gap-2">
                <Tooltip content="Copy passcode">
                  <button
                    onClick={handleCopyPasscode}
                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-600 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                  >
                    <ClipboardDocumentIcon className="h-5 w-5" />
                  </button>
                </Tooltip>
                <button
                  onClick={() => setShowPasscode(!showPasscode)}
                  className="flex items-center gap-2 rounded-lg bg-[#374151] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1f2937]"
                >
                  {showPasscode ? (
                    <>
                      <EyeSlashIcon className="h-4 w-4" />
                      Hide key
                    </>
                  ) : (
                    <>
                      <EyeIcon className="h-4 w-4" />
                      Show key
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Side info */}
      <div className="space-y-4">
        {/* Quiz metadata card */}
        {quizDetail && (
          <div className="rounded-lg border border-gray-100 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <h4 className="mb-4 text-sm font-bold tracking-wide text-[#1F4E79] uppercase dark:text-[#C9A24D]">
              Quiz Information
            </h4>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">
                  Duration
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {quizDetail.duration} min
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">
                  Total Questions
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {quizDetail.totalQuestions}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">
                  Subject
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {subjectName || "Loading..."}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">
                  Created
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {formatDateOnly(quizDetail.createdAt)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Activity logs card */}
        <div className="rounded-lg border border-gray-100 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <h4 className="mb-4 text-sm font-bold tracking-wide text-[#1F4E79] uppercase dark:text-[#C9A24D]">
            Activity Logs
          </h4>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">
                Assigned At
              </span>
              <span className="font-medium text-gray-900 dark:text-white">
                {formatDate(classroomQuiz.createdAt)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">
                Last Updated
              </span>
              <span className="font-medium text-gray-900 dark:text-white">
                {formatDate(classroomQuiz.updatedAt)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Questions sub-tab
// ─────────────────────────────────────────────────────────

function QuestionsContent({
  questions,
}: {
  questions: QuizQuestion[];
}) {
  if (questions.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white py-16 text-center dark:border-gray-700 dark:bg-gray-800">
        <p className="text-gray-500 dark:text-gray-400">
          No questions assigned to this quiz yet.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto pt-4">
      <table className="w-full text-left text-sm text-gray-600 dark:text-gray-400">
        <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500 dark:bg-gray-700 dark:text-gray-400">
          <tr>
            <th className="px-4 py-3">#</th>
            <th className="px-4 py-3">Question ID</th>
            <th className="px-4 py-3">Marks</th>
          </tr>
        </thead>
        <tbody>
          {questions
            .sort((a, b) => a.displayOrder - b.displayOrder)
            .map((q, idx) => (
              <tr
                key={q.questionId}
                className="border-b border-gray-100 dark:border-gray-700"
              >
                <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                  {idx + 1}
                </td>
                <td className="px-4 py-3 font-mono text-xs">
                  {q.questionId}
                </td>
                <td className="px-4 py-3">
                  <Badge color="info">{q.marks}</Badge>
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Main Detail View
// ─────────────────────────────────────────────────────────

export type ClassroomQuizDetailViewProps = {
  classroomQuiz: ClassroomQuiz;
  quizTitle: string;
  onBack: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  showBackInHeader?: boolean;
};

const TAB_OVERVIEW = 0;
const TAB_QUESTIONS = 1;

export function ClassroomQuizDetailView({
  classroomQuiz,
  quizTitle,
  onBack,
  onEdit,
  onDelete,
  showBackInHeader = true,
}: ClassroomQuizDetailViewProps) {
  const [activeTab, setActiveTab] = useState(TAB_OVERVIEW);
  const [quizDetail, setQuizDetail] = useState<Quiz | null>(null);
  const [subjectName, setSubjectName] = useState<string>("");
  const [loadingDetail, setLoadingDetail] = useState(true);
  const { getQuizById } = useQuiz();
  const { getSubjectById } = useSubject();

  const fetchQuizDetail = useCallback(async () => {
    try {
      setLoadingDetail(true);
      const data = await getQuizById(classroomQuiz.quizId);
      setQuizDetail(data);

      if (data?.subjectId) {
        const sub = await getSubjectById(data.subjectId);
        if (sub) {
          setSubjectName(`${sub.subjectCode} - ${sub.subjectName}`);
        }
      }
    } catch {
      console.error("Failed to fetch quiz detail");
    } finally {
      setLoadingDetail(false);
    }
  }, [classroomQuiz.quizId, getQuizById, getSubjectById]);

  useEffect(() => {
    fetchQuizDetail();
  }, [fetchQuizDetail]);

  if (loadingDetail) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="xl" />
      </div>
    );
  }

  return (
    <div className="bg-white shadow dark:bg-gray-800">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3 border-b border-gray-200 p-4 dark:border-gray-600">
        {showBackInHeader && (
          <Button
            color="gray"
            outline
            onClick={onBack}
            className="inline-flex cursor-pointer items-center gap-2"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            Back to list
          </Button>
        )}
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
          {quizTitle}
        </h3>

        <div className="ml-auto flex items-center gap-2">
          {onEdit && (
            <Tooltip content="Edit assignment" placement="top">
              <Button
                size="xs"
                color="gray"
                onClick={onEdit}
                className="border-none bg-transparent shadow-none hover:bg-gray-100 focus:ring-0 dark:hover:bg-gray-700"
              >
                <PencilIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              </Button>
            </Tooltip>
          )}
          {onDelete && (
            <Tooltip content="Remove assignment" placement="top">
              <Button
                size="xs"
                color="gray"
                onClick={onDelete}
                className="border-none bg-transparent shadow-none hover:bg-gray-100 focus:ring-0 dark:hover:bg-gray-700"
              >
                <TrashIcon className="h-4 w-4 text-red-600 dark:text-red-500" />
              </Button>
            </Tooltip>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="p-4 [&_button[role=tab]]:cursor-pointer">
        <Tabs onActiveTabChange={setActiveTab}>
          <TabItem title="Overview" active={activeTab === TAB_OVERVIEW}>
            {activeTab === TAB_OVERVIEW && (
              <OverviewContent
                classroomQuiz={classroomQuiz}
                quizTitle={quizTitle}
                quizDetail={quizDetail}
                subjectName={subjectName}
              />
            )}
          </TabItem>
          <TabItem title="Questions" active={activeTab === TAB_QUESTIONS}>
            {activeTab === TAB_QUESTIONS && (
              <QuestionsContent
                questions={quizDetail?.questions ?? []}
              />
            )}
          </TabItem>
        </Tabs>
      </div>
    </div>
  );
}

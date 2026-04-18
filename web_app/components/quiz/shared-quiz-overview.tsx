"use client";

import React, { useState, useEffect } from "react";
import { Badge, Button } from "flowbite-react";
import {
  ClockIcon,
  ShieldCheckIcon,
  ArrowPathIcon,
  CalendarDaysIcon,
  LockClosedIcon,
  ClipboardDocumentIcon,
  EyeSlashIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";
import { formatDate, formatDateOnly } from "@/utils/datetime-utils";
import { useToast } from "@/hooks/useToast";
import type { ClassroomQuiz, Quiz } from "@/types/quiz";
import { STATUS_COLOR } from "@/components/quiz/classroom-quiz-table";

export function CountdownTimer({
  targetDate,
  onEnd
}: {
  targetDate: string;
  onEnd?: () => void;
}) {
  const [timeLeft, setTimeLeft] = useState<{ d: number; h: number; m: number; s: number } | null>(null);
  const [hasEnded, setHasEnded] = useState(false);

  useEffect(() => {
    const calculateTime = () => {
      const distance = new Date(targetDate).getTime() - new Date().getTime();
      if (distance <= 0) {
        setTimeLeft(null);
        if (!hasEnded) {
          setHasEnded(true);
          onEnd?.();
        }
        return true;
      }
      setTimeLeft({
        d: Math.floor(distance / (1000 * 60 * 60 * 24)),
        h: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        m: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        s: Math.floor((distance % (1000 * 60)) / 1000),
      });
      return false;
    };

    if (calculateTime()) return;
    const timer = setInterval(calculateTime, 1000);
    return () => clearInterval(timer);
  }, [targetDate, onEnd, hasEnded]);

  if (!timeLeft) return <span className="text-red-500 font-bold uppercase tracking-widest text-[10px]">Closed</span>;

  const parts = [];
  if (timeLeft.d > 0) parts.push(`${timeLeft.d}d`);
  parts.push(`${String(timeLeft.h).padStart(2, '0')}h`);
  parts.push(`${String(timeLeft.m).padStart(2, '0')}m`);
  parts.push(`${String(timeLeft.s).padStart(2, '0')}s`);

  return <span>{parts.join(' ')}</span>;
}

export function DetailRow({
  label,
  value,
  icon: Icon,
  extra,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ElementType;
  extra?: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-4 py-3 dark:border-gray-700">
      {Icon && (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#1F4E79]/10 text-[#1F4E79] dark:bg-[#C9A24D]/10 dark:text-[#C9A24D]">
          <Icon className="h-5 w-5" />
        </div>
      )}
      <div className="flex flex-col gap-0.5 flex-1">
        <span className="text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400">
          {label}
        </span>
        <div className="text-gray-900 font-medium dark:text-white leading-tight">
          {value}
        </div>
      </div>
      {extra && <div className="ml-auto mt-2">{extra}</div>}
    </div>
  );
}

export function SharedQuizOverview({
  classroomQuiz,
  quizDetail,
  subjectName,
  isStudent = false,
  studentActionContent,
  onTimerEnd,
}: {
  classroomQuiz: ClassroomQuiz | any;
  quizDetail: Quiz | null;
  subjectName: string;
  isStudent?: boolean;
  studentActionContent?: React.ReactNode;
  onTimerEnd?: () => void;
}) {
  const { showSuccess } = useToast();
  const [showPasscode, setShowPasscode] = useState(false);

  const start = new Date(classroomQuiz.startTime);
  const end = new Date(classroomQuiz.endTime);
  const now = new Date();
  
  // Logical flags for UI
  const isUpcoming = classroomQuiz.status === 'PUBLISHED' && start > now;
  const isOngoing = classroomQuiz.status === 'ONGOING' || (classroomQuiz.status === 'PUBLISHED' && start <= now && end > now);
  const isClosed = classroomQuiz.status === 'CLOSED' || end <= now;

  const handleCopyPasscode = () => {
    if (classroomQuiz.passcode) {
      navigator.clipboard.writeText(classroomQuiz.passcode);
      showSuccess("Passcode copied to clipboard");
    }
  };

  return (
    <div className="flex flex-col gap-6 pt-4">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-10">
        <div className="lg:col-span-6 rounded-xl border border-gray-100 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800 flex flex-col divide-y divide-gray-100 dark:divide-gray-700 min-h-[400px]">
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-x-8 px-6 py-4 items-center">
            <DetailRow
              label="Status"
              value={
                <Badge
                  color={STATUS_COLOR[classroomQuiz.status as keyof typeof STATUS_COLOR] ?? "warning"}
                  className="w-fit"
                >
                  {classroomQuiz.status}
                </Badge>
              }
              icon={ShieldCheckIcon}
            />
            <DetailRow
              label="Max Attempts"
              value={String(classroomQuiz.maxOfAttempts)}
              icon={ArrowPathIcon}
            />
          </div>

          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-x-8 px-6 py-4 items-center bg-gray-50/30 dark:bg-gray-800/40">
            <DetailRow
              label="Start Time"
              value={formatDate(classroomQuiz.startTime)}
              icon={CalendarDaysIcon}
            />
            <DetailRow
              label="End Time"
              value={formatDate(classroomQuiz.endTime)}
              icon={ClockIcon}
            />
          </div>

          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-x-8 px-6 py-4 items-center">
            {classroomQuiz.status !== 'CLOSED' && classroomQuiz.status !== 'DRAFT' ? (
              <div className="flex items-start gap-4 py-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#1F4E79]/10 text-[#1F4E79] dark:bg-[#C9A24D]/10 dark:text-[#C9A24D]">
                  <ClockIcon className="h-5 w-5" />
                </div>
                <div className="flex flex-col gap-0.5 flex-1">
                  <span className="text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400">
                    Countdown Status
                  </span>
                  <div className="text-gray-900 font-medium dark:text-white leading-tight">
                    {isUpcoming ? (
                      <div className="flex items-center gap-1.5 pt-0.5">
                        <span className="text-gray-400 text-sm">Starts in:</span>
                        <span className="text-[#1F4E79] dark:text-blue-400 font-bold tracking-tight">
                          <CountdownTimer targetDate={classroomQuiz.startTime} onEnd={onTimerEnd} />
                        </span>
                      </div>
                    ) : isOngoing ? (
                      <div className="flex items-center gap-1.5 pt-0.5">
                        <span className="text-gray-400 text-sm">Ends in:</span>
                        <span className="text-[#1F4E79] dark:text-blue-400 font-bold tracking-tight">
                          <CountdownTimer targetDate={classroomQuiz.endTime} onEnd={onTimerEnd} />
                        </span>
                      </div>
                    ) : (
                      <span className="text-red-500 font-bold">Ended</span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div />
            )}

            {!isStudent && (
              <div className="flex items-start gap-4 py-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#1F4E79]/10 text-[#1F4E79] dark:bg-[#C9A24D]/10 dark:text-[#C9A24D]">
                  <LockClosedIcon className="h-5 w-5" />
                </div>
                <div className="flex flex-col gap-0.5 flex-1">
                  <span className="text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400">
                    Security Passcode
                  </span>
                  <div className="text-gray-900 font-medium dark:text-white leading-tight">
                    <span className={classroomQuiz.passcode ? "font-mono tracking-wider" : ""}>
                      {!classroomQuiz.passcode ? (
                        "No passcode required"
                      ) : showPasscode ? (
                        classroomQuiz.passcode
                      ) : (
                        "●●●●●●●●"
                      )}
                    </span>
                  </div>
                </div>
                {classroomQuiz.passcode && (
                  <div className="ml-auto flex items-center gap-1.5">
                    <button
                      onClick={handleCopyPasscode}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-600 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                    >
                      <ClipboardDocumentIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setShowPasscode(!showPasscode)}
                      className="flex items-center gap-1.5 rounded-lg bg-[#374151] px-3 py-1.5 text-[10px] font-medium text-white transition-colors hover:bg-[#1f2937]"
                    >
                      {showPasscode ? (
                        <EyeSlashIcon className="h-3.5 w-3.5" />
                      ) : (
                        <EyeIcon className="h-3.5 w-3.5" />
                      )}
                      <span>{showPasscode ? "Hide" : "Show"}</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {isStudent && studentActionContent && (
            <div className="flex-none flex justify-center py-8 px-6 mt-auto">
              {studentActionContent}
            </div>
          )}
        </div>

        <div className="space-y-6 lg:col-span-4">
          {quizDetail && (
            <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <h4 className="mb-6 text-sm font-bold tracking-wide text-[#1F4E79] uppercase dark:text-[#C9A24D] border-l-4 border-blue-600 pl-3">
                Quiz Information
              </h4>
              <div className="space-y-4 text-sm">
                <div className="flex justify-between items-center group">
                  <span className="text-gray-500 dark:text-gray-400">Duration</span>
                  <span className="font-bold text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700/50 px-2 py-1 rounded">
                    {quizDetail.duration} min
                  </span>
                </div>
                <div className="flex justify-between items-center group">
                  <span className="text-gray-500 dark:text-gray-400">Total Questions</span>
                  <span className="font-bold text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700/50 px-2 py-1 rounded">
                    {quizDetail.totalQuestions}
                  </span>
                </div>
                <div className="flex justify-between items-start group">
                  <span className="text-gray-500 dark:text-gray-400 shrink-0">Subject</span>
                  <span className="font-bold text-gray-900 dark:text-white text-right break-words pl-8">
                    {subjectName || "Loading..."}
                  </span>
                </div>
                <div className="flex justify-between items-center group">
                  <span className="text-gray-500 dark:text-gray-400">Created</span>
                  <span className="font-bold text-gray-900 dark:text-white">
                    {formatDateOnly(quizDetail.createdAt)}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h4 className="mb-6 text-sm font-bold tracking-wide text-[#1F4E79] uppercase dark:text-[#C9A24D] border-l-4 border-blue-600 pl-3">
              Activity Logs
            </h4>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-500 dark:text-gray-400">Assigned At</span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {formatDate(classroomQuiz.createdAt)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 dark:text-gray-400">Last Updated</span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {formatDate(classroomQuiz.updatedAt)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

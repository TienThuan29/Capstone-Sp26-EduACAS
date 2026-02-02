"use client";

import { Tabs, TabItem, Badge } from "flowbite-react";
import { ClockIcon } from "@heroicons/react/24/outline";
import type { Examination, Problem } from "@/types/examination";
import { formatDurationMs } from "@/utils/datetime-utils";

const STATUS_LABELS: Record<number, string> = {
  0: "PENDING",
  1: "ONGOING",
  2: "COMPLETED",
};

const MODE_LABELS: Record<number, string> = {
  0: "PRACTICAL",
  1: "EXAMINATION",
};

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1 border-b border-gray-100 py-2 last:border-0 dark:border-gray-600">
      <span className="text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400">
        {label}
      </span>
      <span className="text-gray-900 dark:text-white">{value}</span>
    </div>
  );
}

function ExamTimeRange({
  startDatetime,
  endDatetime,
}: {
  startDatetime: string;
  endDatetime: string;
}) {
  const start = new Date(startDatetime);
  const end = new Date(endDatetime);
  const durationMs = end.getTime() - start.getTime();
  const durationStr = formatDurationMs(durationMs);
  const startStr = start.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const endStr = end.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <div className="flex items-center gap-2">
        <ClockIcon className="h-4 w-4 shrink-0 text-gray-400 dark:text-gray-500" />
        <span className="text-sm font-medium text-gray-900 dark:text-white">
          {startStr}
        </span>
      </div>
      <span className="text-gray-400 dark:text-gray-500">→</span>
      <div className="flex items-center gap-2">
        <ClockIcon className="h-4 w-4 shrink-0 text-gray-400 dark:text-gray-500" />
        <span className="text-sm font-medium text-gray-900 dark:text-white">
          {endStr}
        </span>
      </div>
      <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-600 dark:text-gray-300">
        {durationStr}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main view
// ---------------------------------------------------------------------------

export type ExaminationDetailViewProps = {
  examination: Examination;
  onBack: () => void;
};

export function ExaminationDetailView({
  examination,
}: ExaminationDetailViewProps) {
  const statusLabel =
    STATUS_LABELS[examination.status as 0 | 1 | 2] ?? "PENDING";
  const modeLabel = MODE_LABELS[examination.mode as 0 | 1] ?? "PRACTICAL";
  const problems = examination.problems ?? [];

  return (
    <div className="bg-white shadow dark:bg-gray-800">
      <div className="border-b border-gray-200 p-4 dark:border-gray-600">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
          {examination.examName}
        </h3>
      </div>
      <div className="p-4 [&_button[role=tab]]:cursor-pointer">
        <Tabs>
          <TabItem title="Overview" active>
            <OverviewTabContent
              examination={examination}
              statusLabel={statusLabel}
              modeLabel={modeLabel}
            />
          </TabItem>
          <TabItem title="Problems">
            <ProblemsTabContent problems={problems} />
          </TabItem>
        </Tabs>
      </div>
    </div>
  );
}

function DateTimeDisplay({ datetime }: { datetime: string }) {
  const d = new Date(datetime);
  const dateStr = d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const timeStr = d.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return (
    <div className="flex items-center gap-2">
      {/* <CalendarDaysIcon className="h-4 w-4 shrink-0 text-gray-400 dark:text-gray-500" /> */}
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-medium text-gray-900 dark:text-white">
          {dateStr}
        </span>
        <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
          <ClockIcon className="h-3.5 w-3.5" />
          {timeStr}
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab content components
// ---------------------------------------------------------------------------

type OverviewTabContentProps = {
  examination: Examination;
  statusLabel: string;
  modeLabel: string;
};

function OverviewTabContent({
  examination,
  statusLabel,
  modeLabel,
}: OverviewTabContentProps) {
  return (
    <div className="space-y-1 pt-4">
      <DetailRow label="Exam name" value={examination.examName} />
      <DetailRow
        label="Programming language"
        value={
          examination.programmingLanguage
            ? `${examination.programmingLanguage.languageName}`
            : "—"
        }
      />
      <DetailRow
        label="Classroom"
        value={
          examination.classroom ? `${examination.classroom.className}` : "—"
        }
      />
      <DetailRow
        label="Start – End"
        value={
          <ExamTimeRange
            startDatetime={examination.startDatetime}
            endDatetime={examination.endDatetime}
          />
        }
      />
      <DetailRow label="Description" value={examination.description || "—"} />
      <DetailRow
        label="Public result"
        value={examination.isPublicResult ? "Yes" : "No"}
      />
      <DetailRow label="Total mark" value={String(examination.totalMark)} />
      <DetailRow
        label="Status"
        value={
          <span className="inline-block w-fit">
            <Badge
              color={
                statusLabel === "ONGOING"
                  ? "success"
                  : statusLabel === "COMPLETED"
                    ? "gray"
                    : "warning"
              }
            >
              {statusLabel}
            </Badge>
          </span>
        }
      />
      <DetailRow
        label="Mode"
        value={
          <span className="inline-block w-fit">
            <Badge color="info">{modeLabel}</Badge>
          </span>
        }
      />
      <DetailRow
        label="Created date"
        value={<DateTimeDisplay datetime={examination.createdDate} />}
      />
      <DetailRow
        label="Updated date"
        value={<DateTimeDisplay datetime={examination.updatedDate} />}
      />
    </div>
  );
}

type ProblemsTabContentProps = {
  problems: Problem[];
};

function ProblemsTabContent({ problems }: ProblemsTabContentProps) {
  return (
    <div className="pt-4">
      {problems.length === 0 ? (
        <p className="py-4 text-gray-500 dark:text-gray-400">
          No problems in this examination.
        </p>
      ) : (
        <div className="space-y-4">
          {problems.map((p, idx) => (
            <div
              key={p.id}
              className="rounded-lg border border-gray-200 p-4 dark:border-gray-600"
            >
              <div className="mb-2 font-semibold text-gray-900 dark:text-white">
                {idx + 1}. {p.title}
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                <DetailRow label="ID" value={p.id} />
                <DetailRow label="Mark" value={String(p.mark)} />
                <DetailRow label="Difficulty" value={String(p.difficulty)} />
                <DetailRow
                  label="Created"
                  value={new Date(p.createdDate).toLocaleString("vi-VN")}
                />
                <DetailRow
                  label="Updated"
                  value={new Date(p.updatedDate).toLocaleString("vi-VN")}
                />
              </div>
              {p.content ? (
                <DetailRow
                  label="Content"
                  value={
                    <span className="line-clamp-3 block text-sm">
                      {p.content}
                    </span>
                  }
                />
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

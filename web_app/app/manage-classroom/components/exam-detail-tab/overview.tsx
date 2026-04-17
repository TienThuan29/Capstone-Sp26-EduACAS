"use client";

import { Badge } from "flowbite-react";
import { ClockIcon } from "@heroicons/react/24/outline";
import type { Examination } from "@/types/examination";
import { formatDate, formatDateOnly, formatDurationMs, formatTime } from "@/utils/datetime-utils";

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
  const startStr = formatDate(startDatetime);
  const endStr = formatDate(endDatetime);
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

function DateTimeDisplay({ datetime }: { datetime: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-medium text-gray-900 dark:text-white">
          {formatDateOnly(datetime)}
        </span>
        <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
          <ClockIcon className="h-3.5 w-3.5" />
          {formatTime(datetime)}
        </span>
      </div>
    </div>
  );
}

export type OverviewTabContentProps = {
  examination: Examination;
  statusLabel: string;
  modeLabel: string;
};

export function OverviewTabContent({
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
            ? `${examination.programmingLanguage.name}`
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
      {examination.mode === "EXAMINATION" && (
        <>
          <DetailRow
            label="Strict mode"
            value={
              examination.useStrict ? (
                <span className="inline-block w-fit">
                <Badge color="warning">Enabled</Badge>
                </span>
              ) : (
                <span className="inline-block w-fit">
                  <Badge color="gray">Disabled</Badge>
                </span>
              )
            }
          />
          <DetailRow
            label="Min score threshold"
            value={
              examination.minScoreThreshold > 0 ? (
                <span className="rounded bg-amber-100 px-2 py-0.5 text-sm font-semibold text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                  ≥ {examination.minScoreThreshold}
                </span>
              ) : (
                <span className="text-gray-400">No threshold</span>
              )
            }
          />
        </>
      )}
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

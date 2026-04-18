"use client";

import { useState } from "react";
import {
  Button,
  Badge,
  Timeline,
  TimelineBody,
  TimelineContent,
  TimelineItem,
  TimelinePoint,
  TimelineTime,
  TimelineTitle,
  Tooltip,
} from "flowbite-react";
import { CheckIcon, PencilIcon, TrashIcon, ArrowPathIcon } from "@heroicons/react/24/solid";
import {
  ClipboardDocumentIcon,
  EyeIcon,
  EyeSlashIcon,
  HashtagIcon,
  KeyIcon,
} from "@heroicons/react/24/outline";
import type { Classroom } from "@/types/classroom";
import { formatDateOnly } from "@/utils/datetime-utils";

type OverviewTabProps = {
  classroom: Classroom;
  onOpenUpdateModal: () => void;
  onOpenDeleteModal: () => void;
  onRegenerateEnrolKey: () => void;
  isRegeneratingKey: boolean;
};

export function OverviewTab({
  classroom,
  onOpenUpdateModal,
  onOpenDeleteModal,
  onRegenerateEnrolKey,
  isRegeneratingKey,
}: OverviewTabProps) {
  const [showEnrolKey, setShowEnrolKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const enrolKey = classroom.enrolKey ?? "";

  const handleCopyKey = async () => {
    if (!enrolKey) return;
    try {
      await navigator.clipboard.writeText(enrolKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore clipboard errors
    }
  };

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      <div className="space-y-8 lg:col-span-2">
        <div className="relative overflow-hidden border border-gray-100 bg-white dark:border-gray-700 dark:bg-gray-800">
          <div className="absolute top-0 right-0 -mt-20 -mr-20 h-64 w-64 bg-linear-to-bl from-[#1F4E79]/10 to-transparent opacity-50 blur-3xl" />
          <div className="absolute bottom-0 left-0 -mb-20 -ml-20 h-64 w-64 bg-linear-to-tr from-[#C9A24D]/10 to-transparent opacity-50 blur-3xl" />

          <div className="relative p-8 md:p-10">
            <div className="mb-6 flex flex-wrap items-center gap-3">
              <Badge
                color="info"
                className="cursor-default px-3.5 py-1 text-xs font-bold tracking-widest uppercase"
              >
                {classroom.classCode}
              </Badge>
              <Badge
                color="warning"
                className="cursor-default border border-[#C9A24D]/30 px-3.5 py-1 text-xs font-semibold text-[#C9A24D] dark:border-[#C9A24D]/50 dark:text-[#C9A24D]!"
              >
                {classroom.semesterName}
              </Badge>
            </div>

            <h1 className="mb-5 text-2xl leading-tight font-bold tracking-tight text-gray-900 md:text-3xl lg:text-4xl dark:text-white">
              {classroom.className}
            </h1>

            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-600 dark:text-gray-400">
              <span>
                <span className="font-medium text-gray-500 dark:text-gray-500">
                  Subject:
                </span>{" "}
                {classroom.subject.subjectName}
              </span>
              <span>
                <span className="font-medium text-gray-500 dark:text-gray-500">
                  Semester:
                </span>{" "}
                {classroom.semesterName}
              </span>
            </div>

            <div className="mt-8 flex items-center gap-5 border border-gray-100 bg-gray-50/80 p-5 backdrop-blur-sm dark:border-gray-700 dark:bg-gray-900/40">
              <div className="flex h-12 w-12 items-center justify-center bg-linear-to-br from-[#1F4E79] to-[#2A6BA3] text-xl font-bold text-white">
                {classroom.lecturer.fullname.charAt(0).toUpperCase()}
              </div>
              <div>
                <span className="mb-1 block text-[8px] font-black tracking-[0.25em] text-[#1F4E79] uppercase dark:text-[#C9A24D]">
                  Lecturer
                </span>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {classroom.lecturer.fullname}
                </h3>
              </div>
            </div>

            {/* Enrol key */}
            <div className="mt-2 flex flex-wrap items-center justify-between gap-4 border border-gray-100 bg-gray-50/80 p-5 backdrop-blur-sm dark:border-gray-700 dark:bg-gray-900/40">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#1F4E79]/10 text-[#1F4E79] dark:bg-[#C9A24D]/10 dark:text-[#C9A24D]">
                  <KeyIcon className="h-6 w-6" />
                </div>
                <div>
                  <span className="mb-1 block text-[8px] font-black tracking-[0.25em] text-[#1F4E79] uppercase dark:text-[#C9A24D]">
                    Enrol Key
                  </span>
                  <p className="font-mono text-lg font-semibold tracking-wide text-gray-900 dark:text-white">
                    {showEnrolKey ? enrolKey || "—" : "••••••••"}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Tooltip
                  content={copied ? "Copied!" : "Copy enrol key"}
                  placement="top"
                >
                  <Button
                    color="gray"
                    size="sm"
                    onClick={handleCopyKey}
                    disabled={!enrolKey}
                    className="inline-flex cursor-pointer items-center gap-2"
                  >
                    {copied ? (
                      <CheckIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                    ) : (
                      <ClipboardDocumentIcon className="h-4 w-4" />
                    )}
                  </Button>
                </Tooltip>
                <Tooltip content="Regenerate enrol key" placement="top">
                  <Button
                    color="gray"
                    size="sm"
                    onClick={onRegenerateEnrolKey}
                    disabled={isRegeneratingKey}
                    className="inline-flex cursor-pointer items-center gap-2"
                  >
                    {isRegeneratingKey ? (
                      <ArrowPathIcon className="h-4 w-4 animate-spin" />
                    ) : (
                      <ArrowPathIcon className="h-4 w-4" />
                    )}
                  </Button>
                </Tooltip>
                <Button
                  color="gray"
                  size="sm"
                  onClick={() => setShowEnrolKey((v) => !v)}
                  className="inline-flex cursor-pointer items-center gap-2"
                >
                  {showEnrolKey ? (
                    <>
                      <EyeSlashIcon className="h-4 w-4" />
                      Hide
                    </>
                  ) : (
                    <>
                      <EyeIcon className="h-4 w-4" />
                      Show key
                    </>
                  )}
                </Button>
              </div>
            </div>
            {/* Slot Number */}
            <div className="mt-2 flex items-center gap-4 border border-gray-100 bg-gray-50/80 p-5 backdrop-blur-sm dark:border-gray-700 dark:bg-gray-900/40">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#1F4E79]/10 text-[#1F4E79] dark:bg-[#C9A24D]/10 dark:text-[#C9A24D]">
                <HashtagIcon className="h-6 w-6" />
              </div>
              <div>
                <span className="mb-1 block text-[8px] font-black tracking-[0.25em] text-[#1F4E79] uppercase dark:text-[#C9A24D]">
                  Slot Number
                </span>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {classroom.maxSlot} Slots
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        <div className="border border-gray-100 bg-white p-8 dark:border-gray-700 dark:bg-gray-800">
          <h3 className="relative z-10 mb-8 flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
            <span className="h-2.5 w-2.5 animate-pulse rounded-2xl bg-green-400 ring-4 ring-green-400/20" />
            Classroom Status
          </h3>

          <Timeline className="relative z-10 border-gray-200 dark:border-gray-600">
            <TimelineItem>
              <TimelinePoint className="border-0 bg-[#1F4E79]" />
              <TimelineContent>
                <TimelineTime className="text-gray-500 dark:text-gray-400">
                  {formatDateOnly(classroom.createdDate)}
                </TimelineTime>
                <TimelineTitle className="text-gray-900 dark:text-gray-100">
                  Start Date
                </TimelineTitle>
                <TimelineBody className="text-gray-600 dark:text-gray-300">
                  The class started on this date.
                </TimelineBody>
              </TimelineContent>
            </TimelineItem>
            <TimelineItem>
              <TimelinePoint className="border-0 bg-[#C9A24D]" />
              <TimelineContent>
                <TimelineTime className="text-gray-500 dark:text-gray-400">
                  {classroom.endDate
                    ? formatDateOnly(classroom.endDate)
                    : "N/A"}
                </TimelineTime>
                <TimelineTitle className="text-gray-900 dark:text-gray-100">
                  End Date
                </TimelineTitle>
                <TimelineBody className="text-gray-600 dark:text-gray-300">
                  The class is expected to end on this date.
                </TimelineBody>
              </TimelineContent>
            </TimelineItem>
          </Timeline>

          <div className="group relative z-10 mt-12 cursor-default border border-gray-200 bg-gray-50 p-6 transition-all hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700/50 dark:hover:bg-gray-700">
            <p className="text-sm leading-relaxed text-gray-600 italic dark:text-gray-300">
              &quot;Welcome to **{classroom.className}
              **. Wishing you an effective semester and great results!&quot;
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Button
            color="gray"
            onClick={onOpenUpdateModal}
            className="group w-full cursor-pointer justify-center gap-3 py-4 font-bold"
          >
            <PencilIcon className="h-5 w-5" />
            Edit classroom information
          </Button>
          <Button
            color="red"
            onClick={onOpenDeleteModal}
            className="group w-full cursor-pointer justify-center gap-3 py-4 font-bold"
          >
            <TrashIcon className="h-5 w-5" />
            Delete classroom
          </Button>
        </div>
      </div>
    </div>
  );
}

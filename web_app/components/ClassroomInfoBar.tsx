"use client";

import { Badge } from "flowbite-react";
import {
  BookOpenIcon,
  CalendarDaysIcon,
  UserCircleIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import { formatDateOnly } from "@/utils/datetime-utils";
import type { Classroom } from "@/types/classroom";

type ClassroomInfoBarProps = {
  classroom: Classroom;
  compact?: boolean;
};

export function ClassroomInfoBar({ classroom, compact }: ClassroomInfoBarProps) {
  if (compact) {
    return (
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 dark:border-gray-700 dark:bg-gray-800">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
          {classroom.className}
        </h2>
        <Badge
          color="info"
          className="px-2 py-0.5 text-xs font-bold"
        >
          {classroom.classCode}
        </Badge>
        <Badge
          color="warning"
          className="border border-[#C9A24D]/40 px-2 py-0.5 text-xs font-semibold text-[#B8860B] dark:border-[#C9A24D]/50 dark:text-[#C9A24D]"
        >
          {classroom.semesterName}
        </Badge>
        <span className="ml-1 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
          <BookOpenIcon className="h-3.5 w-3.5" />
          {classroom.subject.subjectName}
        </span>
        <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
          <UserCircleIcon className="h-3.5 w-3.5" />
          {classroom.lecturer.fullname}
        </span>
      </div>
    );
  }

  return (
    <div className="mb-6 overflow-hidden rounded-2xl border border-gray-200 bg-linear-to-r from-white to-slate-50 shadow-sm dark:border-gray-700 dark:from-gray-800 dark:to-gray-800/80">
      {/* Top accent line */}
      <div className="h-1 w-full bg-linear-to-r from-[#1F4E79] to-[#C9A24D]" />

      <div className="px-6 py-5">
        {/* Row 1: Class name + badges */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            {classroom.className}
          </h2>
          <Badge
            color="info"
            className="px-3 py-1 text-sm font-bold tracking-wider"
          >
            {classroom.classCode}
          </Badge>
          <Badge
            color="warning"
            className="border border-[#C9A24D]/40 px-3 py-1 text-sm font-semibold text-[#B8860B] dark:border-[#C9A24D]/50 dark:text-[#C9A24D]"
          >
            {classroom.semesterName}
          </Badge>
        </div>

        {/* Row 2: meta info chips */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetaChip
            icon={<BookOpenIcon className="h-5 w-5" />}
            label="Subject"
            value={classroom.subject.subjectName}
          />
          <MetaChip
            icon={<UserCircleIcon className="h-5 w-5" />}
            label="Lecturer"
            value={classroom.lecturer.fullname}
          />
          <MetaChip
            icon={<UsersIcon className="h-5 w-5" />}
            label="Students"
            value={`${classroom.studentCount ?? 0} enrolled`}
          />
          <MetaChip
            icon={<CalendarDaysIcon className="h-5 w-5" />}
            label="End Date"
            value={
              classroom.endDate
                ? formatDateOnly(classroom.endDate)
                : "No end date"
            }
          />
        </div>
      </div>
    </div>
  );
}

type MetaChipProps = {
  icon: React.ReactNode;
  label: string;
  value: string;
};

function MetaChip({ icon, label, value }: MetaChipProps) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50/60 px-4 py-3 dark:border-gray-700 dark:bg-gray-900/40">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#1F4E79]/10 text-[#1F4E79] dark:bg-[#C9A24D]/10 dark:text-[#C9A24D]">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-black uppercase tracking-widest text-[#1F4E79] dark:text-[#C9A24D]">
          {label}
        </p>
        <p className="truncate text-sm font-semibold text-gray-800 dark:text-gray-100">
          {value}
        </p>
      </div>
    </div>
  );
}

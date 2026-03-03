"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
  Badge,
  Button,
} from "flowbite-react";
import { ChevronDownIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { useSlot, SlotResponse } from "@/hooks/classroom/useSlot";
import { formatDate } from "@/utils/datetime-utils";

const STATUS_LABELS: Record<number, string> = {
  0: "PENDING",
  1: "ONGOING",
  2: "COMPLETED",
};

const MODE_LABELS: Record<number, string> = {
  0: "PRACTICAL",
  1: "EXAMINATION",
};

export function SlotTab() {
  const params = useParams();
  const classroomId = params.id as string;
  const { getSlotsByClassroom } = useSlot();

  const [slots, setSlots] = useState<SlotResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSlotIds, setExpandedSlotIds] = useState<Set<string>>(
    new Set(),
  );

  const toggleSlotExpand = (slotId: string) => {
    setExpandedSlotIds((prev) => {
      const next = new Set(prev);
      if (next.has(slotId)) next.delete(slotId);
      else next.add(slotId);
      return next;
    });
  };

  const fetchSlots = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getSlotsByClassroom(classroomId);
      const sorted = [...data].sort(
        (a, b) => Number(a.slotNumber) - Number(b.slotNumber),
      );
      setSlots(sorted);
    } catch (error) {
      console.error("Failed to fetch slots", error);
    } finally {
      setLoading(false);
    }
  }, [getSlotsByClassroom, classroomId]);

  useEffect(() => {
    if (classroomId) {
      fetchSlots();
    }
  }, [classroomId, fetchSlots]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="border-l-8 border-[#1F4E79] pl-4 text-3xl font-black text-gray-900 dark:border-[#C9A24D] dark:text-white">
          Class Schedule & Slots
        </h2>
        <p className="ml-4 text-sm text-gray-500">
          View all scheduled sessions and topics for this class.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="xl" color="info" />
        </div>
      ) : slots.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white py-20 text-center dark:border-gray-700 dark:bg-gray-800">
          <p className="text-gray-500 dark:text-gray-400">
            No slots have been scheduled for this class yet.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto border-gray-200 bg-white shadow dark:border-gray-700 dark:bg-gray-800">
          <Table hoverable>
            <TableHead>
              <TableRow>
                <TableHeadCell className="w-24">Slot No.</TableHeadCell>
                <TableHeadCell>Title</TableHeadCell>
                <TableHeadCell>Description</TableHeadCell>
                <TableHeadCell className="w-40">Examinations</TableHeadCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {slots.map((slot) => {
                const hasExams = (slot.examinations?.length ?? 0) > 0;
                const isExpanded = expandedSlotIds.has(slot.id);
                return (
                  <React.Fragment key={slot.id}>
                    <TableRow>
                      <TableCell className="font-medium whitespace-nowrap text-gray-900 dark:text-white">
                        <Badge color="info">Slot {slot.slotNumber}</Badge>
                      </TableCell>
                      <TableCell className="font-semibold text-gray-900 dark:text-white">
                        {slot.title}
                      </TableCell>
                      <TableCell className="text-gray-600 dark:text-gray-400">
                        <p className="line-clamp-2">
                          {slot.description || "—"}
                        </p>
                      </TableCell>
                      <TableCell className="align-middle">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => toggleSlotExpand(slot.id)}
                            className="cursor-pointer rounded p-1 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
                            aria-label={
                              isExpanded
                                ? "Collapse examinations"
                                : "Expand examinations"
                            }
                          >
                            {isExpanded ? (
                              <ChevronDownIcon className="h-5 w-5" />
                            ) : (
                              <ChevronRightIcon className="h-5 w-5" />
                            )}
                          </button>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {slot.examinations?.length ?? 0} exam(s)
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                    {isExpanded && (
                      <TableRow className="bg-gray-50 dark:bg-gray-800/50">
                        <TableCell colSpan={4} className="px-6 py-3">
                          {hasExams ? (
                            <ul className="space-y-2 text-sm">
                              {slot.examinations?.map((exam) => {
                                const statusKey = Number(exam.status) as 0 | 1 | 2;
                                const modeKey = Number(exam.mode) as 0 | 1;
                                const statusLabel =
                                  STATUS_LABELS[statusKey] ?? "PENDING";
                                const modeLabel =
                                  MODE_LABELS[modeKey] ?? "PRACTICAL";
                                return (
                                  <li
                                    key={exam.id}
                                    className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded border border-gray-200 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-800"
                                  >
                                    <span className="font-medium text-gray-900 dark:text-white">
                                      {exam.examName}
                                    </span>
                                    <span className="text-gray-500 dark:text-gray-400">
                                      {formatDate(exam.startDatetime)} –{" "}
                                      {formatDate(exam.endDatetime)}
                                    </span>
                                    <Badge
                                      color={
                                        statusLabel === "COMPLETED"
                                          ? "success"
                                          : statusLabel === "ONGOING"
                                            ? "warning"
                                            : "gray"
                                      }
                                    >
                                      {statusLabel}
                                    </Badge>
                                    <span className="text-gray-500 dark:text-gray-400">
                                      {modeLabel}
                                    </span>
                                    <Link
                                      href={`/my-classroom/${classroomId}/exam/${exam.id}`}
                                      className="ml-auto"
                                    >
                                      <Button color="info" size="xs" className="cursor-pointer bg-[#1F4E79] text-white">
                                        Take
                                      </Button>
                                    </Link>
                                  </li>
                                );
                              })}
                            </ul>
                          ) : (
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              No examinations in this slot.
                            </p>
                          )}
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

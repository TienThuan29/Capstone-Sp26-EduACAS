"use client";

import { useState, useEffect, useCallback } from "react";
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
} from "flowbite-react";
import { useSlot, SlotResponse } from "@/hooks/classroom/useSlot";

export function SlotTab() {
  const params = useParams();
  const classroomId = params.id as string;
  const { getSlotsByClassroom } = useSlot();

  const [slots, setSlots] = useState<SlotResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSlots = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getSlotsByClassroom(classroomId);
      // Sort slots by slotNumber numerically
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
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <Table hoverable>
            <TableHead className="bg-gray-50 dark:bg-gray-700">
              <TableHeadCell className="w-24">Slot No.</TableHeadCell>
              <TableHeadCell>Topic / Title</TableHeadCell>
              <TableHeadCell>Description</TableHeadCell>
            </TableHead>
            <TableBody className="divide-y">
              {slots.map((slot) => (
                <TableRow key={slot.id} className="bg-white dark:bg-gray-800">
                  <TableCell className="font-medium whitespace-nowrap text-gray-900 dark:text-white">
                    <Badge color="info" className="w-fit">
                      Slot {slot.slotNumber}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-semibold text-gray-900 dark:text-white">
                    {slot.title}
                  </TableCell>
                  <TableCell className="text-gray-600 dark:text-gray-400">
                    <p className="line-clamp-2 italic">
                      {slot.description || "No description provided."}
                    </p>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

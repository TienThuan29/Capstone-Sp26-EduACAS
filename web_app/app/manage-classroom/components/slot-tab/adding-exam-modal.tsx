"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Modal,
  ModalHeader,
  ModalBody,
  Label,
  Button,
  Spinner,
  Select,
} from "flowbite-react";
import type { SlotResponse } from "@/hooks/classroom/useSlot";
import { useSlot } from "@/hooks/classroom/useSlot";
import { useExamination } from "@/hooks/exam/useExamination";
import type { Examination } from "@/types/examination";
import { useToast } from "@/hooks/useToast";

export interface AddExamToSlotModalProps {
  slot: SlotResponse | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddExamToSlotModal({
  slot,
  onClose,
  onSuccess,
}: AddExamToSlotModalProps) {
  const { updateSlot } = useSlot();
  const { getExaminationsByClassId } = useExamination();
  const { showSuccess, showError } = useToast();

  const [availableExaminations, setAvailableExaminations] = useState<
    Examination[]
  >([]);
  const [selectedExamId, setSelectedExamId] = useState("");
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const show = slot != null;

  const fetchExaminations = useCallback(
    async (targetSlot: SlotResponse) => {
      setSelectedExamId("");
      setLoading(true);
      try {
        const exams = await getExaminationsByClassId(targetSlot.classroomId);
        setAvailableExaminations(exams);
      } catch (error) {
        console.error("Failed to fetch examinations", error);
        showError("Failed to load examinations");
      } finally {
        setLoading(false);
      }
    },
    [getExaminationsByClassId, showError]
  );

  useEffect(() => {
    if (slot) {
      fetchExaminations(slot);
    }
    // Refetch when opening for a different slot (by id), not on every parent re-render
  }, [slot?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const closeAddExamModal = useCallback(() => {
    if (!actionLoading) {
      setSelectedExamId("");
      onClose();
    }
  }, [actionLoading, onClose]);

  const handleAddExamToSlot = useCallback(async () => {
    if (!slot || !selectedExamId) {
      showError("Please select an examination");
      return;
    }
    const currentIds = slot.examinationIds ?? [];
    if (currentIds.includes(selectedExamId)) {
      showError("This examination is already in the slot");
      return;
    }
    try {
      setActionLoading(true);
      await updateSlot(slot.id, {
        classroomId: slot.classroomId,
        title: slot.title,
        description: slot.description ?? "",
        examinationIds: [...currentIds, selectedExamId],
      });
      showSuccess("Examination added to slot");
      setSelectedExamId("");
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      showError(error?.response?.data?.message ?? "Failed to add examination");
    } finally {
      setActionLoading(false);
    }
  }, [
    slot,
    selectedExamId,
    updateSlot,
    showSuccess,
    showError,
    onSuccess,
    onClose,
  ]);

  const existingIds = slot?.examinationIds ?? [];
  const options = availableExaminations.filter(
    (e) => !existingIds.includes(e.id)
  );

  return (
    <Modal show={show} onClose={closeAddExamModal} size="md">
      <ModalHeader>Add examination to slot</ModalHeader>
      <ModalBody className="space-y-4">
        {slot && (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Slot {slot.slotNumber}: {slot.title}
          </p>
        )}
        {loading ? (
          <div className="flex justify-center py-4">
            <Spinner size="lg" />
          </div>
        ) : (
          <div>
            <Label htmlFor="add-exam-select">
              Select examination <span className="text-red-500">*</span>
            </Label>
            <Select
              id="add-exam-select"
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              className="mt-1"
            >
              <option value="">Choose an examination</option>
              {options.map((exam) => (
                <option key={exam.id} value={exam.id}>
                  {exam.examName}
                </option>
              ))}
            </Select>
            {options.length === 0 && !loading && (
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                No examinations available to add. All classroom examinations are
                already in this slot, or none exist yet.
              </p>
            )}
          </div>
        )}
      </ModalBody>
      {!loading && (
        <div className="flex justify-end gap-2 border-t border-gray-200 p-4 dark:border-gray-600">
          <Button color="gray" onClick={closeAddExamModal} disabled={actionLoading} className="cursor-pointer">
            Cancel
          </Button>
          <Button
            onClick={handleAddExamToSlot}
            disabled={actionLoading || !selectedExamId || options.length === 0}
            className="bg-[#1F4E79] hover:bg-[#2A6BA3] cursor-pointer"
          >
            {actionLoading ? (
              <Spinner size="sm" className="mr-2" />
            ) : null}
            Add to slot
          </Button>
        </div>
      )}
    </Modal>
  );
}

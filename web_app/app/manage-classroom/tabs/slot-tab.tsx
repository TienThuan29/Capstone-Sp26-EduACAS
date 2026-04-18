import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  Modal,
  ModalHeader,
  ModalBody,
  Label,
  TextInput,
  Textarea,
  Button,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
  Tooltip,
  Badge,
} from "flowbite-react";
import {
  PlusIcon,
  PencilIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  PlusCircleIcon,
} from "@heroicons/react/24/outline";
import { useSlot, SlotResponse } from "@/hooks/classroom/useSlot";
import type { ExaminationStatus, ExaminationMode } from "@/types/examination";
import { useToast } from "@/hooks/useToast";
import { formatDate } from "@/utils/datetime-utils";
import { AddExamToSlotModal } from "@/app/manage-classroom/components/slot-tab/adding-exam-modal";
import { SlotsTabSkeleton } from "@/components/ui/skeletons";

const STATUS_LABELS: Record<ExaminationStatus, string> = {
  PENDING: "PENDING",
  ONGOING: "ONGOING",
  COMPLETED: "COMPLETED",
};

const MODE_LABELS: Record<ExaminationMode, string> = {
  PRACTICAL: "PRACTICAL",
  EXAMINATION: "EXAMINATION",
};

interface SlotsTabProps {
  maxSlot: number;
}

export function SlotsTab({ maxSlot }: SlotsTabProps) {
  const params = useParams();
  const classroomId = params.id as string;
  const { getSlotsByClassroom, createSlot, createAllSlots, updateSlot } =
    useSlot();
  const { showSuccess, showError } = useToast();

  const [slots, setSlots] = useState<SlotResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [openFormModal, setOpenFormModal] = useState(false);
  const [editingSlot, setEditingSlot] = useState<SlotResponse | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
  });

  const [slotToAddExam, setSlotToAddExam] = useState<SlotResponse | null>(null);

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

  const isFull = slots.length >= maxSlot;

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

  const openAddExamModal = (slot: SlotResponse) => setSlotToAddExam(slot);

  const openCreate = () => {
    setEditingSlot(null);
    setFormData({ title: "", description: "" });
    setOpenFormModal(true);
  };

  const openEdit = (slot: SlotResponse) => {
    setEditingSlot(slot);
    setFormData({
      title: slot.title,
      description: slot.description || "",
    });
    setOpenFormModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.description) {
      showError("Title and Description are required");
      return;
    }

    try {
      setActionLoading(true);
      if (editingSlot) {
        await updateSlot(editingSlot.id, {
          classroomId,
          title: formData.title,
          description: formData.description,
        });
        showSuccess("Updated slot successfully");
      } else {
        if (isFull) {
          showError("Maximum slots reached.");
          return;
        }
        await createSlot({
          classroomId,
          title: formData.title,
          description: formData.description,
        });
        showSuccess("Created slot successfully");
      }
      setOpenFormModal(false);
      fetchSlots();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      showError(error?.response?.data?.message || "Action failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateAll = async () => {
    if (isFull) {
      showError("Already at maximum slots.");
      return;
    }

    try {
      setActionLoading(true);
      await createAllSlots(classroomId);
      showSuccess("Created all slots automatically");
      fetchSlots();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      showError(error?.response?.data?.message || "Failed to create all slots");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="border-l-8 border-[#1F4E79] pl-4 text-3xl font-black text-gray-900 dark:border-[#C9A24D] dark:text-white">
            Slots
          </h2>
          <p className="ml-4 text-sm text-gray-500">
            {slots.length} / {maxSlot} slots created
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            color="gray"
            onClick={handleCreateAll}
            disabled={actionLoading || isFull}
            className="cursor-pointer"
          >
            {actionLoading ? <Spinner size="sm" className="mr-2" /> : null}
            Create All Slots
          </Button>
          <Button
            className="bg-[#1F4E79] hover:bg-[#2A6BA3]"
            onClick={openCreate}
            disabled={isFull}
          >
            <PlusIcon className="mr-2 h-5 w-5" />
            Add slot
          </Button>
        </div>
      </div>

      {loading ? (
        <SlotsTabSkeleton />
      ) : slots.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white py-20 text-center dark:border-gray-700 dark:bg-gray-800">
          <p className="text-gray-500 dark:text-gray-400">
            No slots created yet. Create one to get started.
          </p>
          {/* {!isFull && (
            <div className="mt-4 flex flex-col items-center gap-2">
              <button
                onClick={openCreate}
                className="text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Create your first slot
              </button>
              <span className="text-xs text-gray-400">or</span>
              <button
                onClick={handleCreateAll}
                className="text-sm font-semibold text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300"
              >
                Auto-generate all slots
              </button>
            </div>
          )} */}
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
                <TableHeadCell>
                  <span className="sr-only">Actions</span>
                </TableHeadCell>
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
                            className="rounded p-1 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200 cursor-pointer"
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
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Tooltip content="Add examination" placement="top">
                            <Button
                              size="xs"
                              color="light"
                              onClick={() => openAddExamModal(slot)}
                              className="cursor-pointer"
                            >
                              <PlusCircleIcon className="h-4 w-4" />
                            </Button>
                          </Tooltip>
                          <Tooltip content="Edit" placement="top">
                            <Button
                              size="xs"
                              color="light"
                              onClick={() => openEdit(slot)}
                              className="cursor-pointer"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </Button>
                          </Tooltip>
                        </div>
                      </TableCell>
                    </TableRow>
                    {isExpanded && (
                      <TableRow className="bg-gray-50 dark:bg-gray-800/50">
                        <TableCell colSpan={5} className="px-6 py-3">
                          {hasExams ? (
                            <ul className="space-y-2 text-sm">
                              {slot.examinations?.map((exam) => {
                                const statusLabel = STATUS_LABELS[exam.status] ?? "PENDING";
                                const modeLabel = MODE_LABELS[exam.mode] ?? "PRACTICAL";
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

      <SlotFormModal
        show={openFormModal}
        onClose={() => !actionLoading && setOpenFormModal(false)}
        editingSlot={editingSlot}
        formData={formData}
        onFormDataChange={setFormData}
        onSubmit={handleSubmit}
        actionLoading={actionLoading}
        isFull={isFull}
      />

      <AddExamToSlotModal
        slot={slotToAddExam}
        onClose={() => setSlotToAddExam(null)}
        onSuccess={fetchSlots}
      />
    </div>
  );
}

// Slot Form Modal

interface SlotFormModalProps {
  show: boolean;
  onClose: () => void;
  editingSlot: SlotResponse | null;
  formData: { title: string; description: string };
  onFormDataChange: (data: { title: string; description: string }) => void;
  onSubmit: (e: React.FormEvent) => void;
  actionLoading: boolean;
  isFull: boolean;
}

function SlotFormModal({
  show,
  onClose,
  editingSlot,
  formData,
  onFormDataChange,
  onSubmit,
  actionLoading,
  isFull,
}: SlotFormModalProps) {
  return (
    <Modal show={show} onClose={onClose} size="lg">
      <ModalHeader>
        {editingSlot ? "Edit slot information" : "Create new slot"}
      </ModalHeader>
      <form onSubmit={onSubmit}>
        <ModalBody className="space-y-4">
          <div>
            <Label htmlFor="title">
              Slot Title <span className="text-red-500">*</span>
            </Label>
            <TextInput
              id="title"
              placeholder="e.g. Introduction to React"
              required
              value={formData.title}
              onChange={(e) =>
                onFormDataChange({ ...formData, title: e.target.value })
              }
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="description">
              Description <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="description"
              placeholder="Describe what will be covered in this slot..."
              rows={4}
              required
              value={formData.description}
              onChange={(e) =>
                onFormDataChange({ ...formData, description: e.target.value })
              }
              className="mt-1"
            />
          </div>
        </ModalBody>
        <div className="flex justify-end gap-2 border-t border-gray-200 p-4 dark:border-gray-600">
          <Button color="gray" onClick={onClose} disabled={actionLoading}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={actionLoading || (editingSlot ? false : isFull)}
            className="bg-[#1F4E79] hover:bg-[#2A6BA3]"
          >
            {actionLoading ? <Spinner size="sm" className="mr-2" /> : null}
            {editingSlot ? "Update" : "Create"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

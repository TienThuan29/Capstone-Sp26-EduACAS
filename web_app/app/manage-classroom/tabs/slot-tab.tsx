import { useState, useEffect, useCallback } from "react";
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
} from "@heroicons/react/24/outline";
import { useSlot, SlotResponse } from "@/hooks/classroom/useSlot";
import { useToast } from "@/hooks/useToast";

interface SlotsTabProps {
  maxSlot: number;
}

export function SlotsTab({ maxSlot }: SlotsTabProps) {
  const params = useParams();
  const classroomId = params.id as string;
  const { getSlotsByClassroom, createSlot, createAllSlots, updateSlot } = useSlot();
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

  const isFull = slots.length >= maxSlot;

  const fetchSlots = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getSlotsByClassroom(classroomId);
      // Sort slots by slotNumber numerically
      const sorted = [...data].sort((a, b) => Number(a.slotNumber) - Number(b.slotNumber));
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
        // Backend requires classroomId in the body for update too
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
        <div className="flex justify-center py-20">
          <Spinner size="xl" />
        </div>
      ) : slots.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white py-20 text-center dark:border-gray-700 dark:bg-gray-800">
          <p className="text-gray-500 dark:text-gray-400">
            No slots created yet. Create one to get started.
          </p>
          {!isFull && (
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
           )}
        </div>
      ) : (
        <div className="overflow-x-auto border-gray-200 bg-white shadow dark:border-gray-700 dark:bg-gray-800">
          <Table hoverable>
            <TableHead>
              <TableHeadCell className="w-24">Slot No.</TableHeadCell>
              <TableHeadCell>Title</TableHeadCell>
              <TableHeadCell>Description</TableHeadCell>
              <TableHeadCell>
                <span className="sr-only">Actions</span>
              </TableHeadCell>
            </TableHead>
            <TableBody>
              {slots.map((slot) => (
                <TableRow key={slot.id}>
                  <TableCell className="whitespace-nowrap font-medium text-gray-900 dark:text-white">
                    <Badge color="info">Slot {slot.slotNumber}</Badge>
                  </TableCell>
                  <TableCell className="font-semibold text-gray-900 dark:text-white">
                    {slot.title}
                  </TableCell>
                  <TableCell className="text-gray-600 dark:text-gray-400">
                    <p className="line-clamp-2">{slot.description || "—"}</p>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
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
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal show={openFormModal} onClose={() => !actionLoading && setOpenFormModal(false)} size="lg">
        <ModalHeader>
          {editingSlot ? "Edit slot information" : "Create new slot"}
        </ModalHeader>
        <form onSubmit={handleSubmit}>
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
                  setFormData({ ...formData, title: e.target.value })
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
                  setFormData({ ...formData, description: e.target.value })
                }
                className="mt-1"
              />
            </div>
          </ModalBody>
          <div className="flex justify-end gap-2 border-t border-gray-200 p-4 dark:border-gray-600">
            <Button color="gray" onClick={() => setOpenFormModal(false)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={actionLoading || (editingSlot ? false : isFull)}
              className="bg-[#1F4E79] hover:bg-[#2A6BA3]"
            >
              {actionLoading ? (
                <Spinner size="sm" className="mr-2" />
              ) : null}
              {editingSlot ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}


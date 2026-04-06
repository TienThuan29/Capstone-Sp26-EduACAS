"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Button,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Label,
  TextInput,
  Textarea,
  Select,
  Checkbox,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
  Badge,
  Tooltip,
} from "flowbite-react";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  DocumentDuplicateIcon,
} from "@heroicons/react/24/outline";
import type { Examination, ExaminationRequest } from "@/types/examination";
import { useExamination } from "@/hooks/exam/useExamination";
import { useProgrammingLanguage } from "@/hooks/programming-language/useProgrammingLanguage";
import { useExaminationTemplate } from "@/hooks/examination-template/useExaminationTemplate";
import type { ProgrammingLanguage } from "@/types/language";
import type { ExaminationTemplateResponse } from "@/types/examination-template";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/contexts/AuthContext";
import { formatDate } from "@/utils/datetime-utils";
import { ExaminationDetailView } from "./exam-detail-tab";

const STATUS_LABELS: Record<number, string> = {
  0: "PENDING",
  1: "ONGOING",
  2: "COMPLETED",
};

const MODE_LABELS: Record<number, string> = {
  0: "PRACTICAL",
  1: "EXAMINATION",
};

const STATUS_OPTIONS: ExaminationRequest["status"][] = [
  "PENDING",
  "ONGOING",
  "COMPLETED",
];
const MODE_OPTIONS: ExaminationRequest["mode"][] = [
  "PRACTICAL",
  "EXAMINATION",
];

const emptyForm: ExaminationRequest = {
  examName: "",
  programmingLanguageId: "",
  problems: [],
  // problemIds: [],
  classroomId: "",
  startDatetime: "",
  endDatetime: "",
  description: "",
  isPublicResult: false,
  totalMark: 0,
  status: "PENDING",
  mode: "PRACTICAL",
};

type PractiseTabProps = {
  classId: string;
  examinations: Examination[];
  loading: boolean;
  onRefetch: () => Promise<void>;
  setExamDetailBack?: (callback: (() => void) | null) => void;
  /** Exam ID from URL to restore detail view on refresh */
  initialExamId?: string | null;
  /** Called when user opens an exam or goes back to list (to sync URL) */
  onExamIdInUrlChange?: (examId: string | null) => void;
};

export function ExamsTab({
  classId,
  examinations,
  loading,
  onRefetch,
  setExamDetailBack,
  initialExamId,
  onExamIdInUrlChange,
}: PractiseTabProps) {
  const { showSuccess, showError } = useToast();
  const { user } = useAuth();
  const {
    createExamination,
    updateExamination,
    deleteExamination,
    getExaminationById,
  } = useExamination();

  const { getEnabledProgrammingLanguages } = useProgrammingLanguage();
  const { getAll: getAllTemplates } = useExaminationTemplate();

  const [languages, setLanguages] = useState<ProgrammingLanguage[]>([]);
  const [openFormModal, setOpenFormModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [openTemplateModal, setOpenTemplateModal] = useState(false);
  const [editingExam, setEditingExam] = useState<Examination | null>(null);
  const [examToDelete, setExamToDelete] = useState<Examination | null>(null);
  const [examToView, setExamToView] = useState<Examination | null>(null);
  const [formData, setFormData] = useState<ExaminationRequest>(emptyForm);
  const [actionLoading, setActionLoading] = useState(false);
  const [templateList, setTemplateList] = useState<ExaminationTemplateResponse[]>([]);
  const [templateLoading, setTemplateLoading] = useState(false);

  const loadLanguages = useCallback(async () => {
    try {
      const list = await getEnabledProgrammingLanguages();
      setLanguages(list);
    } catch (e) {
      console.error("Failed to load programming languages", e);
      showError("Failed to load programming languages");
    }
  }, [getEnabledProgrammingLanguages, showError]);

  const loadTemplates = useCallback(async () => {
    setTemplateLoading(true);
    try {
      const result = await getAllTemplates(1, 100);
      setTemplateList(result.items.filter((t) => !t.isDeleted));
    } catch (e) {
      console.error("Failed to load exam templates", e);
      showError("Failed to load exam templates");
    } finally {
      setTemplateLoading(false);
    }
  }, [getAllTemplates, showError]);

  const openFromTemplate = (template: ExaminationTemplateResponse) => {
    setOpenTemplateModal(false);
    setEditingExam(null);
    setFormData({
      ...emptyForm,
      classroomId: classId,
      examName: template.examName,
      totalMark: template.totalMark,
      problems: template.problems.map((p) => ({
        problemId: p.problemId,
        mark: p.mark,
      })),
      startDatetime: new Date().toISOString().slice(0, 16),
      endDatetime: new Date(Date.now() + 60 * 60 * 1000)
        .toISOString()
        .slice(0, 16),
    });
    setOpenFormModal(true);
  };

  const handleOpenTemplateModal = () => {
    void loadTemplates();
    setOpenTemplateModal(true);
  };

  useEffect(() => {
    loadLanguages();
  }, [loadLanguages]);

  const openCreate = () => {
    setEditingExam(null);
    setFormData({
      ...emptyForm,
      classroomId: classId,
      startDatetime: new Date().toISOString().slice(0, 16),
      endDatetime: new Date(Date.now() + 60 * 60 * 1000)
        .toISOString()
        .slice(0, 16),
    });
    setOpenFormModal(true);
  };

  const openEdit = (exam: Examination) => {
    setEditingExam(exam);
    const statusKey = exam.status as 0 | 1 | 2;
    const modeKey = exam.mode as 0 | 1;
    setFormData({
      examName: exam.examName,
      programmingLanguageId: exam.programmingLanguage.id,
      problems: (exam.examProblems ?? []).map((ep) => ({
        problemId: ep.problemId,
        mark: ep.mark,
      })),
      classroomId: exam.classroom.id,
      startDatetime: exam.startDatetime.slice(0, 16),
      endDatetime: exam.endDatetime.slice(0, 16),
      description: exam.description ?? "",
      isPublicResult: exam.isPublicResult,
      totalMark: exam.totalMark,
      status: (STATUS_LABELS[statusKey] ?? "PENDING") as ExaminationRequest["status"],
      mode: (MODE_LABELS[modeKey] ?? "PRACTICAL") as ExaminationRequest["mode"],
    });
    setOpenFormModal(true);
  };

  const openDeleteConfirm = (exam: Examination) => {
    setExamToDelete(exam);
    setOpenDeleteModal(true);
  };

  const openViewDetail = (exam: Examination) => {
    setExamToView(exam);
    onExamIdInUrlChange?.(exam.id);
  };

  const backToList = useCallback(() => {
    setExamToView(null);
    onExamIdInUrlChange?.(null);
  }, [onExamIdInUrlChange]);

  useEffect(() => {
    setExamDetailBack?.(() => (examToView ? backToList : null));
    return () => setExamDetailBack?.(() => null);
  }, [examToView, backToList, setExamDetailBack]);

  // Restore exam detail from URL (e.g. after F5 refresh)
  useEffect(() => {
    if (!initialExamId) {
      setExamToView(null);
      return;
    }
    const fromList = examinations.find((e) => e.id === initialExamId);
    if (fromList) {
      setExamToView(fromList);
      return;
    }
    let cancelled = false;
    getExaminationById(initialExamId).then((exam) => {
      if (!cancelled && exam) setExamToView(exam);
    });
    return () => {
      cancelled = true;
    };
  }, [initialExamId, examinations, getExaminationById]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.examName.trim()) {
      showError("Exam name is required");
      return;
    }
    if (!formData.programmingLanguageId) {
      showError("Programming language is required");
      return;
    }
    if (
      typeof formData.totalMark !== "number" ||
      formData.totalMark < 0 ||
      formData.totalMark > 10
    ) {
      showError("Total mark must be between 0 and 10");
      return;
    }
    try {
      setActionLoading(true);
      if (editingExam) {
        await updateExamination(editingExam.id, formData);
        showSuccess("Examination updated successfully");
      } else {
        await createExamination(formData);
        showSuccess("Examination created successfully");
      }
      setOpenFormModal(false);
      await onRefetch();
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data
              ?.message
          : "Action failed";
      showError(String(msg));
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!examToDelete) return;
    try {
      setActionLoading(true);
      await deleteExamination(examToDelete.id);
      showSuccess("Examination deleted successfully");
      setOpenDeleteModal(false);
      setExamToDelete(null);
      await onRefetch();
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data
              ?.message
          : "Delete failed";
      showError(String(msg));
    } finally {
      setActionLoading(false);
    }
  };

  // Detail tab: show full examination when one is selected (back button is in page header)
  if (examToView) {
    return (
      <ExaminationDetailView
        examination={examToView}
        onBack={backToList}
        showBackInHeader={false}
      />
    );
  }

  // List tab: table of examinations
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="border-l-8 border-[#1F4E79] pl-4 text-3xl font-black text-gray-900 dark:border-[#C9A24D] dark:text-white">
        Examinations
        </h2>
        <div className="flex gap-2">
          <Button
            color="light"
            className="cursor-pointer border border-[#1F4E79] text-[#1F4E79] hover:bg-[#1F4E79]/10 dark:border-[#C9A24D] dark:text-[#C9A24D] dark:hover:bg-[#C9A24D]/10"
            onClick={handleOpenTemplateModal}
          >
            <DocumentDuplicateIcon className="mr-2 h-5 w-5" />
            From Template
          </Button>
          <Button
            color="dark"
            className="bg-[#1F4E79] hover:bg-[#2A6BA3] cursor-pointer"
            onClick={openCreate}
          >
            <PlusIcon className="mr-2 h-5 w-5" />
            Blank Exam
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="xl" />
        </div>
      ) : examinations.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white py-20 text-center dark:border-gray-700 dark:bg-gray-800">
          <p className="text-gray-500 dark:text-gray-400">
            No examinations yet. Create one to get started.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto border-gray-200 bg-white shadow dark:border-gray-700 dark:bg-gray-800">
          <Table hoverable>
            <TableHead>
              <TableRow>
                <TableHeadCell>Exam name</TableHeadCell>
                <TableHeadCell>Language</TableHeadCell>
                <TableHeadCell>Start</TableHeadCell>
                <TableHeadCell>End</TableHeadCell>
                <TableHeadCell>Total mark</TableHeadCell>
                <TableHeadCell>Status</TableHeadCell>
                <TableHeadCell>Mode</TableHeadCell>
                <TableHeadCell>
                  <span className="sr-only">Actions</span>
                </TableHeadCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {examinations.map((exam) => {
                const statusKey = exam.status as 0 | 1 | 2;
                const modeKey = exam.mode as 0 | 1;
                const statusLabel = STATUS_LABELS[statusKey] ?? "PENDING";
                const modeLabel = MODE_LABELS[modeKey] ?? "PRACTICAL";
                return (
                  <TableRow key={exam.id}>
                    <TableCell className="whitespace-nowrap font-medium text-gray-900 dark:text-white">
                      {exam.examName}
                    </TableCell>
                    <TableCell>{exam.programmingLanguage?.name ?? "—"}</TableCell>
                    <TableCell className="whitespace-nowrap text-gray-600 dark:text-gray-400">
                      {formatDate(exam.startDatetime)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-gray-600 dark:text-gray-400">
                      {formatDate(exam.endDatetime)}
                    </TableCell>
                    <TableCell>{exam.totalMark}</TableCell>
                    <TableCell>
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
                    </TableCell>
                    <TableCell>
                      <Badge color="info">{modeLabel}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Tooltip content="View detail" placement="top">
                          <Button
                            size="xs"
                            color="light"
                            onClick={() => openViewDetail(exam)}
                            className="cursor-pointer"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </Button>
                        </Tooltip>
                        <Tooltip content="Edit" placement="top">
                          <Button
                            size="xs"
                            color="light"
                            onClick={() => openEdit(exam)}
                            className="cursor-pointer"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </Button>
                        </Tooltip>
                        <Tooltip content="Delete" placement="top">
                          <Button
                            size="xs"
                            color="failure"
                            onClick={() => openDeleteConfirm(exam)}
                            className="cursor-pointer"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <ExaminationFormModal
        show={openFormModal}
        onClose={() => setOpenFormModal(false)}
        editingExam={editingExam}
        formData={formData}
        setFormData={setFormData}
        languages={languages}
        actionLoading={actionLoading}
        onSubmit={handleSubmit}
      />

      <DeleteExaminationModal
        show={openDeleteModal}
        onClose={() => {
          setOpenDeleteModal(false);
          setExamToDelete(null);
        }}
        examToDelete={examToDelete}
        actionLoading={actionLoading}
        onConfirm={handleDelete}
      />

      <TemplatePickerModal
        show={openTemplateModal}
        onClose={() => setOpenTemplateModal(false)}
        templates={templateList}
        loading={templateLoading}
        onSelect={openFromTemplate}
      />
    </div>
  );
}

/**
 * Modal for creating/editing an examination
 */
type ExaminationFormModalProps = {
  show: boolean;
  onClose: () => void;
  editingExam: Examination | null;
  formData: ExaminationRequest;
  setFormData: React.Dispatch<React.SetStateAction<ExaminationRequest>>;
  languages: ProgrammingLanguage[];
  actionLoading: boolean;
  onSubmit: (e: React.FormEvent) => void;
};

function ExaminationFormModal({
  show,
  onClose,
  editingExam,
  formData,
  setFormData,
  languages,
  actionLoading,
  onSubmit,
}: ExaminationFormModalProps) {
  return (
    <Modal show={show} onClose={onClose} size="lg">
      <ModalHeader>
        {editingExam ? "Edit examination" : "Create examination"}
      </ModalHeader>
      <form
        onSubmit={onSubmit}
        className="flex min-h-0 flex-1 flex-col overflow-hidden"
      >
        <ModalBody className="space-y-4 overflow-y-auto">
          <div>
            <Label htmlFor="examName">
              Exam name <span className="text-red-500">*</span>
            </Label>
            <TextInput
              id="examName"
              required
              value={formData.examName}
              onChange={(e) =>
                setFormData({ ...formData, examName: e.target.value })
              }
              placeholder="e.g. Practice 1 - Arrays"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="programmingLanguageId">
              Programming language <span className="text-red-500">*</span>
            </Label>
            <Select
              id="programmingLanguageId"
              required
              value={formData.programmingLanguageId}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  programmingLanguageId: e.target.value,
                })
              }
              className="mt-1"
            >
              <option value="">Select language</option>
              {languages
                .map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
            </Select>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="startDatetime">
                Start <span className="text-red-500">*</span>
              </Label>
              <TextInput
                id="startDatetime"
                type="datetime-local"
                required
                value={formData.startDatetime}
                onChange={(e) =>
                  setFormData({ ...formData, startDatetime: e.target.value })
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="endDatetime">
                End <span className="text-red-500">*</span>
              </Label>
              <TextInput
                id="endDatetime"
                type="datetime-local"
                required
                value={formData.endDatetime}
                onChange={(e) =>
                  setFormData({ ...formData, endDatetime: e.target.value })
                }
                className="mt-1"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Optional description"
              rows={3}
              className="mt-1"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="totalMark">
                Total mark <span className="text-red-500">*</span>
              </Label>
              <TextInput
                id="totalMark"
                type="number"
                min={0}
                max={10}
                step={0.5}
                required
                value={formData.totalMark || ""}
                onChange={(e) => {
                  const raw = Number(e.target.value);
                  const value =
                    Number.isNaN(raw) ? 0 : Math.min(10, Math.max(0, raw));
                  setFormData({ ...formData, totalMark: value });
                }}
                className="mt-1"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Status</Label>
              <Select
                value={formData.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as ExaminationRequest["status"],
                  })
                }
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label>Mode</Label>
            <Select
              value={formData.mode}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  mode: e.target.value as ExaminationRequest["mode"],
                })
              }
            >
              {MODE_OPTIONS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="isPublicResult"
              checked={formData.isPublicResult}
              onChange={(e) =>
                setFormData({ ...formData, isPublicResult: e.target.checked })
              }
            />
            <Label htmlFor="isPublicResult">Public result</Label>
          </div>
        </ModalBody>
        <ModalFooter className="shrink-0 border-t border-gray-200 dark:border-gray-600">
          <Button type="button" color="gray" onClick={onClose} className="cursor-pointer">
            Cancel
          </Button>
          <Button
            type="submit"
            className="bg-[#1F4E79] hover:bg-[#2A6BA3] cursor-pointer"
            disabled={actionLoading}
          >
            {actionLoading ? (
              <Spinner size="sm" className="mr-2" />
            ) : null}
            {editingExam ? "Update" : "Create"}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}

/**
 * Modal for confirming deletion of an examination
 */
type DeleteExaminationModalProps = {
  show: boolean;
  onClose: () => void;
  examToDelete: Examination | null;
  actionLoading: boolean;
  onConfirm: () => void;
};

function DeleteExaminationModal({
  show,
  onClose,
  examToDelete,
  actionLoading,
  onConfirm,
}: DeleteExaminationModalProps) {
  return (
    <Modal show={show} onClose={onClose} size="md" popup>
      <ModalHeader />
      <ModalBody>
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400">
            Are you sure you want to delete &quot;{examToDelete?.examName}&quot;?
            This action cannot be undone.
          </p>
          <div className="mt-6 flex justify-center gap-4">
            <Button color="gray" onClick={onClose}>
              Cancel
            </Button>
            <Button
              color="failure"
              onClick={onConfirm}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <Spinner size="sm" className="mr-2" />
              ) : null}
              Delete
            </Button>
          </div>
        </div>
      </ModalBody>
    </Modal>
  );
}

type TemplatePickerModalProps = {
  show: boolean;
  onClose: () => void;
  templates: ExaminationTemplateResponse[];
  loading: boolean;
  onSelect: (template: ExaminationTemplateResponse) => void;
};

function TemplatePickerModal({
  show,
  onClose,
  templates,
  loading,
  onSelect,
}: TemplatePickerModalProps) {
  return (
    <Modal show={show} onClose={onClose} size="lg">
      <ModalHeader>Select Exam Template</ModalHeader>
      <ModalBody>
        {loading ? (
          <div className="flex justify-center py-8">
            <Spinner size="xl" />
          </div>
        ) : templates.length === 0 ? (
          <p className="py-8 text-center text-gray-500">
            No exam templates found. Create one in the Examination Bank first.
          </p>
        ) : (
          <div className="space-y-2">
            {templates.map((t) => (
              <div
                key={t.id}
                className="flex cursor-pointer items-center justify-between rounded-lg border border-gray-200 px-4 py-3 transition-colors hover:border-[#1F4E79] hover:bg-blue-50 dark:border-gray-600 dark:hover:border-[#C9A24D] dark:hover:bg-[#C9A24D]/10"
                onClick={() => onSelect(t)}
              >
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{t.examName}</p>
                  <p className="text-sm text-gray-500">
                    {t.problems.length} problem{t.problems.length !== 1 ? "s" : ""} &middot; Total mark: {t.totalMark}
                  </p>
                  {t.description && (
                    <p className="mt-1 text-xs text-gray-400 line-clamp-1">{t.description}</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge color="info">{t.problems.length}</Badge>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    {t.totalMark} pts
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </ModalBody>
      <ModalFooter>
        <Button color="gray" onClick={onClose} className="cursor-pointer">
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  );
}

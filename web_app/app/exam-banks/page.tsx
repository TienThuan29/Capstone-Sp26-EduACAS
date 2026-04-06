"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ArrowPathIcon,
  PencilSquareIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import {
  Badge,
  Button,
  Select,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
} from "flowbite-react";
import { useThemeContext } from "@/components/theme-provider";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/useToast";
import { useExaminationTemplate } from "@/hooks/examination-template/useExaminationTemplate";
import type {
  ExaminationTemplateResponse,
  CreateExaminationTemplatePayload,
  UpdateExaminationTemplatePayload,
} from "@/types/examination-template";
import { useProblem } from "@/hooks/problem/useProblem";
import { formatDateOnly } from "@/utils/datetime-utils";
import { CustomPagination } from "@/components/custom-pagination";

import { initialFormState } from "./components/exam-banks.types";
import type { ExamFormProblem, ExamFormState, ProblemPickerState } from "./components/exam-banks.types";
import { ExamFormModal } from "./components/exam-form-modal";
import { ProblemPickerModal } from "./components/problem-picker-modal";
import { DefaultCustomButton } from "@/components/ui/custom-button";

const DEFAULT_PROBLEM_MARK = 10;

export default function ExamBanksPage() {
  const { isDark } = useThemeContext();
  const { user } = useAuth();
  const toast = useToast();
  const { getByLecturerId, create, update, softDelete, restore } = useExaminationTemplate();
  const { getProblemsByLecturerId } = useProblem();

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [templates, setTemplates] = useState<ExaminationTemplateResponse[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [pageIndex, setPageIndex] = useState(1);
  const pageSize = 10;

  const [includeDeleted, setIncludeDeleted] = useState(false);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isProblemPickerOpen, setIsProblemPickerOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ExaminationTemplateResponse | null>(null);
  const [formState, setFormState] = useState<ExamFormState>(initialFormState);

  const [pickerState, setPickerState] = useState<ProblemPickerState>({
    availableProblems: [],
    searchTerm: "",
    selectedProblemIds: new Set(),
    problemMarks: {},
  });

  const fetchTemplates = useCallback(async () => {
    if (!user?.id) {
      setTemplates([]);
      setTotalCount(0);
      setTotalPages(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await getByLecturerId(user.id, pageIndex, pageSize);
      const items = includeDeleted
        ? data.items
        : data.items.filter((t) => !t.isDeleted);
      setTemplates(items);
      setTotalCount(includeDeleted ? data.totalCount : items.length);
      setTotalPages(data.totalPages);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.showError(
        err.response?.data?.message ?? "Failed to load examination templates",
      );
    } finally {
      setLoading(false);
    }
  }, [getByLecturerId, pageIndex, pageSize, includeDeleted, user?.id, toast]);

  const fetchProblems = useCallback(async () => {
    if (!user?.id) return;
    try {
      const problems = await getProblemsByLecturerId(user.id);
      setPickerState((prev) => ({ ...prev, availableProblems: problems }));
    } catch {
      // silent fail for problem list
    }
  }, [getProblemsByLecturerId, user?.id]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !user?.id) return;
    fetchTemplates();
  }, [mounted, user?.id, fetchTemplates]);

  if (!mounted) return null;

  const resetForm = () => {
    setFormState(initialFormState);
    setEditingTemplate(null);
    setPickerState({
      availableProblems: [],
      searchTerm: "",
      selectedProblemIds: new Set(),
      problemMarks: {},
    });
  };

  const openCreateModal = () => {
    resetForm();
    void fetchProblems();
    setIsFormModalOpen(true);
  };

  const openEditModal = (template: ExaminationTemplateResponse) => {
    void fetchProblems();
    setEditingTemplate(template);
    setFormState({
      examName: template.examName,
      description: template.description ?? "",
      totalMark: template.totalMark,
      problems: template.problems.map((p) => ({
        problemId: p.problemId,
        mark: p.mark,
        title: p.title,
      })),
    });
    setPickerState((prev) => ({
      ...prev,
      selectedProblemIds: new Set(template.problems.map((p) => p.problemId)),
      problemMarks: template.problems.reduce<Record<string, number>>((acc, p) => {
        acc[p.problemId] = p.mark;
        return acc;
      }, {}),
    }));
    setIsFormModalOpen(true);
  };

  const openProblemPicker = () => {
    setPickerState((prev) => ({
      ...prev,
      selectedProblemIds: new Set(formState.problems.map((p) => p.problemId)),
      problemMarks: formState.problems.reduce<Record<string, number>>((acc, p) => {
        acc[p.problemId] = p.mark;
        return acc;
      }, {}),
    }));
    setIsProblemPickerOpen(true);
  };

  const applySelectedProblems = () => {
    const selected: ExamFormProblem[] = Array.from(pickerState.selectedProblemIds).map((id) => {
      const ap = pickerState.availableProblems.find((x) => x.id === id);
      return {
        problemId: id,
        mark: pickerState.problemMarks[id] ?? DEFAULT_PROBLEM_MARK,
        title: ap?.title,
      };
    });
    const total = selected.reduce((sum, p) => sum + p.mark, 0);
    setFormState((prev) => ({ ...prev, problems: selected, totalMark: total }));
    setIsProblemPickerOpen(false);
  };

  const removeProblem = (problemId: string) => {
    setFormState((prev) => {
      const problems = prev.problems.filter((p) => p.problemId !== problemId);
      const totalMark = problems.reduce((sum, p) => sum + p.mark, 0);
      return { ...prev, problems, totalMark };
    });
  };

  const validateForm = (): boolean => {
    if (!formState.examName.trim()) {
      toast.showError("Exam name is required");
      return false;
    }
    if (formState.problems.length === 0) {
      toast.showError("At least one problem is required");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (!user?.id) {
      toast.showError("Unable to identify current user");
      return;
    }

    setSubmitting(true);
    try {
      if (editingTemplate) {
        const payload: UpdateExaminationTemplatePayload = {
          examName: formState.examName.trim(),
          description: formState.description.trim() || undefined,
          totalMark: formState.totalMark,
          problems: formState.problems.map(({ problemId, mark }) => ({ problemId, mark })),
        };
        await update(editingTemplate.id, payload);
        toast.showSuccess("Examination template updated successfully");
      } else {
        const payload: CreateExaminationTemplatePayload = {
          examName: formState.examName.trim(),
          lecturerId: user.id,
          description: formState.description.trim() || undefined,
          totalMark: formState.totalMark,
          problems: formState.problems.map(({ problemId, mark }) => ({ problemId, mark })),
        };
        await create(payload);
        toast.showSuccess("Examination template created successfully");
      }

      setIsFormModalOpen(false);
      resetForm();
      fetchTemplates();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.showError(
        err.response?.data?.message ?? "Failed to save examination template",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleSoftDelete = async (id: string) => {
    if (!window.confirm("Soft delete this examination template?")) return;

    try {
      await softDelete(id);
      toast.showSuccess("Examination template soft deleted");
      fetchTemplates();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.showError(
        err.response?.data?.message ?? "Failed to soft delete",
      );
    }
  };

  const handleRestore = async (id: string) => {
    try {
      await restore(id);
      toast.showSuccess("Examination template restored");
      fetchTemplates();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.showError(err.response?.data?.message ?? "Failed to restore");
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1
          className={`mb-2 text-4xl font-bold ${
            isDark ? "text-white" : "text-gray-900"
          }`}
        >
          Examination Bank
        </h1>
        <p className={`${isDark ? "text-gray-400" : "text-gray-600"}`}>
          Manage examination templates and problem sets
          <span className="ml-2 font-medium">({totalCount})</span>
        </p>
      </div>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-1 flex-wrap gap-3">
          <Select
            value={includeDeleted ? "deleted" : "active"}
            onChange={(e) => {
              setIncludeDeleted(e.target.value === "deleted");
              setPageIndex(1);
            }}
            className="min-w-40"
          >
            <option value="active">Active only</option>
            <option value="deleted">Include deleted</option>
          </Select>
        </div>

        <DefaultCustomButton label="Add Template" icon={<PlusIcon className="h-5 w-5" />} onClick={openCreateModal} className="cursor-pointer">
        </DefaultCustomButton>
      </div>

      <div
        className={`overflow-x-auto rounded-lg border ${
          isDark ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"
        }`}
      >
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <Spinner size="xl" />
            <span className="ml-3">Loading examination templates...</span>
          </div>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableHeadCell>Exam Name</TableHeadCell>
                <TableHeadCell>Description</TableHeadCell>
                <TableHeadCell>Problems</TableHeadCell>
                <TableHeadCell>Total Mark</TableHeadCell>
                <TableHeadCell>Status</TableHeadCell>
                <TableHeadCell>Created</TableHeadCell>
                <TableHeadCell>Actions</TableHeadCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {templates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center">
                    No examination templates found.
                  </TableCell>
                </TableRow>
              ) : (
                templates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell className="font-medium">{template.examName}</TableCell>
                    <TableCell className="max-w-xs">
                      <div className="line-clamp-2 text-sm">
                        {template.description || "—"}
                      </div>
                    </TableCell>
                    <TableCell>{template.problems.length}</TableCell>
                    <TableCell>{template.totalMark}</TableCell>
                    <TableCell>
                      <Badge color={template.isDeleted ? "failure" : "success"}>
                        {template.isDeleted ? "Deleted" : "Active"}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDateOnly(template.createdDate)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="xs"
                          color="light"
                          onClick={() => openEditModal(template)}
                          disabled={template.isDeleted}
                        >
                          <PencilSquareIcon className="h-4 w-4" />
                        </Button>
                        {template.isDeleted ? (
                          <Button
                            size="xs"
                            color="success"
                            onClick={() => handleRestore(template.id)}
                          >
                            <ArrowPathIcon className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            size="xs"
                            color="failure"
                            onClick={() => handleSoftDelete(template.id)}
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>

      <CustomPagination
        currentPage={pageIndex}
        totalPages={totalPages}
        onPageChange={setPageIndex}
      />

      <ExamFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        editingTemplate={editingTemplate}
        formState={formState}
        setFormState={setFormState}
        onOpenProblemPicker={openProblemPicker}
        onRemoveProblem={removeProblem}
        availableProblems={pickerState.availableProblems}
        submitting={submitting}
        onSubmit={handleSubmit}
      />

      <ProblemPickerModal
        isOpen={isProblemPickerOpen}
        onClose={() => setIsProblemPickerOpen(false)}
        pickerState={pickerState}
        setPickerState={setPickerState}
        onApply={applySelectedProblems}
        onFetchProblems={fetchProblems}
        formProblemIds={formState.problems.map((p) => p.problemId)}
        formProblemMarks={formState.problems.reduce<Record<string, number>>((acc, p) => {
          acc[p.problemId] = p.mark;
          return acc;
        }, {})}
        totalMark={formState.totalMark}
        userId={user?.id}
      />
    </div>
  );
}

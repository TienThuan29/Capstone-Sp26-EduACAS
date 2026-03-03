"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useThemeContext } from "@/components/theme-provider";
import { PageUrl } from "@/configs/page.url";
import {
  Button,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  TextInput,
  Textarea,
  Select,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
  Label,
  Tooltip,
} from "flowbite-react";
import {
  PlusIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import { useToast } from "@/hooks/useToast";
import { useProblem } from "@/hooks/problem/useProblem";
import { useAuth } from "@/contexts/AuthContext";
import type { ProblemBasicResponse, Difficulty } from "@/types/problem";
import { DIFFICULTY, PROBLEM_MODE, normalizeDifficulty } from "@/types/problem";
import type {
  CreateProblemPayload,
  UpdateProblemPayload,
} from "@/hooks/problem/useProblem";
import { DefaultCustomButton } from "@/components/ui/custom-button";
import { formatDateOnly } from "@/utils/datetime-utils";

type ProblemFormData = {
  lecturerId: string;
  title: string;
  content: string;
  fileName: string;
  difficulty: Difficulty;
  codeTemplate: string;
};

const initialFormData: ProblemFormData = {
  lecturerId: "",
  title: "",
  content: "",
  fileName: "",
  difficulty: "EASY",
  codeTemplate: "",
};

export default function ProblemBanksPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { isDark } = useThemeContext();
  const toast = useToast();
  const {
    getProblemsByLecturerId,
    createProblem,
    updateProblem,
    deleteProblem,
  } = useProblem();

  const [mounted, setMounted] = useState(false);
  const [problems, setProblems] = useState<ProblemBasicResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [editingProblem] = useState<ProblemBasicResponse | null>(null);
  const [problemToDelete, setProblemToDelete] =
    useState<ProblemBasicResponse | null>(null);
  const [formData, setFormData] = useState<ProblemFormData>(initialFormData);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchProblems();
  }, [])

  const fetchProblems = async () => {
    try {
      setLoading(true);
      const data = await getProblemsByLecturerId(user?.id ?? "");
      setProblems(data);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.showError(err.response?.data?.message ?? "Failed to load problems");
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  const filteredProblems = problems.filter((p) => {
    const matchesSearch = p.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const normalized = normalizeDifficulty(p.difficulty);
    const matchesDifficulty =
      difficultyFilter === "all" || normalized === difficultyFilter;
    return matchesSearch && matchesDifficulty;
  });

  const handleViewDetail = (row: ProblemBasicResponse) => {
    router.push(PageUrl.PROBLEM_BANKS_VIEW_PAGE(row.id));
  };

  const handleDeleteClick = (row: ProblemBasicResponse) => {
    setProblemToDelete(row);
    setIsDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!problemToDelete) return;
    try {
      await deleteProblem(problemToDelete.id);
      toast.showSuccess("Problem deleted successfully");
      setIsDeleteConfirmOpen(false);
      setProblemToDelete(null);
      fetchProblems();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.showError(
        err.response?.data?.message ?? "Failed to delete problem",
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingProblem) {
        const payload: UpdateProblemPayload = {
          title: formData.title,
          content: formData.content,
          fileName: formData.fileName,
          difficulty: formData.difficulty,
          codeTemplates: formData.codeTemplate ? { default: formData.codeTemplate } : undefined,
        };
        await updateProblem(editingProblem.id, payload);
        toast.showSuccess("Problem updated successfully");
      } else {
        const payload: CreateProblemPayload = {
          lecturerId: formData.lecturerId || (user?.id ?? ""),
          title: formData.title,
          content: formData.content,
          fileName: formData.fileName,
          difficulty: formData.difficulty,
          codeTemplates: formData.codeTemplate ? { default: formData.codeTemplate } : undefined,
          mode: PROBLEM_MODE.MANUAL,
        };
        await createProblem(payload);
        toast.showSuccess("Problem created successfully");
      }
      setIsModalOpen(false);
      fetchProblems();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.showError(err.response?.data?.message ?? "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1
          className={`mb-2 text-4xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}
        >
          Problem Bank
        </h1>
        <p className={`text-lg ${isDark ? "text-gray-400" : "text-gray-600"}`}>
          Create and manage coding problems
        </p>
      </div>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 flex-1 flex-wrap gap-4">
          <div className="max-w-md min-w-[200px] flex-1">
            <TextInput
              type="text"
              icon={MagnifyingGlassIcon}
              placeholder="Search by title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
          <Select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
            className="min-w-[140px]"
          >
            <option value="all">All difficulty</option>
            <option value={DIFFICULTY.EASY}>Easy</option>
            <option value={DIFFICULTY.MEDIUM}>Medium</option>
            <option value={DIFFICULTY.HARD}>Hard</option>
          </Select>
        </div>
        <DefaultCustomButton
          label="Add problem"
          icon={<PlusIcon className="h-5 w-5" />}
          onClick={() => router.push(PageUrl.PROBLEM_BANKS_CREATE_PAGE)}
          className="shrink-0 cursor-pointer"
        />
      </div>

      <div
        className={`overflow-x-auto rounded-lg ${isDark ? "bg-gray-800" : "bg-white"} border ${isDark ? "border-gray-700" : "border-gray-200"}`}
      >
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <Spinner size="xl" />
            <span
              className={`ml-3 ${isDark ? "text-gray-300" : "text-gray-700"}`}
            >
              Loading...
            </span>
          </div>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableHeadCell>Title</TableHeadCell>
                <TableHeadCell>Difficulty</TableHeadCell>
                <TableHeadCell>Tags</TableHeadCell>
                <TableHeadCell>Test cases</TableHeadCell>
                <TableHeadCell>Created</TableHeadCell>
                <TableHeadCell>Updated</TableHeadCell>
                <TableHeadCell>Actions</TableHeadCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredProblems.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className={`py-8 text-center ${isDark ? "text-gray-400" : "text-gray-500"}`}
                  >
                    No problems found. Create one to get started.
                  </TableCell>
                </TableRow>
              ) : (
                filteredProblems.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell
                      className={`max-w-xs truncate font-medium ${isDark ? "text-white" : "text-gray-900"}`}
                    >
                      <button
                        type="button"
                        onClick={() => handleViewDetail(p)}
                        className="text-left hover:underline focus:outline-none"
                      >
                        {p.title}
                      </button>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`font-medium ${normalizeDifficulty(p.difficulty) === "EASY"
                          ? "text-green-600"
                          : normalizeDifficulty(p.difficulty) === "MEDIUM"
                            ? "text-yellow-600"
                            : "text-red-600"
                          }`}
                      >
                        {normalizeDifficulty(p.difficulty)}
                      </span>
                    </TableCell>
                    <TableCell
                      className={`max-w-[180px] ${isDark ? "text-gray-300" : "text-gray-700"}`}
                    >
                      {p.tags?.length ? (
                        <span className="truncate" title={p.tags.join(", ")}>
                          {p.tags.slice(0, 3).join(", ")}
                          {p.tags.length > 3 ? ` +${p.tags.length - 3}` : ""}
                        </span>
                      ) : (
                        <span className="italic text-gray-400">—</span>
                      )}
                    </TableCell>
                    <TableCell
                      className={isDark ? "text-gray-300" : "text-gray-700"}
                    >
                      {p.testCasesCount ?? 0}
                    </TableCell>
                    <TableCell
                      className={isDark ? "text-gray-300" : "text-gray-900"}
                    >
                      {formatDateOnly(p.createdDate)}
                    </TableCell>
                    <TableCell
                      className={isDark ? "text-gray-300" : "text-gray-900"}
                    >
                      {p.updatedDate ? formatDateOnly(p.updatedDate) : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Tooltip content="View" placement="top">
                          <Button
                            type="button"
                            size="xs"
                            color="light"
                            onClick={() => handleViewDetail(p)}
                            className="cursor-pointer"
                          >
                            <DocumentTextIcon className="h-4 w-4" />
                          </Button>
                        </Tooltip>
                        <Tooltip content="Delete" placement="top">
                          <Button
                            size="xs"
                            color="failure"
                            onClick={() => handleDeleteClick(p)}
                            className="cursor-pointer"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>

      <ProblemFormModal
        show={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        isDark={isDark}
        editingProblem={editingProblem}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleSubmit}
        submitting={submitting}
      />

      <Modal
        show={isDeleteConfirmOpen}
        onClose={() => {
          setIsDeleteConfirmOpen(false);
          setProblemToDelete(null);
        }}
        size="md"
      >
        <ModalHeader>Delete problem</ModalHeader>
        <ModalBody>
          <p className={isDark ? "text-gray-300" : "text-gray-600"}>
            Are you sure you want to delete &quot;{problemToDelete?.title}
            &quot;? This action cannot be undone.
          </p>
        </ModalBody>
        <ModalFooter className="flex justify-end">
          <Button
            color="gray"
            onClick={() => {
              setIsDeleteConfirmOpen(false);
              setProblemToDelete(null);
            }}
            className="cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            color="red"
            onClick={handleDeleteConfirm}
            className="cursor-pointer"
          >
            Delete
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}

type ProblemFormModalProps = {
  show: boolean;
  onClose: () => void;
  isDark: boolean;
  editingProblem: ProblemBasicResponse | null;
  formData: ProblemFormData;
  setFormData: React.Dispatch<React.SetStateAction<ProblemFormData>>;
  onSubmit: (e: React.FormEvent) => void;
  submitting: boolean;
};

function ProblemFormModal({
  show,
  onClose,
  isDark,
  editingProblem,
  formData,
  setFormData,
  onSubmit,
  submitting,
}: ProblemFormModalProps) {
  return (
    <Modal show={show} onClose={onClose} size="4xl">
      <ModalHeader>
        {editingProblem ? "Edit problem" : "Add new problem"}
      </ModalHeader>
      <ModalBody>
        <form onSubmit={onSubmit} className="space-y-4">
          {!editingProblem && (
            <div>
              <Label
                htmlFor="lecturerId"
                className={isDark ? "text-white" : "text-gray-900"}
              >
                Lecturer ID <span className="text-red-500">*</span>
              </Label>
              <TextInput
                id="lecturerId"
                value={formData.lecturerId}
                onChange={(e) =>
                  setFormData({ ...formData, lecturerId: e.target.value })
                }
                placeholder="Lecturer ID"
                required
                className="mt-1"
              />
            </div>
          )}
          <div>
            <Label
              htmlFor="title"
              className={isDark ? "text-white" : "text-gray-900"}
            >
              Title <span className="text-red-500">*</span>
            </Label>
            <TextInput
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="Problem title (3–500 characters)"
              required
              minLength={3}
              maxLength={500}
              className="mt-1"
            />
          </div>
          <div>
            <Label
              htmlFor="content"
              className={isDark ? "text-white" : "text-gray-900"}
            >
              Content <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) =>
                setFormData({ ...formData, content: e.target.value })
              }
              placeholder="Problem description (10–50000 characters)"
              required
              rows={4}
              className="mt-1"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Label
              htmlFor="fileName"
              className={isDark ? "text-white" : "text-gray-900"}
            >
              File name <span className="text-red-500">*</span>
            </Label>
            <TextInput
              id="fileName"
              value={formData.fileName}
              onChange={(e) =>
                setFormData({ ...formData, fileName: e.target.value })
              }
              placeholder="e.g. Main.java"
              required
              className="mt-1"
            />
          </div>
          <div></div>
          <div>
            <Label
              htmlFor="difficulty"
              className={isDark ? "text-white" : "text-gray-900"}
            >
              Difficulty <span className="text-red-500">*</span>
            </Label>
            <Select
              id="difficulty"
              value={formData.difficulty}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  difficulty: e.target.value as Difficulty,
                })
              }
              className="mt-1"
            >
              <option value={DIFFICULTY.EASY}>Easy</option>
              <option value={DIFFICULTY.MEDIUM}>Medium</option>
              <option value={DIFFICULTY.HARD}>Hard</option>
            </Select>
          </div>
          <div>
            <Label
              htmlFor="codeTemplate"
              className={isDark ? "text-white" : "text-gray-900"}
            >
              Code template
            </Label>
            <Textarea
              id="codeTemplate"
              value={formData.codeTemplate}
              onChange={(e) =>
                setFormData({ ...formData, codeTemplate: e.target.value })
              }
              placeholder="Starter code for the problem"
              rows={6}
              className="mt-1 font-mono text-sm"
            />
          </div>
          <div className="flex justify-end gap-4 pt-4">
            <Button
              type="button"
              color="gray"
              onClick={onClose}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              color="purple"
              disabled={submitting}
              className="cursor-pointer"
            >
              {submitting ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Saving...
                </>
              ) : editingProblem ? (
                "Update"
              ) : (
                "Create"
              )}
            </Button>
          </div>
        </form>
      </ModalBody>
    </Modal>
  );
}

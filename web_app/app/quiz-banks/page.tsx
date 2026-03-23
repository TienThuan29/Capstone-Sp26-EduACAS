"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowPathIcon,
  ClipboardDocumentListIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import {
  Badge,
  Button,
  Label,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Select,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
  TextInput,
} from "flowbite-react";
import { useRouter } from "next/navigation";
import { useThemeContext } from "@/components/theme-provider";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/useToast";
import {
  useQuiz,
  type CreateQuizPayload,
  type UpdateQuizPayload,
} from "@/hooks/quiz/useQuiz";
import { useSubject } from "@/hooks/subject/useSubject";
import type { Quiz } from "@/types/quiz";
import type { Subject } from "@/types/subject";
import { formatDateOnly } from "@/utils/datetime-utils";
import { CustomPagination } from "@/components/custom-pagination";
import { PageUrl } from "@/configs/page.url";

type QuizFormState = {
  subjectId: string;
  title: string;
  duration: number;
};

const initialFormState: QuizFormState = {
  subjectId: "",
  title: "",
  duration: 30,
};

export default function QuizBanksPage() {
  const router = useRouter();
  const { isDark } = useThemeContext();
  const { user } = useAuth();
  const toast = useToast();
  const {
    getQuizzesPaged,
    createQuiz,
    updateQuiz,
    softDeleteQuiz,
    restoreQuiz,
  } = useQuiz();
  const { getActiveSubjects } = useSubject();

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [pageIndex, setPageIndex] = useState(1);
  const pageSize = 10;

  const [searchTerm, setSearchTerm] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("ALL");
  const [includeDeleted, setIncludeDeleted] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const [formState, setFormState] = useState<QuizFormState>(initialFormState);

  const fetchData = useCallback(async () => {
    if (!user?.id) {
      setQuizzes([]);
      setSubjects([]);
      setTotalCount(0);
      setTotalPages(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [quizData, subjectData] = await Promise.all([
        getQuizzesPaged(
          pageIndex,
          pageSize,
          includeDeleted,
          searchTerm,
          subjectFilter,
        ),
        getActiveSubjects(),
      ]);

      setQuizzes(quizData.items);
      setTotalCount(quizData.totalCount);
      setTotalPages(quizData.totalPages);
      setSubjects(subjectData);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.showError(err.response?.data?.message ?? "Failed to load quiz data");
    } finally {
      setLoading(false);
    }
  }, [
    getQuizzesPaged,
    pageIndex,
    pageSize,
    includeDeleted,
    searchTerm,
    subjectFilter,
    getActiveSubjects,
    toast,
    user?.id,
  ]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !user?.id) return;
    fetchData();
  }, [mounted, user?.id, fetchData]);

  const subjectMap = useMemo(() => {
    return subjects.reduce<Record<string, string>>((acc, subject) => {
      acc[subject.id] = subject.subjectName;
      return acc;
    }, {});
  }, [subjects]);

  if (!mounted) return null;

  const resetForm = () => {
    setEditingQuiz(null);
    setFormState(initialFormState);
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (quiz: Quiz) => {
    setEditingQuiz(quiz);
    setFormState({
      subjectId: quiz.subjectId,
      title: quiz.title,
      duration: quiz.duration,
    });
    setIsModalOpen(true);
  };

  const validateForm = (): boolean => {
    if (!editingQuiz && !formState.subjectId.trim()) {
      toast.showError("Subject is required");
      return false;
    }
    if (!formState.title.trim()) {
      toast.showError("Quiz title is required");
      return false;
    }
    if (formState.duration <= 0) {
      toast.showError("Duration must be greater than 0");
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
      if (editingQuiz) {
        const payload: UpdateQuizPayload = {
          title: formState.title.trim(),
          duration: Number(formState.duration),
        };
        await updateQuiz(editingQuiz.id, payload);
        toast.showSuccess("Quiz updated successfully");
      } else {
        const payload: CreateQuizPayload = {
          subjectId: formState.subjectId,
          title: formState.title.trim(),
          duration: Number(formState.duration),
          createdBy: user.id,
        };
        await createQuiz(payload);
        toast.showSuccess("Quiz created successfully");
      }

      setIsModalOpen(false);
      resetForm();
      fetchData();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.showError(err.response?.data?.message ?? "Failed to save quiz");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSoftDelete = async (quizId: string) => {
    if (!window.confirm("Soft delete this quiz?")) return;

    try {
      await softDeleteQuiz(quizId);
      toast.showSuccess("Quiz soft deleted successfully");
      fetchData();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.showError(err.response?.data?.message ?? "Failed to soft delete quiz");
    }
  };

  const handleRestore = async (quizId: string) => {
    try {
      await restoreQuiz(quizId);
      toast.showSuccess("Quiz restored successfully");
      fetchData();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.showError(err.response?.data?.message ?? "Failed to restore quiz");
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
          Quiz Bank
        </h1>
        <p className={`${isDark ? "text-gray-400" : "text-gray-600"}`}>
          Manage quiz metadata and map quizzes to subjects
          <span className="ml-2 font-medium">({totalCount})</span>
        </p>
      </div>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-1 flex-wrap gap-3">
          <div className="min-w-55 max-w-md flex-1">
            <TextInput
              icon={MagnifyingGlassIcon}
              placeholder="Search quiz title..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPageIndex(1);
              }}
            />
          </div>

          <Select
            value={subjectFilter}
            onChange={(e) => {
              setSubjectFilter(e.target.value);
              setPageIndex(1);
            }}
            className="min-w-55"
          >
            <option value="ALL">All subjects</option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.subjectName}
              </option>
            ))}
          </Select>

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

        <Button color="blue" onClick={openCreateModal}>
          <PlusIcon className="mr-2 h-5 w-5" />
          Add Quiz
        </Button>
      </div>

      <div
        className={`overflow-x-auto rounded-lg border ${
          isDark ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"
        }`}
      >
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <Spinner size="xl" />
            <span className="ml-3">Loading quizzes...</span>
          </div>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableHeadCell>Title</TableHeadCell>
                <TableHeadCell>Subject</TableHeadCell>
                <TableHeadCell>Duration (min)</TableHeadCell>
                <TableHeadCell>Total questions</TableHeadCell>
                <TableHeadCell>Status</TableHeadCell>
                <TableHeadCell>Created</TableHeadCell>
                <TableHeadCell>Actions</TableHeadCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {quizzes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center">
                    No quizzes found.
                  </TableCell>
                </TableRow>
              ) : (
                quizzes.map((quiz) => (
                  <TableRow key={quiz.id}>
                    <TableCell className="font-medium">
                      <button
                        type="button"
                        onClick={() => router.push(PageUrl.QUIZ_BANK_DETAIL_PAGE(quiz.id))}
                        className="text-left hover:underline"
                      >
                        {quiz.title}
                      </button>
                    </TableCell>
                    <TableCell>{subjectMap[quiz.subjectId] ?? quiz.subjectId}</TableCell>
                    <TableCell>{quiz.duration}</TableCell>
                    <TableCell>{quiz.totalQuestions}</TableCell>
                    <TableCell>
                      <Badge color={quiz.isDeleted ? "failure" : "success"}>
                        {quiz.isDeleted ? "Deleted" : "Active"}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDateOnly(quiz.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="xs"
                          color="info"
                          onClick={() =>
                            router.push(PageUrl.QUIZ_BANK_DETAIL_PAGE(quiz.id))
                          }
                        >
                          <ClipboardDocumentListIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          size="xs"
                          color="light"
                          onClick={() => openEditModal(quiz)}
                          disabled={quiz.isDeleted}
                        >
                          <PencilSquareIcon className="h-4 w-4" />
                        </Button>
                        {quiz.isDeleted ? (
                          <Button
                            size="xs"
                            color="success"
                            onClick={() => handleRestore(quiz.id)}
                          >
                            <ArrowPathIcon className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            size="xs"
                            color="failure"
                            onClick={() => handleSoftDelete(quiz.id)}
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

      <Modal show={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <ModalHeader>{editingQuiz ? "Edit Quiz" : "Create New Quiz"}</ModalHeader>
        <form onSubmit={handleSubmit}>
          <ModalBody>
            <div className="space-y-4">
              <div>
                <Label htmlFor="quiz-subject">Subject</Label>
                <Select
                  id="quiz-subject"
                  value={formState.subjectId}
                  onChange={(e) =>
                    setFormState((prev) => ({ ...prev, subjectId: e.target.value }))
                  }
                  disabled={Boolean(editingQuiz)}
                  required
                >
                  <option value="">Select subject</option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.subjectName}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <Label htmlFor="quiz-title">Title</Label>
                <TextInput
                  id="quiz-title"
                  value={formState.title}
                  onChange={(e) =>
                    setFormState((prev) => ({ ...prev, title: e.target.value }))
                  }
                  required
                />
              </div>

              <div>
                <Label htmlFor="quiz-duration">Duration (minutes)</Label>
                <TextInput
                  id="quiz-duration"
                  type="number"
                  min={1}
                  value={String(formState.duration)}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      duration: Number(e.target.value || 0),
                    }))
                  }
                  required
                />
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="gray" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button color="blue" type="submit" disabled={submitting}>
              {submitting ? "Saving..." : editingQuiz ? "Update" : "Create"}
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  );
}

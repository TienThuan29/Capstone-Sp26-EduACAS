"use client";

import { useCallback, useEffect, useState } from "react";
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
  Textarea,
} from "flowbite-react";
import {
  ArrowPathIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { useThemeContext } from "@/components/theme-provider";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/useToast";
import {
  useQuestion,
  type CreateAnswerOptionPayload,
  type CreateQuestionPayload,
  type UpdateQuestionPayload,
} from "@/hooks/question/useQuestion";
import type { Question, QuestionType } from "@/types/question";
import { formatDateOnly } from "@/utils/datetime-utils";
import { CustomPagination } from "@/components/custom-pagination";

type QuestionFormState = {
  content: string;
  imageUrl: string;
  type: QuestionType;
  answerOptions: CreateAnswerOptionPayload[];
  textAnswer: string;
};

const initialFormState: QuestionFormState = {
  content: "",
  imageUrl: "",
  type: "SINGLE_CHOICE",
  answerOptions: [
    { content: "", isCorrect: false },
    { content: "", isCorrect: false },
  ],
  textAnswer: "",
};

const QUESTION_TYPE_OPTIONS: Array<{ value: QuestionType; label: string }> = [
  { value: "SINGLE_CHOICE", label: "Single choice" },
  { value: "MULTIPLE_CHOICE", label: "Multiple choice" },
  { value: "ESSAY", label: "Essay" },
];

export default function QuestionBanksPage() {
  const { isDark } = useThemeContext();
  const { user } = useAuth();
  const toast = useToast();
  const {
    getQuestionsPaged,
    createQuestion,
    updateQuestion,
    softDeleteQuestion,
    restoreQuestion,
  } = useQuestion();

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [pageIndex, setPageIndex] = useState(1);
  const pageSize = 10;

  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<"ALL" | QuestionType>("ALL");
  const [includeDeleted, setIncludeDeleted] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [formState, setFormState] = useState<QuestionFormState>(initialFormState);
  const questionFormId = "question-form";

  const fetchQuestions = useCallback(async () => {
    if (!user?.id) {
      setQuestions([]);
      setTotalCount(0);
      setTotalPages(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await getQuestionsPaged(
        pageIndex,
        pageSize,
        includeDeleted,
        searchTerm,
        typeFilter,
      );
      setQuestions(data.items);
      setTotalCount(data.totalCount);
      setTotalPages(data.totalPages);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.showError(err.response?.data?.message ?? "Failed to load questions");
    } finally {
      setLoading(false);
    }
  }, [
    getQuestionsPaged,
    pageIndex,
    pageSize,
    includeDeleted,
    searchTerm,
    typeFilter,
    user?.id,
    toast,
  ]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !user?.id) return;
    fetchQuestions();
  }, [mounted, user?.id, fetchQuestions]);

  if (!mounted) return null;

  const resetForm = () => {
    setFormState(initialFormState);
    setEditingQuestion(null);
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (question: Question) => {
    setEditingQuestion(question);
    setFormState({
      content: question.content,
      imageUrl: question.imageUrl ?? "",
      type: question.type,
      textAnswer: question.textAnswer ?? "",
      answerOptions:
        question.type === "ESSAY"
          ? []
          : (question.answerOptions?.length
              ? question.answerOptions
              : [
                  { content: "", isCorrect: false },
                  { content: "", isCorrect: false },
                ]
            ).map((item) => ({
              content: item.content,
              isCorrect: item.isCorrect,
            })),
    });
    setIsModalOpen(true);
  };

  const handleChangeType = (value: QuestionType) => {
    setFormState((prev) => {
      if (value === "ESSAY") {
        return { ...prev, type: value, answerOptions: [] };
      }
      return {
        ...prev,
        type: value,
        textAnswer: "",
        answerOptions:
          prev.answerOptions.length >= 2
            ? prev.answerOptions
            : [
                { content: "", isCorrect: false },
                { content: "", isCorrect: false },
              ],
      };
    });
  };

  const addAnswerOption = () => {
    setFormState((prev) => ({
      ...prev,
      answerOptions: [...prev.answerOptions, { content: "", isCorrect: false }],
    }));
  };

  const updateAnswerOption = (
    index: number,
    field: keyof CreateAnswerOptionPayload,
    value: string | boolean,
  ) => {
    setFormState((prev) => ({
      ...prev,
      answerOptions: prev.answerOptions.map((option, idx) =>
        idx === index ? { ...option, [field]: value } : option,
      ),
    }));
  };

  const removeAnswerOption = (index: number) => {
    setFormState((prev) => {
      if (prev.answerOptions.length <= 2) return prev;
      return {
        ...prev,
        answerOptions: prev.answerOptions.filter((_, idx) => idx !== index),
      };
    });
  };

  const validateForm = (): boolean => {
    if (!formState.content.trim()) {
      toast.showError("Question content is required");
      return false;
    }

    if (formState.type !== "ESSAY") {
      if (formState.answerOptions.length < 2) {
        toast.showError("At least 2 answer options are required");
        return false;
      }

      const hasEmptyOption = formState.answerOptions.some(
        (option) => !option.content.trim(),
      );
      if (hasEmptyOption) {
        toast.showError("Answer option content cannot be empty");
        return false;
      }

      const correctAnswersCount = formState.answerOptions.filter(
        (option) => option.isCorrect,
      ).length;

      if (formState.type === "SINGLE_CHOICE" && correctAnswersCount !== 1) {
        toast.showError("Single choice must have exactly one correct answer");
        return false;
      }

      if (formState.type === "MULTIPLE_CHOICE" && correctAnswersCount < 1) {
        toast.showError("Multiple choice must have at least one correct answer");
        return false;
      }
    } else if (!formState.textAnswer.trim()) {
      toast.showError("Essay must have expected text answer");
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
      const normalizedAnswerOptions =
        formState.type === "ESSAY"
          ? []
          : formState.answerOptions.map((option) => ({
              content: option.content.trim(),
              isCorrect: option.isCorrect,
            }));

      const normalizedTextAnswer =
        formState.type === "ESSAY" ? formState.textAnswer.trim() : undefined;

      if (editingQuestion) {
        const payload: UpdateQuestionPayload = {
          content: formState.content.trim(),
          imageUrl: formState.imageUrl.trim() || undefined,
          type: formState.type,
          answerOptions: normalizedAnswerOptions,
          textAnswer: normalizedTextAnswer,
        };
        await updateQuestion(editingQuestion.id, payload);
        toast.showSuccess("Question updated successfully");
      } else {
        const payload: CreateQuestionPayload = {
          content: formState.content.trim(),
          imageUrl: formState.imageUrl.trim() || undefined,
          type: formState.type,
          createdBy: user.id,
          answerOptions: normalizedAnswerOptions,
          textAnswer: normalizedTextAnswer,
        };
        await createQuestion(payload);
        toast.showSuccess("Question created successfully");
      }

      setIsModalOpen(false);
      resetForm();
      fetchQuestions();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.showError(err.response?.data?.message ?? "Failed to save question");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSoftDelete = async (questionId: string) => {
    if (!window.confirm("Soft delete this question?")) return;

    try {
      await softDeleteQuestion(questionId);
      toast.showSuccess("Question soft deleted successfully");
      fetchQuestions();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.showError(err.response?.data?.message ?? "Failed to soft delete question");
    }
  };

  const handleRestore = async (questionId: string) => {
    try {
      await restoreQuestion(questionId);
      toast.showSuccess("Question restored successfully");
      fetchQuestions();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.showError(err.response?.data?.message ?? "Failed to restore question");
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
          Question Bank
        </h1>
        <p className={`${isDark ? "text-gray-400" : "text-gray-600"}`}>
          Manage all questions and answer options
          <span className="ml-2 font-medium">({totalCount})</span>
        </p>
      </div>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-1 flex-wrap gap-3">
          <div className="min-w-55 max-w-md flex-1">
            <TextInput
              icon={MagnifyingGlassIcon}
              placeholder="Search question content..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPageIndex(1);
              }}
            />
          </div>

          <Select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value as "ALL" | QuestionType);
              setPageIndex(1);
            }}
            className="min-w-45"
          >
            <option value="ALL">All types</option>
            {QUESTION_TYPE_OPTIONS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
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
          Add Question
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
            <span className="ml-3">Loading questions...</span>
          </div>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableHeadCell>Content</TableHeadCell>
                <TableHeadCell>Type</TableHeadCell>
                <TableHeadCell>Options</TableHeadCell>
                <TableHeadCell>Status</TableHeadCell>
                <TableHeadCell>Created</TableHeadCell>
                <TableHeadCell>Actions</TableHeadCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {questions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center">
                    No questions found.
                  </TableCell>
                </TableRow>
              ) : (
                questions.map((question) => (
                  <TableRow key={question.id}>
                    <TableCell className="max-w-xl">
                      <div className="line-clamp-2 text-sm">{question.content}</div>
                    </TableCell>
                    <TableCell>
                      <Badge color="info">{question.type}</Badge>
                    </TableCell>
                    <TableCell>{question.answerOptions?.length ?? 0}</TableCell>
                    <TableCell>
                      <Badge color={question.isDeleted ? "failure" : "success"}>
                        {question.isDeleted ? "Deleted" : "Active"}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDateOnly(question.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="xs"
                          color="light"
                          onClick={() => openEditModal(question)}
                          disabled={question.isDeleted}
                        >
                          <PencilSquareIcon className="h-4 w-4" />
                        </Button>
                        {question.isDeleted ? (
                          <Button
                            size="xs"
                            color="success"
                            onClick={() => handleRestore(question.id)}
                          >
                            <ArrowPathIcon className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            size="xs"
                            color="failure"
                            onClick={() => handleSoftDelete(question.id)}
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

      <Modal show={isModalOpen} onClose={() => setIsModalOpen(false)} size="4xl">
        <ModalHeader>
          {editingQuestion ? "Edit Question" : "Create New Question"}
        </ModalHeader>
        <ModalBody>
          <form id={questionFormId} onSubmit={handleSubmit}>
            <div className="space-y-5">
              <div>
                <Label htmlFor="question-content">Question content</Label>
                <Textarea
                  id="question-content"
                  rows={5}
                  value={formState.content}
                  onChange={(e) =>
                    setFormState((prev) => ({ ...prev, content: e.target.value }))
                  }
                  required
                />
              </div>

              <div>
                <Label htmlFor="question-image">Image URL (optional)</Label>
                <TextInput
                  id="question-image"
                  value={formState.imageUrl}
                  onChange={(e) =>
                    setFormState((prev) => ({ ...prev, imageUrl: e.target.value }))
                  }
                  placeholder="https://..."
                />
              </div>

              <div>
                <Label htmlFor="question-type">Question type</Label>
                <Select
                  id="question-type"
                  value={formState.type}
                  onChange={(e) => handleChangeType(e.target.value as QuestionType)}
                >
                  {QUESTION_TYPE_OPTIONS.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </Select>
              </div>

              {formState.type !== "ESSAY" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Answer options</Label>
                    <Button size="xs" color="light" type="button" onClick={addAnswerOption}>
                      <PlusIcon className="mr-1 h-4 w-4" />
                      Add option
                    </Button>
                  </div>

                  {formState.answerOptions.map((option, index) => (
                    <div key={`answer-option-${index}`} className="grid grid-cols-12 gap-2">
                      <div className="col-span-8">
                        <TextInput
                          value={option.content}
                          onChange={(e) =>
                            updateAnswerOption(index, "content", e.target.value)
                          }
                          placeholder={`Option ${index + 1}`}
                          required
                        />
                      </div>
                      <div className="col-span-3 flex items-center">
                        <Label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={option.isCorrect}
                            onChange={(e) =>
                              updateAnswerOption(index, "isCorrect", e.target.checked)
                            }
                            className="rounded"
                          />
                          Correct
                        </Label>
                      </div>
                      <div className="col-span-1 flex justify-end">
                        <Button
                          color="failure"
                          size="xs"
                          type="button"
                          onClick={() => removeAnswerOption(index)}
                          disabled={formState.answerOptions.length <= 2}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {formState.type === "ESSAY" && (
                <div>
                  <Label htmlFor="question-text-answer">Expected text answer</Label>
                  <Textarea
                    id="question-text-answer"
                    rows={4}
                    value={formState.textAnswer}
                    onChange={(e) =>
                      setFormState((prev) => ({
                        ...prev,
                        textAnswer: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
              )}
            </div>
          </form>
        </ModalBody>
        <ModalFooter>
          <Button color="gray" type="button" onClick={() => setIsModalOpen(false)}>
            Cancel
          </Button>
          <Button color="blue" type="submit" form={questionFormId} disabled={submitting}>
            {submitting ? "Saving..." : editingQuestion ? "Update" : "Create"}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}

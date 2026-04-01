"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeftIcon,
  BookOpenIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import {
  Badge,
  Button,
  Label,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
  TextInput,
} from "flowbite-react";
import { useThemeContext } from "@/components/theme-provider";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/useToast";
import {
  useQuiz,
  type AssignQuizQuestionPayload,
} from "@/hooks/quiz/useQuiz";
import { useQuestion } from "@/hooks/question/useQuestion";
import { PageUrl } from "@/configs/page.url";
import type { Quiz } from "@/types/quiz";
import type { Question } from "@/types/question";
import { CustomPagination } from "@/components/custom-pagination";

type SelectedQuestionMap = Record<
  string,
  { marks: number; displayOrder: number }
>;

export default function QuizDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const quizId = params?.id ?? "";

  const { isDark } = useThemeContext();
  const { user } = useAuth();
  const toast = useToast();
  const { getQuizById, assignQuestionsToQuiz, getAllQuizzes } = useQuiz();
  const { getQuestionsPaged, getQuestionById } = useQuestion();

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [quiz, setQuiz] = useState<Quiz | null>(null);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [pageIndex, setPageIndex] = useState(1);
  const pageSize = 10;
  const [searchTerm, setSearchTerm] = useState("");

  const [selectedQuestions, setSelectedQuestions] =
    useState<SelectedQuestionMap>({});
  const [isQuizBankModalOpen, setIsQuizBankModalOpen] = useState(false);
  const [loadingQuizBank, setLoadingQuizBank] = useState(false);
  const [quizBankQuizzes, setQuizBankQuizzes] = useState<Quiz[]>([]);
  const [expandedQuizIds, setExpandedQuizIds] = useState<Record<string, boolean>>(
    {},
  );
  const [loadingQuizQuestionIds, setLoadingQuizQuestionIds] = useState<
    Record<string, boolean>
  >({});
  const [quizQuestionMap, setQuizQuestionMap] = useState<
    Record<string, QuizQuestionView[]>
  >({});

  const selectedCount = useMemo(
    () => Object.keys(selectedQuestions).length,
    [selectedQuestions],
  );

  const selectedQuestionIdSet = useMemo(
    () => new Set(Object.keys(selectedQuestions)),
    [selectedQuestions],
  );

  const fetchQuizAndQuestions = useCallback(async () => {
    if (!quizId || !user?.id) {
      setQuiz(null);
      setQuestions([]);
      setTotalPages(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [quizData, questionData] = await Promise.all([
        getQuizById(quizId),
        getQuestionsPaged(pageIndex, pageSize, false, searchTerm),
      ]);

      if (!quizData) {
        toast.showError("Quiz not found");
        router.push(PageUrl.QUIZ_BANK_PAGE);
        return;
      }

      setQuiz(quizData);
      setQuestions(questionData.items);
      setTotalPages(questionData.totalPages);

      const mapped = (quizData.questions ?? []).reduce<SelectedQuestionMap>(
        (acc, item, idx) => {
          acc[item.questionId] = {
            marks: item.marks,
            displayOrder: item.displayOrder || idx + 1,
          };
          return acc;
        },
        {},
      );
      setSelectedQuestions((prev) =>
        Object.keys(prev).length > 0 ? prev : mapped,
      );
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.showError(err.response?.data?.message ?? "Failed to load quiz details");
    } finally {
      setLoading(false);
    }
  }, [
    quizId,
    getQuizById,
    getQuestionsPaged,
    pageIndex,
    pageSize,
    searchTerm,
    toast,
    router,
    user?.id,
  ]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !user?.id) return;
    fetchQuizAndQuestions();
  }, [mounted, user?.id, fetchQuizAndQuestions]);

  const toggleQuestion = (questionId: string, checked: boolean) => {
    setSelectedQuestions((prev) => {
      if (!checked) {
        const next = { ...prev };
        delete next[questionId];
        return next;
      }

      if (prev[questionId]) return prev;

      const nextDisplayOrder = Object.keys(prev).length + 1;
      return {
        ...prev,
        [questionId]: { marks: 1, displayOrder: nextDisplayOrder },
      };
    });
  };

  const updateSelectedMeta = (
    questionId: string,
    field: "marks" | "displayOrder",
    value: number,
  ) => {
    setSelectedQuestions((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        [field]: value,
      },
    }));
  };

  const appendQuestionsToSelection = useCallback((questionsToAdd: QuizQuestionView[]) => {
    if (questionsToAdd.length === 0) {
      return;
    }

    setSelectedQuestions((prev) => {
      const next = { ...prev };
      let nextDisplayOrder = Object.keys(next).length + 1;

      questionsToAdd.forEach((item) => {
        if (next[item.questionId]) {
          return;
        }

        next[item.questionId] = {
          marks: item.marks > 0 ? item.marks : 1,
          displayOrder: nextDisplayOrder,
        };
        nextDisplayOrder += 1;
      });

      return next;
    });
  }, []);

  const removeQuestionsFromSelection = useCallback((questionIds: string[]) => {
    if (questionIds.length === 0) {
      return;
    }

    setSelectedQuestions((prev) => {
      const next = { ...prev };
      questionIds.forEach((questionId) => {
        delete next[questionId];
      });
      return next;
    });
  }, []);

  const loadQuizBankQuestions = useCallback(
    async (sourceQuizId: string): Promise<QuizQuestionView[]> => {
      if (quizQuestionMap[sourceQuizId]) {
        return quizQuestionMap[sourceQuizId];
      }

      setLoadingQuizQuestionIds((prev) => ({ ...prev, [sourceQuizId]: true }));
      try {
        const sourceQuiz = await getQuizById(sourceQuizId);
        if (!sourceQuiz) {
          return [];
        }

        const sourceQuestionItems = (sourceQuiz.questions ?? []).slice().sort((a, b) => {
          return a.displayOrder - b.displayOrder;
        });

        const questionViews = await Promise.all(
          sourceQuestionItems.map(async (item, index) => {
            const detail = await getQuestionById(item.questionId);
            return {
              questionId: item.questionId,
              content: detail?.content ?? `Question ${index + 1}`,
              type: detail?.type,
              marks: item.marks,
              displayOrder: item.displayOrder || index + 1,
            } satisfies QuizQuestionView;
          }),
        );

        setQuizQuestionMap((prev) => ({
          ...prev,
          [sourceQuizId]: questionViews,
        }));

        return questionViews;
      } catch (error: unknown) {
        const err = error as { response?: { data?: { message?: string } } };
        toast.showError(
          err.response?.data?.message ?? "Failed to load questions from selected quiz",
        );
        return [];
      } finally {
        setLoadingQuizQuestionIds((prev) => ({ ...prev, [sourceQuizId]: false }));
      }
    },
    [quizQuestionMap, getQuizById, getQuestionById, toast],
  );

  const openQuizBankModal = useCallback(async () => {
    setIsQuizBankModalOpen(true);

    if (quizBankQuizzes.length > 0) {
      return;
    }

    setLoadingQuizBank(true);
    try {
      const allQuizzes = await getAllQuizzes(false);
      const importableQuizzes = allQuizzes.filter((item) => item.id !== quizId && !item.isDeleted);
      setQuizBankQuizzes(importableQuizzes);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.showError(err.response?.data?.message ?? "Failed to load quiz bank");
    } finally {
      setLoadingQuizBank(false);
    }
  }, [quizBankQuizzes.length, getAllQuizzes, quizId, toast]);

  const toggleQuizExpand = useCallback(
    async (sourceQuizId: string) => {
      const isExpanded = Boolean(expandedQuizIds[sourceQuizId]);
      setExpandedQuizIds((prev) => ({
        ...prev,
        [sourceQuizId]: !isExpanded,
      }));

      if (!isExpanded) {
        await loadQuizBankQuestions(sourceQuizId);
      }
    },
    [expandedQuizIds, loadQuizBankQuestions],
  );

  const handleImportWholeQuiz = useCallback(
    async (sourceQuizId: string) => {
      const sourceQuestions = await loadQuizBankQuestions(sourceQuizId);
      appendQuestionsToSelection(sourceQuestions);
      toast.showSuccess(`Imported ${sourceQuestions.length} question(s) from quiz`);
    },
    [loadQuizBankQuestions, appendQuestionsToSelection, toast],
  );

  const handleRemoveWholeQuiz = useCallback(
    async (sourceQuizId: string) => {
      const sourceQuestions = await loadQuizBankQuestions(sourceQuizId);
      removeQuestionsFromSelection(sourceQuestions.map((item) => item.questionId));
      toast.showSuccess("Removed imported questions from this quiz");
    },
    [loadQuizBankQuestions, removeQuestionsFromSelection, toast],
  );

  const handleToggleImportedQuestion = useCallback(
    (item: QuizQuestionView, checked: boolean) => {
      if (checked) {
        appendQuestionsToSelection([item]);
        return;
      }

      removeQuestionsFromSelection([item.questionId]);
    },
    [appendQuestionsToSelection, removeQuestionsFromSelection],
  );

  const isAllQuestionsImportedFromQuiz = useCallback(
    (sourceQuizId: string): boolean => {
      const sourceQuestions = quizQuestionMap[sourceQuizId] ?? [];
      if (sourceQuestions.length === 0) {
        return false;
      }

      return sourceQuestions.every((item) => selectedQuestionIdSet.has(item.questionId));
    },
    [quizQuestionMap, selectedQuestionIdSet],
  );

  const handleSave = async () => {
    if (!quizId) return;

    const payload: AssignQuizQuestionPayload[] = Object.entries(selectedQuestions)
      .map(([questionId, meta]) => ({
        questionId,
        marks: Number(meta.marks),
        displayOrder: Number(meta.displayOrder),
      }))
      .sort((a, b) => a.displayOrder - b.displayOrder);

    setSaving(true);
    try {
      await assignQuestionsToQuiz(quizId, payload);
      toast.showSuccess("Quiz questions updated successfully");
      fetchQuizAndQuestions();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.showError(
        err.response?.data?.message ?? "Failed to assign questions to quiz",
      );
    } finally {
      setSaving(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <Button
            color="light"
            onClick={() => router.push(PageUrl.QUIZ_BANK_PAGE)}
            className="mb-3"
          >
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Back to Quiz Bank
          </Button>
          <h1
            className={`text-3xl font-bold ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            Quiz Detail: {quiz?.title ?? "..."}
          </h1>
          <p className={`${isDark ? "text-gray-400" : "text-gray-600"}`}>
            Select and assign questions to this quiz ({selectedCount} selected)
          </p>
        </div>

        <Button color="blue" onClick={handleSave} disabled={saving || loading}>
          <CheckIcon className="mr-2 h-5 w-5" />
          {saving ? "Saving..." : "Save Assignment"}
        </Button>
      </div>

      <div className="mb-4">
        <Button color="light" onClick={openQuizBankModal}>
          <BookOpenIcon className="mr-2 h-5 w-5" />
          Quiz Bank
        </Button>
      </div>

      <div className="mb-4 max-w-md">
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

      <div
        className={`overflow-x-auto rounded-lg border ${
          isDark ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"
        }`}
      >
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <Spinner size="xl" />
            <span className="ml-3">Loading quiz details...</span>
          </div>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableHeadCell>Select</TableHeadCell>
                <TableHeadCell>Question content</TableHeadCell>
                <TableHeadCell>Type</TableHeadCell>
                <TableHeadCell>Marks</TableHeadCell>
                <TableHeadCell>Display order</TableHeadCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {questions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center">
                    No questions found.
                  </TableCell>
                </TableRow>
              ) : (
                questions.map((question) => {
                  const selected = selectedQuestions[question.id];
                  return (
                    <TableRow key={question.id}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={Boolean(selected)}
                          onChange={(e) =>
                            toggleQuestion(question.id, e.target.checked)
                          }
                          className="rounded"
                        />
                      </TableCell>
                      <TableCell className="max-w-xl">
                        <div className="line-clamp-2 text-sm">{question.content}</div>
                      </TableCell>
                      <TableCell>
                        <Badge color="info">{question.type}</Badge>
                      </TableCell>
                      <TableCell>
                        <Label htmlFor={`marks-${question.id}`} className="sr-only">
                          Marks
                        </Label>
                        <TextInput
                          id={`marks-${question.id}`}
                          type="number"
                          min={0}
                          step={0.5}
                          value={String(selected?.marks ?? 0)}
                          disabled={!selected}
                          onChange={(e) =>
                            updateSelectedMeta(
                              question.id,
                              "marks",
                              Number(e.target.value || 0),
                            )
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Label
                          htmlFor={`display-order-${question.id}`}
                          className="sr-only"
                        >
                          Display order
                        </Label>
                        <TextInput
                          id={`display-order-${question.id}`}
                          type="number"
                          min={1}
                          value={String(selected?.displayOrder ?? 1)}
                          disabled={!selected}
                          onChange={(e) =>
                            updateSelectedMeta(
                              question.id,
                              "displayOrder",
                              Number(e.target.value || 1),
                            )
                          }
                        />
                      </TableCell>
                    </TableRow>
                  );
                })
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

      <Modal
        show={isQuizBankModalOpen}
        size="5xl"
        dismissible
        onClose={() => setIsQuizBankModalOpen(false)}
      >
        <ModalHeader>Import Questions From Quiz Bank</ModalHeader>
        <ModalBody>
          {loadingQuizBank ? (
            <div className="flex items-center justify-center p-6">
              <Spinner size="lg" />
              <span className="ml-2">Loading quizzes...</span>
            </div>
          ) : quizBankQuizzes.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-600">
              No other quizzes available for import.
            </div>
          ) : (
            <div className="space-y-4">
              {quizBankQuizzes.map((sourceQuiz) => {
                const expanded = Boolean(expandedQuizIds[sourceQuiz.id]);
                const loadingSourceQuestions = Boolean(loadingQuizQuestionIds[sourceQuiz.id]);
                const sourceQuestions = quizQuestionMap[sourceQuiz.id] ?? [];
                const importedAll = isAllQuestionsImportedFromQuiz(sourceQuiz.id);

                return (
                  <div
                    key={sourceQuiz.id}
                    className={`rounded-lg border p-4 ${
                      isDark ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h3 className="font-semibold">{sourceQuiz.title}</h3>
                        <p className="text-xs text-gray-500">
                          {sourceQuiz.totalQuestions} question(s)
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          size="xs"
                          color={importedAll ? "gray" : "blue"}
                          onClick={() =>
                            importedAll
                              ? handleRemoveWholeQuiz(sourceQuiz.id)
                              : handleImportWholeQuiz(sourceQuiz.id)
                          }
                          disabled={loadingSourceQuestions}
                        >
                          {loadingSourceQuestions
                            ? "Loading..."
                            : importedAll
                              ? "Remove all"
                              : "Import all"}
                        </Button>
                        <Button
                          size="xs"
                          color="light"
                          onClick={() => toggleQuizExpand(sourceQuiz.id)}
                        >
                          {expanded ? (
                            <ChevronUpIcon className="mr-1 h-4 w-4" />
                          ) : (
                            <ChevronDownIcon className="mr-1 h-4 w-4" />
                          )}
                          {expanded ? "Hide questions" : "Select questions"}
                        </Button>
                      </div>
                    </div>

                    {expanded && (
                      <div className="mt-3 space-y-2 border-t pt-3">
                        {loadingSourceQuestions ? (
                          <div className="flex items-center gap-2 text-sm">
                            <Spinner size="sm" />
                            Loading questions...
                          </div>
                        ) : sourceQuestions.length === 0 ? (
                          <p className="text-sm text-gray-500">
                            This quiz has no questions.
                          </p>
                        ) : (
                          sourceQuestions.map((item) => (
                            <label
                              key={`${sourceQuiz.id}-${item.questionId}`}
                              className="flex cursor-pointer items-center justify-between gap-3 rounded-md border px-3 py-2"
                            >
                              <div className="flex items-start gap-2">
                                <input
                                  type="checkbox"
                                  checked={selectedQuestionIdSet.has(item.questionId)}
                                  onChange={(event) =>
                                    handleToggleImportedQuestion(item, event.target.checked)
                                  }
                                />
                                <div>
                                  <p className="text-sm font-medium">{item.content}</p>
                                  <p className="text-xs text-gray-500">
                                    Marks: {item.marks} | Order: {item.displayOrder}
                                  </p>
                                </div>
                              </div>
                              <Badge color="info">{item.type ?? "N/A"}</Badge>
                            </label>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button color="gray" onClick={() => setIsQuizBankModalOpen(false)}>
            Close
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}

type QuizQuestionView = {
  questionId: string;
  content: string;
  type?: Question["type"];
  marks: number;
  displayOrder: number;
};

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeftIcon,
  BookOpenIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ClipboardDocumentListIcon,
  MagnifyingGlassIcon,
  SparklesIcon,
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
import { QuizDetailPageSkeleton } from "@/components/ui/skeletons";
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

  const [selectedQuestions, setSelectedQuestions] =
    useState<SelectedQuestionMap>({});
  const selectedQuestionsRef = useRef(selectedQuestions);
  const [reviewQuestions, setReviewQuestions] = useState<Question[]>([]);
  const [loadingReviewQuestions, setLoadingReviewQuestions] = useState(false);

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

  const [isQuestionBankModalOpen, setIsQuestionBankModalOpen] = useState(false);
  const [questionBankQuestions, setQuestionBankQuestions] = useState<Question[]>([]);
  const [questionBankSearchTerm, setQuestionBankSearchTerm] = useState("");
  const [questionBankPageIndex, setQuestionBankPageIndex] = useState(1);
  const [questionBankTotalPages, setQuestionBankTotalPages] = useState(0);
  const [loadingQuestionBank, setLoadingQuestionBank] = useState(false);
  const questionBankPageSize = 10;

  useEffect(() => {
    selectedQuestionsRef.current = selectedQuestions;
  }, [selectedQuestions]);

  const selectedCount = useMemo(
    () => Object.keys(selectedQuestions).length,
    [selectedQuestions],
  );

  const TOTAL_MARKS = 10;

  const totalMarks = useMemo(
    () =>
      Object.values(selectedQuestions).reduce((sum, q) => sum + q.marks, 0),
    [selectedQuestions],
  );

  const autoDistributeMarks = useCallback(() => {
    if (selectedCount === 0) return;
    const base = Math.floor(TOTAL_MARKS / selectedCount);
    const remainder = TOTAL_MARKS % selectedCount;

    setSelectedQuestions((prev) => {
      const next = { ...prev };
      let extra = remainder;
      Object.keys(next).forEach((qId) => {
        next[qId] = {
          ...next[qId],
          marks: extra > 0 ? base + 1 : base,
        };
        if (extra > 0) extra -= 1;
      });
      return next;
    });
  }, [selectedCount]);

  const selectedQuestionIdSet = useMemo(
    () => new Set(Object.keys(selectedQuestions)),
    [selectedQuestions],
  );

  const fetchQuizDetail = useCallback(async () => {
    if (!quizId || !user?.id) {
      setQuiz(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const quizData = await getQuizById(quizId);

      if (!quizData) {
        toast.showError("Quiz not found");
        router.push(PageUrl.QUIZ_BANK_PAGE);
        return;
      }

      setQuiz(quizData);

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
    toast,
    router,
    user?.id,
  ]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !user?.id) return;
    fetchQuizDetail();
  }, [mounted, user?.id, fetchQuizDetail]);

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

  const refreshReviewQuestions = useCallback(async () => {
    const selectedIds = Object.keys(selectedQuestionsRef.current);
    if (selectedIds.length === 0) {
      setReviewQuestions([]);
      return;
    }

    setLoadingReviewQuestions(true);
    try {
      const details = await Promise.all(selectedIds.map((id) => getQuestionById(id)));
      const questionMap = details
        .filter((item): item is Question => item !== null)
        .reduce<Record<string, Question>>((acc, item) => {
          acc[item.id] = item;
          return acc;
        }, {});

      const ordered = selectedIds
        .map((id) => questionMap[id])
        .filter((item): item is Question => Boolean(item));

      setReviewQuestions(ordered);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.showError(err.response?.data?.message ?? "Failed to load selected question details");
    } finally {
      setLoadingReviewQuestions(false);
    }
  }, [getQuestionById, toast]);

  useEffect(() => {
    if (!mounted || !user?.id) return;
    refreshReviewQuestions();
  }, [mounted, user?.id, refreshReviewQuestions]);

  const prevSelectedIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const currentIds = new Set(Object.keys(selectedQuestions));
    const prevIds = prevSelectedIdsRef.current;
    const changed =
      currentIds.size !== prevIds.size ||
      [...currentIds].some((id) => !prevIds.has(id));

    if (changed) {
      prevSelectedIdsRef.current = currentIds;
      refreshReviewQuestions();
    }
  }, [selectedQuestions, refreshReviewQuestions]);

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

  const fetchQuestionBank = useCallback(async () => {
    setLoadingQuestionBank(true);
    try {
      const data = await getQuestionsPaged(
        questionBankPageIndex,
        questionBankPageSize,
        false,
        questionBankSearchTerm,
      );
      setQuestionBankQuestions(data.items);
      setQuestionBankTotalPages(data.totalPages);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.showError(err.response?.data?.message ?? "Failed to load question bank");
    } finally {
      setLoadingQuestionBank(false);
    }
  }, [getQuestionsPaged, questionBankPageIndex, questionBankPageSize, questionBankSearchTerm, toast]);

  useEffect(() => {
    if (!isQuestionBankModalOpen || !mounted || !user?.id) return;
    fetchQuestionBank();
  }, [isQuestionBankModalOpen, mounted, user?.id, fetchQuestionBank]);

  const openQuestionBankModal = () => {
    setIsQuestionBankModalOpen(true);
    setQuestionBankPageIndex(1);
  };

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

    const zeroMarksQuestions = Object.entries(selectedQuestions)
      .filter(([, meta]) => meta.marks <= 0);
    if (zeroMarksQuestions.length > 0) {
      toast.showError(`All questions must have marks greater than 0. Please check the marks for each question.`);
      return;
    }

    if (selectedCount > 0 && Math.abs(totalMarks - TOTAL_MARKS) > 0.001) {
      toast.showError(`Total marks must equal ${TOTAL_MARKS}. Current total: ${totalMarks}`);
      return;
    }

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
      fetchQuizDetail();
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

        <Button className="cursor-pointer" color="blue" onClick={handleSave} disabled={saving || loading}>
          <CheckIcon className="mr-2 h-5 w-5" />
          {saving ? "Saving..." : "Save Assignment"}
        </Button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Button color="light" onClick={openQuizBankModal} className="cursor-pointer">
          <BookOpenIcon className="mr-2 h-5 w-5" />
          Quiz Bank
        </Button>
        <Button color="light" onClick={openQuestionBankModal} className="cursor-pointer">
          <ClipboardDocumentListIcon className="mr-2 h-5 w-5" />
          Question Bank
        </Button>
        <div className="ml-auto flex items-center gap-3">
          {selectedCount > 0 && (
            <>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                  Total Marks:
                </span>
                <div className="flex items-center gap-2">
                  <div className={`h-2.5 w-32 overflow-hidden rounded-full bg-gray-200 ${isDark ? "bg-gray-700" : ""}`}>
                    <div
                      className={`h-full rounded-full transition-all ${
                        Math.abs(totalMarks - TOTAL_MARKS) < 0.001
                          ? "bg-green-500"
                          : totalMarks > TOTAL_MARKS
                            ? "bg-red-500"
                            : "bg-blue-500"
                      }`}
                      style={{ width: `${Math.min((totalMarks / TOTAL_MARKS) * 100, 100)}%` }}
                    />
                  </div>
                  <span
                    className={`text-sm font-semibold ${
                      Math.abs(totalMarks - TOTAL_MARKS) < 0.001
                        ? "text-green-600"
                        : "text-red-500"
                    }`}
                  >
                    {totalMarks} / {TOTAL_MARKS}
                  </span>
                </div>
                <Button
                  size="xs"
                  color="purple"
                  className="cursor-pointer"
                  onClick={autoDistributeMarks}
                  title={`Distribute ${TOTAL_MARKS} points evenly across all questions`}
                >
                  <SparklesIcon className="mr-1 h-4 w-4" />
                  Auto Distribute
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

      <div
        className={`overflow-x-auto rounded-lg border ${
          isDark ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"
        }`}
      >
        {loading || loadingReviewQuestions ? (
          <QuizDetailPageSkeleton />
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableHeadCell>Actions</TableHeadCell>
                <TableHeadCell>Question content</TableHeadCell>
                <TableHeadCell>Type</TableHeadCell>
                <TableHeadCell>Answer options</TableHeadCell>
                <TableHeadCell>Marks</TableHeadCell>
                <TableHeadCell>Display order</TableHeadCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reviewQuestions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center">
                    No questions in review yet. Use Quiz Bank or Question Bank to add.
                  </TableCell>
                </TableRow>
              ) : (
                reviewQuestions.map((question) => {
                  const selected = selectedQuestions[question.id];
                  return (
                    <TableRow key={question.id}>
                      <TableCell>
                        <Button
                          size="xs"
                          color="red"
                          className="cursor-pointer"
                          onClick={() =>
                            removeQuestionsFromSelection([question.id])
                          }
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </TableCell>
                      <TableCell className="max-w-xl">
                        <div className="line-clamp-2 text-sm">{question.content}</div>
                      </TableCell>
                      <TableCell>
                        <Badge color="info">{question.type}</Badge>
                      </TableCell>
                      <TableCell className="min-w-72 max-w-xl">
                        {question.type === "ESSAY" ? (
                          <p className="text-xs text-gray-600">
                            Expected: {question.textAnswer ?? "(empty)"}
                          </p>
                        ) : question.answerOptions.length === 0 ? (
                          <p className="text-xs text-gray-500">No answer options</p>
                        ) : (
                          <div className="space-y-1">
                            {question.answerOptions.map((option) => (
                              <div
                                key={option.id}
                                className={`rounded border px-2 py-1 text-xs ${
                                  option.isCorrect
                                    ? "border-green-300 bg-green-50 text-green-800"
                                    : isDark
                                      ? "border-gray-700 bg-gray-800 text-gray-200"
                                      : "border-gray-200 bg-gray-50 text-gray-700"
                                }`}
                              >
                                {option.content}
                                {option.isCorrect ? " (Correct)" : ""}
                              </div>
                            ))}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Label htmlFor={`marks-${question.id}`} className="sr-only">
                          Marks
                        </Label>
                        <TextInput
                          id={`marks-${question.id}`}
                          type="number"
                          min={0.5}
                          max={TOTAL_MARKS}
                          step={0.5}
                          value={String(selected?.marks ?? 0)}
                          disabled={!selected}
                          onChange={(e) =>
                            updateSelectedMeta(
                              question.id,
                              "marks",
                              Math.max(0.5, Math.min(Number(e.target.value || 0), TOTAL_MARKS)),
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
                          className="cursor-pointer"
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
                          className="cursor-pointer"
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
                            <div
                              key={`${sourceQuiz.id}-${item.questionId}`}
                              className="flex items-center justify-between gap-3 rounded-md border px-3 py-2"
                            >
                              <div className="flex items-start gap-2">
                                <div>
                                  <p className="text-sm font-medium">{item.content}</p>
                                  <p className="text-xs text-gray-500">
                                    Marks: {item.marks} | Order: {item.displayOrder}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {selectedQuestionIdSet.has(item.questionId) ? (
                                  <Button
                                    size="xs"
                                    color="red"
                                    onClick={() => removeQuestionsFromSelection([item.questionId])}
                                    className="cursor-pointer"
                                  >
                                    <TrashIcon className="h-4 w-4" />
                                  </Button>
                                ) : (
                                  <Button
                                    size="xs"
                                    color="blue"
                                    onClick={() => appendQuestionsToSelection([item])}
                                    className="cursor-pointer"
                                  >
                                    Add
                                  </Button>
                                )}
                                <Badge color="info">{item.type ?? "N/A"}</Badge>
                              </div>
                            </div>
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
          <Button className="cursor-pointer" color="gray" onClick={() => setIsQuizBankModalOpen(false)}>
            Close
          </Button>
        </ModalFooter>
      </Modal>

      <Modal
        show={isQuestionBankModalOpen}
        size="5xl"
        dismissible
        onClose={() => setIsQuestionBankModalOpen(false)}
      >
        <ModalHeader>Add Questions From Question Bank</ModalHeader>
        <ModalBody>
          <div className="mb-4 max-w-md">
            <TextInput
              icon={MagnifyingGlassIcon}
              placeholder="Search question content..."
              value={questionBankSearchTerm}
              onChange={(e) => {
                setQuestionBankSearchTerm(e.target.value);
                setQuestionBankPageIndex(1);
              }}
            />
          </div>

          <div
            className={`overflow-x-auto rounded-lg border ${
              isDark ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"
            }`}
          >
            {loadingQuestionBank ? (
              <div className="flex items-center justify-center p-8">
                <Spinner size="lg" />
                <span className="ml-2">Loading question bank...</span>
              </div>
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeadCell>Question content</TableHeadCell>
                    <TableHeadCell>Type</TableHeadCell>
                    <TableHeadCell>Action</TableHeadCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {questionBankQuestions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="py-8 text-center">
                        No questions found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    questionBankQuestions.map((question) => {
                      const isAdded = selectedQuestionIdSet.has(question.id);

                      return (
                        <TableRow key={question.id}>
                          <TableCell className="max-w-xl">
                            <div className="line-clamp-2 text-sm">{question.content}</div>
                          </TableCell>
                          <TableCell>
                            <Badge color="info">{question.type}</Badge>
                          </TableCell>
                          <TableCell>
                            {isAdded ? (
                              <Button
                                size="xs"
                                color="red"
                                onClick={() => removeQuestionsFromSelection([question.id])}
                              >
                                <TrashIcon className="h-4 w-4" />
                              </Button>
                            ) : (
                              <Button
                                size="xs"
                                color="blue"
                                onClick={() =>
                                  appendQuestionsToSelection([
                                    {
                                      questionId: question.id,
                                      content: question.content,
                                      type: question.type,
                                      marks: 1,
                                      displayOrder: 1,
                                    },
                                  ])
                                }
                              >
                                Add
                              </Button>
                            )}
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
            currentPage={questionBankPageIndex}
            totalPages={questionBankTotalPages}
            onPageChange={setQuestionBankPageIndex}
          />
        </ModalBody>
        <ModalFooter>
          <Button color="gray" onClick={() => setIsQuestionBankModalOpen(false)}>
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

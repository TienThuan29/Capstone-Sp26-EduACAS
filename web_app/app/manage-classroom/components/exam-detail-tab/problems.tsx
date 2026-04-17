"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Badge, Button, Spinner, TextInput, Modal, ModalHeader, ModalBody, ModalFooter } from "flowbite-react";
import {
  PlusIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Examination, Problem, ExamProblemDTO } from "@/types/examination";
import { useProblem } from "@/hooks/problem/useProblem";
import { useExamination } from "@/hooks/examination/useExamination";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/useToast";
import type { ProblemBasicResponse } from "@/types/problem";
import { normalizeDifficulty } from "@/types/problem";
import { toExamProblem } from "@/utils/exam-problem";
import { DefaultCustomButton } from "@/components/ui/custom-button";
import { formatDate } from "@/utils/datetime-utils";

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1 border-b border-gray-100 py-2 last:border-0 dark:border-gray-600">
      <span className="text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400">
        {label}
      </span>
      <span className="text-gray-900 dark:text-white">{value}</span>
    </div>
  );
}

export type ProblemsTabContentProps = {
  examination: Examination;
  problems: Problem[];
  onExaminationUpdate?: (updated: Examination) => void;
};

// Local state for pending problem with mark
interface PendingProblem {
  problemId: string;
  title: string;
  difficulty: number | string;
  mark: number;
}

export function ProblemsTabContent({
  examination,
  problems: initialProblems,
  onExaminationUpdate,
}: ProblemsTabContentProps) {
  const { user } = useAuth();
  const toast = useToast();
  const { getProblemsByLecturerId, getProblemsByIds, getProblemById } = useProblem();
  const { updateExamination } = useExamination();

  const [lecturerProblems, setLecturerProblems] = useState<
    ProblemBasicResponse[]
  >([]);
  const [examProblemDetails, setExamProblemDetails] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingExamProblems, setLoadingExamProblems] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddPanel, setShowAddPanel] = useState(false);
  // Modal state for viewing problem content
  const [contentModalOpen, setContentModalOpen] = useState(false);
  const [selectedProblemContent, setSelectedProblemContent] = useState<Problem | null>(null);
  const [loadingProblemContent, setLoadingProblemContent] = useState(false);

  // Pending problems to add (with marks)
  const [pendingProblems, setPendingProblems] = useState<PendingProblem[]>([]);
  // Marks for existing problems (problemId -> mark)
  const [problemMarks, setProblemMarks] = useState<Record<string, number>>({});
  // Track removed problem IDs
  const [removedProblemIds, setRemovedProblemIds] = useState<Set<string>>(
    new Set(),
  );

  // Fetch all exam problem details in a single batch request
  useEffect(() => {
    let cancelled = false;
    const fetchExamProblemDetails = async () => {
      const examProblems = examination.examProblems ?? [];
      if (examProblems.length === 0) {
        setExamProblemDetails([]);
        return;
      }

      setLoadingExamProblems(true);
      try {
        const problemIds = examProblems.map((ep) => ep.problemId);
        const problemDetails = await getProblemsByIds(problemIds);
        if (cancelled) return;
        const examId = examination.id;
        const langId = examination.programmingLanguage?.id;
        const orderMap = new Map(examProblems.map((ep, i) => [ep.problemId, i]));
        const sorted = [...problemDetails].sort(
          (a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0)
        );
        setExamProblemDetails(sorted.map((p) => toExamProblem(p, examId, langId)));
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to fetch problem details:", error);
          toast.showError("Failed to load problem details");
        }
      } finally {
        if (!cancelled) setLoadingExamProblems(false);
      }
    };

    fetchExamProblemDetails();
    return () => {
      cancelled = true;
    };
  }, [examination.examProblems, examination.id, examination.programmingLanguage?.id, getProblemsByIds, toast]);

  // Use fetched problem details or initial problems
  const problems = examProblemDetails.length > 0 ? examProblemDetails : initialProblems;

  // Initialize marks from existing exam problems
  useEffect(() => {
    const initialMarks: Record<string, number> = {};
    examination.examProblems?.forEach((ep) => {
      initialMarks[ep.problemId] = ep.mark;
    });
    setProblemMarks(initialMarks);
  }, [examination]);

  // Get IDs of problems already in the exam (excluding removed ones)
  const currentProblemIds = useMemo(() => {
    const ids = new Set(problems.map((p) => p.id));
    removedProblemIds.forEach((id) => ids.delete(id));
    pendingProblems.forEach((p) => ids.add(p.problemId));
    return ids;
  }, [problems, removedProblemIds, pendingProblems]);

  // Calculate total marks
  const totalAssignedMarks = useMemo(() => {
    let total = 0;
    // Existing problems (not removed)
    problems.forEach((p) => {
      if (!removedProblemIds.has(p.id)) {
        total += problemMarks[p.id] ?? 0;
      }
    });
    // Pending problems
    pendingProblems.forEach((p) => {
      total += p.mark;
    });
    return total;
  }, [problems, removedProblemIds, problemMarks, pendingProblems]);

  const remainingMarks = examination.totalMark - totalAssignedMarks;

  // Check if there are unsaved changes
  const hasChanges = useMemo(() => {
    if (pendingProblems.length > 0) return true;
    if (removedProblemIds.size > 0) return true;
    // Check if any marks changed
    for (const ep of examination.examProblems ?? []) {
      if (problemMarks[ep.problemId] !== ep.mark) return true;
    }
    return false;
  }, [pendingProblems, removedProblemIds, problemMarks, examination.examProblems]);

  // Load lecturer's problems
  const loadLecturerProblems = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const data = await getProblemsByLecturerId(user.id);
      setLecturerProblems(data);
    } catch {
      toast.showError("Failed to load problems");
    } finally {
      setLoading(false);
    }
  }, [user?.id, getProblemsByLecturerId, toast]);

  // Handle opening problem content modal for existing problems (already have full data)
  const handleViewExistingProblem = useCallback((problem: Problem) => {
    setSelectedProblemContent(problem);
    setContentModalOpen(true);
  }, []);

  // Handle opening problem content modal (fetch from API for ProblemBasicResponse)
  const handleViewContent = useCallback(async (problemId: string) => {
    setLoadingProblemContent(true);
    try {
      const problemData = await getProblemById(problemId);
      if (problemData) {
        // Convert ProblemResponse to Problem using toExamProblem
        const examId = examination.id;
        const langId = examination.programmingLanguage?.id;
        const problem = toExamProblem(problemData, examId, langId);
        setSelectedProblemContent(problem);
        setContentModalOpen(true);
      }
    } catch (error) {
      console.error("Failed to load problem content:", error);
      toast.showError("Failed to load problem content");
    } finally {
      setLoadingProblemContent(false);
    }
  }, [examination.id, examination.programmingLanguage?.id, getProblemById, toast]);

  useEffect(() => {
    if (showAddPanel && lecturerProblems.length === 0) {
      loadLecturerProblems();
    }
  }, [showAddPanel, lecturerProblems.length, loadLecturerProblems]);

  // Filter problems not yet added to exam
  const availableProblems = lecturerProblems.filter(
    (p) => !currentProblemIds.has(p.id),
  );

  // Search filter
  const filteredProblems = availableProblems.filter((p) =>
    p.title.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Add problem to pending list
  const handleAddProblem = (problem: ProblemBasicResponse, mark: number) => {
    if (mark <= 0) {
      toast.showError("Mark must be greater than 0");
      return;
    }
    if (mark > remainingMarks) {
      toast.showError(
        `Mark exceeds remaining marks (${remainingMarks} available)`,
      );
      return;
    }
    setPendingProblems((prev) => [
      ...prev,
      {
        problemId: problem.id,
        title: problem.title,
        difficulty: problem.difficulty,
        mark,
      },
    ]);
    toast.showSuccess(`Added "${problem.title}" with ${mark} marks`);
  };

  // Remove pending problem
  const handleRemovePending = (problemId: string) => {
    setPendingProblems((prev) => prev.filter((p) => p.problemId !== problemId));
  };

  // Mark existing problem for removal
  const handleRemoveExisting = (problemId: string) => {
    setRemovedProblemIds((prev) => new Set(prev).add(problemId));
  };

  // Undo removal of existing problem
  const handleUndoRemove = (problemId: string) => {
    setRemovedProblemIds((prev) => {
      const newSet = new Set(prev);
      newSet.delete(problemId);
      return newSet;
    });
  };

  // Update mark for existing problem
  const handleMarkChange = (problemId: string, mark: number) => {
    setProblemMarks((prev) => ({ ...prev, [problemId]: mark }));
  };

  // Save all changes
  const handleSave = async () => {
    if (totalAssignedMarks > examination.totalMark) {
      toast.showError(
        `Total marks (${totalAssignedMarks}) exceed examination total (${examination.totalMark})`,
      );
      return;
    }

    setSaving(true);
    try {
      // Build problems array with marks
      const examProblems: ExamProblemDTO[] = [];
      // Existing problems (not removed)
      problems.forEach((p) => {
        if (!removedProblemIds.has(p.id)) {
          examProblems.push({
            problemId: p.id,
            mark: problemMarks[p.id] ?? 0,
          });
        }
      });
      // Add pending problems
      pendingProblems.forEach((p) => {
        examProblems.push({
          problemId: p.problemId,
          mark: p.mark,
        });
      });

      const payload = {
        examName: examination.examName,
        programmingLanguageId: examination.programmingLanguage?.id ?? "",
        problems: examProblems,
        classroomId: examination.classroom?.id ?? "",
        startDatetime: examination.startDatetime,
        endDatetime: examination.endDatetime,
        description: examination.description,
        isPublicResult: examination.isPublicResult,
        totalMark: examination.totalMark,
        status: examination.status,
        mode: examination.mode,
        useStrict: examination.useStrict,
        minScoreThreshold: examination.minScoreThreshold,
      };

      // console.log("Updating examination with payload:", JSON.stringify(payload, null, 2));
      const updatedExam = await updateExamination(examination.id, payload);
      toast.showSuccess("Examination updated successfully");
      // Clear pending changes
      setPendingProblems([]);
      setRemovedProblemIds(new Set());
      onExaminationUpdate?.(updatedExam);
    } catch {
      toast.showError("Failed to update examination");
    } finally {
      setSaving(false);
    }
  };

  const getDifficultyBadge = (difficulty: number | string) => {
    const normalized =
      typeof difficulty === "number"
        ? normalizeDifficulty(difficulty)
        : (difficulty as "EASY" | "MEDIUM" | "HARD");
    const colors: Record<string, "success" | "warning" | "failure"> = {
      EASY: "success",
      MEDIUM: "warning",
      HARD: "failure",
    };
    return <Badge color={colors[normalized] ?? "info"}>{normalized}</Badge>;
  };

  // Visible problems = existing (not removed) + pending
  const visibleExistingProblems = problems.filter(
    (p) => !removedProblemIds.has(p.id),
  );

  // Show loading state while fetching exam problem details
  if (loadingExamProblems) {
    return (
      <div className="flex items-center justify-center py-8">
        <Spinner size="lg" />
        <span className="ml-3 text-gray-500 dark:text-gray-400">
          Loading exam problems...
        </span>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4 pt-4">
        {/* Header with marks summary */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
              Exam Problems ({visibleExistingProblems.length + pendingProblems.length})
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Total Marks: {totalAssignedMarks} / {examination.totalMark}
              {remainingMarks > 0 && (
                <span className="ml-2 text-green-600 dark:text-green-400">
                  ({remainingMarks} remaining)
                </span>
              )}
              {remainingMarks < 0 && (
                <span className="ml-2 text-red-600 dark:text-red-400">
                  (exceeds by {Math.abs(remainingMarks)})
                </span>
              )}
            </p>
          </div>
          <div className="flex gap-2">
            {hasChanges && (
              <Button
                color="green"
                size="sm"
                className="cursor-pointer"
                onClick={handleSave}
                disabled={saving || totalAssignedMarks > examination.totalMark}
              >
                {saving ? (
                  <Spinner size="sm" className="mr-1" />
                ) : (
                  <CheckIcon className="mr-1 h-4 w-4" />
                )}
                Save Changes
              </Button>
            )}
            <DefaultCustomButton
              icon={<PlusIcon className="mr-1 h-4 w-4" />}
              label={showAddPanel ? "Hide" : "Add Problem"}
              size="sm"
              className="cursor-pointer"
              onClick={() => setShowAddPanel(!showAddPanel)}
            />
          </div>
        </div>

        {/* Add Problem Panel */}
        {showAddPanel && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-900/20">
            <h5 className="mb-3 font-medium text-gray-900 dark:text-white">
              Add Problem from Your Bank
            </h5>

            {/* Search */}
            <div className="relative mb-3">
              <TextInput
                placeholder="Search problems..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={MagnifyingGlassIcon}
              />
            </div>

            {/* Available Problems List */}
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <Spinner size="md" />
                <span className="ml-2 text-gray-500">Loading problems...</span>
              </div>
            ) : filteredProblems.length === 0 ? (
              <p className="py-4 text-center text-gray-500 dark:text-gray-400">
                {availableProblems.length === 0
                  ? "All your problems are already added to this exam."
                  : "No problems match your search."}
              </p>
            ) : (
              <div className="max-h-60 space-y-2 overflow-y-auto">
                {filteredProblems.map((p) => (
                  <AddProblemRow
                    key={p.id}
                    problem={p}
                    maxMark={remainingMarks}
                    onAdd={handleAddProblem}
                    getDifficultyBadge={getDifficultyBadge}
                    onViewContent={() => handleViewContent(p.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Pending Problems (to be added) */}
        {pendingProblems.length > 0 && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
            <h5 className="mb-3 font-medium text-green-800 dark:text-green-300">
              Pending Additions ({pendingProblems.length})
            </h5>
            <div className="space-y-2">
              {pendingProblems.map((p) => (
                <div
                  key={p.problemId}
                  className="flex items-center justify-between rounded-lg border border-green-300 bg-white p-3 dark:border-green-700 dark:bg-gray-700"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {p.title}
                    </span>
                    {getDifficultyBadge(p.difficulty)}
                    <Badge color="purple">{p.mark} marks</Badge>
                  </div>
                  <Button
                    color="failure"
                    size="xs"
                    className="cursor-pointer"
                    onClick={() => handleRemovePending(p.problemId)}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Removed Problems (pending removal) */}
        {removedProblemIds.size > 0 && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-900/20">
            <h5 className="mb-3 font-medium text-red-800 dark:text-red-300">
              Pending Removals ({removedProblemIds.size})
            </h5>
            <div className="space-y-2">
              {problems
                .filter((p) => removedProblemIds.has(p.id))
                .map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-lg border border-red-300 bg-white p-3 dark:border-red-700 dark:bg-gray-700"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-gray-500 line-through dark:text-gray-400">
                        {p.title}
                      </span>
                      {getDifficultyBadge(p.difficulty)}
                    </div>
                    <Button
                      color="gray"
                      size="xs"
                      className="cursor-pointer"
                      onClick={() => handleUndoRemove(p.id)}
                    >
                      Undo
                    </Button>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Current Problems in Exam */}
        {visibleExistingProblems.length === 0 && pendingProblems.length === 0 ? (
          <p className="py-4 text-gray-500 dark:text-gray-400">
            No problems in this examination.
          </p>
        ) : (
          <div className="space-y-4">
            {visibleExistingProblems.map((p, idx) => (
              <div
                key={p.id}
                className="rounded-lg border border-gray-200 p-4 dark:border-gray-600"
              >
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleViewExistingProblem(p)}
                      className="font-semibold text-gray-900 dark:text-white underline-offset-4 hover:underline dark:hover:text-blue-400"
                    >
                      {idx + 1}. {p.title}
                    </button>
                    {getDifficultyBadge(p.difficulty)}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <label className="text-sm text-gray-600 dark:text-gray-400">
                        Mark:
                      </label>
                      <TextInput
                        type="number"
                        sizing="sm"
                        className="w-20"
                        min={0}
                        max={examination.totalMark}
                        value={problemMarks[p.id] ?? 0}
                        onChange={(e) =>
                          handleMarkChange(p.id, parseFloat(e.target.value) || 0)
                        }
                      />
                    </div>
                    <Button
                      color="failure"
                      size="xs"
                      className="cursor-pointer"
                      onClick={() => handleRemoveExisting(p.id)}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  <DetailRow label="ID" value={p.id} />
                  <DetailRow
                    label="Created"
                    value={formatDate(p.createdDate)}
                  />
                  <DetailRow
                    label="Updated"
                    value={formatDate(p.updatedDate)}
                  />
                  <DetailRow
                    label="Test Cases"
                    value={String(p.testCases?.length ?? 0)}
                  />
                  {p.tags && p.tags.length > 0 && (
                    <div className="col-span-2 mt-1">
                      <span className="text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400">
                        Tags
                      </span>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {p.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-600 dark:text-gray-300"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                {p.content && (
                  <div className="mt-2">
                    <DetailRow
                      label="Content"
                      value={
                        <Button
                          size="xs"
                          color="blue"
                          className="cursor-pointer"
                          onClick={() => handleViewExistingProblem(p)}
                        >
                          View Content
                        </Button>
                      }
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Problem Content Modal */}
      <Modal show={contentModalOpen} onClose={() => setContentModalOpen(false)} size="4xl">
        <ModalHeader>
          {selectedProblemContent?.title || "Problem Content"}
        </ModalHeader>
        <ModalBody className="max-h-[70vh] overflow-y-auto">
          {loadingProblemContent ? (
            <div className="flex items-center justify-center py-8">
              <Spinner size="lg" />
              <span className="ml-3 text-gray-500">Loading problem content...</span>
            </div>
          ) : selectedProblemContent?.content ? (
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {selectedProblemContent.content}
              </ReactMarkdown>
            </div>
          ) : (
            <p className="text-gray-500">No content available.</p>
          )}
        </ModalBody>
        <ModalFooter>
          <Button color="gray" onClick={() => setContentModalOpen(false)}>
            Close
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
}

// Component for adding a problem with mark input
function AddProblemRow({
  problem,
  maxMark,
  onAdd,
  getDifficultyBadge,
  onViewContent,
}: {
  problem: ProblemBasicResponse;
  maxMark: number;
  onAdd: (problem: ProblemBasicResponse, mark: number) => void;
  getDifficultyBadge: (difficulty: number | string) => React.ReactNode;
  onViewContent: (problem: ProblemBasicResponse) => void;
}) {
  const [mark, setMark] = useState<number>(0);

  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-600 dark:bg-gray-700">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <button
          type="button"
          onClick={() => onViewContent(problem)}
          className="truncate font-medium text-gray-900 dark:text-white underline-offset-4 hover:underline dark:hover:text-blue-400 cursor-pointer"
        >
          {problem.title}
        </button>
        <div className="flex flex-wrap gap-1">
          {problem.tags && problem.tags.length > 0 ? (
            problem.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-600 dark:text-gray-300"
              >
                {tag}
              </span>
            ))
          ) : null}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {getDifficultyBadge(problem.difficulty)}
        <div className="flex items-center gap-1">
          <TextInput
            type="number"
            sizing="sm"
            className="w-20"
            placeholder="Mark"
            min={0}
            max={maxMark}
            value={mark || ""}
            onChange={(e) => setMark(parseFloat(e.target.value) || 0)}
          />
          <Button
            color="success"
            size="xs"
            className="cursor-pointer"
            onClick={() => {
              onAdd(problem, mark);
              setMark(0);
            }}
            disabled={mark <= 0 || mark > maxMark}
          >
            <PlusIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Tabs,
  TabItem,
  Badge,
  Button,
  Spinner,
  TextInput,
} from "flowbite-react";
import {
  ClockIcon,
  PlusIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";
import type { Examination, Problem, ExamProblemDTO } from "@/types/examination";
import { formatDurationMs } from "@/utils/datetime-utils";
import { useProblem } from "@/hooks/problem/useProblem";
import { useExamination } from "@/hooks/exam/useExamination";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/useToast";
import type { ProblemBasicResponse } from "@/types/problem";
import { normalizeDifficulty } from "@/types/problem";

const STATUS_LABELS: Record<number, string> = {
  0: "PENDING",
  1: "ONGOING",
  2: "COMPLETED",
};

const MODE_LABELS: Record<number, string> = {
  0: "PRACTICAL",
  1: "EXAMINATION",
};

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

function ExamTimeRange({
  startDatetime,
  endDatetime,
}: {
  startDatetime: string;
  endDatetime: string;
}) {
  const start = new Date(startDatetime);
  const end = new Date(endDatetime);
  const durationMs = end.getTime() - start.getTime();
  const durationStr = formatDurationMs(durationMs);
  const startStr = start.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const endStr = end.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <div className="flex items-center gap-2">
        <ClockIcon className="h-4 w-4 shrink-0 text-gray-400 dark:text-gray-500" />
        <span className="text-sm font-medium text-gray-900 dark:text-white">
          {startStr}
        </span>
      </div>
      <span className="text-gray-400 dark:text-gray-500">→</span>
      <div className="flex items-center gap-2">
        <ClockIcon className="h-4 w-4 shrink-0 text-gray-400 dark:text-gray-500" />
        <span className="text-sm font-medium text-gray-900 dark:text-white">
          {endStr}
        </span>
      </div>
      <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-600 dark:text-gray-300">
        {durationStr}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main view
// ---------------------------------------------------------------------------

export type ExaminationDetailViewProps = {
  examination: Examination;
  onBack: () => void;
  onExaminationUpdate?: (updated: Examination) => void;
};

export function ExaminationDetailView({
  examination,
  onExaminationUpdate,
}: ExaminationDetailViewProps) {
  const statusLabel =
    STATUS_LABELS[examination.status as 0 | 1 | 2] ?? "PENDING";
  const modeLabel = MODE_LABELS[examination.mode as 0 | 1] ?? "PRACTICAL";
  const problems = examination.problems ?? [];

  return (
    <div className="bg-white shadow dark:bg-gray-800">
      <div className="border-b border-gray-200 p-4 dark:border-gray-600">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
          {examination.examName}
        </h3>
      </div>
      <div className="p-4 [&_button[role=tab]]:cursor-pointer">
        <Tabs>
          <TabItem title="Overview" active>
            <OverviewTabContent
              examination={examination}
              statusLabel={statusLabel}
              modeLabel={modeLabel}
            />
          </TabItem>
          <TabItem title="Problems">
            <ProblemsTabContent
              examination={examination}
              problems={problems}
              onExaminationUpdate={onExaminationUpdate}
            />
          </TabItem>
        </Tabs>
      </div>
    </div>
  );
}

function DateTimeDisplay({ datetime }: { datetime: string }) {
  const d = new Date(datetime);
  const dateStr = d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const timeStr = d.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return (
    <div className="flex items-center gap-2">
      {/* <CalendarDaysIcon className="h-4 w-4 shrink-0 text-gray-400 dark:text-gray-500" /> */}
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-medium text-gray-900 dark:text-white">
          {dateStr}
        </span>
        <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
          <ClockIcon className="h-3.5 w-3.5" />
          {timeStr}
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab content components
// ---------------------------------------------------------------------------

type OverviewTabContentProps = {
  examination: Examination;
  statusLabel: string;
  modeLabel: string;
};

function OverviewTabContent({
  examination,
  statusLabel,
  modeLabel,
}: OverviewTabContentProps) {
  return (
    <div className="space-y-1 pt-4">
      <DetailRow label="Exam name" value={examination.examName} />
      <DetailRow
        label="Programming language"
        value={
          examination.programmingLanguage
            ? `${examination.programmingLanguage.languageName}`
            : "—"
        }
      />
      <DetailRow
        label="Classroom"
        value={
          examination.classroom ? `${examination.classroom.className}` : "—"
        }
      />
      <DetailRow
        label="Start – End"
        value={
          <ExamTimeRange
            startDatetime={examination.startDatetime}
            endDatetime={examination.endDatetime}
          />
        }
      />
      <DetailRow label="Description" value={examination.description || "—"} />
      <DetailRow
        label="Public result"
        value={examination.isPublicResult ? "Yes" : "No"}
      />
      <DetailRow label="Total mark" value={String(examination.totalMark)} />
      <DetailRow
        label="Status"
        value={
          <span className="inline-block w-fit">
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
          </span>
        }
      />
      <DetailRow
        label="Mode"
        value={
          <span className="inline-block w-fit">
            <Badge color="info">{modeLabel}</Badge>
          </span>
        }
      />
      <DetailRow
        label="Created date"
        value={<DateTimeDisplay datetime={examination.createdDate} />}
      />
      <DetailRow
        label="Updated date"
        value={<DateTimeDisplay datetime={examination.updatedDate} />}
      />
    </div>
  );
}

type ProblemsTabContentProps = {
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

function ProblemsTabContent({
  examination,
  problems: initialProblems,
  onExaminationUpdate,
}: ProblemsTabContentProps) {
  const { user } = useAuth();
  const toast = useToast();
  const { getProblemsByLecturerId, getProblemById } = useProblem();
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

  // Pending problems to add (with marks)
  const [pendingProblems, setPendingProblems] = useState<PendingProblem[]>([]);
  // Marks for existing problems (problemId -> mark)
  const [problemMarks, setProblemMarks] = useState<Record<string, number>>({});
  // Track removed problem IDs
  const [removedProblemIds, setRemovedProblemIds] = useState<Set<string>>(
    new Set(),
  );

  // Fetch problem details for examProblems
  useEffect(() => {
    const fetchExamProblemDetails = async () => {
      const examProblems = examination.examProblems ?? [];
      if (examProblems.length === 0) {
        setExamProblemDetails([]);
        return;
      }

      setLoadingExamProblems(true);
      try {
        const problemDetails = await Promise.all(
          examProblems.map(async (ep) => {
            const problem = await getProblemById(ep.problemId);
            return problem;
          })
        );
        // Filter out nulls and cast to Problem[]
        setExamProblemDetails(
          problemDetails.filter((p): p is Problem => p !== null) as Problem[]
        );
      } catch (error) {
        console.error("Failed to fetch problem details:", error);
        toast.showError("Failed to load problem details");
      } finally {
        setLoadingExamProblems(false);
      }
    };

    fetchExamProblemDetails();
  }, [examination.examProblems, getProblemById, toast]);

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
        status:
          (["PENDING", "ONGOING", "COMPLETED"][examination.status] as
            | "PENDING"
            | "ONGOING"
            | "COMPLETED") ?? "PENDING",
        mode:
          (["PRACTICAL", "EXAMINATION"][examination.mode] as
            | "PRACTICAL"
            | "EXAMINATION") ?? "PRACTICAL",
      };

      console.log("Updating examination with payload:", JSON.stringify(payload, null, 2));

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
              color="success"
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
          <Button
            color="blue"
            size="sm"
            className="cursor-pointer"
            onClick={() => setShowAddPanel(!showAddPanel)}
          >
            <PlusIcon className="mr-1 h-4 w-4" />
            {showAddPanel ? "Hide" : "Add Problem"}
          </Button>
        </div>
      </div>

      {/* Add Problem Panel */}
      {showAddPanel && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
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
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
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
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {idx + 1}. {p.title}
                  </span>
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
                  value={new Date(p.createdDate).toLocaleString("vi-VN")}
                />
                <DetailRow
                  label="Updated"
                  value={new Date(p.updatedDate).toLocaleString("vi-VN")}
                />
                <DetailRow
                  label="Test Cases"
                  value={String(p.testCases?.length ?? 0)}
                />
              </div>
              {p.content && (
                <div className="mt-2">
                  <DetailRow
                    label="Content"
                    value={
                      <span className="line-clamp-3 block text-sm">
                        {p.content}
                      </span>
                    }
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Component for adding a problem with mark input
function AddProblemRow({
  problem,
  maxMark,
  onAdd,
  getDifficultyBadge,
}: {
  problem: ProblemBasicResponse;
  maxMark: number;
  onAdd: (problem: ProblemBasicResponse, mark: number) => void;
  getDifficultyBadge: (difficulty: number | string) => React.ReactNode;
}) {
  const [mark, setMark] = useState<number>(0);

  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-600 dark:bg-gray-700">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span className="truncate font-medium text-gray-900 dark:text-white">
          {problem.title}
        </span>
        {getDifficultyBadge(problem.difficulty)}
      </div>
      <div className="flex items-center gap-2">
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
  );
}

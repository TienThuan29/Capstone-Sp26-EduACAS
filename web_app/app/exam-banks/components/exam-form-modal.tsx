"use client";

import Link from "next/link";
import { Button, Label, Modal, ModalBody, ModalFooter, ModalHeader, TextInput, Textarea } from "flowbite-react";
import { ArrowTopRightOnSquareIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { PageUrl } from "@/configs/page.url";
import type { ExamFormState } from "./exam-banks.types";
import type { ExaminationTemplateResponse } from "@/types/examination-template";
import type { ProblemBasicResponse } from "@/types/problem";

const MAX_TOTAL_MARK = 10;
const MIN_TOTAL_MARK = 1;

type Props = {
  isOpen: boolean;
  onClose: () => void;
  editingTemplate: ExaminationTemplateResponse | null;
  formState: ExamFormState;
  setFormState: React.Dispatch<React.SetStateAction<ExamFormState>>;
  onOpenProblemPicker: () => void;
  onRemoveProblem: (problemId: string) => void;
  availableProblems: ProblemBasicResponse[];
  submitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
};

export const ExamFormModal = ({
  isOpen,
  onClose,
  editingTemplate,
  formState,
  setFormState,
  onOpenProblemPicker,
  onRemoveProblem,
  availableProblems,
  submitting,
  onSubmit,
}: Props) => {
  const selectedProblemMap = availableProblems.reduce<Record<string, ProblemBasicResponse>>(
    (acc, p) => {
      acc[p.id] = p;
      return acc;
    },
    {},
  );

  const markSum = formState.problems.reduce((sum, p) => sum + p.mark, 0);
  const remaining = formState.totalMark - markSum;
  const isOverBudget = remaining < 0;
  const isMarkBudgetExact = remaining === 0;

  return (
    <Modal show={isOpen} onClose={onClose} size="4xl">
      <ModalHeader>
        {editingTemplate ? "Edit Examination Template" : "Create Examination Template"}
      </ModalHeader>
      <ModalBody>
        <form id="exam-form" onSubmit={onSubmit}>
          <div className="space-y-5">
            <div>
              <Label htmlFor="exam-name">Exam Name</Label>
              <TextInput
                id="exam-name"
                value={formState.examName}
                onChange={(e) =>
                  setFormState((prev) => ({ ...prev, examName: e.target.value }))
                }
                placeholder="e.g., Midterm Exam"
                required
              />
            </div>

            <div>
              <Label htmlFor="exam-description">Description (optional)</Label>
              <Textarea
                id="exam-description"
                rows={3}
                value={formState.description}
                onChange={(e) =>
                  setFormState((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="Brief description..."
              />
            </div>

            <div>
              <Label htmlFor="total-mark">
                Total Mark{" "}
                <span className="text-xs text-gray-500">(1 – 10)</span>
              </Label>
              <TextInput
                id="total-mark"
                type="number"
                min={MIN_TOTAL_MARK}
                max={MAX_TOTAL_MARK}
                value={formState.totalMark}
                onChange={(e) => {
                  const raw = Number(e.target.value);
                  if (raw >= MIN_TOTAL_MARK && raw <= MAX_TOTAL_MARK) {
                    setFormState((prev) => ({ ...prev, totalMark: raw }));
                  } else if (!e.target.value || isNaN(raw)) {
                    setFormState((prev) => ({ ...prev, totalMark: MIN_TOTAL_MARK }));
                  }
                }}
                placeholder="e.g., 10"
              />
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between">
                <Label>Problems ({formState.problems.length})</Label>
                <span
                  className={`text-sm font-medium ${
                    isOverBudget
                      ? "text-red-500"
                      : isMarkBudgetExact
                        ? "text-green-500"
                        : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  {formState.problems.length > 0 ? (
                    <>
                      Mark sum: {markSum.toFixed(1)} / {formState.totalMark}
                      {isOverBudget && (
                        <span className="ml-2">
                          (exceeds by {Math.abs(remaining).toFixed(1)})
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-gray-500 dark:text-gray-400">
                      Mark sum: 0 / {formState.totalMark}
                    </span>
                  )}
                </span>
              </div>

              {formState.problems.length > 0 && (
                <div className="mb-3 space-y-2">
                  {formState.problems.map((p) => {
                    const displayTitle =
                      p.title?.trim() ||
                      selectedProblemMap[p.problemId]?.title?.trim() ||
                      "Untitled problem";
                    return (
                      <div
                        key={p.problemId}
                        className="flex flex-wrap items-center gap-2 rounded border px-3 py-2 dark:border-gray-600 sm:flex-nowrap"
                      >
                        <span className="min-w-0 flex-1 truncate text-sm font-medium">
                          {displayTitle}
                        </span>
                        <div className="flex shrink-0 items-center gap-2">
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                            Mark: {p.mark}
                          </span>
                          <Link
                            href={PageUrl.PROBLEM_BANKS_VIEW_PAGE(p.problemId)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-blue-600 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-blue-400 dark:hover:bg-gray-700"
                          >
                            <ArrowTopRightOnSquareIcon className="mr-1 h-3.5 w-3.5" />
                            View
                          </Link>
                          <Button
                            type="button"
                            color="failure"
                            size="xs"
                            onClick={() => onRemoveProblem(p.problemId)}
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <Button
                type="button"
                color="light"
                size="sm"
                onClick={onOpenProblemPicker}
                disabled={formState.totalMark <= 0}
              >
                <PlusIcon className="mr-1 h-4 w-4" />
                Add Problems
              </Button>
            </div>
          </div>
        </form>
      </ModalBody>
      <ModalFooter>
        <Button color="gray" type="button" onClick={onClose}>
          Cancel
        </Button>
        <Button
          color="blue"
          type="submit"
          form="exam-form"
          disabled={submitting || isOverBudget || formState.totalMark <= 0}
        >
          {submitting ? "Saving..." : editingTemplate ? "Update" : "Create"}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

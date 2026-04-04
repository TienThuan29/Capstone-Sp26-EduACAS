"use client";

import { useEffect, useMemo } from "react";
import {
  Button,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  TextInput,
} from "flowbite-react";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import type { ProblemPickerState } from "./exam-banks.types";
import type { ProblemBasicResponse } from "@/types/problem";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  pickerState: ProblemPickerState;
  setPickerState: React.Dispatch<React.SetStateAction<ProblemPickerState>>;
  onApply: () => void;
  onFetchProblems: () => void;
  formProblemIds: string[];
  formProblemMarks: Record<string, number>;
  totalMark: number;
  userId?: string;
};

export const ProblemPickerModal = ({
  isOpen,
  onClose,
  pickerState,
  setPickerState,
  onApply,
  onFetchProblems,
  formProblemIds,
  formProblemMarks,
  totalMark,
  userId,
}: Props) => {
  const filteredProblems = useMemo(
    () =>
      pickerState.availableProblems.filter((p) =>
        p.title.toLowerCase().includes(pickerState.searchTerm.toLowerCase()),
      ),
    [pickerState.availableProblems, pickerState.searchTerm],
  );

  const selectedMarksSum = Array.from(pickerState.selectedProblemIds).reduce(
    (sum, id) => sum + (pickerState.problemMarks[id] ?? 0),
    0,
  );
  const remaining = Math.max(0, totalMark - selectedMarksSum);
  const isOverBudget = selectedMarksSum > totalMark;
  const hasZeroOrNegativeMark = Array.from(pickerState.selectedProblemIds).some(
    (id) => (pickerState.problemMarks[id] ?? 0) <= 0,
  );

  useEffect(() => {
    if (isOpen && userId) {
      onFetchProblems();
      setPickerState((prev) => ({
        ...prev,
        selectedProblemIds: new Set(formProblemIds),
        problemMarks: { ...formProblemMarks },
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, userId]);

  const handleToggle = (problemId: string) => {
    setPickerState((prev) => {
      const next = new Set(prev.selectedProblemIds);
      if (next.has(problemId)) {
        next.delete(problemId);
        const updatedMarks = { ...prev.problemMarks };
        delete updatedMarks[problemId];
        return { ...prev, selectedProblemIds: next, problemMarks: updatedMarks };
      }
      const prevSum = Array.from(prev.selectedProblemIds).reduce(
        (sum, id) => sum + (prev.problemMarks[id] ?? 0),
        0,
      );
      if (prevSum >= totalMark) {
        return prev;
      }
      next.add(problemId);
      return {
        ...prev,
        selectedProblemIds: next,
        problemMarks: { ...prev.problemMarks, [problemId]: 0 },
      };
    });
  };

  const handleMarkChange = (problemId: string, value: number) => {
    const clamped = Math.max(0, value);
    const otherProblemsSum = Array.from(pickerState.selectedProblemIds)
      .filter((id) => id !== problemId)
      .reduce((sum, id) => sum + (pickerState.problemMarks[id] ?? 0), 0);
    const maxAllowed = Math.max(0, totalMark - otherProblemsSum);
    const finalValue = Math.min(clamped, maxAllowed);
    setPickerState((prev) => ({
      ...prev,
      problemMarks: { ...prev.problemMarks, [problemId]: finalValue },
    }));
  };

  return (
    <Modal show={isOpen} onClose={onClose} size="4xl">
      <ModalHeader>Select Problems</ModalHeader>
      <ModalBody>
        <div className="mb-3 flex items-center justify-between">
          <div className="min-w-55 max-w-md flex-1">
            <TextInput
              icon={MagnifyingGlassIcon}
              placeholder="Search problem title..."
              value={pickerState.searchTerm}
              onChange={(e) =>
                setPickerState((prev) => ({ ...prev, searchTerm: e.target.value }))
              }
            />
          </div>
          <span
            className={`ml-4 whitespace-nowrap text-sm font-medium ${
              isOverBudget ? "text-red-500" : remaining === 0 ? "text-green-500" : "text-gray-500 dark:text-gray-400"
            }`}
          >
            Total: {selectedMarksSum.toFixed(1)} / {totalMark}
            {isOverBudget && ` (exceeds by ${(selectedMarksSum - totalMark).toFixed(1)})`}
          </span>
        </div>

        <div className="max-h-96 space-y-2 overflow-y-auto">
          {filteredProblems.length === 0 ? (
            <p className="py-4 text-center text-gray-500">No problems found.</p>
          ) : (
            <>
              {(isOverBudget || remaining === 0) && (
                <p className="py-2 text-center text-sm text-gray-500">
                  {isOverBudget
                    ? "Total marks exceed the limit. Reduce marks on selected problems."
                    : "Total mark limit is used. Reduce marks or deselect a problem to add another."}
                </p>
              )}
              {filteredProblems.slice(0, 25).map((problem) => {
                const isSelected = pickerState.selectedProblemIds.has(problem.id);
                const currentMark = pickerState.problemMarks[problem.id] ?? 0;
                const otherProblemsSum = Array.from(pickerState.selectedProblemIds)
                  .filter((id) => id !== problem.id)
                  .reduce((sum, id) => sum + (pickerState.problemMarks[id] ?? 0), 0);
                const maxAllowed = Math.max(0, totalMark - otherProblemsSum);
                const isDisabled = !isSelected && remaining === 0;
                return (
                  <div
                    key={problem.id}
                    className={`flex items-center justify-between rounded border p-3 transition-colors ${
                      isSelected
                        ? "cursor-pointer border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                        : isDisabled
                          ? "cursor-not-allowed border-gray-200 bg-gray-100 opacity-50 dark:border-gray-700 dark:bg-gray-800"
                          : "cursor-pointer border-gray-200 dark:border-gray-700"
                    }`}
                    onClick={() => !isDisabled && handleToggle(problem.id)}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => !isDisabled && handleToggle(problem.id)}
                        disabled={isDisabled}
                        className="rounded"
                      />
                      <div>
                        <p className="text-sm font-medium">{problem.title}</p>
                        <p className="text-xs text-gray-500">{problem.difficulty}</p>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="flex items-center gap-2">
                        <TextInput
                          type="number"
                          min={0}
                          max={maxAllowed}
                          step={0.5}
                          value={currentMark}
                          onChange={(e) => handleMarkChange(problem.id, Number(e.target.value))}
                          onClick={(e) => e.stopPropagation()}
                          className="!w-20"
                        />
                        <span className="text-sm">pts</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>
      </ModalBody>
      <ModalFooter>
        <Button color="gray" type="button" onClick={onClose}>
          Cancel
        </Button>
        <Button
          color="blue"
          type="button"
          onClick={onApply}
          disabled={isOverBudget || hasZeroOrNegativeMark}
        >
          Apply ({pickerState.selectedProblemIds.size} selected)
        </Button>
      </ModalFooter>
    </Modal>
  );
};

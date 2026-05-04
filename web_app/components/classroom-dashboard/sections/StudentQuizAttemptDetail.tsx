"use client";

import { XMarkIcon } from "@heroicons/react/24/outline";
import { QuizAttemptProgressChart } from "../charts/QuizAttemptProgressChart";
import type { QuizAttemptResponse } from "@/types/quiz";

interface StudentQuizAttemptDetailProps {
  studentName: string;
  quizName: string;
  attempts: QuizAttemptResponse[];
  onClose: () => void;
}

export function StudentQuizAttemptDetail({
  studentName,
  quizName,
  attempts,
  onClose,
}: StudentQuizAttemptDetailProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-700 dark:bg-gray-800">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-200"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>

        <QuizAttemptProgressChart
          attempts={attempts}
          studentName={studentName}
          quizName={quizName}
        />
      </div>
    </div>
  );
}

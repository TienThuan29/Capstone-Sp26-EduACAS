"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Button,
  Spinner,
} from "flowbite-react";
import {
  PlusIcon,
  ArrowDownTrayIcon,
  PencilSquareIcon,
} from "@heroicons/react/24/outline";
import { useClassroomQuiz } from "@/hooks/quiz/useClassroomQuiz";
import { useQuiz } from "@/hooks/quiz/useQuiz";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/useToast";
import { toUtcIsoString } from "@/utils/datetime-utils";
import { PageUrl } from "@/configs/page.url";
import { useRouter } from "next/navigation";
import type { ClassroomQuiz, ClassroomQuizStatus } from "@/types/quiz";
import { ClassroomQuizDetailView } from "./quiz-detail-tab";
import { ClassroomQuizTable } from "@/components/quiz/classroom-quiz-table";
import { ImportQuizModal } from "../components/quiz-tab/import-quiz-modal";
import { QuizFormModal } from "../components/quiz-tab/quiz-form-modal";
import { DeleteQuizModal } from "../components/quiz-tab/delete-quiz-modal";


type QuizzesTabProps = {
  classId: string;
  setQuizDetailBack?: (callback: (() => void) | null) => void;
  initialQuizId?: string | null;
  onQuizIdInUrlChange?: (quizId: string | null) => void;
};

export function QuizzesTab({
  classId,
  setQuizDetailBack,
  initialQuizId,
  onQuizIdInUrlChange,
}: QuizzesTabProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const {
    getClassroomQuizzesByClassroomPaged,
    getClassroomQuizById,
    createClassroomQuiz,
    updateClassroomQuiz,
    softDeleteClassroomQuiz,
  } = useClassroomQuiz();
  const { getQuizById } = useQuiz();

  const [classroomQuizzes, setClassroomQuizzes] = useState<ClassroomQuiz[]>([]);
  const [quizNameMap, setQuizNameMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(10);

  const [showAddDropdown, setShowAddDropdown] = useState(false);
  const [openImportModal, setOpenImportModal] = useState(false);
  const [openFormModal, setOpenFormModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);

  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
  const [editingQuiz, setEditingQuiz] = useState<ClassroomQuiz | null>(null);
  const [quizToDelete, setQuizToDelete] = useState<ClassroomQuiz | null>(null);
  const [quizToView, setQuizToView] = useState<ClassroomQuiz | null>(null);

  const fetchQuizzes = useCallback(async () => {
    try {
      setLoading(true);
      const dataPaged = await getClassroomQuizzesByClassroomPaged(classId, currentPage, pageSize, true);
      const data = dataPaged.items;
      setClassroomQuizzes(data);
      setTotalPages(dataPaged.totalPages);

      const uniqueQuizIds = [...new Set(data.map((q) => q.quizId))];
      const nameMap: Record<string, string> = { ...quizNameMap };
      await Promise.all(
        uniqueQuizIds.map(async (qid) => {
          if (nameMap[qid]) return;
          try {
            const quiz = await getQuizById(qid);
            if (quiz) nameMap[qid] = quiz.title;
          } catch {
            nameMap[qid] = qid;
          }
        })
      );
      setQuizNameMap(nameMap);
    } catch (err) {
      console.error("Failed to fetch classroom quizzes:", err);
      showError("Failed to load quizzes");
    } finally {
      setLoading(false);
    }
  }, [classId, getClassroomQuizzesByClassroomPaged, currentPage, pageSize, showError, getQuizById]);

  useEffect(() => {
    fetchQuizzes();
  }, [fetchQuizzes]);

  const backToList = useCallback(() => {
    setQuizToView(null);
    onQuizIdInUrlChange?.(null);
  }, [onQuizIdInUrlChange]);

  useEffect(() => {
    setQuizDetailBack?.(() => (quizToView ? backToList : null));
    return () => setQuizDetailBack?.(() => null);
  }, [quizToView, backToList, setQuizDetailBack]);

  useEffect(() => {
    if (!initialQuizId) {
      setQuizToView(null);
      return;
    }
    const fromList = classroomQuizzes.find((q) => q.id === initialQuizId);
    if (fromList) {
      setQuizToView(fromList);
    } else {
      getClassroomQuizById(initialQuizId)
        .then((cq) => { if (cq) setQuizToView(cq); })
        .catch(() => showError("Failed to load quiz details"));
    }
  }, [initialQuizId, classroomQuizzes, getClassroomQuizById, showError]);

  const handleOpenImport = () => {
    setShowAddDropdown(false);
    setOpenImportModal(true);
  };

  const handleImportSelect = (quizId: string) => {
    setSelectedQuizId(quizId);
    setEditingQuiz(null);
    setOpenImportModal(false);
    setOpenFormModal(true);
  };

  const handleOpenEdit = (cq: ClassroomQuiz) => {
    setEditingQuiz(cq);
    setSelectedQuizId(cq.quizId);
    setOpenFormModal(true);
  };

  const handleOpenDeleteConfirm = (cq: ClassroomQuiz) => {
    setQuizToDelete(cq);
    setOpenDeleteModal(true);
  };

  const handleFormSubmit = async (data: {
    startTime: string;
    endTime: string;
    maxOfAttempts: number;
    passcode: string;
    status: ClassroomQuizStatus;
  }) => {
    try {
      setActionLoading(true);
      const startTimeUtc = toUtcIsoString(data.startTime);
      const endTimeUtc = toUtcIsoString(data.endTime);

      if (editingQuiz) {
        await updateClassroomQuiz(editingQuiz.id, {
          startTime: startTimeUtc,
          endTime: endTimeUtc,
          maxOfAttempts: data.maxOfAttempts,
          passcode: data.passcode || undefined,
          status: data.status,
        } as any);
        showSuccess("Quiz assignment updated");
      } else {
        await createClassroomQuiz({
          classroomId: classId,
          quizId: selectedQuizId!,
          startTime: startTimeUtc,
          endTime: endTimeUtc,
          maxOfAttempts: data.maxOfAttempts,
          passcode: data.passcode || undefined,
          createdBy: user?.id ?? "",
        });
        showSuccess("Quiz assigned successfully");
      }
      setOpenFormModal(false);
      await fetchQuizzes();
    } catch (err: any) {
      showError(err?.response?.data?.message || "Operation failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!quizToDelete) return;
    try {
      setActionLoading(true);
      await softDeleteClassroomQuiz(quizToDelete.id);
      showSuccess("Quiz assignment removed");
      setOpenDeleteModal(false);
      if (quizToView?.id === quizToDelete.id) backToList();
      await fetchQuizzes();
    } catch (err: any) {
      showError(err?.response?.data?.message || "Delete failed");
    } finally {
      setActionLoading(false);
    }
  };


  return (
    <div className="space-y-6">
      {quizToView ? (
        <ClassroomQuizDetailView
          classroomQuiz={quizToView}
          quizTitle={quizNameMap[quizToView.quizId] ?? quizToView.quizId}
          onBack={backToList}
          onEdit={() => handleOpenEdit(quizToView)}
          onDelete={() => handleOpenDeleteConfirm(quizToView)}
          showBackInHeader={false}
        />
      ) : (
        <>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="border-l-8 border-[#1F4E79] pl-4 text-3xl font-black text-gray-900 dark:border-[#C9A24D] dark:text-white">
              Quizzes
            </h2>

            <div className="relative">
              <Button
                color="dark"
                className="bg-[#1F4E79] hover:bg-[#2A6BA3] cursor-pointer"
                onClick={() => setShowAddDropdown((v) => !v)}
              >
                <PlusIcon className="mr-2 h-5 w-5" />
                Add Quiz
              </Button>

              {showAddDropdown && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowAddDropdown(false)} />
                  <div className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl dark:border-gray-600 dark:bg-gray-700">
                    <button
                      className="flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-600"
                      onClick={handleOpenImport}
                    >
                      <ArrowDownTrayIcon className="h-5 w-5 text-[#1F4E79] dark:text-[#C9A24D]" />
                      <div>
                        <span className="block font-semibold">Import from Quiz Bank</span>
                        <span className="block text-xs text-gray-500 dark:text-gray-400">Choose an existing quiz</span>
                      </div>
                    </button>
                    <div className="border-t border-gray-100 dark:border-gray-600" />
                    <button
                      className="flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-600"
                      onClick={() => router.push(PageUrl.QUIZ_BANK_PAGE)}
                    >
                      <PencilSquareIcon className="h-5 w-5 text-[#1F4E79] dark:text-[#C9A24D]" />
                      <div>
                        <span className="block font-semibold">Create New Quiz</span>
                        <span className="block text-xs text-gray-500 dark:text-gray-400">Go to Quiz Banks to create</span>
                      </div>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <Spinner size="xl" />
            </div>
          ) : (
            <ClassroomQuizTable
              classroomQuizzes={classroomQuizzes}
              quizNameMap={quizNameMap}
              onViewDetail={(cq) => {
                setQuizToView(cq);
                onQuizIdInUrlChange?.(cq.id);
              }}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(page) => setCurrentPage(page)}
            />
          )}
        </>
      )}


      <ImportQuizModal
        show={openImportModal}
        onClose={() => setOpenImportModal(false)}
        onSelect={handleImportSelect}
      />

      <QuizFormModal
        show={openFormModal}
        onClose={() => setOpenFormModal(false)}
        editingQuiz={editingQuiz}
        selectedQuizId={selectedQuizId}
        classId={classId}
        userId={user?.id ?? ""}
        onSubmit={handleFormSubmit}
        actionLoading={actionLoading}
      />

      <DeleteQuizModal
        show={openDeleteModal}
        onClose={() => setOpenDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        quizToDelete={quizToDelete}
        quizTitle={quizToDelete ? (quizNameMap[quizToDelete.quizId] ?? "this quiz") : ""}
        actionLoading={actionLoading}
      />
    </div>
  );
}

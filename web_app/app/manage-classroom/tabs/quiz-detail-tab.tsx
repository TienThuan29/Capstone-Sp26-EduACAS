"use client";

import { useState, useEffect, useCallback } from "react";
import { Badge, Button, Spinner, Tabs, TabItem, Tooltip, Pagination, Card, Table, TableBody, TableCell, TableHead, TableHeadCell, TableRow, Modal, ModalHeader, ModalBody } from "flowbite-react";
import {
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  NoSymbolIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { useQuiz } from "@/hooks/quiz/useQuiz";
import { useSubject } from "@/hooks/subject/useSubject";
import { useQuizAttempt } from "@/hooks/quiz/useQuizAttempt";
import { useToast } from "@/hooks/useToast";
import type { ClassroomQuiz, Quiz, QuizQuestion, QuizAttemptResponse } from "@/types/quiz";
import { SharedQuizOverview } from "@/components/quiz/shared-quiz-overview";
import { formatDate } from "@/utils/datetime-utils";

function BanConfirmModal({
  show,
  onClose,
  onConfirm,
  studentName,
  isBanning,
}: {
  show: boolean;
  onClose: () => void;
  onConfirm: () => void;
  studentName: string;
  isBanning: boolean;
}) {
  return (
    <Modal show={show} size="md" popup onClose={onClose}>
      <ModalHeader />
      <ModalBody>
        <div className="text-center p-4">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-500">
            <NoSymbolIcon className="h-10 w-10" />
          </div>

          <h3 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">
            Ban Student
          </h3>

          <p className="mb-6 text-gray-500 dark:text-gray-400">
            Are you sure you want to ban <span className="font-semibold text-gray-900 dark:text-white">"{studentName}"</span> from this quiz?
          </p>

          <div className="mb-6 rounded-lg bg-orange-50 p-4 text-xs text-orange-700 dark:bg-orange-900/20 dark:text-orange-300">
            <p className="font-bold flex items-center justify-center gap-2">
              <ExclamationTriangleIcon className="h-4 w-4" />
              This action is IRREVERSIBLE
            </p>
            <p className="mt-1">
              Banning will immediately end the student's attempt, set their final score to <strong>0</strong>, and they will not be able to continue this attempt.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button
              color="failure"
              onClick={onConfirm}
              disabled={isBanning}
              className="bg-red-600 hover:bg-red-700 dark:bg-red-600 cursor-pointer"
            >
              {isBanning ? <Spinner size="sm" className="mr-2" /> : null}
              Confirm Ban
            </Button>
            <Button
              color="gray"
              onClick={onClose}
              disabled={isBanning}
              className="cursor-pointer"
            >
              Cancel
            </Button>
          </div>
        </div>
      </ModalBody>
    </Modal>
  );
}

function SubmissionsContent({
  classroomQuizId,
  quizDetail,
}: {
  classroomQuizId: string;
  quizDetail: Quiz | null;
}) {
  const { getSubmissionsPaged, abandonAttempt, loading } = useQuizAttempt();
  const { showSuccess, showError } = useToast();
  const [submissions, setSubmissions] = useState<QuizAttemptResponse[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10;

  const [banModalState, setBanModalState] = useState<{
    show: boolean;
    attempt: QuizAttemptResponse | null;
    isBanning: boolean;
  }>({
    show: false,
    attempt: null,
    isBanning: false,
  });

  const fetchSubmissions = useCallback(async () => {
    const data = await getSubmissionsPaged(classroomQuizId, currentPage, pageSize);
    if (data) {
      setSubmissions(data.items);
      setTotalPages(data.totalPages);
    }
  }, [classroomQuizId, currentPage, getSubmissionsPaged]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  const handleBanConfirm = async () => {
    if (!banModalState.attempt) return;
    
    setBanModalState(prev => ({ ...prev, isBanning: true }));
    try {
      const success = await abandonAttempt(banModalState.attempt.id);
      if (success) {
        showSuccess(`Banned ${banModalState.attempt.studentName} successfully`);
        setBanModalState({ show: false, attempt: null, isBanning: false });
        fetchSubmissions();
      } else {
        showError("Failed to ban student");
      }
    } catch (err) {
      showError("An error occurred while banning");
    } finally {
      setBanModalState(prev => ({ ...prev, isBanning: false }));
    }
  };

  if (loading && submissions.length === 0) {
    return (
      <div className="flex justify-center py-10">
        <Spinner size="md" />
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white py-16 text-center dark:border-gray-700 dark:bg-gray-800">
        <p className="text-gray-500 dark:text-gray-400">
          No student submissions found for this quiz yet.
        </p>
      </div>
    );
  }

  const maxScore = quizDetail?.questions?.reduce((acc, q) => acc + (q.marks || 0), 0) || 0;

  return (
    <div className="space-y-4 pt-4">
      <Card className="border-none shadow-sm bg-white dark:bg-gray-800 ring-1 ring-gray-100 dark:ring-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <Table hoverable>
            <TableHead>
              <TableRow className="bg-gray-50 dark:bg-gray-700/50">
                <TableHeadCell>Student Info</TableHeadCell>
                <TableHeadCell className="text-center">Attempt</TableHeadCell>
                <TableHeadCell className="text-center">Start Time</TableHeadCell>
                <TableHeadCell className="text-center">End Time</TableHeadCell>
                <TableHeadCell className="text-center">Correct Answers</TableHeadCell>
                <TableHeadCell className="text-center">Score</TableHeadCell>
                <TableHeadCell className="text-center">Status</TableHeadCell>
                <TableHeadCell className="text-center">Actions</TableHeadCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {submissions.map((attempt) => (
                <TableRow key={attempt.id} className="border-b border-gray-50 dark:border-gray-700 last:border-0 hover:bg-gray-50/80 dark:hover:bg-gray-700/30 transition-colors">
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-bold text-gray-900 dark:text-white uppercase tracking-tight text-xs">{attempt.studentName}</span>
                      <span className="text-[10px] text-gray-400 font-mono italic">{attempt.studentEmail}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-bold text-gray-900 dark:text-white">
                    {attempt.attemptNumber}
                  </TableCell>
                  <TableCell className="text-center text-gray-600 dark:text-gray-400 text-sm whitespace-nowrap">
                    {formatDate(attempt.startTime)}
                  </TableCell>
                  <TableCell className="text-center text-gray-600 dark:text-gray-400 text-sm whitespace-nowrap">
                    {attempt.endTime ? formatDate(attempt.endTime) : '-'}
                  </TableCell>
                  <TableCell className="text-center font-medium">
                    {attempt.status === 'SUBMITTED' ? (
                      <span className="text-[#1F4E79] dark:text-blue-400">{attempt.correctAnswers} / {attempt.totalQuestions}</span>
                    ) : attempt.status === 'ABANDONED' ? (
                      <span className="text-red-500">0 / {attempt.totalQuestions}</span>
                    ) : '-'}
                  </TableCell>
                  <TableCell className="text-center">
                    {(attempt.status === 'SUBMITTED' || attempt.status === 'ABANDONED') && attempt.score !== undefined ? (
                      <Badge color={attempt.status === 'SUBMITTED' ? "success" : "failure"} className="px-3 font-bold mx-auto w-fit">
                        {attempt.score.toFixed(1)} / {maxScore.toFixed(1)}
                      </Badge>
                    ) : '-'}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center">
                      <Badge
                        color={attempt.status === 'SUBMITTED' ? 'success' : attempt.status === 'INPROGRESS' ? 'info' : 'failure'}
                      >
                        {attempt.status}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center">
                      <Tooltip content={attempt.status === 'ABANDONED' ? "Student is banned" : attempt.status === 'SUBMITTED' ? "Already submitted" : "Ban student"} placement="top">
                        <Button 
                          size="xs" 
                          color="failure" 
                          pill 
                          outline
                          disabled={attempt.status !== 'INPROGRESS'}
                          onClick={() => setBanModalState({ show: true, attempt, isBanning: false })}
                          className={`border-none bg-transparent shadow-none focus:ring-0 ${attempt.status === 'INPROGRESS' ? 'hover:bg-red-50' : 'opacity-30 cursor-not-allowed'}`}
                        >
                          <NoSymbolIcon className="h-5 w-5" />
                        </Button>
                      </Tooltip>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {totalPages > 1 && (
        <div className="flex justify-center py-2">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            showIcons
          />
        </div>
      )}

      <BanConfirmModal
        show={banModalState.show}
        onClose={() => setBanModalState({ show: false, attempt: null, isBanning: false })}
        onConfirm={handleBanConfirm}
        studentName={banModalState.attempt?.studentName || ""}
        isBanning={banModalState.isBanning}
      />
    </div>
  );
}


export type ClassroomQuizDetailViewProps = {
  classroomQuiz: ClassroomQuiz;
  quizTitle: string;
  onBack: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  showBackInHeader?: boolean;
};

const TAB_OVERVIEW = 0;
const TAB_SUBMISSIONS = 1;

export function ClassroomQuizDetailView({
  classroomQuiz,
  quizTitle,
  onBack,
  onEdit,
  onDelete,
  showBackInHeader = true,
}: ClassroomQuizDetailViewProps) {
  const [activeTab, setActiveTab] = useState(TAB_OVERVIEW);
  const [quizDetail, setQuizDetail] = useState<Quiz | null>(null);
  const [subjectName, setSubjectName] = useState<string>("");
  const [loadingDetail, setLoadingDetail] = useState(true);
  const { getQuizById } = useQuiz();
  const { getSubjectById } = useSubject();

  const fetchQuizDetail = useCallback(async () => {
    try {
      setLoadingDetail(true);
      const data = await getQuizById(classroomQuiz.quizId);
      setQuizDetail(data);

      if (data?.subjectId) {
        const sub = await getSubjectById(data.subjectId);
        if (sub) {
          setSubjectName(`${sub.subjectCode} - ${sub.subjectName}`);
        }
      }
    } catch {
      console.error("Failed to fetch quiz detail");
    } finally {
      setLoadingDetail(false);
    }
  }, [classroomQuiz.quizId, getQuizById, getSubjectById]);

  useEffect(() => {
    fetchQuizDetail();
  }, [fetchQuizDetail]);

  if (loadingDetail) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="xl" />
      </div>
    );
  }

  return (
    <div className="bg-white shadow dark:bg-gray-800">
      <div className="flex flex-wrap items-center gap-3 border-b border-gray-200 p-4 dark:border-gray-600">
        {showBackInHeader && (
          <Button
            color="gray"
            outline
            onClick={onBack}
            className="inline-flex cursor-pointer items-center gap-2"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            Back to list
          </Button>
        )}
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
          {quizTitle}
        </h3>

        <div className="ml-auto flex items-center gap-2">
          {onEdit && (
            <Tooltip content="Edit assignment" placement="top">
              <Button
                size="xs"
                color="gray"
                onClick={onEdit}
                className="border-none bg-transparent shadow-none hover:bg-gray-100 focus:ring-0 dark:hover:bg-gray-700"
              >
                <PencilIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              </Button>
            </Tooltip>
          )}
          {onDelete && (
            <Tooltip
              content={
                classroomQuiz.status === 'PUBLISHED' &&
                  new Date(classroomQuiz.startTime) <= new Date() &&
                  new Date(classroomQuiz.endTime) > new Date()
                  ? "Cannot delete an ongoing quiz"
                  : "Remove assignment"
              }
              placement="top"
            >
              <Button
                size="xs"
                color="gray"
                onClick={onDelete}
                disabled={
                  classroomQuiz.status === 'PUBLISHED' &&
                  new Date(classroomQuiz.startTime) <= new Date() &&
                  new Date(classroomQuiz.endTime) > new Date()
                }
                className="border-none bg-transparent shadow-none hover:bg-gray-100 focus:ring-0 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <TrashIcon className="h-4 w-4 text-red-600 dark:text-red-500" />
              </Button>
            </Tooltip>
          )}
        </div>
      </div>

      <div className="p-4 [&_button[role=tab]]:cursor-pointer">
        <Tabs onActiveTabChange={setActiveTab}>
          <TabItem title="Overview" active={activeTab === TAB_OVERVIEW}>
            {activeTab === TAB_OVERVIEW && (
              <SharedQuizOverview
                classroomQuiz={classroomQuiz}
                quizDetail={quizDetail}
                subjectName={subjectName}
                isStudent={false}
              />
            )}
          </TabItem>
          <TabItem title="Submissions" active={activeTab === TAB_SUBMISSIONS}>
            {activeTab === TAB_SUBMISSIONS && (
              <SubmissionsContent
                classroomQuizId={classroomQuiz.id}
                quizDetail={quizDetail}
              />
            )}
          </TabItem>
        </Tabs>
      </div>
    </div>
  );
}

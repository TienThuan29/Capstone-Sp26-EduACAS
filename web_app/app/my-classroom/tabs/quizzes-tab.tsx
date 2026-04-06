"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
    Badge,
    Button,
    Spinner,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeadCell,
    TableRow,
    Modal,
    ModalHeader,
    ModalBody,
    Label,
    TextInput,
    Card,
    Tabs,
    TabItem,
} from "flowbite-react";
import {
    ClipboardDocumentListIcon,
    ArrowLeftIcon,
} from "@heroicons/react/24/outline";
import { useClassroomQuiz } from "@/hooks/quiz/useClassroomQuiz";
import { useQuiz } from "@/hooks/quiz/useQuiz";
import { useSubject } from "@/hooks/subject/useSubject";
import { useQuizAttempt } from "@/hooks/quiz/useQuizAttempt";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/contexts/AuthContext";
import type { ClassroomQuiz, Quiz, QuizAttemptResponse } from "@/types/quiz";
import { formatDate } from "@/utils/datetime-utils";
import { QuizTakingView } from "../components/quiz-taking-view";
import { ClassroomQuizTable } from "@/components/quiz/classroom-quiz-table";
import { SharedQuizOverview } from "@/components/quiz/shared-quiz-overview";

function QuizAttemptHistoryCard({
    attempts,
    quizDetail,
    onViewAttempt
}: {
    attempts: QuizAttemptResponse[];
    quizDetail: Quiz | null;
    onViewAttempt: (attempt: QuizAttemptResponse) => void;
}) {
    if (attempts.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                <ClipboardDocumentListIcon className="h-12 w-12 text-gray-300 mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No attempts found for this quiz.</p>
            </div>
        );
    }

    const maxScore = quizDetail?.questions?.reduce((acc, q) => acc + (q.marks || 0), 0) || 0;

    return (
        <Card className="border-none shadow-sm bg-white dark:bg-gray-800 ring-1 ring-gray-100 dark:ring-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
                <Table hoverable>
                    <TableHead>
                        <TableRow className="bg-gray-50 dark:bg-gray-700/50">
                            <TableHeadCell className="text-center">Attempt</TableHeadCell>
                            <TableHeadCell className="text-center">Start Time</TableHeadCell>
                            <TableHeadCell className="text-center">End Time</TableHeadCell>
                            <TableHeadCell className="text-center">Correct Answers</TableHeadCell>
                            <TableHeadCell className="text-center">Score</TableHeadCell>
                            <TableHeadCell className="text-center">Status</TableHeadCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {attempts.map((attempt) => (
                            <TableRow 
                                key={attempt.id} 
                                className="border-b border-gray-50 dark:border-gray-700 last:border-0 hover:bg-gray-50/80 dark:hover:bg-gray-700/30 transition-colors cursor-pointer group"
                                onClick={() => onViewAttempt(attempt)}
                            >
                                <TableCell className="text-center font-bold text-gray-900 dark:text-white">{attempt.attemptNumber}</TableCell>
                                <TableCell className="text-center text-gray-600 dark:text-gray-400 text-sm whitespace-nowrap">
                                    {formatDate(attempt.startTime)}
                                </TableCell>
                                <TableCell className="text-center text-gray-600 dark:text-gray-400 text-sm whitespace-nowrap">
                                    {attempt.endTime ? formatDate(attempt.endTime) : '-'}
                                </TableCell>
                                <TableCell className="text-center font-medium">
                                    {attempt.status === 'SUBMITTED' ? (
                                        <span className="text-[#1F4E79] dark:text-blue-400">{attempt.correctAnswers} / {attempt.totalQuestions}</span>
                                    ) : '-'}
                                </TableCell>
                                <TableCell className="text-center">
                                    {attempt.status === 'SUBMITTED' && attempt.score !== undefined ? (
                                        <Badge color="info" className="px-3 font-bold mx-auto w-fit">
                                            {attempt.score.toFixed(1)} / {maxScore.toFixed(1)}
                                        </Badge>
                                    ) : '-'}
                                </TableCell>
                                <TableCell className="text-center">
                                    <div className="flex justify-center">
                                        <Badge color={attempt.status === 'SUBMITTED' ? 'success' : attempt.status === 'INPROGRESS' ? 'warning' : 'failure'}>
                                            {attempt.status}
                                        </Badge>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </Card>
    );
}

function PasscodeModal({
    show,
    onClose,
    onConfirm
}: {
    show: boolean;
    onClose: () => void;
    onConfirm: (passcode: string) => void;
}) {
    const [passcode, setPasscode] = useState("");

    return (
        <Modal show={show} size="md" popup onClose={onClose}>
            <ModalHeader />
            <ModalBody>
                <div className="space-y-6 px-2 pb-4">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        Enter Quiz Passcode
                    </h3>
                    <div>
                        <div className="mb-2 block">
                            <Label htmlFor="passcode">This quiz requires a passcode to proceed.</Label>
                        </div>
                        <TextInput
                            id="passcode"
                            placeholder="Type passcode here..."
                            type="password"
                            value={passcode}
                            onChange={(e) => setPasscode(e.target.value)}
                            required
                        />
                    </div>
                    <div className="flex w-full justify-end gap-3">
                        <Button color="gray" onClick={onClose}>Cancel</Button>
                        <Button color="blue" className="bg-[#1F4E79]" onClick={() => onConfirm(passcode)}>
                            Start Quiz
                        </Button>
                    </div>
                </div>
            </ModalBody>
        </Modal>
    );
}

export function QuizzesTab({
    classId,
    setQuizDetailBack
}: {
    classId: string;
    setQuizDetailBack?: (cb: (() => void) | null) => void;
}) {
    const { user } = useAuth();
    const { showSuccess, showError } = useToast();
    const { getClassroomQuizzesByClassroomPaged } = useClassroomQuiz();
    const { getQuizById } = useQuiz();
    const { getSubjectById } = useSubject();
    const { getHistory, startAttempt } = useQuizAttempt();

    const [classroomQuizzes, setClassroomQuizzes] = useState<ClassroomQuiz[]>([]);
    const [quizNameMap, setQuizNameMap] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [pageSize] = useState(10);

    const [selectedQuiz, setSelectedQuiz] = useState<ClassroomQuiz | null>(null);
    const [quizDetail, setQuizDetail] = useState<Quiz | null>(null);
    const [subjectName, setSubjectName] = useState("");
    const [attemptsHistory, setAttemptsHistory] = useState<QuizAttemptResponse[]>([]);
    const [loadingDetail, setLoadingDetail] = useState(false);

    const [showPasscodeModal, setShowPasscodeModal] = useState(false);
    const [activeAttempt, setActiveAttempt] = useState<QuizAttemptResponse | null>(null);
    const [viewingAttempt, setViewingAttempt] = useState<QuizAttemptResponse | null>(null);
    const [activeTab, setActiveTab] = useState(0);

    const backToList = useCallback(() => {
        setSelectedQuiz(null);
        setViewingAttempt(null);
        setQuizDetailBack?.(null);
        setActiveTab(0);
    }, [setQuizDetailBack]);

    const fetchQuizzes = useCallback(async () => {
        try {
            setLoading(true);
            const dataPaged = await getClassroomQuizzesByClassroomPaged(classId, currentPage, pageSize, true);
            const quizzes = dataPaged.items;
            setClassroomQuizzes(quizzes);
            setTotalPages(dataPaged.totalPages);

            const uniqueQuizIds = [...new Set(quizzes.map((q) => q.quizId))];

            const newTitles: Record<string, string> = {};
            await Promise.all(
                uniqueQuizIds.map(async (qid) => {
                    try {
                        const quiz = await getQuizById(qid);
                        if (quiz) newTitles[qid] = quiz.title;
                    } catch {
                        newTitles[qid] = qid;
                    }
                })
            );

            setQuizNameMap(prev => ({ ...prev, ...newTitles }));
        } catch (err) {
            console.error(err);
            showError("Failed to load quizzes");
        } finally {
            setLoading(false);
        }
    }, [classId, currentPage, pageSize, getClassroomQuizzesByClassroomPaged, getQuizById, showError]);

    useEffect(() => {
        fetchQuizzes();
    }, [fetchQuizzes]);

    const handleViewDetail = async (cq: ClassroomQuiz) => {
        setSelectedQuiz(cq);
        setQuizDetailBack?.(() => backToList);

        setLoadingDetail(true);
        try {
            const [detail, history] = await Promise.all([
                getQuizById(cq.quizId),
                getHistory(cq.id, user?.id || "")
            ]);
            setQuizDetail(detail);
            setAttemptsHistory(history);

            if (detail?.subjectId) {
                const sub = await getSubjectById(detail.subjectId);
                if (sub) setSubjectName(`${sub.subjectCode} - ${sub.subjectName}`);
            }
        } catch (err) {
            console.error(err);
            showError("Failed to load quiz details");
        } finally {
            setLoadingDetail(false);
        }
    };

    const handleTakeQuiz = () => {
        if (!selectedQuiz) return;

        const inProgress = attemptsHistory.find(a => a.status === 'INPROGRESS');
        if (inProgress) {
            setActiveAttempt(inProgress);
            return;
        }

        if (selectedQuiz.passcode) {
            setShowPasscodeModal(true);
        } else {
            onPasscodeConfirm("");
        }
    };

    const onPasscodeConfirm = async (passcode: string) => {
        if (!selectedQuiz || !user) return;

        if (selectedQuiz.passcode && passcode !== selectedQuiz.passcode) {
            showError("Incorrect passcode");
            return;
        }

        try {
            const attempt = await startAttempt({
                classroomQuizId: selectedQuiz.id,
                studentId: user.id
            });
            if (attempt) {
                setActiveAttempt(attempt);
                setShowPasscodeModal(false);
            }
        } catch (err: any) {
            showError(err.message || "Failed to start quiz");
        }
    };

    const onQuizFinished = () => {
        setActiveAttempt(null);
        if (selectedQuiz) handleViewDetail(selectedQuiz);
    };

    if (activeAttempt) {
        return (
            <QuizTakingView
                key={activeAttempt.id}
                attempt={activeAttempt}
                onSubmitted={onQuizFinished}
            />
        );
    }

    if (viewingAttempt) {
        return (
            <QuizTakingView
                key={viewingAttempt.id}
                attempt={viewingAttempt}
                onSubmitted={() => {}}
                readOnly={true}
                onBack={() => setViewingAttempt(null)}
            />
        );
    }

    if (selectedQuiz) {
        const now = new Date();
        const start = new Date(selectedQuiz.startTime);
        const end = new Date(selectedQuiz.endTime);
        const isUpcoming = start > now;

        return (
            <div className="bg-white shadow dark:bg-gray-800">
                <div className="flex flex-wrap items-center gap-3 border-b border-gray-200 p-4 dark:border-gray-600">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {quizNameMap[selectedQuiz.quizId] || "Quiz Details"}
                    </h3>
                </div>

                <div className="p-4 [&_button[role=tab]]:cursor-pointer">
                    <Tabs aria-label="Quiz detail tabs" onActiveTabChange={(tab) => setActiveTab(tab)}>
                        <TabItem title="Overview" active={activeTab === 0}>
                            {loadingDetail ? (
                                <div className="flex justify-center py-20">
                                    <Spinner size="xl" />
                                </div>
                            ) : (
                                <div className="animate-in fade-in duration-300">
                                    <SharedQuizOverview
                                        classroomQuiz={selectedQuiz}
                                        quizDetail={quizDetail}
                                        subjectName={subjectName}
                                        isStudent={true}
                                        onTimerEnd={() => handleViewDetail(selectedQuiz)}
                                        studentActionContent={
                                            attemptsHistory.length < selectedQuiz.maxOfAttempts ? (
                                                <div className="flex justify-center w-full">
                                                    <Button
                                                        size="md"
                                                        onClick={handleTakeQuiz}
                                                        disabled={selectedQuiz.status === 'CLOSED' || isUpcoming}
                                                        className="bg-[#1F4E79] hover:bg-[#2A6BA3] shadow-md disabled:opacity-50 disabled:grayscale transition-all rounded-lg px-16 py-1"
                                                    >
                                                        <span className="text-[15px] font-extrabold tracking-widest uppercase whitespace-nowrap">
                                                            {isUpcoming ? 'Not Started' : selectedQuiz.status === 'CLOSED' ? 'Closed' : 'START QUIZ'}
                                                        </span>
                                                    </Button>
                                                </div>
                                            ) : null
                                        }
                                    />
                                </div>
                            )}
                        </TabItem>
                        <TabItem title={`History (${attemptsHistory.length})`} active={activeTab === 1}>
                            <div className="pt-4">
                                <QuizAttemptHistoryCard
                                    attempts={attemptsHistory}
                                    quizDetail={quizDetail}
                                    onViewAttempt={(a) => setViewingAttempt(a)}
                                />
                            </div>
                        </TabItem>
                    </Tabs>
                </div>

                {showPasscodeModal && (
                    <PasscodeModal
                        show={showPasscodeModal}
                        onClose={() => setShowPasscodeModal(false)}
                        onConfirm={onPasscodeConfirm}
                    />
                )}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-black text-gray-900 dark:text-white border-l-8 border-[#1F4E79] pl-4">
                Available Quizzes
            </h2>
            <ClassroomQuizTable
                classroomQuizzes={classroomQuizzes}
                quizNameMap={quizNameMap}
                onViewDetail={handleViewDetail}
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                onTimerEnd={fetchQuizzes}
            />
        </div>
    );
}

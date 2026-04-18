"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Modal,
    ModalBody,
    Label,
    TextInput,
    Select,
    Spinner,
    Badge,
    Button,
} from "flowbite-react";
import {
    XMarkIcon,
    BookOpenIcon,
    InformationCircleIcon
} from "@heroicons/react/24/outline";
import { useQuiz } from "@/hooks/quiz/useQuiz";
import { useQuestion } from "@/hooks/question/useQuestion";
import { useToast } from "@/hooks/useToast";
import { toLocalDatetimeString } from "@/utils/datetime-utils";
import { ClassroomQuiz, CLASSROOM_QUIZ_STATUS, ClassroomQuizStatus, Quiz } from "@/types/quiz";
import type { Question } from "@/types/question";

interface QuizFormModalProps {
    show: boolean;
    onClose: () => void;
    editingQuiz: ClassroomQuiz | null;
    selectedQuizId: string | null;
    classId: string;
    userId: string;
    onSubmit: (data: {
        startTime: string;
        endTime: string;
        maxOfAttempts: number;
        passcode: string;
        status: ClassroomQuizStatus;
    }) => Promise<void>;
    actionLoading: boolean;
}

export function QuizFormModal({
    show,
    onClose,
    editingQuiz,
    selectedQuizId,
    onSubmit,
    actionLoading,
}: QuizFormModalProps) {
    const { getQuizById } = useQuiz();
    const { getQuestionById } = useQuestion();
    const { showError } = useToast();

    const [formData, setFormData] = useState({
        quizId: "",
        startTime: "",
        endTime: "",
        maxOfAttempts: 1,
        passcode: "",
        status: CLASSROOM_QUIZ_STATUS.DRAFT as ClassroomQuizStatus,
    });

    const [selectedQuizDuration, setSelectedQuizDuration] = useState(0);
    const [selectedQuizObj, setSelectedQuizObj] = useState<Quiz | null>(null);
    const [modalQuestions, setModalQuestions] = useState<Question[]>([]);
    const [loadingQuestions, setLoadingQuestions] = useState(false);

    const now = new Date();
    const isEditing = !!editingQuiz;
    const isDraft = editingQuiz?.status === CLASSROOM_QUIZ_STATUS.DRAFT;
    const isPublished = editingQuiz?.status === CLASSROOM_QUIZ_STATUS.PUBLISHED;
    const isOngoing = editingQuiz?.status === CLASSROOM_QUIZ_STATUS.ONGOING;
    const isClosed = editingQuiz?.status === CLASSROOM_QUIZ_STATUS.CLOSED;

    const fetchPreviewData = useCallback(async (quizId: string) => {
        setLoadingQuestions(true);
        setModalQuestions([]);
        setSelectedQuizObj(null);
        try {
            const quiz = await getQuizById(quizId);
            if (quiz) {
                setSelectedQuizDuration(quiz.duration);
                setSelectedQuizObj(quiz);
                if (quiz.questions && quiz.questions.length > 0) {
                    const questionPromises = quiz.questions
                        .sort((a, b) => a.displayOrder - b.displayOrder)
                        .map((q) => getQuestionById(q.questionId));
                    const results = await Promise.all(questionPromises);
                    setModalQuestions(results.filter((res) => res !== null) as Question[]);
                }
            }
        } catch (err) {
            console.error("Failed to fetch preview data:", err);
            showError("Failed to load quiz preview");
        } finally {
            setLoadingQuestions(false);
        }
    }, [getQuizById, getQuestionById, showError]);

    useEffect(() => {
        if (show) {
            if (editingQuiz) {
                setFormData({
                    quizId: editingQuiz.quizId,
                    startTime: toLocalDatetimeString(editingQuiz.startTime),
                    endTime: toLocalDatetimeString(editingQuiz.endTime),
                    maxOfAttempts: editingQuiz.maxOfAttempts,
                    passcode: editingQuiz.passcode || "",
                    status: editingQuiz.status,
                });
                fetchPreviewData(editingQuiz.quizId);
            } else if (selectedQuizId) {
                setFormData({
                    quizId: selectedQuizId,
                    startTime: "",
                    endTime: "",
                    maxOfAttempts: 1,
                    passcode: "",
                    status: CLASSROOM_QUIZ_STATUS.DRAFT,
                });
                fetchPreviewData(selectedQuizId);
            }
        }
    }, [show, editingQuiz, selectedQuizId, fetchPreviewData]);

    const handleSubmitLocal = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.startTime || !formData.endTime) {
            showError("Start time and end time are required");
            return;
        }

        const start = new Date(formData.startTime);
        const end = new Date(formData.endTime);
        const submissionNow = new Date();

        if (!isEditing || isDraft) {
            if (start.getTime() < submissionNow.getTime() - 300000) {
                showError("Start time cannot be in the past");
                return;
            }
        }

        if (end <= start) {
            showError("End time must be after start time");
            return;
        }

        if (selectedQuizDuration > 0) {
            const windowMinutes = (end.getTime() - start.getTime()) / (60 * 1000);
            if (windowMinutes < selectedQuizDuration) {
                showError(
                    `The time window (${Math.round(windowMinutes)} min) must be at least equal to the quiz duration (${selectedQuizDuration} min)`
                );
                return;
            }
        }

        if (isOngoing && end.getTime() < submissionNow.getTime() - 60000) {
            showError("When ongoing, you can only extend the time (New end time must be in future)");
            return;
        }

        await onSubmit(formData);
    };

    const getAvailableStatuses = () => {
        if (!editingQuiz) return [CLASSROOM_QUIZ_STATUS.DRAFT];

        switch (editingQuiz.status) {
            case CLASSROOM_QUIZ_STATUS.DRAFT:
                return [CLASSROOM_QUIZ_STATUS.DRAFT, CLASSROOM_QUIZ_STATUS.PUBLISHED, CLASSROOM_QUIZ_STATUS.ONGOING];
            case CLASSROOM_QUIZ_STATUS.PUBLISHED:
                return [CLASSROOM_QUIZ_STATUS.DRAFT, CLASSROOM_QUIZ_STATUS.PUBLISHED, CLASSROOM_QUIZ_STATUS.ONGOING];
            case CLASSROOM_QUIZ_STATUS.ONGOING:
                return [CLASSROOM_QUIZ_STATUS.ONGOING, CLASSROOM_QUIZ_STATUS.CLOSED];
            case CLASSROOM_QUIZ_STATUS.CLOSED:
                return [CLASSROOM_QUIZ_STATUS.CLOSED];
            default:
                return [editingQuiz.status];
        }
    };

    return (
        <Modal
            show={show}
            onClose={onClose}
            size="6xl"
        >
            <div className="flex items-center justify-between rounded-t border-b border-gray-200 p-4 dark:border-gray-600">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {editingQuiz ? "Edit Quiz Assignment" : "Assign Quiz to Classroom"}
                </h3>
                <button
                    type="button"
                    className="ml-auto inline-flex cursor-pointer items-center rounded-lg bg-transparent p-1.5 text-sm text-gray-400 hover:bg-gray-200 hover:text-gray-900 dark:hover:bg-gray-600 dark:hover:text-white"
                    onClick={onClose}
                >
                    <XMarkIcon className="h-5 w-5" />
                    <span className="sr-only">Close modal</span>
                </button>
            </div>
            <form
                onSubmit={handleSubmitLocal}
                className="flex min-h-0 flex-1 flex-col overflow-hidden"
            >
                <ModalBody className="p-0 overflow-hidden flex flex-col">
                    <div className="grid h-[75vh] min-h-[500px] min-w-0 grid-cols-1 lg:grid-cols-2 overflow-hidden border-b border-gray-200 dark:border-gray-700">
                        <div className="flex flex-col min-h-0 border-b border-gray-200 bg-gray-50/30 p-6 dark:border-gray-700 dark:bg-gray-800/50 lg:border-r lg:border-b-0 overflow-hidden">
                            <h4 className="mb-4 flex items-center gap-2 border-b border-gray-200 pb-3 text-lg font-bold text-gray-900 dark:border-gray-700 dark:text-white">
                                <BookOpenIcon className="h-6 w-6 text-[#1F4E79] dark:text-[#C9A24D]" />
                                Quiz Questions Preview
                            </h4>

                            {loadingQuestions ? (
                                <div className="flex h-40 items-center justify-center">
                                    <Spinner size="lg" />
                                </div>
                            ) : (
                                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                                    <div className="space-y-6">
                                        {modalQuestions.map((q, idx) => (
                                            <div key={q.id} className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                                                <div className="mb-3 flex items-center justify-between border-b border-gray-50 pb-2 dark:border-gray-700">
                                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Question {idx + 1}</span>
                                                    <Badge color="info" size="xs">{q.type}</Badge>
                                                </div>
                                                <div
                                                    className="prose prose-sm mb-4 max-w-none font-medium text-gray-800 dark:prose-invert dark:text-gray-200"
                                                    dangerouslySetInnerHTML={{ __html: q.content }}
                                                />

                                                {q.answerOptions && q.answerOptions.length > 0 && (
                                                    <div className="space-y-2">
                                                        {q.answerOptions.map((opt) => (
                                                            <div
                                                                key={opt.id}
                                                                className={`rounded-md border p-3 text-sm transition-all ${opt.isCorrect
                                                                    ? "border-green-200 bg-green-50 text-green-700 dark:border-green-900/40 dark:bg-green-900/20 dark:text-green-300"
                                                                    : "border-gray-100 bg-gray-50/50 text-gray-600 dark:border-gray-700 dark:bg-gray-800/30 dark:text-gray-400"
                                                                    }`}
                                                            >
                                                                {opt.content}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {q.type === "ESSAY" && q.textAnswer && (
                                                    <div className="mt-2 space-y-1">
                                                        <span className="text-[10px] font-bold uppercase tracking-wider text-green-600 dark:text-green-400">Answer:</span>
                                                        <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700 dark:border-green-900/40 dark:bg-green-900/20 dark:text-green-300">
                                                            {q.textAnswer}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                        {modalQuestions.length === 0 && !loadingQuestions && (
                                            <p className="py-10 text-center text-gray-500 dark:text-gray-400 font-medium">No preview available for this quiz.</p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col h-full overflow-hidden">
                            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                                {selectedQuizObj && (
                                    <div className="mb-8 space-y-4 border-b border-gray-100 pb-8 dark:border-gray-700">
                                        <h4 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                            Quiz Information
                                        </h4>
                                        <div className="space-y-4">
                                            <div>
                                                <Label>Quiz Title</Label>
                                                <TextInput
                                                    value={selectedQuizObj.title}
                                                    disabled
                                                    className="mt-1"
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <Label>Duration (Min)</Label>
                                                    <TextInput
                                                        value={selectedQuizObj.duration}
                                                        disabled
                                                        className="mt-1"
                                                    />
                                                </div>
                                                <div>
                                                    <Label>Total Questions</Label>
                                                    <TextInput
                                                        value={selectedQuizObj.totalQuestions}
                                                        disabled
                                                        className="mt-1"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <h4 className="mb-6 border-b border-gray-200 pb-3 text-lg font-bold text-gray-900 dark:border-gray-700 dark:text-white flex items-center gap-2">
                                    Assignment Settings
                                </h4>

                                <div className="space-y-5">
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <div>
                                            <Label htmlFor="startTime">Start Time</Label>
                                            <TextInput
                                                id="startTime"
                                                type="datetime-local"
                                                value={formData.startTime}
                                                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                                required
                                                className="mt-1"
                                                disabled={isEditing && !isDraft && (isOngoing || isClosed)}
                                            />
                                            {isEditing && (isOngoing || isClosed) && (
                                                <p className="mt-1 text-[10px] text-orange-500">StartTime cannot be changed once the quiz starts or ends.</p>
                                            )}
                                        </div>
                                        <div>
                                            <Label htmlFor="endTime">End Time</Label>
                                            <TextInput
                                                id="endTime"
                                                type="datetime-local"
                                                value={formData.endTime}
                                                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                                                required
                                                className="mt-1"
                                                disabled={isEditing && isOngoing && false}
                                            />
                                            {isOngoing && <p className="mt-1 text-[10px] text-blue-500">Please extend the end time if you wish to delay the closing.</p>}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <div>
                                            <Label htmlFor="maxAttempts">Max Attempts</Label>
                                            <TextInput
                                                id="maxAttempts"
                                                type="number"
                                                min={1}
                                                value={formData.maxOfAttempts}
                                                onChange={(e) => setFormData({ ...formData, maxOfAttempts: parseInt(e.target.value) || 1 })}
                                                required
                                                className="mt-1"
                                                disabled={isEditing && isClosed}
                                            />
                                        </div>
                                        {isEditing && (
                                            <div>
                                                <Label htmlFor="status">Assignment Status</Label>
                                                <Select
                                                    id="status"
                                                    value={formData.status}
                                                    onChange={(e) => setFormData({ ...formData, status: e.target.value as ClassroomQuizStatus })}
                                                    required
                                                    className="mt-1"
                                                    disabled={isClosed}
                                                >
                                                    {getAvailableStatuses().map((s) => (
                                                        <option key={s} value={s}>{s}</option>
                                                    ))}
                                                </Select>
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <Label htmlFor="passcode">Passcode (Optional)</Label>
                                        <TextInput
                                            id="passcode"
                                            placeholder="Enter a passcode to restrict access"
                                            value={formData.passcode}
                                            onChange={(e) => setFormData({ ...formData, passcode: e.target.value })}
                                            maxLength={50}
                                            className="mt-1"
                                            disabled={isClosed}
                                        />
                                        <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-500">
                                            <InformationCircleIcon className="h-4 w-4" />
                                            Students must enter this to start the quiz. Max 50 characters.
                                        </p>
                                    </div>

                                    {formData.status === CLASSROOM_QUIZ_STATUS.DRAFT && (
                                        <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
                                            <div className="flex items-center gap-2 font-bold">
                                                <InformationCircleIcon className="h-5 w-5" />
                                                Draft Mode
                                            </div>
                                            <p className="mt-1 ml-7">Lecturers can preview content, but students will not see this assignment.</p>
                                        </div>
                                    )}

                                    {isOngoing && (
                                        <div className="rounded-lg bg-green-50 p-4 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-300">
                                            <div className="flex items-center gap-2 font-bold">
                                                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                                Quiz is Ongoing
                                            </div>
                                            <p className="mt-1 ml-7">Quiz is active. You can only extend the end time, change the passcode, or increase the number of attempts.</p>
                                        </div>
                                    )}

                                    {isClosed && (
                                        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">
                                            <div className="flex items-center gap-2 font-bold">
                                                <InformationCircleIcon className="h-5 w-5" />
                                                Quiz is Closed
                                            </div>
                                            <p className="mt-1 ml-7">The quiz has ended. To reopen, please increase the <strong>End Time</strong> to a future date.</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="mt-auto flex items-center justify-end gap-3 border-t border-gray-200 bg-gray-50/50 p-4 dark:border-gray-600 dark:bg-gray-800/50 sticky bottom-0">
                                <Button color="gray" onClick={onClose} disabled={actionLoading} className="cursor-pointer">
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    className="bg-[#1F4E79] hover:bg-[#2A6BA3] cursor-pointer"
                                    disabled={actionLoading}
                                >
                                    {actionLoading ? (
                                        <Spinner size="sm" className="mr-2" />
                                    ) : null}
                                    {editingQuiz ? "Update" : "Assign"}
                                </Button>
                            </div>
                        </div>
                    </div>
                </ModalBody>
            </form>
        </Modal>
    );
}

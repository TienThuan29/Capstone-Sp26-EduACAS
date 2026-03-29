"use client";

import {
    Modal,
    ModalHeader,
    ModalBody,
    Button,
    Spinner,
} from "flowbite-react";
import { ExclamationTriangleIcon, TrashIcon } from "@heroicons/react/24/outline";
import type { ClassroomQuiz } from "@/types/quiz";

interface DeleteQuizModalProps {
    show: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void>;
    quizToDelete: ClassroomQuiz | null;
    quizTitle: string;
    actionLoading: boolean;
}

export function DeleteQuizModal({
    show,
    onClose,
    onConfirm,
    quizToDelete,
    quizTitle,
    actionLoading,
}: DeleteQuizModalProps) {
    if (!quizToDelete) return null;

    return (
        <Modal
            show={show}
            onClose={onClose}
            size="md"
            popup
        >
            <ModalHeader />
            <ModalBody>
                <div className="text-center p-4">
                    <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-500">
                        <ExclamationTriangleIcon className="h-10 w-10" />
                    </div>

                    <h3 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">
                        Remove Quiz
                    </h3>

                    <p className="mb-6 text-gray-500 dark:text-gray-400">
                        Are you sure you want to remove <span className="font-semibold text-gray-900 dark:text-white">"{quizTitle}"</span> from this classroom?
                    </p>

                    <div className="mb-8 rounded-lg bg-gray-50 p-3 text-xs text-gray-500 dark:bg-gray-800/50 dark:text-gray-400">
                        <p className="flex items-center justify-center gap-1">
                            <TrashIcon className="h-3 w-3" />
                            This will only remove the assignment. The actual quiz remains in your Quiz Bank.
                        </p>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                        <Button
                            color="failure"
                            onClick={onConfirm}
                            disabled={actionLoading}
                            className="bg-red-600 hover:bg-red-700 dark:bg-red-600 cursor-pointer"
                        >
                            {actionLoading ? (
                                <Spinner size="sm" className="mr-2" />
                            ) : null}
                            Delete
                        </Button>
                        <Button
                            color="gray"
                            onClick={onClose}
                            disabled={actionLoading}
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

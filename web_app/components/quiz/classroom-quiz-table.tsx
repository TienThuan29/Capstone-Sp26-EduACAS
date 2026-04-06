import React from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeadCell,
    TableRow,
    Badge,
    Pagination,
} from "flowbite-react";
import {
    ClipboardDocumentListIcon,
} from "@heroicons/react/24/outline";
import { ClassroomQuiz, ClassroomQuizStatus } from "@/types/quiz";
import { formatDate } from "@/utils/datetime-utils";
import { CountdownTimer } from "@/components/quiz/shared-quiz-overview";

export const STATUS_COLOR: Record<ClassroomQuizStatus, string> = {
    DRAFT: "warning",
    PUBLISHED: "success",
    CLOSED: "failure",
};

interface ClassroomQuizTableProps {
    classroomQuizzes: ClassroomQuiz[];
    quizNameMap: Record<string, string>;
    onViewDetail: (cq: ClassroomQuiz) => void;
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    onTimerEnd?: () => void;
}

export function ClassroomQuizTable({
    classroomQuizzes,
    quizNameMap,
    onViewDetail,
    currentPage,
    totalPages,
    onPageChange,
    onTimerEnd,
}: ClassroomQuizTableProps) {
    if (classroomQuizzes.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 py-16 dark:border-gray-600 dark:bg-gray-800">
                <ClipboardDocumentListIcon className="mb-4 h-16 w-16 text-gray-400" />
                <h3 className="mb-2 text-lg font-semibold text-gray-700 dark:text-gray-300">
                    No quizzes found
                </h3>
                <p className="text-sm text-gray-500">
                    Please check back later or assign a new quiz.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="overflow-x-auto border border-gray-200 bg-white shadow last:rounded-b-lg dark:border-gray-700 dark:bg-gray-800">
                <Table hoverable>
                    <TableHead>
                        <TableRow>
                            <TableHeadCell>Quiz Name</TableHeadCell>
                            <TableHeadCell className="text-center">Status</TableHeadCell>
                            <TableHeadCell className="text-center">Start Time</TableHeadCell>
                            <TableHeadCell className="text-center">End Time</TableHeadCell>
                            <TableHeadCell className="text-center">Attempts</TableHeadCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {classroomQuizzes.map((cq) => (
                            <TableRow
                                key={cq.id}
                                className="cursor-pointer"
                                onClick={() => onViewDetail(cq)}
                            >
                                <TableCell className="whitespace-nowrap font-medium text-gray-900 dark:text-white">
                                    {quizNameMap[cq.quizId] ?? "Loading..."}
                                </TableCell>
                                <TableCell className="text-center">
                                    <div className="flex flex-col items-center gap-1">
                                        <Badge color={STATUS_COLOR[cq.status] ?? "warning"}>
                                            {cq.status}
                                        </Badge>
                                        
                                        {cq.status === 'PUBLISHED' && (
                                            <div className="text-[10px] font-medium text-gray-400 whitespace-nowrap tabular-nums">
                                                {new Date(cq.startTime) > new Date() ? (
                                                    <span className="flex items-center gap-1">
                                                        <CountdownTimer targetDate={cq.startTime} onEnd={onTimerEnd} />
                                                    </span>
                                                ) : new Date(cq.endTime) > new Date() ? (
                                                    <span className="flex items-center gap-1">
                                                        <CountdownTimer targetDate={cq.endTime} onEnd={onTimerEnd} />
                                                    </span>
                                                ) : null}
                                            </div>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="whitespace-nowrap text-center text-gray-600 dark:text-gray-400">
                                    {formatDate(cq.startTime)}
                                </TableCell>
                                <TableCell className="whitespace-nowrap text-center text-gray-600 dark:text-gray-400">
                                    {formatDate(cq.endTime)}
                                </TableCell>
                                <TableCell className="text-center text-gray-600 dark:text-gray-400">
                                    {cq.maxOfAttempts}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
            {totalPages > 1 && (
                <div className="flex justify-center mt-4">
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={onPageChange}
                        showIcons
                    />
                </div>
            )}
        </div>
    );
}

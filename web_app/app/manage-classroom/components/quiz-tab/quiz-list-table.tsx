"use client";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeadCell,
    TableRow,
    Badge,
    Tooltip,
    Button,
} from "flowbite-react";
import {
    EyeIcon,
} from "@heroicons/react/24/outline";
import { ClassroomQuiz, ClassroomQuizStatus } from "@/types/quiz";
import { formatDate } from "@/utils/datetime-utils";

const STATUS_LABELS: Record<ClassroomQuizStatus, string> = {
    [ClassroomQuizStatus.DRAFT]: "DRAFT",
    [ClassroomQuizStatus.PUBLISHED]: "PUBLISHED",
    [ClassroomQuizStatus.CLOSED]: "CLOSED",
};

const STATUS_COLOR: Record<ClassroomQuizStatus, string> = {
    [ClassroomQuizStatus.DRAFT]: "warning",
    [ClassroomQuizStatus.PUBLISHED]: "success",
    [ClassroomQuizStatus.CLOSED]: "failure",
};

interface QuizListTableProps {
    classroomQuizzes: ClassroomQuiz[];
    quizNameMap: Record<string, string>;
    onViewDetail: (cq: ClassroomQuiz) => void;
}

export function QuizListTable({
    classroomQuizzes,
    quizNameMap,
    onViewDetail,
}: QuizListTableProps) {
    return (
        <div className="overflow-x-auto border-gray-200 bg-white shadow dark:border-gray-700 dark:bg-gray-800">
            <Table hoverable>
                <TableHead>
                    <TableRow>
                        <TableHeadCell>Quiz Title</TableHeadCell>
                        <TableHeadCell>Status</TableHeadCell>
                        <TableHeadCell>Start Time</TableHeadCell>
                        <TableHeadCell>End Time</TableHeadCell>
                        <TableHeadCell>Max Attempts</TableHeadCell>
                        <TableHeadCell>
                            <span className="sr-only">Actions</span>
                        </TableHeadCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {classroomQuizzes.map((cq) => {
                        const statusLabel =
                            (STATUS_LABELS[cq.status] as string) ?? "DRAFT";
                        return (
                            <TableRow
                                key={cq.id}
                                className="cursor-pointer"
                                onClick={() => onViewDetail(cq)}
                            >
                                <TableCell className="whitespace-nowrap font-medium text-gray-900 dark:text-white">
                                    {quizNameMap[cq.quizId] ?? cq.quizId}
                                </TableCell>
                                <TableCell>
                                    <Badge color={STATUS_COLOR[cq.status] ?? "warning"}>
                                        {statusLabel}
                                    </Badge>
                                </TableCell>
                                <TableCell className="whitespace-nowrap text-gray-600 dark:text-gray-400">
                                    {formatDate(cq.startTime)}
                                </TableCell>
                                <TableCell className="whitespace-nowrap text-gray-600 dark:text-gray-400">
                                    {formatDate(cq.endTime)}
                                </TableCell>
                                <TableCell>{cq.maxOfAttempts}</TableCell>
                                <TableCell>
                                    <div
                                        className="flex items-center gap-2"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <Tooltip content="View detail" placement="top">
                                            <Button
                                                size="xs"
                                                color="light"
                                                onClick={() => onViewDetail(cq)}
                                                className="cursor-pointer"
                                            >
                                                <EyeIcon className="h-4 w-4" />
                                            </Button>
                                        </Tooltip>
                                    </div>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
}

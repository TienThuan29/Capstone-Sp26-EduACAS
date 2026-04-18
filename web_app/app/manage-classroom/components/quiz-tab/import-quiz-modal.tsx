"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
    Modal,
    ModalBody,
    TextInput,
    Select,
    Spinner,
    Badge,
    Button,
} from "flowbite-react";
import {
    XMarkIcon,
    MagnifyingGlassIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { useQuiz } from "@/hooks/quiz/useQuiz";
import { useSubject } from "@/hooks/subject/useSubject";
import { useToast } from "@/hooks/useToast";
import type { Quiz } from "@/types/quiz";
import type { Subject } from "@/types/subject";

const IMPORT_PAGE_SIZE = 8;

interface ImportQuizModalProps {
    show: boolean;
    onClose: () => void;
    onSelect: (quizId: string) => void;
}

export function ImportQuizModal({
    show,
    onClose,
    onSelect,
}: ImportQuizModalProps) {
    const { getQuizzesPaged } = useQuiz();
    const { getActiveSubjects } = useSubject();
    const { showError } = useToast();

    const [importSearch, setImportSearch] = useState("");
    const [importSubjectFilter, setImportSubjectFilter] = useState("ALL");
    const [importPage, setImportPage] = useState(1);
    const [importTotalPages, setImportTotalPages] = useState(0);
    const [importTotalCount, setImportTotalCount] = useState(0);
    const [importQuizzes, setImportQuizzes] = useState<Quiz[]>([]);
    const [importLoading, setImportLoading] = useState(false);
    
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [subjectMap, setSubjectMap] = useState<Record<string, Subject>>({});
    const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const loadSubjects = useCallback(async () => {
        try {
            const list = await getActiveSubjects();
            setSubjects(list);
            const map: Record<string, Subject> = {};
            list.forEach((s: Subject) => {
                map[s.id] = s;
            });
            setSubjectMap(map);
        } catch (err) {
            console.error("Failed to load subjects:", err);
        }
    }, [getActiveSubjects]);

    const fetchImportQuizzes = useCallback(
        async (page: number, search: string, subjectId: string) => {
            try {
                setImportLoading(true);
                const result = await getQuizzesPaged(
                    page,
                    IMPORT_PAGE_SIZE,
                    false,
                    search || undefined,
                    subjectId !== "ALL" ? subjectId : undefined
                );
                setImportQuizzes(result.items);
                setImportTotalPages(result.totalPages);
                setImportTotalCount(result.totalCount);
                setImportPage(result.pageIndex);
            } catch {
                showError("Failed to load quiz bank");
            } finally {
                setImportLoading(false);
            }
        },
        [getQuizzesPaged, showError]
    );

    useEffect(() => {
        if (show) {
            loadSubjects();
            fetchImportQuizzes(1, "", "ALL");
            setImportSearch("");
            setImportSubjectFilter("ALL");
            setImportPage(1);
        }
    }, [show, loadSubjects, fetchImportQuizzes]);

    const handleSearchChange = (value: string) => {
        setImportSearch(value);
        if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
        searchDebounceRef.current = setTimeout(() => {
            setImportPage(1);
            fetchImportQuizzes(1, value, importSubjectFilter);
        }, 400);
    };

    const handleSubjectChange = (value: string) => {
        setImportSubjectFilter(value);
        setImportPage(1);
        fetchImportQuizzes(1, importSearch, value);
    };

    const handlePageChange = (newPage: number) => {
        setImportPage(newPage);
        fetchImportQuizzes(newPage, importSearch, importSubjectFilter);
    };

    return (
        <Modal show={show} onClose={onClose} size="xl">
            <div className="flex items-center justify-between rounded-t border-b border-gray-200 p-4 dark:border-gray-600">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Import Quiz from Quiz Bank
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
            <ModalBody>
                <div className="space-y-4">
                    <div className="flex flex-col gap-3 sm:flex-row">
                        <div className="relative flex-1">
                            <MagnifyingGlassIcon className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-gray-400" />
                            <TextInput
                                placeholder="Search quizzes by title..."
                                value={importSearch}
                                onChange={(e) => handleSearchChange(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Select
                            value={importSubjectFilter}
                            onChange={(e) => handleSubjectChange(e.target.value)}
                            className="sm:w-56"
                        >
                            <option value="ALL">All Subjects</option>
                            {subjects.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.subjectCode} - {s.subjectName}
                                </option>
                            ))}
                        </Select>
                    </div>

                    {importLoading ? (
                        <div className="flex justify-center py-12">
                            <Spinner size="lg" />
                        </div>
                    ) : importQuizzes.length === 0 ? (
                        <p className="py-8 text-center text-gray-500 dark:text-gray-400">
                            No quizzes found.
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {importQuizzes.map((q) => {
                                const sub = subjectMap[q.subjectId];
                                return (
                                    <button
                                        key={q.id}
                                        className="flex w-full cursor-pointer items-center justify-between rounded-lg border border-gray-200 p-4 text-left transition-all hover:border-[#1F4E79] hover:bg-[#1F4E79]/5 dark:border-gray-600 dark:hover:border-[#C9A24D] dark:hover:bg-[#C9A24D]/5"
                                        onClick={() => onSelect(q.id)}
                                    >
                                        <div className="min-w-0 flex-1">
                                            <h4 className="font-semibold text-gray-900 dark:text-white">
                                                {q.title}
                                            </h4>
                                            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                                {sub && (
                                                    <Badge color="purple" className="text-[10px]">
                                                        {sub.subjectCode}
                                                    </Badge>
                                                )}
                                                <span>{q.totalQuestions} questions</span>
                                                <span>·</span>
                                                <span>{q.duration} min</span>
                                            </div>
                                        </div>
                                        <Badge color="info" className="ml-3 shrink-0">
                                            Select
                                        </Badge>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {importTotalPages > 1 && (
                        <div className="flex items-center justify-between border-t border-gray-100 pt-3 dark:border-gray-700">
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                Showing page {importPage} of {importTotalPages} ({importTotalCount} quizzes)
                            </p>
                            <div className="flex items-center gap-1">
                                <Button
                                    size="xs"
                                    color="gray"
                                    disabled={importPage <= 1 || importLoading}
                                    onClick={() => handlePageChange(importPage - 1)}
                                    className="cursor-pointer"
                                >
                                    <ChevronLeftIcon className="h-4 w-4" />
                                </Button>
                                {Array.from({ length: Math.min(5, importTotalPages) }, (_, i) => {
                                    let page: number;
                                    if (importTotalPages <= 5) {
                                        page = i + 1;
                                    } else if (importPage <= 3) {
                                        page = i + 1;
                                    } else if (importPage >= importTotalPages - 2) {
                                        page = importTotalPages - 4 + i;
                                    } else {
                                        page = importPage - 2 + i;
                                    }
                                    return (
                                        <Button
                                            key={page}
                                            size="xs"
                                            color={page === importPage ? "dark" : "gray"}
                                            onClick={() => handlePageChange(page)}
                                            disabled={importLoading}
                                            className={`cursor-pointer ${page === importPage
                                                ? "bg-[#1F4E79] text-white"
                                                : ""
                                                }`}
                                        >
                                            {page}
                                        </Button>
                                    );
                                })}
                                <Button
                                    size="xs"
                                    color="gray"
                                    disabled={importPage >= importTotalPages || importLoading}
                                    onClick={() => handlePageChange(importPage + 1)}
                                    className="cursor-pointer"
                                >
                                    <ChevronRightIcon className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </ModalBody>
        </Modal>
    );
}

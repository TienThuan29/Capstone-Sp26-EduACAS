"use client";

import React from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";

interface CustomPaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

export function CustomPagination({
    currentPage,
    totalPages,
    onPageChange,
}: CustomPaginationProps) {
    // Logic to determine which page numbers to show
    const getPageNumbers = () => {
        const pages = [];
        const maxVisiblePages = 5;

        if (totalPages <= maxVisiblePages) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            if (currentPage <= 3) {
                pages.push(1, 2, 3, 4, "...", totalPages);
            } else if (currentPage >= totalPages - 2) {
                pages.push(1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
            } else {
                pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
            }
        }
        return pages;
    };

    // Do not render if there's only 1 page (or 0)
    if (totalPages <= 1) return null;

    return (
        <div className="flex items-center justify-center gap-2 py-4">
            {/* Previous Button */}
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="group flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-[#1F4E79] hover:bg-[#1F4E79] hover:text-white hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:bg-white disabled:hover:text-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-[#C9A24D] dark:hover:border-[#C9A24D]"
                aria-label="Previous Page"
            >
                <ChevronLeftIcon className="h-5 w-5" />
            </button>

            {/* Page Numbers */}
            <div className="flex items-center gap-2 rounded-xl bg-gray-50 p-1 dark:bg-gray-800/50">
                {getPageNumbers().map((page, index) => (
                    <React.Fragment key={index}>
                        {typeof page === "number" ? (
                            <button
                                onClick={() => onPageChange(page)}
                                className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold transition-all duration-300 ${currentPage === page
                                        ? "bg-gradient-to-br from-[#1F4E79] to-[#163A5C] text-white shadow-lg shadow-blue-900/20 scale-105 dark:from-[#C9A24D] dark:to-[#B08D43]"
                                        : "bg-transparent text-gray-600 hover:bg-white hover:text-[#1F4E79] hover:shadow-sm dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-[#C9A24D]"
                                    }`}
                            >
                                {page}
                            </button>
                        ) : (
                            <span className="flex h-9 w-9 items-center justify-center text-gray-400 dark:text-gray-600 pb-2 bg-transparent text-lg">
                                ...
                            </span>
                        )}
                    </React.Fragment>
                ))}
            </div>

            {/* Next Button */}
            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="group flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-[#1F4E79] hover:bg-[#1F4E79] hover:text-white hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:bg-white disabled:hover:text-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-[#C9A24D] dark:hover:border-[#C9A24D]"
                aria-label="Next Page"
            >
                <ChevronRightIcon className="h-5 w-5" />
            </button>
        </div>
    );
}

"use client";

import { useState } from "react";
import type { TestCaseResponse } from "@/types/problem";
import { Badge } from "flowbite-react";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";

export function TestCaseCard({
  tc,
  index,
  isDark,
}: {
  tc: TestCaseResponse;
  index: number;
  isDark: boolean;
}) {
  const [optionsExpanded, setOptionsExpanded] = useState(false);

  const attrs: { label: string; value: string | number | boolean }[] = [
    { label: "Public", value: tc.isPublic },
    { label: "Case insensitive", value: tc.isCaseInsensitive },
    { label: "Floating point", value: tc.isFloatingPoint },
    {
      label: "Floating point tolerance",
      value:
        tc.floatingPointTolerance != null ? tc.floatingPointTolerance : "—",
    },
    {
      label: "Decimal places",
      value: tc.decimalPlaces != null ? tc.decimalPlaces : "—",
    },
    { label: "Token comparison", value: tc.isTokenComparision },
    { label: "Not ordered comparison", value: tc.isNotOrderedComparision },
  ];

  return (
    <div
      className={`group relative overflow-hidden rounded-sm border transition-all hover:border-blue-400 ${
        isDark ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"
      }`}
    >
      {/* Header of Test Case Card */}
      <div
        className={`flex items-center justify-between border-b px-4 py-3 ${isDark ? "border-gray-700 bg-gray-900/50" : "border-gray-100 bg-gray-50/50"}`}
      >
        <div className="flex items-center gap-2">
          <span
            className={`flex h-6 w-6 items-center justify-center rounded-sm text-xs font-bold ${isDark ? "bg-gray-700 text-gray-300" : "bg-gray-200 text-gray-700"}`}
          >
            {index + 1}
          </span>
          <span
            className={`text-sm font-medium ${isDark ? "text-gray-200" : "text-gray-700"}`}
          >
            Test Case
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {tc.isPublic && (
            <Badge color="success" size="xs">
              Public
            </Badge>
          )}
          {tc.isCaseInsensitive && (
            <Badge color="gray" size="xs">
              Aa≈aa
            </Badge>
          )}
          {tc.isFloatingPoint && (
            <Badge color="indigo" size="xs">
              Float
            </Badge>
          )}
          {tc.isTokenComparision && (
            <Badge color="purple" size="xs">
              Token
            </Badge>
          )}
          {tc.isNotOrderedComparision && (
            <Badge color="yellow" size="xs">
              Unordered
            </Badge>
          )}
        </div>
      </div>

      {/* Input / Expected Output */}
      <div className="grid gap-4 p-4 text-sm sm:grid-cols-2">
        <div className="space-y-1.5">
          <span className="text-xs font-semibold tracking-wider text-gray-500 uppercase">
            Input
          </span>
          <div
            className={`relative max-h-32 overflow-y-auto rounded-sm border p-3 font-mono text-xs leading-relaxed ${isDark ? "border-gray-700 bg-gray-900 text-gray-300" : "border-gray-100 bg-gray-50 text-gray-700"}`}
          >
            {tc.inputData || (
              <span className="text-gray-400 italic">Empty</span>
            )}
          </div>
        </div>
        <div className="space-y-1.5">
          <span className="text-xs font-semibold tracking-wider text-gray-500 uppercase">
            Expected Output
          </span>
          <div
            className={`relative max-h-32 overflow-y-auto rounded-sm border p-3 font-mono text-xs leading-relaxed ${isDark ? "border-gray-700 bg-gray-900 text-gray-300" : "border-gray-100 bg-gray-50 text-gray-700"}`}
          >
            {tc.expectedOutput || (
              <span className="text-gray-400 italic">Empty</span>
            )}
          </div>
        </div>
      </div>

      {/* Options (collapsible) */}
      <div
        className={`border-t ${isDark ? "border-gray-700 bg-gray-900/30" : "border-gray-100 bg-gray-50/50"}`}
      >
        <button
          type="button"
          onClick={() => setOptionsExpanded((prev) => !prev)}
          className={`flex w-full items-center justify-between gap-2 px-4 py-3 text-left transition-colors hover:opacity-80 ${isDark ? "text-gray-300" : "text-gray-700"}`}
          aria-expanded={optionsExpanded}
        >
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Options
          </span>
          {optionsExpanded ? (
            <ChevronUpIcon className="h-4 w-4 shrink-0 text-gray-500" aria-hidden />
          ) : (
            <ChevronDownIcon className="h-4 w-4 shrink-0 text-gray-500" aria-hidden />
          )}
        </button>
        {optionsExpanded && (
          <div className={`space-y-2 border-t px-4 py-3 text-xs ${isDark ? "border-gray-700 text-gray-400" : "border-gray-200 text-gray-600"}`}>
            {attrs.map(({ label, value }) => (
              <div key={label} className="flex flex-wrap gap-1">
                <span className="font-medium text-gray-500">{label}:</span>
                <span>
                  {typeof value === "boolean" ? (value ? "Yes" : "No") : value}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

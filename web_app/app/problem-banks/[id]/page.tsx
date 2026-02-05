"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useThemeContext } from "@/components/theme-provider";
import { Button, Label, Spinner, Badge } from "flowbite-react";
import { ArrowLeftIcon, PencilIcon } from "@heroicons/react/24/outline";
import { useToast } from "@/hooks/useToast";
import { useProblem } from "@/hooks/problem/useProblem";
import { usePrivateS3 } from "@/hooks/s3/usePrivateS3";
import { PageUrl } from "@/configs/page.url";
import type { Difficulty } from "@/types/problem";
import { normalizeDifficulty } from "@/types/problem";
import type { ProblemResponse } from "@/types/problem";

const difficultyBadgeColor: Record<
  Difficulty,
  "success" | "warning" | "failure"
> = {
  EASY: "success",
  MEDIUM: "warning",
  HARD: "failure",
};

export default function ProblemViewPage() {
  const params = useParams();
  const { isDark } = useThemeContext();
  const toast = useToast();
  const { getProblemById } = useProblem();
  const { getFileUrl } = usePrivateS3();

  const id = typeof params.id === "string" ? params.id : "";
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [problem, setProblem] = useState<ProblemResponse | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoading(true);
      setProblem(null);
      setPdfUrl(null);
      try {
        const data = await getProblemById(id);
        if (data) {
          setProblem(data);
          if (data.fileUrl) {
            setPdfUrl(data.fileUrl);
          } else if (data.fileName) {
            setPdfLoading(true);
            try {
              const url = await getFileUrl(data.fileName);
              setPdfUrl(url);
            } catch {
              toast.showError("Could not load file preview");
            } finally {
              setPdfLoading(false);
            }
          }
        } else {
          toast.showError("Problem not found");
        }
      } catch (error: unknown) {
        const err = error as { response?: { data?: { message?: string } } };
        toast.showError(
          err.response?.data?.message ?? "Failed to load problem",
        );
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, getProblemById, getFileUrl, toast]);

  if (!mounted) return null;

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center p-8">
        <Spinner size="xl" />
        <span className={`ml-3 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
          Loading...
        </span>
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="p-8">
        <Button as={Link} href={PageUrl.QUESTION_BANKS_PAGE} color="light">
          <ArrowLeftIcon className="mr-2 h-5 w-5" />
          Back to problem banks
        </Button>
        <p className={`mt-4 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
          Problem not found.
        </p>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header Section */}
      <div className="mb-8 flex flex-wrap items-center gap-4">
        <Button as={Link} href={PageUrl.QUESTION_BANKS_PAGE} color="light">
          <ArrowLeftIcon className="mr-2 h-5 w-5" />
          Back
        </Button>
        <Button
          as={Link}
          href={PageUrl.PROBLEM_BANKS_EDIT_PAGE(id)} // 
          color="purple"
          className="bg-[#1F4E79] hover:bg-[#1F4E79]/90"
        >
          <PencilIcon className="mr-2 h-5 w-5" />
          Edit
        </Button>
      </div>

      {/* Main Content: Split Layout */}
      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-3">
        {/* LEFT COLUMN: Attributes & Test Cases */}
        <div className="space-y-6 lg:col-span-1">
          <section
            className={`border p-6 ${isDark ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"}`}
          >
            <div className="min-w-0 flex-1">
              <h1
                className={`text-3xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}
              >
                {problem.title}
              </h1>
              {/* <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge color={difficultyBadgeColor[difficulty]}>
                  {difficulty}
                </Badge>
                {problem.fileName && (
                  <span
                    className={`font-mono text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
                  >
                    File: {problem.fileName}
                  </span>
                )}
              </div> */}
            </div>
            <Label className={isDark ? "text-white" : "text-gray-900"}>
              Content
            </Label>
            <div
              className={`mt-2 rounded border p-4 whitespace-pre-wrap ${isDark ? "border-gray-600 bg-gray-900 text-gray-300" : "border-gray-200 bg-gray-50 text-gray-800"}`}
            >
              {problem.content || "—"}
            </div>

            {problem.codeTemplate && (
              <div className="mt-6">
                <Label className={isDark ? "text-white" : "text-gray-900"}>
                  Code template
                </Label>
                <pre
                  className={`mt-2 overflow-x-auto rounded border p-4 font-mono text-sm ${isDark ? "border-gray-600 bg-gray-900 text-gray-300" : "border-gray-200 bg-gray-50 text-gray-800"}`}
                >
                  {problem.codeTemplate}
                </pre>
              </div>
            )}
          </section>

          {problem.testCases && problem.testCases.length > 0 ? (
            <section
              className={`border p-6 ${isDark ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"}`}
            >
              <Label className={isDark ? "text-white" : "text-gray-900"}>
                Test cases ({problem.testCases.length})
              </Label>
              <div className="mt-4 space-y-4">
                {problem.testCases.map((tc, index) => (
                  <div
                    key={tc.id}
                    className={`rounded border p-4 ${isDark ? "border-gray-600 bg-gray-900" : "border-gray-200 bg-gray-50"}`}
                  >
                    <div
                      className={`mb-2 flex items-center justify-between text-sm font-bold ${isDark ? "text-gray-300" : "text-gray-700"}`}
                    >
                      <span>Test case {index + 1}</span>
                      {tc.isPublic && <Badge color="info">Public</Badge>}
                    </div>
                    <div className="grid gap-3 text-sm">
                      <div>
                        <span className="text-xs font-semibold tracking-wider text-gray-500 uppercase">
                          Input
                        </span>
                        <pre
                          className={`mt-1 rounded p-2 font-mono ${isDark ? "bg-black/30 text-gray-300" : "bg-white text-gray-800"}`}
                        >
                          {tc.inputData || "—"}
                        </pre>
                      </div>
                      <div>
                        <span className="text-xs font-semibold tracking-wider text-gray-500 uppercase">
                          Expected Output
                        </span>
                        <pre
                          className={`mt-1 rounded p-2 font-mono ${isDark ? "bg-black/30 text-gray-300" : "bg-white text-gray-800"}`}
                        >
                          {tc.expectedOutput || "—"}
                        </pre>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ): (
            <div className="border border-dashed p-12 text-center">
              No test cases provided for this problem.
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: PDF Preview (Sticky) */}
        <div className="lg:sticky lg:top-8 lg:col-span-2">
          {problem.fileName && (pdfUrl || pdfLoading) ? (
            <div
              className={`overflow-hidden border ${isDark ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"}`}
            >
              <div
                className={`border-b p-4 ${isDark ? "border-gray-700" : "border-gray-200"}`}
              >
                <Label className={isDark ? "text-white" : "text-gray-900"}>
                  Attachment preview
                </Label>
              </div>
              <div className="p-0">
                {pdfLoading ? (
                  <div
                    className={`flex h-[70vh] w-full items-center justify-center ${isDark ? "bg-gray-900" : "bg-gray-50"}`}
                  >
                    <Spinner size="xl" />
                    <span
                      className={`ml-3 ${isDark ? "text-gray-400" : "text-gray-600"}`}
                    >
                      Loading preview...
                    </span>
                  </div>
                ) : pdfUrl ? (
                  <iframe
                    src={pdfUrl}
                    title="Problem attachment"
                    className="h-[75vh] w-full"
                  />
                ) : (
                  <div className="p-8 text-center text-gray-500">
                    No preview available
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div
              className={`rounded-lg border border-dashed p-12 text-center ${isDark ? "border-gray-700 text-gray-500" : "border-gray-300 text-gray-400"}`}
            >
              No PDF attachment provided for this problem.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

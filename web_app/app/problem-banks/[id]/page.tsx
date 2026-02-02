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

const difficultyBadgeColor: Record<Difficulty, "success" | "warning" | "failure"> = {
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
        toast.showError(err.response?.data?.message ?? "Failed to load problem");
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
        <Button
          as={Link}
          href={PageUrl.QUESTION_BANKS_PAGE}
          color="light"
          className="cursor-pointer"
        >
          <ArrowLeftIcon className="h-5 w-5" />
          Back to problem banks
        </Button>
        <p className={`mt-4 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
          Problem not found.
        </p>
      </div>
    );
  }

  const difficulty = normalizeDifficulty(problem.difficulty);

  return (
    <div className="p-8">
      <div className="mb-8 flex flex-wrap items-center gap-4">
        <Button
          as={Link}
          href={PageUrl.QUESTION_BANKS_PAGE}
          color="light"
          className="cursor-pointer"
        >
          <ArrowLeftIcon className="h-5 w-5" />
          Back
        </Button>
        <Button
          as={Link}
          href={PageUrl.PROBLEM_BANKS_EDIT_PAGE(id)}
          color="purple"
          className="cursor-pointer bg-[#1F4E79] hover:bg-[#1F4E79]/90"
        >
          <PencilIcon className="h-5 w-5" />
          Edit
        </Button>
        <div className="min-w-0 flex-1">
          <h1
            className={`text-4xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}
          >
            {problem.title}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge color={difficultyBadgeColor[difficulty]}>{difficulty}</Badge>
            <span className={isDark ? "text-gray-400" : "text-gray-600"}>
              Mark: {problem.mark}
            </span>
            {problem.fileName && (
              <span
                className={`font-mono text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
              >
                File: {problem.fileName}
              </span>
            )}
          </div>
        </div>
      </div>

      <div
        className={`space-y-6 rounded-lg border p-6 ${isDark ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"}`}
      >
        <div>
          <Label className={isDark ? "text-white" : "text-gray-900"}>
            Content
          </Label>
          <div
            className={`mt-1 whitespace-pre-wrap rounded border p-4 ${isDark ? "border-gray-600 bg-gray-900 text-gray-300" : "border-gray-200 bg-gray-50 text-gray-800"}`}
          >
            {problem.content || "—"}
          </div>
        </div>

        {(problem.fileName && (pdfUrl || pdfLoading)) && (
          <div>
            <Label className={isDark ? "text-white" : "text-gray-900"}>
              Attachment preview
            </Label>
            <div
              className={`mt-1 overflow-hidden rounded border ${isDark ? "border-gray-600" : "border-gray-200"}`}
            >
              {pdfLoading ? (
                <div
                  className={`flex h-[480px] w-full items-center justify-center ${isDark ? "bg-gray-900" : "bg-gray-50"}`}
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
                  className="h-[480px] w-full"
                />
              ) : null}
            </div>
          </div>
        )}

        {problem.codeTemplate && (
          <div>
            <Label className={isDark ? "text-white" : "text-gray-900"}>
              Code template
            </Label>
            <pre
              className={`mt-1 overflow-x-auto rounded border p-4 font-mono text-sm ${isDark ? "border-gray-600 bg-gray-900 text-gray-300" : "border-gray-200 bg-gray-50 text-gray-800"}`}
            >
              {problem.codeTemplate}
            </pre>
          </div>
        )}

        {problem.testCases && problem.testCases.length > 0 && (
          <div>
            <Label className={isDark ? "text-white" : "text-gray-900"}>
              Test cases ({problem.testCases.length})
            </Label>
            <div className="mt-2 space-y-3">
              {problem.testCases.map((tc, index) => (
                <div
                  key={tc.id}
                  className={`rounded border p-4 ${isDark ? "border-gray-600 bg-gray-900" : "border-gray-200 bg-gray-50"}`}
                >
                  <div
                    className={`mb-2 text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}
                  >
                    Test case {index + 1}
                    {tc.isPublic && (
                      <Badge color="info" className="ml-2">
                        Public
                      </Badge>
                    )}
                  </div>
                  <div className="grid gap-2 text-sm">
                    <div>
                      <span
                        className={isDark ? "text-gray-500" : "text-gray-500"}
                      >
                        Input:
                      </span>
                      <pre
                        className={`mt-0.5 font-mono ${isDark ? "text-gray-300" : "text-gray-800"}`}
                      >
                        {tc.inputData || "—"}
                      </pre>
                    </div>
                    <div>
                      <span
                        className={isDark ? "text-gray-500" : "text-gray-500"}
                      >
                        Expected output:
                      </span>
                      <pre
                        className={`mt-0.5 font-mono ${isDark ? "text-gray-300" : "text-gray-800"}`}
                      >
                        {tc.expectedOutput || "—"}
                      </pre>
                    </div>
                    <div className="flex gap-2 text-xs">
                      {tc.isCaseInsensitive && (
                        <Badge color="gray">Case insensitive</Badge>
                      )}
                      {tc.isRemovedSpace && (
                        <Badge color="gray">Spaces removed</Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

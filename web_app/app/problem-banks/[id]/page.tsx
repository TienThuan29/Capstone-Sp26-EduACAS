"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useThemeContext } from "@/components/theme-provider";
import { Button, Spinner, Badge } from "flowbite-react";
import {
  ArrowLeftIcon,
  PencilIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
  CodeBracketSquareIcon,
  BeakerIcon,
  ClockIcon,
  HashtagIcon,
  PaperClipIcon,
} from "@heroicons/react/24/outline";
import { useToast } from "@/hooks/useToast";
import { useProblem } from "@/hooks/problem/useProblem";
import { usePrivateS3 } from "@/hooks/s3/usePrivateS3";
import { PageUrl } from "@/configs/page.url";
import type { ProblemResponse } from "@/types/problem";
import { normalizeDifficulty } from "@/types/problem";
import { markdownToHtml } from "@/utils/markdown-converter";
import { DefaultCustomButton } from "@/components/ui/custom-button";
import { formatDate } from "@/utils/datetime-utils";
import { TestCaseCard } from "../components/testcase-card";

export default function ProblemViewPage() {
  const params = useParams();
  const router = useRouter();
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

  const idRef = useRef<string>("");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!id) return;

    const isIdChanged = idRef.current !== id;
    if (isIdChanged) {
      setLoading(true);
      setProblem(null);
      setPdfUrl(null);
      idRef.current = id;
    }

    const load = async () => {
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
      <div className={`flex min-h-screen flex-col items-center justify-center ${isDark ? "bg-gray-900" : "bg-gray-50"}`}>
        <Spinner size="xl" />
        <span className={`mt-4 animate-pulse text-sm font-medium ${isDark ? "text-gray-400" : "text-gray-500"}`}>
          Loading Problem...
        </span>
      </div>
    );
  }

  if (!problem) {
    return (
      <div className={`flex min-h-screen flex-col items-center justify-center p-8 text-center ${isDark ? "bg-gray-900" : "bg-gray-50"}`}>
        <div className={`mb-6 rounded-sm p-4 ${isDark ? "bg-gray-800 text-gray-400" : "bg-gray-100 text-gray-500"}`}>
          <DocumentTextIcon className="h-12 w-12" />
        </div>
        <h2 className={`mb-2 text-xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>Problem Not Found</h2>
        <p className={`mb-6 max-w-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>
          The problem you are looking for might have been deleted or does not exist.
        </p>
        <Button as={Link} href={PageUrl.QUESTION_BANKS_PAGE} color="blue">
          <ArrowLeftIcon className="mr-2 h-4 w-4" />
          Back to Problem Bank
        </Button>
      </div>
    );
  }

  const hasAttachment = Boolean(problem.fileName);
  const hasContent = Boolean(problem.content && problem.content.trim());
  const contentHtml = hasContent ? markdownToHtml(problem.content) : "";
  const difficultyLabel = normalizeDifficulty(problem.difficulty);
  const difficultyColor =
    difficultyLabel === "EASY"
      ? "success"
      : difficultyLabel === "MEDIUM"
        ? "warning"
        : "failure";

  return (
    <div className={`min-h-screen pb-20 ${isDark ? "bg-gray-900" : "bg-gray-50"}`}>
      {/* 1. Header Section */}
      <div className={`sticky top-0 z-30 border-b backdrop-blur-md ${isDark ? "border-gray-700 bg-gray-900/80" : "border-gray-200 bg-white/80"}`}>
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Button
              as={Link}
              href={PageUrl.QUESTION_BANKS_PAGE}
              color="light"
              size="sm"
              className="!rounded-sm !p-2 border-0 shadow-none hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </Button>
            <div className="hidden h-6 w-px bg-gray-300 dark:bg-gray-700 md:block"></div>
            <div className="flex flex-col">
              <div className="flex items-center gap-3">
                <h1 className={`text-lg font-bold leading-none ${isDark ? "text-white" : "text-gray-900"}`}>
                  {problem.title}
                </h1>
                <Badge color={difficultyColor} size="xs" className="hidden sm:inline-flex">
                  {difficultyLabel}
                </Badge>
              </div>
              <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                 ID: <span className="font-mono">{problem.id}</span>
              </p>
            </div>
          </div>
          
          <DefaultCustomButton
            label="Edit Problem"
            icon={<PencilIcon className="h-4 w-4" />}
            onClick={() => router.push(PageUrl.PROBLEM_BANKS_EDIT_PAGE(id))}
            className="cursor-pointer"
          />
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          
          {/* === LEFT COLUMN (Main Content) - Spans 2 cols === */}
          <div className="space-y-8 lg:col-span-2">
            
            {/* Content Display */}
            {hasAttachment ? (
              // PDF Preview Mode
              <div className={`overflow-hidden rounded-xl border shadow-sm ${isDark ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"}`}>
                 <div className={`flex items-center justify-between border-b px-6 py-4 ${isDark ? "border-gray-700" : "border-gray-100"}`}>
                    <h3 className={`flex items-center gap-2 text-lg font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                      <PaperClipIcon className="h-5 w-5 text-gray-500" />
                      Attachment
                    </h3>
                    {problem.fileName && <span className="text-sm text-gray-500">{problem.fileName}</span>}
                 </div>
                 
                 <div className="relative min-h-[600px] w-full bg-gray-100 dark:bg-gray-900">
                    {pdfLoading ? (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <Spinner size="xl" />
                          <p className={`mt-3 text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>Loading document...</p>
                        </div>
                      </div>
                    ) : pdfUrl ? (
                      <iframe src={pdfUrl} title="Problem attachment" className="h-[800px] w-full border-none" />
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center p-12 text-center text-gray-500">
                         <DocumentTextIcon className="h-16 w-16 opacity-20" />
                         <p className="mt-4">No preview available for this file type.</p>
                      </div>
                    )}
                 </div>
              </div>
            ) : (
              // Standard Markdown Content Mode
              <div className={`overflow-hidden rounded-sm border shadow-sm ${isDark ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"}`}>
                <div className={`flex items-center gap-2 border-b px-6 py-4 ${isDark ? "border-gray-700" : "border-gray-100"}`}>
                    <DocumentTextIcon className="h-5 w-5 text-gray-500" />
                    <h3 className={`text-lg font-bold ${isDark ? "text-white" : "text-gray-900"}`}>Description</h3>
                </div>
                {hasContent ? (
                  <div 
                    className={`prose max-w-none p-6 ${
                      isDark 
                      ? "prose-invert prose-p:text-gray-300 prose-headings:text-gray-100 prose-strong:text-white prose-code:text-blue-300" 
                      : "prose-headings:text-gray-900 prose-p:text-gray-600 prose-code:text-blue-600"
                    }`}
                    dangerouslySetInnerHTML={{ __html: contentHtml }}
                  />
                ) : (
                   <div className="p-12 text-center italic text-gray-500">No textual description provided.</div>
                )}
              </div>
            )}

            {/* Code Templates Section */}
            {!hasAttachment && problem.codeTemplates && Object.keys(problem.codeTemplates).length > 0 && (
               <div className={`overflow-hidden rounded-sm border shadow-sm ${isDark ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"}`}>
                  <div className={`flex items-center gap-2 border-b px-6 py-4 ${isDark ? "border-gray-700" : "border-gray-100"}`}>
                      <CodeBracketSquareIcon className="h-5 w-5 text-gray-500" />
                      <h3 className={`text-lg font-bold ${isDark ? "text-white" : "text-gray-900"}`}>Starter Code</h3>
                  </div>
                  <div className="divide-y dark:divide-gray-700">
                    {Object.entries(problem.codeTemplates).map(([langId, template]) => (
                      <div key={langId} className="group relative">
                        <div className={`flex items-center justify-between bg-gray-50 px-4 py-2 dark:bg-gray-900/50`}>
                           <span className="font-mono text-xs font-bold uppercase text-gray-500">{langId}</span>
                           <Button 
                              size="xs" 
                              color="gray" 
                              className="opacity-0 transition-opacity group-hover:opacity-100"
                              onClick={() => {navigator.clipboard.writeText(template); toast.showSuccess("Copied!");}}
                           >
                             Copy
                           </Button>
                        </div>
                        <pre className={`overflow-x-auto p-4 font-mono text-sm leading-relaxed ${isDark ? "bg-gray-800 text-gray-300" : "bg-white text-gray-800"}`}>
                          {template}
                        </pre>
                      </div>
                    ))}
                  </div>
               </div>
            )}
          </div>

          {/* === RIGHT COLUMN (Sidebar) - Spans 1 col === */}
          <div className="space-y-6 lg:col-span-1">
            
            {/* 1. Problem Metadata Card */}
            <div className={`rounded-sm border p-5 shadow-sm ${isDark ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"}`}>
               <h4 className={`mb-4 text-sm font-bold uppercase tracking-wider ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                 Problem Info
               </h4>
               
               <div className="space-y-4">
                  <div className="flex items-center justify-between">
                     <span className={`text-sm ${isDark ? "text-gray-300" : "text-gray-600"}`}>Difficulty</span>
                     <Badge color={difficultyColor}>{difficultyLabel}</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                     <span className={`text-sm ${isDark ? "text-gray-300" : "text-gray-600"}`}>Created</span>
                     <div className="flex items-center gap-1.5 text-sm text-gray-500">
                        <CalendarDaysIcon className="h-4 w-4" />
                        {formatDate(problem.createdDate)}
                     </div>
                  </div>

                  <div className="flex items-center justify-between">
                     <span className={`text-sm ${isDark ? "text-gray-300" : "text-gray-600"}`}>Last Updated</span>
                     <div className="flex items-center gap-1.5 text-sm text-gray-500">
                        <ClockIcon className="h-4 w-4" />
                        {formatDate(problem.updatedDate)}
                     </div>
                  </div>

                  <div className="pt-2">
                     <span className={`mb-2 block text-sm ${isDark ? "text-gray-300" : "text-gray-600"}`}>Tags</span>
                     {problem.tags && problem.tags.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {problem.tags.map(tag => (
                             <span key={tag} className={`inline-flex items-center rounded px-2 py-1 text-xs font-medium ${isDark ? "bg-blue-900/30 text-blue-200" : "bg-blue-50 text-blue-700"}`}>
                               <HashtagIcon className="mr-1 h-3 w-3 opacity-70" />
                               {tag}
                             </span>
                          ))}
                        </div>
                     ) : (
                        <span className="text-sm text-gray-400 italic">No tags assigned</span>
                     )}
                  </div>
               </div>
            </div>

            {/* 2. Test Cases List */}
            <div className={`flex flex-col rounded-sm border shadow-sm ${isDark ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"}`}>
               <div className={`flex items-center justify-between border-b p-4 ${isDark ? "border-gray-700" : "border-gray-100"}`}>
                  <h3 className={`flex items-center gap-2 font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                     <BeakerIcon className="h-5 w-5 text-gray-500" />
                     Test Cases
                  </h3>
                  <Badge color="gray" className="rounded-sm px-2">{problem.testCases?.length || 0}</Badge>
               </div>
               
               <div className="flex-1 p-4">
                  {problem.testCases && problem.testCases.length > 0 ? (
                    <div className="max-h-[600px] space-y-4 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
                      {problem.testCases.map((tc, index) => (
                        <TestCaseCard
                          key={tc.id}
                          tc={tc}
                          index={index}
                          isDark={isDark}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                       <div className="mb-2 rounded-sm bg-gray-100 p-3 dark:bg-gray-700">
                          <BeakerIcon className="h-6 w-6 text-gray-400" />
                       </div>
                       <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>No test cases available</p>
                    </div>
                  )}
               </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useThemeContext } from "@/components/theme-provider";
import {
  Button,
  TextInput,
  Textarea,
  Select,
  Label,
  Spinner,
  FileInput,
} from "flowbite-react";
import {
  ArrowLeftIcon,
  CloudArrowUpIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { useToast } from "@/hooks/useToast";
import { useProblem } from "@/hooks/problem/useProblem";
import { usePrivateS3 } from "@/hooks/s3/usePrivateS3";
import { useAuth } from "@/contexts/AuthContext";
import { PageUrl } from "@/configs/page.url";
import type { Difficulty, ProblemMode } from "@/types/problem";
import { DIFFICULTY, PROBLEM_MODE } from "@/types/problem";
import type {
  CreateProblemPayload,
  CreateTestCasePayload,
} from "@/hooks/problem/useProblem";
import { DefaultCustomButton } from "@/components/ui/custom-button";
import { TestcaseBlock } from "../components/testcase-block";
import { TipTapToolbar } from "@/components/tiptap-toolbar";
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import Underline from '@tiptap/extension-underline';
import TipTapLink from '@tiptap/extension-link';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight';
import { createLowlight, all } from 'lowlight';
import TurndownService from 'turndown';
import { markdownToHtml } from '@/utils/markdown-converter';
import { formatMarkdownCode } from '@/utils/markdown-formatter';

const initialFormData = {
  lecturerId: "",
  title: "",
  content: "",
  fileName: "",
  difficulty: "EASY" as Difficulty,
  codeTemplate: "",
};

export default function CreateProblemPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { isDark } = useThemeContext();
  const toast = useToast();
  const { uploadFile } = usePrivateS3();
  const { createProblem, extractOcrContent } = useProblem();

  const [mounted, setMounted] = useState(false);
  const [formData, setFormData] = useState(initialFormData);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFileLabel, setSelectedFileLabel] = useState<string | null>(
    null,
  );
  const [testCases, setTestCases] = useState<CreateTestCasePayload[]>([]);
  const [showTestcaseForm, setShowTestcaseForm] = useState(false);

  const [mode, setMode] = useState<ProblemMode>("MANUAL");
  const [extracting, setExtracting] = useState(false);
  const [extractedMarkdown, setExtractedMarkdown] = useState("");
  const [showEditor, setShowEditor] = useState(false);
  const [editorHtml, setEditorHtml] = useState("");

  const lowlight = createLowlight(all);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      CodeBlockLowlight.configure({
        lowlight,
        HTMLAttributes: {
          class: 'hljs',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'right', 'justify'],
      }),
      TextStyle,
      Underline,
      TipTapLink.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline',
        },
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'border-collapse table-auto w-full',
        },
      }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: editorHtml,
    onUpdate: ({ editor }) => {
      setEditorHtml(editor.getHTML());
    },
    editable: true,
    immediatelyRender: false,
  });


  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (user?.id) {
      setFormData((prev) => ({ ...prev, lecturerId: user.id }));
    }
  }, [user?.id]);

  const uploadFileToS3 = async (file: File) => {
    setUploading(true);
    setSelectedFileLabel(file.name);
    try {
      const fileName = await uploadFile(file);
      setFormData((prev) => ({ ...prev, fileName }));
      toast.showSuccess("File uploaded. File name saved.");
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.showError(err.response?.data?.message ?? "Failed to upload file");
      setSelectedFileLabel(null);
    } finally {
      setUploading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadFileToS3(file);
    e.target.value = "";
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file || uploading) return;
    await uploadFileToS3(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleExtractAndEdit = async () => {
    if (!formData.fileName) {
      toast.showError("Please upload a file first");
      return;
    }

    setExtracting(true);
    try {
      const markdown = await extractOcrContent(formData.fileName);

      setExtractedMarkdown(markdown);

      const formattedMarkdown = await formatMarkdownCode(markdown);

      const html = markdownToHtml(formattedMarkdown);
      setEditorHtml(html);

      if (editor) {
        editor.commands.setContent(html);
      }

      setShowEditor(true);

      toast.showSuccess("Content extracted successfully!");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast.showError(error.message || "Failed to extract content");
      console.error("OCR extraction error:", error);
    } finally {
      setExtracting(false);
    }
  };

  if (!mounted) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setSubmitting(true);
    try {
      let finalContent = "";
      let finalFileName = "";

      if (mode === "MANUAL") {
        if (editor) {
          const html = editor.getHTML();
          const turndownService = new TurndownService();
          finalContent = turndownService.turndown(html);
        }
        finalFileName = formData.fileName || "manual_problem.txt";

        if (!finalContent.trim()) {
          toast.showError("Please enter problem content");
          return;
        }
      } else {
        if (!formData.fileName?.trim()) {
          toast.showError("Please upload a file first");
          return;
        }

        finalFileName = formData.fileName;

        if (showEditor && editor) {
          const html = editor.getHTML();
          const turndownService = new TurndownService();
          finalContent = turndownService.turndown(html);
        } else {
          finalContent = "";
        }
      }

      const payload: CreateProblemPayload = {
        lecturerId: formData.lecturerId || (user?.id ?? ""),
        title: formData.title,
        content: finalContent,
        fileName: finalFileName,
        difficulty: formData.difficulty,
        codeTemplate: formData.codeTemplate,
        testCases: testCases.length > 0 ? testCases : undefined,
        mode: mode,
        wantsToEdit: showEditor,
      };

      await createProblem(payload);
      toast.showSuccess("Problem created successfully");
      router.push(PageUrl.QUESTION_BANKS_PAGE);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.showError(
        err.response?.data?.message ?? "Failed to create problem",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center gap-4">
        <Button
          as={Link}
          href={PageUrl.QUESTION_BANKS_PAGE}
          color="light"
          className="cursor-pointer"
        >
          <ArrowLeftIcon className="h-5 w-5" />
          Back
        </Button>
        <div>
          <h1
            className={`text-4xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}
          >
            Create problem
          </h1>
          <p className={`mt-1 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
            Add a new coding problem to the bank
          </p>
        </div>
      </div>
      <div className="mb-4 flex justify-end">
        <div className="inline-flex rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 p-1">
          <button
            type="button"
            onClick={() => {
              setMode(PROBLEM_MODE.MANUAL);
              setShowEditor(false);
            }}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${mode === PROBLEM_MODE.MANUAL
              ? "bg-blue-600 text-white shadow-sm"
              : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
              }`}
          >
            Manual
          </button>
          <button
            type="button"
            onClick={() => {
              setMode(PROBLEM_MODE.FROM_FILE);
              setShowEditor(false);
            }}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${mode === PROBLEM_MODE.FROM_FILE
              ? "bg-blue-600 text-white shadow-sm"
              : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
              }`}
          >
            Upload File
          </button>
        </div>
      </div>

      <div
        className={`p-6 ${isDark ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"}`}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label
              htmlFor="title"
              className={isDark ? "text-white" : "text-gray-900"}
            >
              Title <span className="text-red-500">*</span>
            </Label>
            <TextInput
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="Problem title (3–500 characters)"
              required
              minLength={3}
              maxLength={500}
              className="mt-1"
            />
          </div>

          {mode === PROBLEM_MODE.MANUAL && (
            <div>
              <Label
                htmlFor="content"
                className={isDark ? "text-white" : "text-gray-900"}
              >
                Content <span className="text-red-500">*</span>
              </Label>

              <div className={`mt-1 rounded-lg border ${isDark ? "border-gray-600 bg-gray-700" : "border-gray-300 bg-white"}`}>
                {editor && <TipTapToolbar editor={editor} isDark={isDark} />}
                <EditorContent
                  editor={editor}
                  className={`prose max-w-none p-4 min-h-[300px] ${isDark ? 'prose-invert' : ''
                    } 
                  [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:text-blue-600 dark:[&_h1]:text-blue-400 [&_h1]:mb-4
                  [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-blue-500 dark:[&_h2]:text-blue-300 [&_h2]:mb-3
                  [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-gray-700 dark:[&_h3]:text-gray-300 [&_h3]:mb-2
                  [&_p]:text-gray-900 dark:[&_p]:text-gray-100
                  [&_li]:text-gray-900 dark:[&_li]:text-gray-100
                  [&_td]:text-gray-900 dark:[&_td]:text-gray-100
                  [&_th]:text-gray-900 dark:[&_th]:text-gray-100
                  [&_pre]:bg-gray-50 dark:[&_pre]:bg-transparent [&_pre]:p-4 [&_pre]:rounded-lg [&_pre]:border [&_pre]:border-gray-200 dark:[&_pre]:border-gray-600
                  [&_code]:text-sm [&_code]:font-mono
                  [&_pre_code]:bg-transparent [&_pre_code]:text-gray-900 dark:[&_pre_code]:text-gray-100
                  [&_.hljs-keyword]:text-purple-600 dark:[&_.hljs-keyword]:text-purple-400
                  [&_.hljs-string]:text-green-600 dark:[&_.hljs-string]:text-green-400
                  [&_.hljs-comment]:text-gray-500 dark:[&_.hljs-comment]:text-gray-400 [&_.hljs-comment]:italic
                  [&_.hljs-number]:text-orange-600 dark:[&_.hljs-number]:text-orange-400
                  [&_.hljs-title]:text-blue-600 dark:[&_.hljs-title]:text-blue-400
                  focus:outline-none`}
                />
              </div>

              <p className={`mt-1 text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                Use the toolbar to format your problem description
              </p>
            </div>
          )}

          {mode === PROBLEM_MODE.FROM_FILE && (
            <div className="space-y-4">
              <div>
                <Label
                  htmlFor="dropzone-file"
                  className={isDark ? "text-white" : "text-gray-900"}
                >
                  Upload Problem File <span className="text-red-500">*</span>
                </Label>
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  className="mt-1 flex w-full items-center justify-center"
                >
                  <Label
                    htmlFor="dropzone-file"
                    className={`flex h-40 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed ${isDark ? "border-gray-600 bg-gray-700 hover:border-gray-500 hover:bg-gray-600" : "border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100"}`}
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      {uploading ? (
                        <Spinner size="lg" />
                      ) : (
                        <>
                          <CloudArrowUpIcon className="mb-4 h-10 w-10 text-gray-500 dark:text-gray-400" />
                          <p
                            className={`mb-2 text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}
                          >
                            <span className="font-semibold">Click to upload</span>{" "}
                            or drag and drop
                          </p>
                          <p
                            className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}
                          >
                            Problem files (e.g. file.pdf, ...)
                          </p>
                          {formData.fileName && (
                            <p className="mt-2 text-xs font-medium text-green-600 dark:text-green-400">
                              Saved: {formData.fileName}
                            </p>
                          )}
                          {selectedFileLabel && !formData.fileName && (
                            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                              Selected: {selectedFileLabel}
                            </p>
                          )}
                        </>
                      )}
                    </div>
                    <FileInput
                      id="dropzone-file"
                      className="hidden"
                      onChange={handleFileUpload}
                      disabled={uploading}
                      accept=".pdf, .docx, .doc, .txt"
                    />
                  </Label>
                </div>
                {formData.fileName && (
                  <p
                    className={`mt-2 text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
                  >
                    File saved: <span className="font-mono font-medium">{formData.fileName}</span>
                  </p>
                )}
              </div>

              {formData.fileName && !showEditor && (
                <div>
                  <Button
                    type="button"
                    color="purple"
                    onClick={handleExtractAndEdit}
                    disabled={extracting}
                    className="cursor-pointer"
                  >
                    {extracting ? (
                      <>
                        <Spinner size="sm" className="mr-2" />
                        Extracting content...
                      </>
                    ) : (
                      <>
                        Extract & Edit Content
                      </>
                    )}
                  </Button>
                  <p className={`mt-1 text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                    Extract problem content from the file using OCR and edit it before creating
                  </p>
                </div>
              )}

              {showEditor && editor && (
                <div>
                  <Label className={isDark ? "text-white" : "text-gray-900"}>
                    Edit Extracted Content
                  </Label>

                  <div className={`mt-2 rounded-lg border ${isDark ? "border-gray-600 bg-gray-700" : "border-gray-300 bg-white"}`}>
                    <TipTapToolbar editor={editor} isDark={isDark} />

                    <EditorContent
                      editor={editor}
                      className={`prose max-w-none p-4 min-h-[300px] ${isDark ? 'prose-invert' : ''
                        } 
                      [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:text-blue-600 dark:[&_h1]:text-blue-400 [&_h1]:mb-4
                      [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-blue-500 dark:[&_h2]:text-blue-300 [&_h2]:mb-3
                      [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-gray-700 dark:[&_h3]:text-gray-300 [&_h3]:mb-2
                      [&_p]:text-gray-900 dark:[&_p]:text-gray-100
                      [&_li]:text-gray-900 dark:[&_li]:text-gray-100
                      [&_td]:text-gray-900 dark:[&_td]:text-gray-100
                      [&_th]:text-gray-900 dark:[&_th]:text-gray-100
                      [&_pre]:bg-gray-50 dark:[&_pre]:bg-transparent [&_pre]:p-4 [&_pre]:rounded-lg [&_pre]:border [&_pre]:border-gray-200 dark:[&_pre]:border-gray-600
                      [&_code]:text-sm [&_code]:font-mono
                      [&_pre_code]:bg-transparent [&_pre_code]:text-gray-900 dark:[&_pre_code]:text-gray-100
                      [&_.hljs-keyword]:text-purple-600 dark:[&_.hljs-keyword]:text-purple-400
                      [&_.hljs-string]:text-green-600 dark:[&_.hljs-string]:text-green-400
                      [&_.hljs-comment]:text-gray-500 dark:[&_.hljs-comment]:text-gray-400 [&_.hljs-comment]:italic
                      [&_.hljs-number]:text-orange-600 dark:[&_.hljs-number]:text-orange-400
                      [&_.hljs-title]:text-blue-600 dark:[&_.hljs-title]:text-blue-400
                      focus:outline-none`}
                    />
                  </div>

                  <p className={`mt-1 text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                    Review and edit the extracted content before creating the problem
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label
                htmlFor="difficulty"
                className={isDark ? "text-white" : "text-gray-900"}
              >
                Difficulty <span className="text-red-500">*</span>
              </Label>
              <Select
                id="difficulty"
                value={formData.difficulty}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    difficulty: e.target.value as Difficulty,
                  })
                }
                className="mt-1"
              >
                <option value={DIFFICULTY.EASY}>Easy</option>
                <option value={DIFFICULTY.MEDIUM}>Medium</option>
                <option value={DIFFICULTY.HARD}>Hard</option>
              </Select>
            </div>
          </div>

          <div>
            <Label
              htmlFor="codeTemplate"
              className={isDark ? "text-white" : "text-gray-900"}
            >
              Code template
            </Label>
            <Textarea
              id="codeTemplate"
              value={formData.codeTemplate}
              onChange={(e) =>
                setFormData({ ...formData, codeTemplate: e.target.value })
              }
              placeholder="Starter code for the solution"
              rows={8}
              className="mt-1 font-mono text-sm"
            />
          </div>

          {testCases.length > 0 && (
            <div>
              <h3
                className={`mb-2 text-lg font-semibold ${isDark ? "text-white" : "text-gray-900"}`}
              >
                Test cases ({testCases.length})
              </h3>
              <ul className="space-y-2">
                {testCases.map((tc, index) => (
                  <li
                    key={index}
                    className={`flex items-start justify-between gap-2 rounded-lg border p-3 ${isDark ? "border-gray-600 bg-gray-800" : "border-gray-200 bg-gray-50"}`}
                  >
                    <div className="min-w-0 flex-1 font-mono text-sm">
                      <span className={isDark ? "text-gray-400" : "text-gray-600"}>
                        Input:
                      </span>{" "}
                      <span className={isDark ? "text-gray-200" : "text-gray-800"}>
                        {tc.inputData.length > 60
                          ? `${tc.inputData.slice(0, 60)}...`
                          : tc.inputData}
                      </span>
                      <span className="mx-2 text-gray-400">→</span>
                      <span className={isDark ? "text-gray-400" : "text-gray-600"}>
                        Expected:
                      </span>{" "}
                      <span className={isDark ? "text-gray-200" : "text-gray-800"}>
                        {tc.expectedOutput.length > 40
                          ? `${tc.expectedOutput.slice(0, 40)}...`
                          : tc.expectedOutput}
                      </span>
                      <span className={`ml-2 text-xs ${isDark ? "text-gray-500" : "text-gray-500"}`}>
                        {tc.isPublic && "Public"}
                        {tc.isCaseInsensitive && " · Case insensitive"}
                        {tc.isRemovedSpace && " · No spaces"}
                      </span>
                    </div>
                    <Button
                      type="button"
                      size="xs"
                      color="failure"
                      className="cursor-pointer shrink-0"
                      onClick={() =>
                        setTestCases((prev) =>
                          prev.filter((_, i) => i !== index),
                        )
                      }
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {showTestcaseForm && (
            <TestcaseBlock
              isDark={isDark}
              onAdd={(tc) => {
                setTestCases((prev) => [...prev, tc]);
              }}
              onCancel={() => setShowTestcaseForm(false)}
            />
          )}

          <div className="flex flex-wrap items-center justify-between gap-4 pt-4">
            <div className="flex gap-4">
              <Button
                type="button"
                color="gray"
                as={Link}
                href={PageUrl.QUESTION_BANKS_PAGE}
                className="cursor-pointer"
              >
                Cancel
              </Button>
              <DefaultCustomButton
                label="Create problem"
                icon={<PlusIcon className="h-5 w-5" />}
                onClick={handleSubmit}
                disabled={submitting}
                className="cursor-pointer"
              />
            </div>
            <Button
              type="button"
              color="green"
              className="cursor-pointer"
              onClick={() => setShowTestcaseForm(true)}
            >
              <PlusIcon className="h-5 w-5" /> Add Test Case
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

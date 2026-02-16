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
  CheckCircleIcon,
  AdjustmentsHorizontalIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import { useToast } from "@/hooks/useToast";
import { useProblem } from "@/hooks/problem/useProblem";
import { usePrivateS3 } from "@/hooks/s3/usePrivateS3";
import { useAuth } from "@/contexts/AuthContext";
import { useProgrammingLanguage } from "@/hooks/programming-language/useProgrammingLanguage";
import type { ProgrammingLanguage } from "@/types/language";
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
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import Underline from "@tiptap/extension-underline";
import TipTapLink from "@tiptap/extension-link";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { CodeBlockLowlight } from "@tiptap/extension-code-block-lowlight";
import { createLowlight, all } from "lowlight";
import TurndownService from "turndown";
import { markdownToHtml } from "@/utils/markdown-converter";
import { formatMarkdownCode } from "@/utils/markdown-formatter";

const initialFormData = {
  lecturerId: "",
  title: "",
  content: "",
  fileName: "",
  difficulty: "EASY" as Difficulty,
  codeTemplates: {} as Record<string, string>,
  tags: [] as string[],
};

export default function CreateProblemPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { isDark } = useThemeContext();
  const toast = useToast();
  const { uploadFile } = usePrivateS3();
  const { createProblem, extractOcrContent } = useProblem();
  const { getEnabledProgrammingLanguages } = useProgrammingLanguage();

  const [mounted, setMounted] = useState(false);
  const [formData, setFormData] = useState(initialFormData);
  const [programmingLanguages, setProgrammingLanguages] = useState<ProgrammingLanguage[]>([]);
  const [selectedLanguageId, setSelectedLanguageId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFileLabel, setSelectedFileLabel] = useState<string | null>(
    null,
  );
  const [testCases, setTestCases] = useState<CreateTestCasePayload[]>([]);
  const [showTestcaseForm, setShowTestcaseForm] = useState(false);
  const [tagInput, setTagInput] = useState("");

  const [mode, setMode] = useState<ProblemMode>("MANUAL");
  const [extracting, setExtracting] = useState(false);
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
          class: "hljs",
        },
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
        alignments: ["left", "center", "right", "justify"],
      }),
      TextStyle,
      Underline,
      TipTapLink.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-blue-600 underline",
        },
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: "border-collapse table-auto w-full",
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
    editorProps: {
      attributes: {
        spellcheck: 'false',
      },
    },
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

  // Ensure editor is editable and properly initialized
  useEffect(() => {
    if (editor && !editor.isDestroyed) {
      editor.setEditable(true);
      // Ensure editor can receive focus
      const editorElement = editor.view.dom;
      if (editorElement) {
        editorElement.setAttribute('contenteditable', 'true');
        editorElement.style.cursor = 'text';
      }
    }
  }, [editor]);

  useEffect(() => {
    const loadLanguages = async () => {
      try {
        const langs = await getEnabledProgrammingLanguages();
        setProgrammingLanguages(langs);
      } catch (error) {
        console.error("Failed to load programming languages:", error);
      }
    };
    loadLanguages();
  }, [getEnabledProgrammingLanguages]);

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
        codeTemplates:
          Object.keys(formData.codeTemplates).length > 0
            ? formData.codeTemplates
            : undefined,
        testCases: testCases.length > 0 ? testCases : undefined,
        mode: mode,
        wantsToEdit: showEditor,
        tags: formData.tags.length > 0 ? formData.tags : undefined,
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
    <div
      className={`min-h-screen pb-20 ${isDark ? "bg-gray-900" : "bg-gray-50"}`}
    >
      {/* Header Section */}
      <div
        className={`sticky top-0 z-10 border-b backdrop-blur-md ${isDark ? "border-gray-700 bg-gray-900/80" : "border-gray-200 bg-white/80"}`}
      >
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                as={Link}
                href={PageUrl.QUESTION_BANKS_PAGE}
                color="light"
                size="sm"
                className="cursor-pointer"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </Button>
              <div>
                <h1
                  className={`text-2xl font-bold tracking-tight ${isDark ? "text-white" : "text-gray-900"}`}
                >
                  Create New Problem
                </h1>
                <p
                  className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}
                >
                  Contribute to the problem bank
                </p>
              </div>
            </div>

            {/* Action Buttons đưa lên top để dễ thao tác */}
            <div className="flex items-center gap-3">
              <Button color="gray" as={Link} href={PageUrl.QUESTION_BANKS_PAGE}>
                Cancel
              </Button>
              <DefaultCustomButton
                label="Create Problem"
                icon={<PlusIcon className="mr-2 h-5 w-5" />}
                onClick={handleSubmit}
                disabled={submitting}
                className="cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 gap-8 lg:grid-cols-3"
        >
          {/* LEFT COLUMN (MAIN CONTENT) */}
          <div className="space-y-6 lg:col-span-2">
            {/* Section: Basic Info */}
            <div
              className={`rounded-sm border p-6 shadow-sm ${isDark ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"}`}
            >
              <h2
                className={`mb-4 text-lg font-semibold ${isDark ? "text-white" : "text-gray-900"}`}
              >
                Problem Details
              </h2>

              <div className="space-y-4">
                <div>
                  <Label
                    htmlFor="title"
                    className={`mb-2 block ${isDark ? "text-white" : "text-gray-900"}`}
                  >
                    Title <span className="text-red-500">*</span>
                  </Label>
                  <TextInput
                    id="title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="e.g. Two Sum, Reverse Linked List..."
                    required
                    minLength={3}
                    maxLength={500}
                    className="w-full"
                  />
                </div>

                {/* Mode Selection */}
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div
                    onClick={() => {
                      setMode(PROBLEM_MODE.MANUAL);
                      setShowEditor(false);
                    }}
                    className={`cursor-pointer rounded-lg border-2 p-4 transition-all ${
                      mode === PROBLEM_MODE.MANUAL
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                        : "border-gray-200 hover:border-blue-300 dark:border-gray-700"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`rounded-full p-2 ${mode === PROBLEM_MODE.MANUAL ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-500"}`}
                      >
                        <DocumentTextIcon className="h-6 w-6" />
                      </div>
                      <div>
                        <p
                          className={`font-semibold ${isDark ? "text-white" : "text-gray-900"}`}
                        >
                          Manual Entry
                        </p>
                        <p className="text-xs text-gray-500">
                          Write description directly
                        </p>
                      </div>
                    </div>
                  </div>

                  <div
                    onClick={() => {
                      setMode(PROBLEM_MODE.FROM_FILE);
                      setShowEditor(false);
                    }}
                    className={`cursor-pointer rounded-lg border-2 p-4 transition-all ${
                      mode === PROBLEM_MODE.FROM_FILE
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                        : "border-gray-200 hover:border-blue-300 dark:border-gray-700"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`rounded-full p-2 ${mode === PROBLEM_MODE.FROM_FILE ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-500"}`}
                      >
                        <CloudArrowUpIcon className="h-6 w-6" />
                      </div>
                      <div>
                        <p
                          className={`font-semibold ${isDark ? "text-white" : "text-gray-900"}`}
                        >
                          Upload File
                        </p>
                        <p className="text-xs text-gray-500">
                          PDF, DOCX extraction
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section: Content Editor / Upload Area */}
            <div
              className={`min-h-[400px] rounded-sm border p-6 shadow-sm ${isDark ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"}`}
            >
              <h2
                className={`mb-4 flex items-center gap-2 text-lg font-semibold ${isDark ? "text-white" : "text-gray-900"}`}
              >
                Problem Content
                <span className="text-sm text-red-500">*</span>
              </h2>

              {mode === PROBLEM_MODE.MANUAL && (
                <>
                  <div
                    className={`flex flex-col rounded-lg border ${isDark ? "border-gray-600 bg-gray-700" : "border-gray-300 bg-white"}`}
                  >
                    {editor && (
                      <div className="border-b bg-gray-50 p-2 dark:border-gray-600 dark:bg-gray-700">
                        <TipTapToolbar editor={editor} isDark={isDark} />
                      </div>
                    )}
                    <div className="max-h-[600px] overflow-y-auto">
                      <EditorContent
                        editor={editor}
                        className={`prose max-w-none p-4 min-h-[300px] ${isDark ? 'prose-invert' : ''} 
                          [&_.ProseMirror]:cursor-text [&_.ProseMirror]:outline-none
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
                  </div>
                  <p className={`mt-1 text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                    Use the toolbar to format your problem description
                  </p>
                </>
              )}

              {mode === PROBLEM_MODE.FROM_FILE && (
                <div className="space-y-6">
                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    className="group relative"
                  >
                    <Label
                      htmlFor="dropzone-file"
                      className={`flex h-64 w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-colors ${
                        isDark
                          ? "border-gray-600 bg-gray-700/50 hover:border-blue-500 hover:bg-gray-700"
                          : "border-gray-300 bg-gray-50 hover:border-blue-500 hover:bg-blue-50"
                      }`}
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                        {uploading ? (
                          <Spinner size="xl" />
                        ) : (
                          <>
                            <div className="mb-4 rounded-full bg-blue-100 p-4 dark:bg-blue-900/30">
                              <CloudArrowUpIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                            </div>
                            <p
                              className={`mb-2 text-lg font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}
                            >
                              Drag & drop your file here
                            </p>
                            <p
                              className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}
                            >
                              PDF, DOCX, DOC or TXT (Max 10MB)
                            </p>
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

                  {/* File status & Extraction Logic (Keep your existing logic here, styled simpler) */}
                  {formData.fileName && (
                    <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
                      <div className="flex items-center gap-3">
                        <div className="rounded-full bg-green-100 p-2 text-green-600 dark:bg-green-900 dark:text-green-400">
                          <CheckCircleIcon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium text-green-800 dark:text-green-300">
                            File uploaded successfully
                          </p>
                          <p className="text-xs text-green-600 dark:text-green-400">
                            {formData.fileName}
                          </p>
                        </div>
                      </div>
                      {!showEditor && (
                        <Button
                          size="sm"
                          color="purple"
                          className="cursor-pointer"
                          onClick={handleExtractAndEdit}
                          disabled={extracting}
                        >
                          {extracting ? (
                            <Spinner size="xs" />
                          ) : (
                            "Extract & Edit"
                          )}
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Extracted Editor Display */}
                  {showEditor && editor && (
                    <div className="animate-fade-in mt-4">
                      <Label
                        className={`mb-2 block ${isDark ? "text-white" : "text-gray-900"}`}
                      >
                        Edit Extracted Content
                      </Label>
                      <div
                        className={`flex flex-col rounded-lg border ${isDark ? "border-gray-600 bg-gray-700" : "border-gray-300 bg-white"}`}
                      >
                        <div className="border-b bg-gray-50 p-2 dark:border-gray-600 dark:bg-gray-700">
                          <TipTapToolbar editor={editor} isDark={isDark} />
                        </div>
                        <div className="max-h-[600px] overflow-y-auto">
                          <EditorContent
                            editor={editor}
                            className={`prose max-w-none p-4 min-h-[300px] ${isDark ? 'prose-invert' : ''} 
                              [&_.ProseMirror]:cursor-text [&_.ProseMirror]:outline-none
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
                      </div>
                      <p className={`mt-1 text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                        Review and edit the extracted content before creating the problem
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Section: Code Templates */}
            <div
              className={`rounded-sm border p-6 shadow-xs ${isDark ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"}`}
            >
              <div className="mb-4 flex items-center justify-between">
                <h2
                  className={`text-lg font-semibold ${isDark ? "text-white" : "text-gray-900"}`}
                >
                  Starter Code
                </h2>
                <div className="flex gap-2">
                  <Select
                    value={selectedLanguageId}
                    onChange={(e) => setSelectedLanguageId(e.target.value)}
                    className="w-40"
                    sizing="sm"
                  >
                    <option value="">Select Lang...</option>
                    {programmingLanguages
                      .filter((lang) => !formData.codeTemplates[lang.id])
                      .map((lang) => (
                        <option key={lang.id} value={lang.id}>
                          {lang.name}
                        </option>
                      ))}
                  </Select>
                  <Button
                    size="sm"
                    onClick={() => {
                      if (
                        selectedLanguageId &&
                        !formData.codeTemplates[selectedLanguageId]
                      ) {
                        setFormData({
                          ...formData,
                          codeTemplates: {
                            ...formData.codeTemplates,
                            [selectedLanguageId]: "",
                          },
                        });
                        setSelectedLanguageId("");
                      }
                    }}
                    disabled={!selectedLanguageId}
                  >
                    <PlusIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                {Object.entries(formData.codeTemplates).length === 0 && (
                  <div className="rounded-lg border-2 border-dashed border-gray-200 py-8 text-center text-gray-500 italic dark:border-gray-700">
                    No templates added yet. Add a language to start.
                  </div>
                )}
                {Object.entries(formData.codeTemplates).map(
                  ([langId, template]) => (
                    <div
                      key={langId}
                      className={`relative overflow-hidden rounded-lg border transition-all hover:border-blue-400 ${isDark ? "border-gray-600 bg-gray-900" : "border-gray-200 bg-gray-50"}`}
                    >
                      <div className="flex items-center justify-between border-b bg-gray-100 px-4 py-2 dark:border-gray-600 dark:bg-gray-700">
                        <span className="font-mono text-sm font-semibold text-gray-700 dark:text-gray-200">
                          {programmingLanguages.find((l) => l.id === langId)
                            ?.name || langId}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const newT = { ...formData.codeTemplates };
                            delete newT[langId];
                            setFormData({ ...formData, codeTemplates: newT });
                          }}
                          className="text-gray-500 hover:text-red-500"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                      <Textarea
                        value={template}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            codeTemplates: {
                              ...formData.codeTemplates,
                              [langId]: e.target.value,
                            },
                          })
                        }
                        className="w-full border-none bg-transparent p-4 font-mono text-sm focus:ring-0"
                        rows={5}
                        placeholder="// Write starter code here..."
                      />
                    </div>
                  ),
                )}
              </div>
            </div>
          </div>

          {/* === RIGHT COLUMN (SIDEBAR) - Chiếm 1 phần === */}
          <div className="space-y-6 lg:col-span-1">
            {/* Card: Settings */}
            <div
              className={`sticky top-24 rounded-sm border p-6 shadow-sm ${isDark ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"}`}
            >
              <h3
                className={`mb-4 flex items-center gap-2 text-lg font-semibold ${isDark ? "text-white" : "text-gray-900"}`}
              >
                <AdjustmentsHorizontalIcon className="h-5 w-5" />
                Configuration
              </h3>

              <div className="space-y-5">
                {/* Difficulty */}
                <div>
                  <Label
                    htmlFor="difficulty"
                    className={isDark ? "text-white" : "text-gray-900"}
                  >
                    Difficulty
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

                {/* Tags */}
                <div>
                  <Label
                    htmlFor="tags"
                    className={isDark ? "text-white" : "text-gray-900"}
                  >
                    Tags
                  </Label>
                  <div className="mt-1 flex gap-2">
                    <TextInput
                      id="tags"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          const trimmed = tagInput.trim();
                          if (trimmed && !formData.tags.includes(trimmed)) {
                            setFormData({
                              ...formData,
                              tags: [...formData.tags, trimmed],
                            });
                            setTagInput("");
                          }
                        }
                      }}
                      placeholder="Add tag..."
                      className="flex-1"
                    />
                    <Button
                      size="sm"
                      color="light"
                      onClick={() => {
                        const trimmed = tagInput.trim();
                        if (trimmed && !formData.tags.includes(trimmed)) {
                          setFormData({
                            ...formData,
                            tags: [...formData.tags, trimmed],
                          });
                          setTagInput("");
                        }
                      }}
                    >
                      +
                    </Button>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {formData.tags.map((tag, index) => (
                      <span
                        key={index}
                        className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                          isDark
                            ? "bg-blue-400/10 text-blue-400 ring-blue-400/30"
                            : "bg-blue-50 text-blue-700 ring-blue-700/10"
                        }`}
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() =>
                            setFormData({
                              ...formData,
                              tags: formData.tags.filter((_, i) => i !== index),
                            })
                          }
                          className="ml-1 hover:text-red-500"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    {formData.tags.length === 0 && (
                      <span className="text-xs text-gray-400">
                        No tags selected
                      </span>
                    )}
                  </div>
                </div>

                <hr
                  className={isDark ? "border-gray-700" : "border-gray-200"}
                />

                {/* Test Cases Summary in Sidebar */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <Label className={isDark ? "text-white" : "text-gray-900"}>
                      Test Cases
                    </Label>
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                      {testCases.length}
                    </span>
                  </div>

                  <div className="max-h-[300px] space-y-2 overflow-y-auto pr-1">
                    {testCases.map((tc, index) => (
                      <div
                        key={index}
                        className={`group relative rounded-md border p-2 text-xs transition-colors hover:border-blue-400 ${isDark ? "border-gray-700 bg-gray-900" : "border-gray-200 bg-gray-50"}`}
                      >
                        <div className="truncate font-mono font-semibold text-gray-700 dark:text-gray-300">
                          In: {tc.inputData}
                        </div>
                        <div className="truncate font-mono text-gray-500">
                          Out: {tc.expectedOutput}
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setTestCases((prev) =>
                              prev.filter((_, i) => i !== index),
                            )
                          }
                          className="absolute top-1 right-1 hidden text-red-500 group-hover:block hover:text-red-700"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    {testCases.length === 0 && (
                      <div className="text-xs text-gray-500 italic">
                        No test cases added.
                      </div>
                    )}
                  </div>

                  <Button
                    fullSized
                    color="light"
                    className="mt-3 border-dashed cursor-pointer"
                    onClick={() => setShowTestcaseForm(true)}
                  >
                    <PlusIcon className="mr-2 h-4 w-4" /> Add Test Case
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Modal Test Case Form */}
      {showTestcaseForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="animate-in fade-in zoom-in w-full max-w-2xl duration-200">
            <TestcaseBlock
              isDark={isDark}
              onAdd={(tc) => {
                setTestCases((prev) => [...prev, tc]);
                setShowTestcaseForm(false); 
              }}
              onCancel={() => setShowTestcaseForm(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

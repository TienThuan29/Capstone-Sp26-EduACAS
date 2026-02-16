"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
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
  CheckIcon,
} from "@heroicons/react/24/outline";
import { useToast } from "@/hooks/useToast";
import { useProblem } from "@/hooks/problem/useProblem";
import { usePrivateS3 } from "@/hooks/s3/usePrivateS3";
import { useAuth } from "@/contexts/AuthContext";
import { useProgrammingLanguage } from "@/hooks/programming-language/useProgrammingLanguage";
import type { ProgrammingLanguage } from "@/types/language";
import { PageUrl } from "@/configs/page.url";
import type { Difficulty } from "@/types/problem";
import { DIFFICULTY, normalizeDifficulty } from "@/types/problem";
import type { UpdateProblemPayload } from "@/hooks/problem/useProblem";
import { DefaultCustomButton } from "@/components/ui/custom-button";
import { TestcaseBlock } from "../../components/testcase-block";
import type { CreateTestCasePayload } from "@/hooks/problem/useProblem";
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


const initialFormData = {
  title: "",
  content: "",
  fileName: "",
  difficulty: "EASY" as Difficulty,
  codeTemplates: {} as Record<string, string>,
  tags: [] as string[],
};

export default function EditProblemPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const { isDark } = useThemeContext();
  const toast = useToast();
  const { uploadFile, getFileUrl } = usePrivateS3();
  const { getProblemById, updateProblem } = useProblem();
  const { getEnabledProgrammingLanguages } = useProgrammingLanguage();

  const id = typeof params.id === "string" ? params.id : "";

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState(initialFormData);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFileLabel, setSelectedFileLabel] = useState<string | null>(
    null,
  );
  const [testCases, setTestCases] = useState<CreateTestCasePayload[]>([]);
  const [showTestcaseForm, setShowTestcaseForm] = useState(false);
  const [editorHtml, setEditorHtml] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [programmingLanguages, setProgrammingLanguages] = useState<ProgrammingLanguage[]>([]);
  const [selectedLanguageId, setSelectedLanguageId] = useState<string>("");

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

  useEffect(() => {
    if (!id) return;
    const loadProblem = async () => {
      setLoading(true);
      try {
        const data = await getProblemById(id);
        if (data) {
          setFormData({
            title: data.title,
            content: data.content,
            fileName: data.fileName,
            difficulty: normalizeDifficulty(data.difficulty),
            codeTemplates: data.codeTemplates || {},
            tags: data.tags || [],
          });

          if (!data.fileName && data.content) {
            const html = markdownToHtml(data.content);
            setEditorHtml(html);
            if (editor) {
              editor.commands.setContent(html);
            }
          }

          if (data.testCases && data.testCases.length > 0) {
            setTestCases(
              data.testCases.map((tc) => ({
                inputData: tc.inputData,
                expectedOutput: tc.expectedOutput,
                isPublic: tc.isPublic,
                isCaseInsensitive: tc.isCaseInsensitive,
                isFloatingPoint: tc.isFloatingPoint ?? false,
                floatingPointTolerance: tc.floatingPointTolerance ?? 0.0001,
                decimalPlaces: tc.decimalPlaces ?? 2,
                isTokenComparision: tc.isTokenComparision ?? false,
              })),
            );
          }
        } else {
          toast.showError("Problem not found");
          router.push(PageUrl.QUESTION_BANKS_PAGE);
        }
      } catch (error: unknown) {
        const err = error as { response?: { data?: { message?: string } } };
        toast.showError(
          err.response?.data?.message ?? "Failed to load problem",
        );
        router.push(PageUrl.QUESTION_BANKS_PAGE);
      } finally {
        setLoading(false);
      }
    };
    loadProblem();
  }, [id, getProblemById, toast, router, editor]);

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

  if (!mounted) return null;

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center p-8">
        <Spinner size="xl" />
        <span className={`ml-3 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
          Loading problem...
        </span>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setSubmitting(true);
    try {
      let finalContent = "";
      const hasAttachment = Boolean(formData.fileName?.trim());

      if (!hasAttachment) {
        if (editor) {
          const html = editor.getHTML();
          const turndownService = new TurndownService();
          finalContent = turndownService.turndown(html);
        }

        if (!finalContent.trim()) {
          toast.showError("Please enter problem content");
          return;
        }
      } else {
        finalContent = "";
      }

      const payload: UpdateProblemPayload = {
        title: formData.title,
        content: finalContent,
        fileName: formData.fileName,
        difficulty: formData.difficulty,
        codeTemplates: Object.keys(formData.codeTemplates).length > 0 ? formData.codeTemplates : undefined,
        testCases: testCases.length > 0 ? testCases : undefined,
        tags: formData.tags.length > 0 ? formData.tags : undefined,
      };

      await updateProblem(id, payload);
      toast.showSuccess("Problem updated successfully");
      router.push(PageUrl.QUESTION_BANKS_PAGE);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.showError(
        err.response?.data?.message ?? "Failed to update problem",
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
            Edit problem
          </h1>
          <p className={`mt-1 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
            Update the coding problem details
          </p>
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

          {!formData.fileName && (
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

          {formData.fileName && (
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label
                  htmlFor="dropzone-file"
                  className={isDark ? "text-white" : "text-gray-900"}
                >
                  Upload Problem File
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
                              Current: {formData.fileName}
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
                    className={`mt-1 text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
                  >
                    File name for problem:{" "}
                    <span className="font-mono font-medium">
                      {formData.fileName}
                    </span>
                  </p>
                )}
              </div>
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
              className={isDark ? "text-white" : "text-gray-900"}
            >
              Code Templates (by Language)
            </Label>
            <div className="mt-2 space-y-4">
              {Object.entries(formData.codeTemplates).map(([langId, template]) => {
                const lang = programmingLanguages.find(l => l.id === langId);
                return (
                  <div key={langId} className={`rounded-lg border p-4 ${isDark ? "border-gray-600 bg-gray-800" : "border-gray-200 bg-gray-50"}`}>
                    <div className="mb-2 flex items-center justify-between">
                      <span className={`font-medium ${isDark ? "text-white" : "text-gray-900"}`}>
                        {lang?.name || langId}
                      </span>
                      <Button
                        type="button"
                        size="xs"
                        color="failure"
                        onClick={() => {
                          const newTemplates = { ...formData.codeTemplates };
                          delete newTemplates[langId];
                          setFormData({ ...formData, codeTemplates: newTemplates });
                        }}
                        className="cursor-pointer"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                    <Textarea
                      value={template}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          codeTemplates: {
                            ...formData.codeTemplates,
                            [langId]: e.target.value,
                          },
                        });
                      }}
                      placeholder={`Starter code for ${lang?.name || langId}`}
                      rows={6}
                      className="font-mono text-sm"
                    />
                  </div>
                );
              })}
              <div className="flex gap-2">
                <Select
                  value={selectedLanguageId}
                  onChange={(e) => setSelectedLanguageId(e.target.value)}
                  className="flex-1"
                >
                  <option value="">Select a language...</option>
                  {programmingLanguages
                    .filter(lang => !formData.codeTemplates[lang.id])
                    .map((lang) => (
                      <option key={lang.id} value={lang.id}>
                        {lang.name}
                      </option>
                    ))}
                </Select>
                <Button
                  type="button"
                  color="blue"
                  onClick={() => {
                    if (selectedLanguageId && !formData.codeTemplates[selectedLanguageId]) {
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
                  className="cursor-pointer"
                >
                  <PlusIcon className="h-5 w-5" /> Add Template
                </Button>
              </div>
            </div>
            <p className={`mt-1 text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
              Add starter code templates for different programming languages
            </p>
          </div>

          <div>
            <Label
              htmlFor="tags"
              className={isDark ? "text-white" : "text-gray-900"}
            >
              Tags
            </Label>
            <div className="mt-1 flex flex-wrap gap-2">
              {formData.tags.map((tag, index) => (
                <span
                  key={index}
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium ${
                    isDark
                      ? "bg-blue-900 text-blue-200"
                      : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        tags: formData.tags.filter((_, i) => i !== index),
                      });
                    }}
                    className={`ml-1 rounded-full hover:bg-opacity-80 ${
                      isDark ? "text-blue-200 hover:text-blue-100" : "text-blue-800 hover:text-blue-900"
                    }`}
                  >
                    <span className="sr-only">Remove tag</span>
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="mt-2 flex gap-2">
              <TextInput
                id="tags"
                type="text"
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
                placeholder="Type a tag and press Enter"
                className="flex-1"
              />
              <Button
                type="button"
                color="blue"
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
                className="cursor-pointer"
              >
                Add Tag
              </Button>
            </div>
            <p className={`mt-1 text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
              Add tags to categorize your problem (e.g., "arrays", "dynamic-programming", "graph")
            </p>
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
                        {tc.isFloatingPoint && " · Floating point"}
                        {tc.isTokenComparision && " · Token comparison"}
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
                label="Update problem"
                icon={<CheckIcon className="h-5 w-5" />}
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

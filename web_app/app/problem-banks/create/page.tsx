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
import type { Difficulty } from "@/types/problem";
import { DIFFICULTY } from "@/types/problem";
import type {
  CreateProblemPayload,
  CreateTestCasePayload,
} from "@/hooks/problem/useProblem";
import { DefaultCustomButton } from "@/components/ui/custom-button";
import { TestcaseBlock } from "../components/testcase-block";

const initialFormData = {
  lecturerId: "",
  title: "",
  content: "",
  fileName: "",
  mark: "",
  difficulty: "EASY" as Difficulty,
  codeTemplate: "",
};

export default function CreateProblemPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { isDark } = useThemeContext();
  const toast = useToast();
  const { uploadFile } = usePrivateS3();
  const { createProblem } = useProblem();

  const [mounted, setMounted] = useState(false);
  const [formData, setFormData] = useState(initialFormData);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFileLabel, setSelectedFileLabel] = useState<string | null>(
    null,
  );
  const [testCases, setTestCases] = useState<CreateTestCasePayload[]>([]);
  const [showTestcaseForm, setShowTestcaseForm] = useState(false);

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

  if (!mounted) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fileName?.trim()) {
      toast.showError("Please upload a template file first");
      return;
    }
    const markNum = parseFloat(formData.mark);
    if (Number.isNaN(markNum) || markNum < 0.1 || markNum > 100) {
      toast.showError("Mark must be between 0.1 and 100");
      return;
    }
    setSubmitting(true);
    try {
      const payload: CreateProblemPayload = {
        lecturerId: formData.lecturerId || (user?.id ?? ""),
        title: formData.title,
        content: formData.content,
        fileName: formData.fileName,
        mark: markNum,
        difficulty: formData.difficulty,
        codeTemplate: formData.codeTemplate,
        testCases: testCases.length > 0 ? testCases : undefined,
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

          <div>
            <Label
              htmlFor="content"
              className={isDark ? "text-white" : "text-gray-900"}
            >
              Content <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) =>
                setFormData({ ...formData, content: e.target.value })
              }
              placeholder="Problem description (10–50000 characters)"
              required
              rows={6}
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-1 gap-4">
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

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label
                htmlFor="mark"
                className={isDark ? "text-white" : "text-gray-900"}
              >
                Mark (0-10) <span className="text-red-500">*</span>
              </Label>
              <TextInput
                id="mark"
                type="number"
                step="0.1"
                min="0.1"
                max="100"
                value={formData.mark}
                onChange={(e) =>
                  setFormData({ ...formData, mark: e.target.value })
                }
                required
                className="mt-1"
              />
            </div>
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

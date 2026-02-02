"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useThemeContext } from "@/components/theme-provider";
import {
  Button,
  TextInput,
  Textarea,
  Select,
  Label,
  Spinner,
} from "flowbite-react";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { useToast } from "@/hooks/useToast";
import { useProblem } from "@/hooks/problem/useProblem";
import { PageUrl } from "@/configs/page.url";
import type { Difficulty } from "@/types/problem";
import { DIFFICULTY } from "@/types/problem";
import type { UpdateProblemPayload } from "@/hooks/problem/useProblem";

type FormData = {
  title: string;
  content: string;
  fileName: string;
  mark: string;
  difficulty: Difficulty;
  codeTemplate: string;
};

export default function ProblemEditPage() {
  const params = useParams();
  const router = useRouter();
  const { isDark } = useThemeContext();
  const toast = useToast();
  const { getProblemById, updateProblem } = useProblem();

  const id = typeof params.id === "string" ? params.id : "";
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    title: "",
    content: "",
    fileName: "",
    mark: "",
    difficulty: "EASY",
    codeTemplate: "",
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoading(true);
      try {
        const problem = await getProblemById(id);
        if (problem) {
          setFormData({
            title: problem.title,
            content: problem.content,
            fileName: problem.fileName,
            mark: String(problem.mark),
            difficulty: normalizeDifficulty(problem.difficulty),
            codeTemplate: problem.codeTemplate ?? "",
          });
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
  }, [id, getProblemById, toast]);

  if (!mounted) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const markNum = parseFloat(formData.mark);
    if (Number.isNaN(markNum) || markNum < 0.1 || markNum > 100) {
      toast.showError("Mark must be between 0.1 and 100");
      return;
    }
    setSubmitting(true);
    try {
      const payload: UpdateProblemPayload = {
        title: formData.title,
        content: formData.content,
        fileName: formData.fileName,
        mark: markNum,
        difficulty: formData.difficulty,
        codeTemplate: formData.codeTemplate,
      };
      await updateProblem(id, payload);
      toast.showSuccess("Problem updated successfully");
      router.push(PageUrl.PROBLEM_BANKS_VIEW_PAGE(id));
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.showError(err.response?.data?.message ?? "Failed to update problem");
    } finally {
      setSubmitting(false);
    }
  };

  function normalizeDifficulty(value: number | Difficulty): Difficulty {
    if (typeof value === "number") {
      const map: Record<number, Difficulty> = { 0: "EASY", 1: "MEDIUM", 2: "HARD" };
      return map[value] ?? "EASY";
    }
    return value;
  }

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

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center gap-4">
        <Button
          as={Link}
          href={id ? PageUrl.PROBLEM_BANKS_VIEW_PAGE(id) : PageUrl.QUESTION_BANKS_PAGE}
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
            Update problem details
          </p>
        </div>
      </div>

      <div
        className={`rounded-lg border p-6 ${isDark ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"}`}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="title" className={isDark ? "text-white" : "text-gray-900"}>
              Title <span className="text-red-500">*</span>
            </Label>
            <TextInput
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              minLength={3}
              maxLength={500}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="content" className={isDark ? "text-white" : "text-gray-900"}>
              Content <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              required
              rows={6}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="fileName" className={isDark ? "text-white" : "text-gray-900"}>
              File name <span className="text-red-500">*</span>
            </Label>
            <TextInput
              id="fileName"
              value={formData.fileName}
              onChange={(e) => setFormData({ ...formData, fileName: e.target.value })}
              required
              className="mt-1 font-mono"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="mark" className={isDark ? "text-white" : "text-gray-900"}>
                Mark (0.1–100) <span className="text-red-500">*</span>
              </Label>
              <TextInput
                id="mark"
                type="number"
                step="0.1"
                min="0.1"
                max="100"
                value={formData.mark}
                onChange={(e) => setFormData({ ...formData, mark: e.target.value })}
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="difficulty" className={isDark ? "text-white" : "text-gray-900"}>
                Difficulty <span className="text-red-500">*</span>
              </Label>
              <Select
                id="difficulty"
                value={formData.difficulty}
                onChange={(e) =>
                  setFormData({ ...formData, difficulty: e.target.value as Difficulty })
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
            <Label htmlFor="codeTemplate" className={isDark ? "text-white" : "text-gray-900"}>
              Code template
            </Label>
            <Textarea
              id="codeTemplate"
              value={formData.codeTemplate}
              onChange={(e) =>
                setFormData({ ...formData, codeTemplate: e.target.value })
              }
              rows={8}
              className="mt-1 font-mono text-sm"
            />
          </div>
          <div className="flex gap-4 pt-4">
            <Button
              type="button"
              color="gray"
              as={Link}
              href={id ? PageUrl.PROBLEM_BANKS_VIEW_PAGE(id) : PageUrl.QUESTION_BANKS_PAGE}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              color="purple"
              disabled={submitting}
              className="cursor-pointer bg-[#1F4E79] hover:bg-[#1F4E79]/90"
            >
              {submitting ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Updating...
                </>
              ) : (
                "Update problem"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

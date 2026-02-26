"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, Badge, Button, Label, TextInput } from "flowbite-react";
import { EyeIcon, ChatBubbleLeftRightIcon, PlusIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useEditor } from "@tiptap/react";
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
import { useDiscussionIssue } from "@/hooks/discussion/useDiscussionIssue";
import { useAuth } from "@/contexts/AuthContext";
import { useThemeContext } from "@/components/theme-provider";
import { TextEditor } from "@/components/text-editor";
import { htmlToMarkdown } from "@/utils/markdown-converter";
import type { DiscussionIssueListItem } from "@/types/discussion";

const PAGE_SIZE = 10;
const lowlight = createLowlight(all);

type DiscussionListProps = {
  classId: string;
  /** Base path for classroom: "my-classroom" (student) or "manage-classroom" (lecturer). Default "my-classroom". */
  classroomBasePath?: "my-classroom" | "manage-classroom";
};

function isEmptyHtml(html: string): boolean {
  const t = html.trim();
  if (!t) return true;
  if (t === "<p></p>" || t === "<p><br></p>") return true;
  return false;
}

export function DiscussionList({
  classId,
  classroomBasePath = "my-classroom",
}: DiscussionListProps) {
  const router = useRouter();
  const { getPagedByClassroom } = useDiscussionIssue();
  const [items, setItems] = useState<DiscussionIssueListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageIndex, setPageIndex] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [showNewForm, setShowNewForm] = useState(false);
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const refetch = useCallback(() => {
    if (!classId) return;
    getPagedByClassroom(classId, pageIndex, PAGE_SIZE).then((data) => {
      setItems(data.items ?? []);
      setTotalCount(data.totalCount ?? 0);
    });
  }, [classId, pageIndex, getPagedByClassroom]);

  useEffect(() => {
    if (!classId) {
      setItems([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    getPagedByClassroom(classId, pageIndex, PAGE_SIZE)
      .then((data) => {
        if (!cancelled) {
          setItems(data.items ?? []);
          setTotalCount(data.totalCount ?? 0);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err?.response?.data?.message ?? "Failed to load discussions");
          setItems([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [classId, pageIndex, getPagedByClassroom]);

  const handleNewIssueCreated = useCallback(
    (issueId: string) => {
      setShowNewForm(false);
      refetch();
      router.push(`/${classroomBasePath}/${classId}?tab=discussion&issue=${issueId}`, { scroll: false });
    },
    [classroomBasePath, classId, refetch, router]
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="border-l-8 border-[#1F4E79] pl-4 text-3xl font-black text-gray-900 dark:border-[#C9A24D] dark:text-white">
            Discussion Channel
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Browse and participate in Q&A.
          </p>
        </div>
        <Button
          color="gray"
          className={
            showNewForm
              ? "shrink-0 cursor-pointer bg-gray-500 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-700"
              : "shrink-0 cursor-pointer bg-[#1F4E79] hover:bg-[#1F4E79]/90 dark:bg-[#C9A24D] dark:hover:bg-[#C9A24D]/90"
          }
          onClick={() => setShowNewForm((prev) => !prev)}
        >
          {showNewForm ? <XMarkIcon className="h-4 w-4" /> : <PlusIcon className="h-4 w-4" />}
          {showNewForm ? "Cancel new issue" : "New Discussion Issue"}
        </Button>
      </div>

      {showNewForm && (
        <NewDiscussionForm
          classId={classId}
          classroomBasePath={classroomBasePath}
          onCancel={() => setShowNewForm(false)}
          onSuccess={handleNewIssueCreated}
        />
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 py-4 text-center text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 bg-white py-16 text-center dark:border-gray-700 dark:bg-gray-800">
          <p className="font-medium text-gray-500 dark:text-gray-400">
            Loading discussions…
          </p>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 bg-white py-16 text-center dark:border-gray-700 dark:bg-gray-800">
          <p className="font-medium text-gray-500 dark:text-gray-400">
            No discussions yet. Start one when you have a question.
          </p>
        </div>
      ) : (
        <>
          <ul className="space-y-3">
            {items.map((issue) => {
              const tags = issue.tags ?? [];
              const content = (
                <Card
                  className="cursor-pointer border border-gray-200 transition-all hover:border-[#1F4E79] hover:shadow-xs dark:border-gray-700 dark:hover:border-[#C9A24D]"
                  key={issue.id}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        {issue.title}
                      </h3>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {tags.map((tag) => (
                          <Badge key={tag} color="gray" className="font-medium">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1.5" title="Views">
                        <EyeIcon className="h-4 w-4" />
                        {issue.viewCount}
                      </span>
                      <span className="flex items-center gap-1.5" title="Comments">
                        <ChatBubbleLeftRightIcon className="h-4 w-4" />
                        {issue.commentCount}
                      </span>
                    </div>
                  </div>
                </Card>
              );

              const issueHref = `/${classroomBasePath}/${classId}?tab=discussion&issue=${issue.id}`;
              return (
                <li key={issue.id}>
                  <Link href={issueHref} className="block">
                    {content}
                  </Link>
                </li>
              );
            })}
          </ul>
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                type="button"
                onClick={() => setPageIndex((p) => Math.max(1, p - 1))}
                disabled={pageIndex <= 1}
                className="rounded border border-gray-300 px-3 py-1 text-sm disabled:opacity-50 dark:border-gray-600"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Page {pageIndex} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPageIndex((p) => Math.min(totalPages, p + 1))}
                disabled={pageIndex >= totalPages}
                className="rounded border border-gray-300 px-3 py-1 text-sm disabled:opacity-50 dark:border-gray-600"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}


type NewDiscussionFormProps = {
  classId: string;
  classroomBasePath: string;
  onCancel: () => void;
  onSuccess: (issueId: string) => void;
};

function NewDiscussionForm({
  classId,
  onCancel,
  onSuccess,
}: NewDiscussionFormProps) {
  const { user } = useAuth();
  const { isDark } = useThemeContext();
  const { createIssue } = useDiscussionIssue();
  const [title, setTitle] = useState("");
  const [contentHtml, setContentHtml] = useState("");
  const [refProblemId, setRefProblemId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      CodeBlockLowlight.configure({
        lowlight,
        HTMLAttributes: { class: "hljs" },
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
        alignments: ["left", "center", "right", "justify"],
      }),
      TextStyle,
      Underline,
      TipTapLink.configure({
        openOnClick: false,
        HTMLAttributes: { class: "text-blue-600 underline" },
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: { class: "border-collapse table-auto w-full" },
      }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: "",
    onUpdate: ({ editor }) => {
      setContentHtml(editor.getHTML());
    },
    editable: true,
    editorProps: { attributes: { spellcheck: "false" } },
    immediatelyRender: false,
  });

  useEffect(() => {
    if (editor && !editor.isDestroyed) {
      editor.commands.setContent("");
    }
  }, [editor]);

  const handleSubmit = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setSubmitError("Title is required.");
      return;
    }
    if (isEmptyHtml(contentHtml)) {
      setSubmitError("Content is required.");
      return;
    }
    if (!user?.id) {
      setSubmitError("You must be signed in to create a discussion.");
      return;
    }
    setSubmitError(null);
    setSubmitting(true);
    try {
      const contentMarkdown = htmlToMarkdown(contentHtml);
      const issue = await createIssue({
        classroomId: classId,
        authorId: user.id,
        title: trimmedTitle,
        content: contentMarkdown,
        refProblemId: refProblemId.trim() || undefined,
      });
      if (issue?.id) {
        onSuccess(issue.id);
      } else {
        setSubmitError("Failed to create discussion. Please try again.");
      }
    } catch (err: unknown) {
      setSubmitError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          "Failed to create discussion. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
        New Discussion Issue
      </h3>
      <div className="space-y-4">
        <div>
          <Label htmlFor="new-issue-title" className="mb-1 block text-gray-900 dark:text-white">
            Title
          </Label>
          <TextInput
            id="new-issue-title"
            placeholder="Summarize your question or topic"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full"
          />
        </div>
        <div>
          <TextEditor
            editor={editor}
            isDark={!!isDark}
            label="Content"
            helperText="Use the toolbar to format your question or description. You can use code blocks for snippets."
          />
        </div>
        {/* <div>
          <Label htmlFor="new-issue-ref" className="mb-1 block text-gray-900 dark:text-white">
            Related problem (optional)
          </Label>
          <TextInput
            id="new-issue-ref"
            placeholder="Problem ID if this relates to a specific problem"
            value={refProblemId}
            onChange={(e) => setRefProblemId(e.target.value)}
            className="w-full"
          />
        </div> */}
        {submitError && (
          <p className="text-sm text-red-600 dark:text-red-400">{submitError}</p>
        )}
        <div className="flex gap-2">
          <Button
            color="gray"
            outline
            onClick={onCancel}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            className="bg-[#1F4E79] hover:bg-[#1F4E79]/90 dark:bg-[#C9A24D] dark:hover:bg-[#C9A24D]/90"
            onClick={handleSubmit}
            disabled={submitting || !title.trim() || isEmptyHtml(contentHtml)}
          >
            {submitting ? "Creating…" : "Create discussion"}
          </Button>
        </div>
      </div>
    </div>
  );
}
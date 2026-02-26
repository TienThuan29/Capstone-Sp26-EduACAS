"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Badge,
  Button,
  Label,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Pagination,
  TextInput,
  Timeline,
  TimelineBody,
  TimelineContent,
  TimelineItem,
  TimelinePoint,
  TimelineTime,
  TimelineTitle,
} from "flowbite-react";
import {
  EyeIcon,
  ChatBubbleLeftRightIcon,
  PlusIcon,
  XMarkIcon,
  PencilSquareIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
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
import { formatDate } from "@/utils/datetime-utils";
import { useDiscussionIssue } from "@/hooks/discussion/useDiscussionIssue";
import { useAuth } from "@/contexts/AuthContext";
import { useThemeContext } from "@/components/theme-provider";
import { TextEditor } from "@/components/text-editor";
import { htmlToMarkdown, markdownToHtml } from "@/utils/markdown-converter";
import type { DiscussionIssue, DiscussionIssueListItem } from "@/types/discussion";

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
  const { user } = useAuth();
  const { getPagedByClassroom, getById, softDeleteIssue } = useDiscussionIssue();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [issueToDelete, setIssueToDelete] = useState<string | null>(null);
  const [items, setItems] = useState<DiscussionIssueListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageIndex, setPageIndex] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [showNewForm, setShowNewForm] = useState(false);
  const [editingIssue, setEditingIssue] = useState<DiscussionIssue | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "my-discussion">("all");
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const displayedItems =
    activeTab === "my-discussion" && user?.id
      ? items.filter((i) => i.authorId === user.id)
      : items;

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

  const handleFormSuccess = useCallback(
    (issueId: string, options?: { isEdit?: boolean }) => {
      setShowNewForm(false);
      setEditingIssue(null);
      refetch();
      if (!options?.isEdit) {
        router.push(`/${classroomBasePath}/${classId}?tab=discussion&issue=${issueId}`, {
          scroll: false,
        });
      }
    },
    [classroomBasePath, classId, refetch, router]
  );

  const handleEditClick = useCallback(
    async (issueId: string, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const issue = await getById(issueId);
      if (issue) setEditingIssue(issue);
    },
    [getById]
  );

  const openDeleteModal = useCallback((issueId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIssueToDelete(issueId);
  }, []);

  const closeDeleteModal = useCallback(() => {
    if (!deletingId) setIssueToDelete(null);
  }, [deletingId]);

  const confirmDeleteIssue = useCallback(async () => {
    if (!issueToDelete) return;
    setDeletingId(issueToDelete);
    try {
      const ok = await softDeleteIssue(issueToDelete);
      if (ok) {
        setIssueToDelete(null);
        refetch();
      }
    } finally {
      setDeletingId(null);
    }
  }, [issueToDelete, softDeleteIssue, refetch]);

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
        {/* Create new discussion issue button */}
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

      <div className="flex rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
        <Button
          onClick={() => setActiveTab("all")}
          className={`rounded-md border-0 bg-transparent px-4 py-2 text-sm font-bold transition-all ${
            activeTab === "all"
              ? "bg-white text-[#1F4E79] dark:bg-gray-700 dark:text-white"
              : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          }`}
        >
          All
        </Button>
        <Button
          onClick={() => setActiveTab("my-discussion")}
          className={`rounded-md border-0 bg-transparent px-4 py-2 text-sm font-bold transition-all ${
            activeTab === "my-discussion"
              ? "bg-white text-[#1F4E79] dark:bg-gray-700 dark:text-white"
              : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          }`}
        >
          My discussion
        </Button>
      </div>

      {(showNewForm || editingIssue) && (
        <NewDiscussionForm
          classId={classId}
          classroomBasePath={classroomBasePath}
          initialIssue={
            editingIssue
              ? {
                  id: editingIssue.id,
                  title: editingIssue.title,
                  content: editingIssue.content,
                  refProblemId: editingIssue.refProblemId || undefined,
                }
              : undefined
          }
          onCancel={() => {
            setShowNewForm(false);
            setEditingIssue(null);
          }}
          onSuccess={handleFormSuccess}
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
      ) : displayedItems.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 bg-white py-16 text-center dark:border-gray-700 dark:bg-gray-800">
          <p className="font-medium text-gray-500 dark:text-gray-400">
            {activeTab === "my-discussion"
              ? "You haven't started any discussions yet. Use \"New Discussion Issue\" to create one."
              : "No discussions yet. Start one when you have a question."}
          </p>
        </div>
      ) : (
        <>
          <Timeline className="relative z-10 border-gray-200 dark:border-gray-600">
            {displayedItems.map((issue) => {
              const tags = issue.tags ?? [];
              const issueHref = `/${classroomBasePath}/${classId}?tab=discussion&issue=${issue.id}`;
              const isDeleting = deletingId === issue.id;

              return (
                <TimelineItem key={issue.id}>
                  <TimelinePoint className="border-0 bg-[#1F4E79] dark:bg-[#C9A24D]" />
                  <TimelineContent>
                    <TimelineTime className="text-gray-500 dark:text-gray-400">
                      {formatDate(issue.createdDate)}
                    </TimelineTime>
                    <TimelineTitle className="text-gray-900 dark:text-gray-100">
                      <Link
                        href={issueHref}
                        className="hover:text-[#1F4E79] dark:hover:text-[#C9A24D]"
                      >
                        {issue.title}
                      </Link>
                    </TimelineTitle>
                    <TimelineBody className="text-gray-600 dark:text-gray-300">
                      <div className="mt-2 flex flex-wrap gap-2">
                        {tags.map((tag) => (
                          <Badge key={tag} color="gray" className="font-medium">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1.5" title="Views">
                          <EyeIcon className="h-4 w-4" />
                          {issue.viewCount}
                        </span>
                        <span className="flex items-center gap-1.5" title="Comments">
                          <ChatBubbleLeftRightIcon className="h-4 w-4" />
                          {issue.commentCount}
                        </span>
                        {activeTab === "my-discussion" && (
                          <>
                            <Button
                              size="xs"
                              color="gray"
                              onClick={(e: React.MouseEvent) => handleEditClick(issue.id, e)}
                              className="cursor-pointer"
                              title="Edit"
                            >
                              <PencilSquareIcon className="h-4 w-4" />
                              Edit
                            </Button>
                            <Button
                              size="xs"
                              color="red"
                              onClick={(e: React.MouseEvent) =>
                                openDeleteModal(issue.id, e)
                              }
                              disabled={isDeleting}
                              className="cursor-pointer"
                              title="Delete"
                            >
                              <TrashIcon className="h-4 w-4" />
                              Delete
                            </Button>
                          </>
                        )}
                      </div>
                    </TimelineBody>
                  </TimelineContent>
                </TimelineItem>
              );
            })}
          </Timeline>
          {totalPages > 1 && (
            <div className="flex overflow-x-auto justify-center pt-4">
              <Pagination
                currentPage={pageIndex}
                totalPages={totalPages}
                onPageChange={(page) => setPageIndex(page)}
              />
            </div>
          )}
        </>
      )}

      <DeleteDiscussionModal
        show={issueToDelete !== null}
        onClose={closeDeleteModal}
        onConfirm={confirmDeleteIssue}
        isDeleting={!!deletingId}
      />
    </div>
  );
}

type DeleteDiscussionModalProps = {
  show: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
};

function DeleteDiscussionModal({
  show,
  onClose,
  onConfirm,
  isDeleting,
}: DeleteDiscussionModalProps) {
  return (
    <Modal show={show} onClose={onClose} size="md">
      <ModalHeader>Delete discussion</ModalHeader>
      <ModalBody>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Delete this discussion? This cannot be undone.
        </p>
      </ModalBody>
      <ModalFooter>
        <Button
          color="gray"
          onClick={onClose}
          disabled={isDeleting}
          className="cursor-pointer"
        >
          Cancel
        </Button>
        <Button
          color="red"
          onClick={onConfirm}
          disabled={isDeleting}
          className="cursor-pointer"
        >
          {isDeleting ? "Deleting…" : "Delete"}
        </Button>
      </ModalFooter>
    </Modal>
  );
}

type DiscussionFormInitialIssue = {
  id: string;
  title: string;
  content: string;
  refProblemId?: string;
};

type NewDiscussionFormProps = {
  classId: string;
  classroomBasePath: string;
  onCancel: () => void;
  onSuccess: (issueId: string, options?: { isEdit?: boolean }) => void;
  /** When set, form is in edit mode with pre-filled data. */
  initialIssue?: DiscussionFormInitialIssue | null;
};

function NewDiscussionForm({
  classId,
  onCancel,
  onSuccess,
  initialIssue,
}: NewDiscussionFormProps) {
  const { user } = useAuth();
  const { isDark } = useThemeContext();
  const { createIssue, updateIssue } = useDiscussionIssue();
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
    if (!editor || editor.isDestroyed) return;
    if (initialIssue) {
      setTitle(initialIssue.title);
      const html = markdownToHtml(initialIssue.content);
      setContentHtml(html);
      setRefProblemId(initialIssue.refProblemId ?? "");
      editor.commands.setContent(html);
    } else {
      setTitle("");
      setContentHtml("");
      setRefProblemId("");
      editor.commands.setContent("");
    }
    // Only re-run when switching between create and edit (by issue id), not on every initialIssue reference change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, initialIssue?.id]);

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
    const contentMarkdown = htmlToMarkdown(contentHtml);
    try {
      if (initialIssue) {
        const issue = await updateIssue(initialIssue.id, {
          title: trimmedTitle,
          content: contentMarkdown,
          refProblemId: refProblemId.trim() || undefined,
        });
        if (issue?.id) {
          onSuccess(issue.id, { isEdit: true });
        } else {
          setSubmitError("Failed to update discussion. Please try again.");
        }
      } else {
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
      }
    } catch (err: unknown) {
      setSubmitError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          (initialIssue ? "Failed to update discussion. Please try again." : "Failed to create discussion. Please try again.")
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
        {initialIssue ? "Edit Discussion Issue" : "New Discussion Issue"}
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
        {/* Future feature: related problem,... */}
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
            className="cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            className="bg-[#1F4E79] hover:bg-[#1F4E79]/90 dark:bg-[#C9A24D] dark:hover:bg-[#C9A24D]/90 cursor-pointer"
            onClick={handleSubmit}
            disabled={submitting || !title.trim() || isEmptyHtml(contentHtml)}
          >
            {initialIssue
              ? submitting
                ? "Updating…"
                : "Update discussion"
              : submitting
                ? "Creating…"
                : "Create discussion"}
          </Button>
        </div>
      </div>
    </div>
  );
}
"use client";

import { useState, useEffect, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
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
import {
  Button,
  Badge,
  Avatar,
  Select,
  Label,
  HR,
} from "flowbite-react";
import { useThemeContext } from "@/components/theme-provider";
import { TextEditor } from "@/app/problem-banks/components/text-editor";
import type {
  DiscussionIssue,
  DiscussionIssueStatus,
  Comment,
} from "@/types/discussion";
import { formatDate } from "@/utils/datetime-utils";
import { htmlToMarkdown } from "@/utils/markdown-converter";

function totalCommentCount(comments: Comment[]): number {
  return comments.reduce((sum, c) => sum + 1 + totalCommentCount(c.replies), 0);
}

/** Shared ReactMarkdown components for issue and comment body: proper inline vs block code styling */
const discussionMarkdownComponents = {
  code({ className, children, ...props }: React.ComponentProps<"code">) {
    const match = /language-(\w+)/.exec(className || "");
    const isInline = !match && !String(children).includes("\n");
    if (isInline) {
      return (
        <code
          className="rounded bg-gray-200 px-1.5 py-0.5 font-mono text-sm text-gray-800 dark:bg-gray-700 dark:text-gray-200"
          {...props}
        >
          {children}
        </code>
      );
    }
    return (
      <code
        className={`block font-mono text-sm text-gray-800 dark:text-gray-200 ${className || ""}`}
        {...props}
      >
        {children}
      </code>
    );
  },
  pre({ children, ...props }: React.ComponentProps<"pre">) {
    return (
      <pre
        className="overflow-x-auto rounded-lg px-4 py-3 text-sm text-gray-100 dark:bg-gray-900"
        {...props}
      >
        {children}
      </pre>
    );
  },
};

import {
  HandThumbUpIcon,
  ChatBubbleLeftRightIcon,
  EyeIcon,
  ChevronLeftIcon,
} from "@heroicons/react/24/outline";

type DiscussionDetailProps = {
  issue: DiscussionIssue;
  classId: string;
  onBack: () => void;
  onMarkAccepted?: (commentId: string) => void;
  onUpvote?: (target: "issue" | "comment", id: string) => void;
  onStatusChange?: (status: DiscussionIssueStatus) => void;
  onSubmitComment?: (content: string, parentCommentId?: string) => void;
};

type DiscussionDetailSidebarProps = {
  issue: DiscussionIssue;
  commentCount: number;
  onUpvote?: (target: "issue" | "comment", id: string) => void;
  onMarkAccepted?: (commentId: string) => void;
  onStatusChange?: (status: DiscussionIssueStatus) => void;
};

function DiscussionDetailSidebar({
  issue,
  commentCount,
  onUpvote,
  onMarkAccepted,
  onStatusChange,
}: DiscussionDetailSidebarProps) {
  const [selectedStatus, setSelectedStatus] =
    useState<DiscussionIssueStatus>(issue.status);

  useEffect(() => {
    setSelectedStatus(issue.status);
  }, [issue.status]);

  const handleSaveStatus = () => {
    onStatusChange?.(selectedStatus);
  };

  const hasStatusChanged = selectedStatus !== issue.status;

  return (
    <div className="lg:col-span-4 lg:border-l lg:border-gray-200 lg:pl-8 lg:dark:border-gray-600">
      <div className="sticky top-24">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Avatar
              size="lg"
              img={issue.authorDisplay?.avatarUrl}
              rounded
            ></Avatar>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">
                {issue.authorDisplay?.fullName ?? "Unknown"}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Asked {formatDate(issue.createdDate)}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 border-t border-gray-200 pt-3 dark:border-gray-600">
            <Label htmlFor="issue-status" className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Status
            </Label>
            <div className="flex items-center gap-2">
              <Select
                id="issue-status"
                value={selectedStatus}
                onChange={(e) =>
                  setSelectedStatus(e.target.value as DiscussionIssueStatus)
                }
                className="min-w-0 flex-1"
              >
                <option value="Open">Open</option>
                <option value="Close">Closed</option>
              </Select>
              {onStatusChange && (
                <Button
                  size="sm"
                  className="shrink-0 cursor-pointer bg-[#1F4E79] hover:bg-[#1F4E79]/90 dark:bg-[#C9A24D] dark:hover:bg-[#C9A24D]/90"
                  onClick={handleSaveStatus}
                  disabled={!hasStatusChanged}
                >
                  Save
                </Button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 border-t border-gray-200 pt-3 dark:border-gray-600">
            <span className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
              <EyeIcon className="h-4 w-4" />
              {issue.viewCount} views
            </span>
            <span className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
              <ChatBubbleLeftRightIcon className="h-4 w-4" />
              {commentCount} comments
            </span>
          </div>

          <div className="flex flex-col gap-2 border-t border-gray-200 pt-3 dark:border-gray-600">
            {onUpvote && (
              <Button
                color="light"
                size="sm"
                className="cursor-pointer"
                onClick={() => onUpvote("issue", issue.id)}
              >
                <HandThumbUpIcon className="mr-2 h-4 w-4" />
                Upvote
              </Button>
            )}
            {onMarkAccepted && (
              <Button
                color="gray"
                size="sm"
                outline
                className="cursor-pointer"
                onClick={() => {}}
              >
                Mark as Accepted Answer
              </Button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

type CommentReplyBoxProps = {
  compact: boolean;
  isReplying: boolean;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onCancel: () => void;
  onSubmit: () => void;
};

const lowlight = createLowlight(all);

function CommentReplyBox({
  compact,
  isReplying,
  value,
  onChange,
  onCancel,
  onSubmit,
}: CommentReplyBoxProps) {
  const { isDark } = useThemeContext();

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
    content: value || "",
    onUpdate: ({ editor }) => {
      onChange({
        target: { value: editor.getHTML() },
      } as React.ChangeEvent<HTMLTextAreaElement>);
    },
    editable: true,
    editorProps: { attributes: { spellcheck: "false" } },
    immediatelyRender: false,
  });

  useEffect(() => {
    if (value === "" && editor && !editor.isDestroyed) {
      editor.commands.setContent("");
    }
  }, [value, editor]);

  const isEmptyHtml = (html: string) => {
    const t = html.trim();
    if (!t) return true;
    if (t === "<p></p>" || t === "<p><br></p>") return true;
    return false;
  };

  return (
    <div
      className={
        compact
          ? "mt-3 rounded-lg border border-gray-200 p-2.5 dark:border-gray-700"
          : "mt-4 rounded-lg border border-gray-200 p-4 dark:border-gray-700"
      }
    >
      <h3
        className={
          compact
            ? "mb-2 text-xs font-semibold text-gray-900 dark:text-white"
            : "mb-3 text-sm font-semibold text-gray-900 dark:text-white"
        }
      >
        {isReplying ? "Reply to comment" : "Write a comment"}
      </h3>
      <div className={compact ? "max-h-[280px] overflow-y-auto" : undefined}>
        <TextEditor
          editor={editor}
          isDark={!!isDark}
          helperText={compact ? undefined : "Use the toolbar to format your comment"}
        />
      </div>
      <div
        className={
          compact
            ? "mt-1.5 flex justify-end gap-1.5"
            : "mt-2 flex justify-end gap-2"
        }
      >
        <Button
          size={compact ? "xs" : "sm"}
          color="gray"
          outline
          className="cursor-pointer"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          size={compact ? "xs" : "sm"}
          className="cursor-pointer bg-[#1F4E79] hover:bg-[#1F4E79]/90 dark:bg-[#C9A24D] dark:hover:bg-[#C9A24D]/90"
          onClick={onSubmit}
          disabled={isEmptyHtml(value)}
        >
          {isReplying ? "Post reply" : "Post comment"}
        </Button>
      </div>
    </div>
  );
}

function CommentTree({
  comments,
  depth = 0,
  onUpvote,
  onReply,
  replyingToCommentId,
  renderReplyBox,
}: {
  comments: Comment[];
  depth?: number;
  onUpvote?: (commentId: string) => void;
  onReply?: (commentId: string) => void;
  replyingToCommentId?: string | null;
  renderReplyBox?: (isReply?: boolean) => ReactNode;
}) {
  return (
    <ul className="space-y-4">
      {comments
        .filter((c) => !c.isDeleted)
        .map((comment) => (
          <li
            key={comment.id}
            className={
              depth > 0
                ? "ml-8 border-l-2 border-gray-200 pl-4 dark:border-gray-600"
                : ""
            }
          >
            <div className="flex gap-3 py-2">
              <Avatar
                size="sm"
                img={comment.authorDisplay?.avatarUrl}
                rounded
                className="shrink-0"
              >
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {comment.authorDisplay?.fullName ?? "Unknown"}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDate(comment.createdDate)}
                  </span>
                  {comment.upVoteCount > 0 && (
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <HandThumbUpIcon className="h-3.5 w-3.5" />
                      {comment.upVoteCount}
                    </span>
                  )}
                </div>
                <div className="prose prose-sm max-w-none dark:prose-invert prose-p:text-sm prose-p:text-gray-700 prose-p:dark:text-gray-300 prose-headings:text-gray-900 prose-headings:dark:text-white">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={discussionMarkdownComponents}
                  >
                    {comment.content}
                  </ReactMarkdown>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {onUpvote && (
                    <Button
                      size="xs"
                      color="light"
                      className="cursor-pointer"
                      onClick={() => onUpvote(comment.id)}
                    >
                      <HandThumbUpIcon className="mr-1 h-3.5 w-3.5" />
                      Upvote
                    </Button>
                  )}
                  {onReply && (
                    <Button
                      size="xs"
                      color="light"
                      className="cursor-pointer"
                      onClick={() => onReply(comment.id)}
                    >
                      <ChatBubbleLeftRightIcon className="mr-1 h-3.5 w-3.5" />
                      Reply
                    </Button>
                  )}
                </div>
              </div>
            </div>
            {replyingToCommentId === comment.id && renderReplyBox?.(true)}
            {comment.replies.length > 0 && (
              <div className="mt-3">
                <CommentTree
                  comments={comment.replies}
                  depth={depth + 1}
                  onUpvote={onUpvote}
                  onReply={onReply}
                  replyingToCommentId={replyingToCommentId}
                  renderReplyBox={renderReplyBox}
                />
              </div>
            )}
          </li>
        ))}
    </ul>
  );
}

export function DiscussionDetail({
  issue,
  classId,
  onBack,
  onMarkAccepted,
  onUpvote,
  onStatusChange,
  onSubmitComment,
}: DiscussionDetailProps) {
  const [commentDraft, setCommentDraft] = useState("");
  const [showCommentBox, setShowCommentBox] = useState(false);
  const [replyingToCommentId, setReplyingToCommentId] = useState<string | null>(
    null,
  );

  const openWriteComment = () => {
    setReplyingToCommentId(null);
    setShowCommentBox(true);
  };

  const openReply = (commentId: string) => {
    setReplyingToCommentId(commentId);
    setShowCommentBox(true);
  };

  const closeCommentBox = () => {
    setShowCommentBox(false);
    setReplyingToCommentId(null);
    setCommentDraft("");
  };

  const handleSubmitComment = () => {
    const trimmed = commentDraft.trim();
    if (!trimmed || trimmed === "<p></p>" || trimmed === "<p><br></p>") return;
    const markdown = htmlToMarkdown(trimmed);
    if (!markdown.trim()) return;
    onSubmitComment?.(markdown, replyingToCommentId ?? undefined);
    setCommentDraft("");
    closeCommentBox();
  };

  const renderReplyBox = (isReply = false) => (
    <CommentReplyBox
      compact={isReply}
      isReplying={!!replyingToCommentId}
      value={commentDraft}
      onChange={(e) => setCommentDraft(e.target.value)}
      onCancel={closeCommentBox}
      onSubmit={handleSubmitComment}
    />
  );

  return (
    <div className="space-y-3">
      <Button
        color="light"
        size="sm"
        onClick={onBack}
        className="inline-flex cursor-pointer items-center gap-2"
      >
        <ChevronLeftIcon className="h-4 w-4" />
        Back to list
      </Button>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left column: main content & thread */}
        <div className="lg:col-span-8">
          <div className="p-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {issue.title}
            </h1>
            <div className="flex flex-wrap gap-2">
              {issue.tags?.map((tag) => (
                <Badge key={tag} color="gray">
                  {tag}
                </Badge>
              ))}
            </div>
            <div className="prose prose-sm max-w-none dark:prose-invert prose-p:text-gray-700 prose-p:dark:text-gray-300 prose-headings:text-gray-900 prose-headings:dark:text-white bg-gray-50 p-4 dark:bg-gray-800/50">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={discussionMarkdownComponents}
              >
                {issue.content}
              </ReactMarkdown>
            </div>
          </div>

          <HR/>

          <div className="mt-8">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Comments
              </h3>
              <Button
                size="sm"
                color="light"
                className="cursor-pointer"
                onClick={openWriteComment}
              >
                <ChatBubbleLeftRightIcon className="mr-2 h-4 w-4" />
                Write comment
              </Button>
            </div>
            <CommentTree
              comments={issue.comments}
              onUpvote={onUpvote ? (id) => onUpvote("comment", id) : undefined}
              onReply={openReply}
              replyingToCommentId={replyingToCommentId}
              renderReplyBox={renderReplyBox}
            />
          </div>

          {/* Write a Comment - at bottom only for new top-level comment */}
          {showCommentBox && !replyingToCommentId && renderReplyBox(false)}
        </div>

        {/* Right column: metadata & actions */}
        <DiscussionDetailSidebar
          issue={issue}
          commentCount={totalCommentCount(issue.comments)}
          onUpvote={onUpvote}
          onMarkAccepted={onMarkAccepted}
          onStatusChange={onStatusChange}
        />
      </div>
    </div>
  );
}

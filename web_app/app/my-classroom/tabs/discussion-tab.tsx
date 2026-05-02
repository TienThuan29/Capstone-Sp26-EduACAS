"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { DiscussionIssue, DiscussionIssueStatus } from "@/types/discussion";
import { DiscussionDetail } from "@/components/discussion-detail";
import { DiscussionList } from "@/components/discussion-list";
import { useDiscussionIssue } from "@/hooks/discussion/useDiscussionIssue";
import { useComment } from "@/hooks/discussion/useComment";
import { useAuth } from "@/contexts/AuthContext";
import { DiscussionTabSkeleton } from "@/components/ui/skeletons";

type DiscussionTabProps = {
  classId: string;
  /** When true, "Back to list" is shown in the page header instead of inside the detail view. */
  hideBackButton?: boolean;
};

export function DiscussionTab({ classId, hideBackButton }: DiscussionTabProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const issueIdFromUrl = searchParams.get("issue");
  const { user } = useAuth();
  const { getById, changeStatus } = useDiscussionIssue();
  const { writeComment, replyComment, upvoteComment, updateComment, softDeleteComment } = useComment();

  const [selectedIssue, setSelectedIssue] = useState<DiscussionIssue | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    if (!issueIdFromUrl) {
      setSelectedIssue(null);
      return;
    }
    let cancelled = false;
    setLoadingDetail(true);
    getById(issueIdFromUrl)
      .then((issue) => {
        if (!cancelled) setSelectedIssue(issue ?? null);
      })
      .finally(() => {
        if (!cancelled) setLoadingDetail(false);
      });
    return () => {
      cancelled = true;
    };
  }, [issueIdFromUrl, getById]);

  const handleBack = () => {
    router.replace(`/my-classroom/${classId}?tab=discussion`, {
      scroll: false,
    });
  };

  const handleSubmitComment = useCallback(
    async (content: string, parentCommentId?: string) => {
      if (!selectedIssue || !user?.id) return;
      try {
        const updated =
          parentCommentId
            ? await replyComment({
                issueId: selectedIssue.id,
                parentCommentId,
                authorId: user.id,
                content,
              })
            : await writeComment({
                issueId: selectedIssue.id,
                authorId: user.id,
                content,
              });
        if (updated) setSelectedIssue(updated);
      } catch {
        // Error could be shown via toast or inline message
      }
    },
    [selectedIssue, user?.id, writeComment, replyComment]
  );

  const handleUpvote = useCallback(
    async (target: "issue" | "comment", id: string) => {
      if (!selectedIssue) return;
      if (target === "comment") {
        try {
          const updated = await upvoteComment({
            issueId: selectedIssue.id,
            commentId: id,
          });
          if (updated) setSelectedIssue(updated);
        } catch {
          // Error could be shown via toast
        }
      }
      // Issue upvote: no backend endpoint yet, leave as no-op
    },
    [selectedIssue, upvoteComment]
  );

  const handleStatusChange = useCallback(
    async (status: DiscussionIssueStatus) => {
      if (!selectedIssue) return;
      try {
        const updated = await changeStatus(selectedIssue.id, status);
        if (updated) setSelectedIssue(updated);
      } catch {
        // Error could be shown via toast
      }
    },
    [selectedIssue, changeStatus]
  );

  const handleEditComment = useCallback(
    async (commentId: string, content: string) => {
      if (!selectedIssue) return;
      try {
        const updated = await updateComment({
          issueId: selectedIssue.id,
          commentId,
          content,
        });
        if (updated) setSelectedIssue(updated);
      } catch {
        // Error could be shown via toast
      }
    },
    [selectedIssue, updateComment]
  );

  const handleDeleteComment = useCallback(
    async (commentId: string) => {
      if (!selectedIssue) return;
      try {
        const updated = await softDeleteComment({
          issueId: selectedIssue.id,
          commentId,
        });
        if (updated) setSelectedIssue(updated);
      } catch {
        // Error could be shown via toast
      }
    },
    [selectedIssue, softDeleteComment]
  );

  if (issueIdFromUrl && loadingDetail) {
    return <DiscussionTabSkeleton />;
  }

  if (issueIdFromUrl && selectedIssue) {
    return (
      <DiscussionDetail
        issue={selectedIssue}
        classId={classId}
        onBack={handleBack}
        hideBackButton={hideBackButton}
        onUpvote={handleUpvote}
        onStatusChange={handleStatusChange}
        onSubmitComment={handleSubmitComment}
        onEditComment={handleEditComment}
        onDeleteComment={handleDeleteComment}
      />
    );
  }

  if (issueIdFromUrl && !loadingDetail && !selectedIssue) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white py-16 text-center dark:border-gray-700 dark:bg-gray-800">
        <p className="font-medium text-gray-500 dark:text-gray-400">
          Discussion not found.
        </p>
        <button
          type="button"
          onClick={handleBack}
          className="mt-2 text-[#1F4E79] underline dark:text-[#C9A24D]"
        >
          Back to list
        </button>
      </div>
    );
  }

  return (
    <DiscussionList classId={classId} classroomBasePath="my-classroom" />
  );
}

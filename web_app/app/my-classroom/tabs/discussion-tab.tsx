"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { DiscussionIssue } from "@/types/discussion";
import { DiscussionDetail } from "@/components/discussion-detail";
import { DiscussionList } from "@/components/discussion-list";
import { useDiscussionIssue } from "@/hooks/discussion/useDiscussionIssue";

type DiscussionTabProps = {
  classId: string;
};

export function DiscussionTab({ classId }: DiscussionTabProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const issueIdFromUrl = searchParams.get("issue");
  const { getById } = useDiscussionIssue();

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

  if (issueIdFromUrl && loadingDetail) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white py-16 text-center dark:border-gray-700 dark:bg-gray-800">
        <p className="font-medium text-gray-500 dark:text-gray-400">
          Loading discussion…
        </p>
      </div>
    );
  }

  if (issueIdFromUrl && selectedIssue) {
    return (
      <DiscussionDetail
        issue={selectedIssue}
        classId={classId}
        onBack={handleBack}
        onUpvote={() => {}}
        onStatusChange={() => {}}
        onSubmitComment={() => {}}
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

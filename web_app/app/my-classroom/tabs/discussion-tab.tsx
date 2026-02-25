"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import type { DiscussionIssue } from "@/types/discussion";
import { DiscussionDetail } from "@/components/discussion-detail";
import { DiscussionList } from "@/components/discussion-list";

type DiscussionTabProps = {
  classId: string;
};

export function DiscussionTab({ classId }: DiscussionTabProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const issueIdFromUrl = searchParams.get("issue");

  const [issues] = useState<DiscussionIssue[]>(MOCK_DISCUSSION_ISSUES);

  const selectedIssue = useMemo(() => {
    if (!issueIdFromUrl) return null;
    return issues.find((i) => i.id === issueIdFromUrl) ?? null;
  }, [issueIdFromUrl, issues]);

  const handleBack = () => {
    router.replace(`/my-classroom/${classId}?tab=discussion`, {
      scroll: false,
    });
  };

  if (selectedIssue) {
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

  return <DiscussionList issues={issues} classId={classId} useRouterLink />;
}

export const MOCK_DISCUSSION_ISSUES: DiscussionIssue[] = [
  {
    id: "issue-1",
    classroomId: "class-1",
    title: "Why does my solution get TLE on test case 3?",
    authorId: "user-1",
    content:
      "I implemented a BFS approach but it times out on the third test. Here's my code:\n\n```cpp\nvoid bfs(int start) {\n  queue<int> q;\n  q.push(start);\n  // ...\n}\n```\n\nIs there a more efficient approach or am I missing an optimization?",
    attachments: [],
    refProblemId: "prob-101",
    status: "Open",
    viewCount: 42,
    comments: [
      {
        id: "comment-1",
        issueId: "issue-1",
        authorId: "user-2",
        content:
          "Try using a visited set to avoid reprocessing nodes. Also check if your queue can grow too large in edge cases.",
        attachments: [],
        upVoteCount: 5,
        replies: [
          {
            id: "comment-1-1",
            issueId: "issue-1",
            authorId: "user-1",
            content:
              "Added a `unordered_set<int> visited` and it passed. Thanks!",
            attachments: [],
            upVoteCount: 2,
            replies: [],
            isDeleted: false,
            createdDate: "2025-02-24T14:30:00Z",
            updatedDate: "2025-02-24T14:30:00Z",
            authorDisplay: { fullName: "Student One" },
          },
        ],
        isDeleted: false,
        createdDate: "2025-02-24T12:00:00Z",
        updatedDate: "2025-02-24T12:00:00Z",
        authorDisplay: { fullName: "TA Alice" },
      },
    ],
    isDeleted: false,
    createdDate: "2025-02-24T10:00:00Z",
    updatedDate: "2025-02-24T10:00:00Z",
    authorDisplay: { fullName: "Student One", avatarUrl: "" },
    tags: ["question", "C++", "algorithm"],
  },
  {
    id: "issue-2",
    classroomId: "class-1",
    title: "Clarification on problem 2: expected output format",
    authorId: "user-3",
    content:
      "The problem says 'output one integer per line'. Does that mean we should print a newline after the last number as well, or only between numbers?",
    attachments: [],
    refProblemId: "prob-102",
    status: "Close",
    viewCount: 18,
    comments: [],
    isDeleted: false,
    createdDate: "2025-02-23T09:00:00Z",
    updatedDate: "2025-02-23T15:00:00Z",
    authorDisplay: { fullName: "Student Two" },
    tags: ["question", "I/O"],
  },
  {
    id: "issue-3",
    classroomId: "class-1",
    title: "Possible bug in grader for Problem 5",
    authorId: "user-4",
    content:
      "My solution passes locally and on the sample but gets WA on the hidden tests. Could there be an issue with the grader or test data?",
    attachments: [],
    refProblemId: "prob-105",
    status: "Open",
    viewCount: 7,
    comments: [],
    isDeleted: false,
    createdDate: "2025-02-25T08:00:00Z",
    updatedDate: "2025-02-25T08:00:00Z",
    authorDisplay: { fullName: "Student Three" },
    tags: ["bug", "Python"],
  },
];

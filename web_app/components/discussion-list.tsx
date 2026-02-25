"use client";

import Link from "next/link";
import { Card, Badge } from "flowbite-react";
import { EyeIcon, ChatBubbleLeftRightIcon } from "@heroicons/react/24/outline";
import type { DiscussionIssue, Comment } from "@/types/discussion";

function countComments(issue: DiscussionIssue): number {
  let n = issue.comments.length;
  issue.comments.forEach((c) => {
    n += countReplies(c);
  });
  return n;
}

function countReplies(comment: Comment): number {
  let n = comment.replies.length;
  comment.replies.forEach((r) => {
    n += countReplies(r);
  });
  return n;
}

type DiscussionListProps = {
  issues: DiscussionIssue[];
  classId: string;
  onSelectIssue?: (issue: DiscussionIssue) => void;
  /** If true, use router link with ?tab=discussion&issue=id; else use onSelectIssue */
  useRouterLink?: boolean;
  /** Base path for classroom: "my-classroom" (student) or "manage-classroom" (lecturer). Default "my-classroom". */
  classroomBasePath?: "my-classroom" | "manage-classroom";
};

export function DiscussionList({
  issues,
  classId,
  onSelectIssue,
  useRouterLink = false,
  classroomBasePath = "my-classroom",
}: DiscussionListProps) {
  return (
    <div className="space-y-4">
      <h2 className="border-l-8 border-[#1F4E79] pl-4 text-3xl font-black text-gray-900 dark:border-[#C9A24D] dark:text-white">
        Discussion Channel
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Browse and participate in Q&A. 
      </p>

      {issues.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 bg-white py-16 text-center dark:border-gray-700 dark:bg-gray-800">
          <p className="font-medium text-gray-500 dark:text-gray-400">
            No discussions yet. Start one when you have a question.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {issues.map((issue) => {
            const commentCount = countComments(issue);
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
                      {commentCount}
                    </span>
                  </div>
                </div>
              </Card>
            );

            if (useRouterLink) {
              const issueHref = `/${classroomBasePath}/${classId}?tab=discussion&issue=${issue.id}`;
              return (
                <li key={issue.id}>
                  <Link href={issueHref} className="block">
                    {content}
                  </Link>
                </li>
              );
            }
            return (
              <li
                key={issue.id}
                onClick={() => onSelectIssue?.(issue)}
                className="list-none"
              >
                {content}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

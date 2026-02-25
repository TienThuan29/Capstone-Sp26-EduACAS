/**
 * Frontend types aligned with backend AcasService.Models.DiscussionIssue and Comment.
 */

export type DiscussionIssueStatus = "OPEN" | "CLOSED";

export interface Comment {
  id: string;
  issueId: string;
  authorId: string;
  content: string;
  attachments: string[];
  upVoteCount: number;
  replies: Comment[];
  isDeleted: boolean;
  createdDate: string;
  updatedDate: string;
  /** Optional display info for UI (not in backend entity) */
  authorDisplay?: { fullName: string; avatarUrl?: string };
}

export interface DiscussionIssue {
  id: string;
  classroomId: string;
  title: string;
  authorId: string;
  content: string;
  attachments: string[];
  refProblemId: string;
  status: DiscussionIssueStatus;
  viewCount: number;
  comments: Comment[];
  isDeleted: boolean;
  createdDate: string;
  updatedDate: string;
  /** Optional display info for UI (not in backend entity) */
  authorDisplay?: { fullName: string; avatarUrl?: string };
  /** Optional classification tags for list view (e.g. 'bug', 'question', 'C++') */
  tags?: string[];
}

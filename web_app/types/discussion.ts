export type DiscussionIssueStatus = "OPEN" | "CLOSED";

/** Author display info from User service (e.g. RabbitMQ). */
export interface AuthorDisplay {
  fullName: string;
  avatarUrl?: string;
  email?: string;
}

/** List item from GET paged (DiscussionIssueListResponse). */
export interface DiscussionIssueListItem {
  id: string;
  title: string;
  authorId: string;
  authorDisplay?: AuthorDisplay | null;
  viewCount: number;
  commentCount: number;
  createdDate: string;
  status: DiscussionIssueStatus;
  tags: string[];
  isDeleted: boolean;
}

export interface PagedDiscussionIssues {
  items: DiscussionIssueListItem[];
  totalCount: number;
  pageIndex: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface Comment {
  id: string;
  issueId: string;
  authorId: string;
  authorDisplay?: AuthorDisplay | null;
  content: string;
  attachments: string[];
  upVoteCount: number;
  replies: Comment[];
  isDeleted: boolean;
  createdDate: string;
  updatedDate: string;
}

export interface DiscussionIssue {
  id: string;
  classroomId: string;
  title: string;
  authorId: string;
  authorDisplay?: AuthorDisplay | null;
  content: string;
  attachments: string[];
  refProblemId: string;
  status: DiscussionIssueStatus;
  viewCount: number;
  comments: Comment[];
  isDeleted: boolean;
  createdDate: string;
  updatedDate: string;
  tags?: string[];
}

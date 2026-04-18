/** Matches backend NotificationType enum. */
export type NotificationType =
  | "SYSTEM"
  | "NEW_PRACTICE"
  | "NEW_MATERIAL"
  | "NEW_EXAMINATION"
  | "NEW_DISCUSSION_ISSUE"
  | "GRADE_RESULT"
  | "REPLY_COMMENT"
  | "ACADEMIC_WARNING_LEVEL_1"
  | "ACADEMIC_WARNING_LEVEL_2"
  | "NEW_REGRADING_REQUEST"
  | "REGRADING_APPROVED"
  | "REGRADING_REJECTED";

export type RealtimeNotification = {
  id: string;
  targetUserId: string;
  title: string;
  body: string;
  type: NotificationType;
  payload: Record<string, unknown>;
  sentDate: string;
};

export type Notification = {
  id: string;
  targetUserId: string;
  title: string;
  body: string;
  type: NotificationType;
  payload: Record<string, unknown>;
  sentDate: string;
  isRead: boolean;
  isDeleted: boolean;
};

export interface PagedNotifications {
  items: Notification[];
  totalCount: number;
  pageIndex: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

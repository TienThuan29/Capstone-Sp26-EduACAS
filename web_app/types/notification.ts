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
  | "ACADEMIC_WARNING_LEVEL_2";

export type RealtimeNotification = {
  id: string;
  targetUserId: string;
  title: string;
  body: string;
  type: NotificationType;
  payload: Record<string, unknown>;
  sentDate: string;
};

export type RegradingRequestStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELED";

export interface SubmissionLite {
  id: string;
  studentId: string;
  examId: string;
  problemId: string;
  finalScore: number;
  submittedDate: string;
}

export interface RegradingRequest {
  id: string;
  examinationId: string;
  submissionId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  reason: string;
  imageUrls: string[];
  createdDate: string;
  status: RegradingRequestStatus;
  statusName: string;
  lecturerNote: string;
  handledDate: string | null;
  submission: SubmissionLite | null;
}

export interface PagedRegradingRequests {
  items: RegradingRequest[];
  totalCount: number;
  pageIndex: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface CreateRegradingRequestPayload {
  examinationId: string;
  submissionId: string;
  imageUrls: string[];
  reason: string;
}

export interface HandleRegradingRequestPayload {
  lecturerNote: string;
}

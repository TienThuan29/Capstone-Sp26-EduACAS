'use client';

export interface SendAcademicWarningBatchRequest {
  classroomId: string;
  examId: string;
  warningLevel: number;
  minScoreThreshold?: number;
}

export interface StudentAcademicWarningResult {
  studentId: string;
  studentEmail: string;
  studentName: string;
  examScore: number;
  warningCreated: boolean;
  emailSent: boolean;
  errorMessage?: string;
}

export interface SendAcademicWarningResponse {
  totalStudents: number;
  processedStudents: number;
  failedCount: number;
  results: StudentAcademicWarningResult[];
}

export interface BatchAcceptedResponse {
  jobId: string;
}

export interface AnalysisEntry {
  submissionId: string;
  analysis: string;
  recommendation: string;
}

export interface InvolvedExamsInfo {
  examScores: Record<string, number>;
  averageScore: number;
}

export interface AcademicWarningResponse {
  id: string;
  classroomId: string;
  studentId: string;
  examId: string;
  problemId: string;
  warningLevel: number;
  triggerType: string;
  sentDate: string;
  isRead: boolean;
  createdDate: string;
  updatedDate: string;
  involvedExams: InvolvedExamsInfo | null;
  llmAnalysis: Record<string, AnalysisEntry>;
  lecturerAnalysis: Record<string, AnalysisEntry>;
  classroomName: string;
  examName: string;
  problemTitle: string;
  studentName: string;
}

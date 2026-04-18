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

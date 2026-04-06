export interface ExamTempProblemResponse {
  problemId: string;
  mark: number;
  title: string;
}

export interface ExaminationTemplateResponse {
  id: string;
  examName: string;
  lecturerId: string;
  description: string;
  totalMark: number;
  problems: ExamTempProblemResponse[];
  isDeleted: boolean;
  createdDate: string;
  updatedDate: string | null;
}

export interface ExamTempProblemRequest {
  problemId: string;
  mark: number;
}

export interface CreateExaminationTemplatePayload {
  examName: string;
  lecturerId: string;
  description?: string;
  totalMark: number;
  problems?: ExamTempProblemRequest[];
}

export interface UpdateExaminationTemplatePayload {
  examName: string;
  description?: string;
  totalMark: number;
  problems?: ExamTempProblemRequest[];
}

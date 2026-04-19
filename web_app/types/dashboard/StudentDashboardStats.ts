export interface StudentDashboardOverview {
  classId: string;
  className: string;
  averageScore: number;
  classAverage: number;
  myRank: number;
  totalStudents: number;
  percentile: number;
  trend: "improving" | "stable" | "declining";
  totalExams: number;
  submittedExams: number;
  submissionRate: number;
  totalWarnings: number;
  unreadWarnings: number;
}

export interface StudentExamScore {
  examId: string;
  examName: string;
  mode: string;
  totalMark: number;
  score: number;
  classAverage: number;
  status: string;
  submittedAt: string | null;
  version: number;
  rank: number;
}

export interface StudentWarning {
  warningId: string;
  className: string;
  warningLevel: 1 | 2;
  reason: string;
  createdAt: string;
  isRead: boolean;
  scoreAtTime: number | null;
}

export interface StudentScoreTrend {
  examId: string;
  examName: string;
  score: number;
  submittedAt: string;
}

export interface StudentSubmissionStats {
  classId: string;
  className: string;
  totalExams: number;
  submittedExams: number;
  submissionRate: number;
  latestSubmissionTime: string | null;
  isLate: boolean;
}

export interface StudentDashboardData {
  overview: StudentDashboardOverview | null;
  examScores: StudentExamScore[];
  warnings: StudentWarning[];
  scoreTrend: StudentScoreTrend[];
  submissionStats: StudentSubmissionStats | null;
}
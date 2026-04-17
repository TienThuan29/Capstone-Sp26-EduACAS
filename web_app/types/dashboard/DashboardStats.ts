export interface DashboardOverview {
  totalStudents: number;
  totalStudentsChange: number;
  classAverage: number;
  classAverageChange: number;
  atRiskCount: number;
  atRiskPercentage: number;
  atRiskChange: number;
  totalWarnings: number;
  newWarningsToday: number;
}

export interface ScoreDistribution {
  range: string;
  count: number;
  percentage: number;
}

export interface AtRiskStudent {
  studentId: string;
  studentName: string;
  averageScore: number;
  warningLevel: number;
  trend: "improving" | "stable" | "declining";
}

export interface RecentWarning {
  warningId: string;
  studentName: string;
  className: string;
  warningLevel: 1 | 2;
  message: string;
  createdAt: string;
  isRead: boolean;
}

export interface ClassStats {
  classId: string;
  className: string;
  totalStudents: number;
  classAverage: number;
  atRiskCount: number;
}

export interface ExamScoreDistribution {
  range: string;
  count: number;
  percentage: number;
}

export interface ExamScoreStatistics {
  examId: string;
  examName: string;
  totalMark: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  medianScore: number;
  totalSubmissions: number;
  totalStudents: number;
  submissionRate: number;
  passRate: number;
  startDatetime: string;
  endDatetime: string;
  scoreDistribution: ExamScoreDistribution[];
}

export interface ClassroomDashboardData {
  overview: DashboardOverview;
  scoreDistribution: ScoreDistribution[];
  atRiskStudents: AtRiskStudent[];
  recentWarnings: RecentWarning[];
  classStats: ClassStats[];
}
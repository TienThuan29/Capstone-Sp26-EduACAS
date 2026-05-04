export interface ExaminationListItem {
  examId: string;
  examName: string;
  classroomId: string;
  classroomName: string;
  mode: string;
  status: string;
  totalMark: number;
  averageScore: number;
  totalSubmissions: number;
  totalStudents: number;
  passRate: number;
  startDatetime: string;
  endDatetime: string;
}

export interface AdminExaminationStatistics {
  totalExaminations: number;
  activeExaminations: number;
  completedExaminations: number;
  pendingExaminations: number;
  practicalExaminations: number;
  examinationModeExaminations: number;
  totalSubmissions: number;
  totalStudentsWithSubmissions: number;
  overallPassRate: number;
  overallAverageScore: number;
  submissionRate: number;
  examinationList: ExaminationListItem[];
}

export interface SubmissionByLanguageItem {
  languageId: string;
  languageName: string;
  totalSubmissions: number;
  uniqueStudents: number;
  percentage: number;
  averageScore: number;
  passRate: number;
}

export interface SubmissionByLanguageResponse {
  totalSubmissions: number;
  totalLanguages: number;
  topLanguage: string;
  languageBreakdown: SubmissionByLanguageItem[];
}

export interface StudentLecturerRatioResponse {
  totalStudents: number;
  totalLecturers: number;
  ratio: string;
  ratioDecimal: number;
  totalClassrooms: number;
  totalEnrollments: number;
}

export interface SubjectStudentDistributionItem {
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  totalStudents: number;
  totalClasses: number;
  totalLecturers: number;
  percentage: number;
}

export interface UsersBySubjectResponse {
  totalStudents: number;
  totalSubjects: number;
  distribution: SubjectStudentDistributionItem[];
}

export interface ClassroomDiscussionItem {
  classroomId: string;
  classroomName: string;
  totalDiscussions: number;
  activeDiscussions: number;
  closedDiscussions: number;
  totalComments: number;
}

export interface AdminDiscussionStatisticsResponse {
  totalDiscussions: number;
  activeDiscussions: number;
  closedDiscussions: number;
  totalComments: number;
  totalViews: number;
  discussionsByClassroom: ClassroomDiscussionItem[];
}

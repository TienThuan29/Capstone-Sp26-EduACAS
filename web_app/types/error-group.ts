export interface ErrorGroupSummary {
  id: string;
  problemId: string;
  examId: string;
  errorSignature: string;
  jPlagStatus: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  submissionIds: string[];
  jPlagResults: JPlagMatchSummary[];
  createdDate: string;
}

export interface JPlagMatchSummary {
  submission1Id: string;
  submission2Id: string;
  similarityScore: number;
}

export interface ErrorGroupDetail extends ErrorGroupSummary {
  jPlagResultsDetailed: JPlagMatchDetailGroup[];
}

export interface JPlagMatchDetailGroup extends JPlagMatchSummary {
  details: MatchLineDetail[];
}

export interface MatchLineDetail {
  startLine1: number;
  endLine1: number;
  startLine2: number;
  endLine2: number;
  tokens: number;
}

export interface ErrorGroupRequest {
  examId: string;
  problemId: string;
  groupIds?: string[];
  minTokenMatch?: number;
  minSimilarity?: number;
  excludeBaseCode?: boolean;
}

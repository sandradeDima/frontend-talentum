export type DashboardGroupBy = 'COMPANY' | 'GERENCIA' | 'CENTRO';

export type DashboardExportJobStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
export type DashboardExportFormat = 'XLSX';

export type DashboardSurveyContext = {
  id: string;
  slug: string;
  name: string;
  company: {
    id: string;
    slug: string;
    name: string;
  };
};

export type DashboardProgressGroup = {
  groupKey: string;
  groupLabel: string;
  totalRespondents: number;
  startedRespondents: number;
  submittedRespondents: number;
  completionRate: number;
};

export type DashboardProgressResult = {
  survey: DashboardSurveyContext;
  groupBy: DashboardGroupBy;
  anonymityMinCount: number;
  suppressedGroups: number;
  aggregateVisible: boolean;
  totals: {
    totalRespondents: number;
    startedRespondents: number;
    submittedRespondents: number;
    completionRate: number;
  };
  groups: DashboardProgressGroup[];
};

export type DashboardResultOverallRow = {
  groupKey: string;
  groupLabel: string;
  submittedRespondents: number;
  answerCount: number;
  averageScore: number;
};

export type DashboardResultSectionRow = {
  groupKey: string;
  sectionKey: string;
  answerCount: number;
  averageScore: number;
};

export type DashboardResultQuestionRow = {
  groupKey: string;
  sectionKey: string;
  questionKey: string;
  answerCount: number;
  averageScore: number;
};

export type DashboardResultsResult = {
  survey: DashboardSurveyContext;
  groupBy: DashboardGroupBy;
  anonymityMinCount: number;
  suppressedGroups: number;
  aggregateVisible: boolean;
  overall: DashboardResultOverallRow[];
  sections: DashboardResultSectionRow[];
  questions: DashboardResultQuestionRow[];
};

export type CreateDashboardExportJobInput = {
  surveySlug: string;
  groupBy: DashboardGroupBy;
};

export type CreateDashboardExportJobResult = {
  id: string;
  status: DashboardExportJobStatus;
  groupBy: DashboardGroupBy;
  format: DashboardExportFormat;
  canDownload: boolean;
  attemptCount: number;
  maxAttempts: number;
  nextRetryAt: string | null;
  createdAt: string;
  survey: {
    id: string;
    slug: string;
    name: string;
  };
};

export type DashboardExportJobResult = {
  id: string;
  status: DashboardExportJobStatus;
  groupBy: DashboardGroupBy;
  format: DashboardExportFormat;
  canDownload: boolean;
  attemptCount: number;
  maxAttempts: number;
  nextRetryAt: string | null;
  createdAt: string;
  updatedAt: string;
  startedAt: string | null;
  completedAt: string | null;
  downloadUrl: string | null;
  errorMessage: string | null;
  survey: DashboardSurveyContext;
};

export type DashboardExportJobListResult = {
  survey: {
    id: string;
    slug: string;
    name: string;
  };
  groupBy: DashboardGroupBy;
  supportedFormats: DashboardExportFormat[];
  jobs: DashboardExportJobResult[];
};

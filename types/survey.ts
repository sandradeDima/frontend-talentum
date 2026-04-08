export type SurveyCampaignStatus =
  | 'BORRADOR'
  | 'CREADA'
  | 'EN_PROCESO'
  | 'FINALIZADA';

export type SurveyTemplateKey = 'BASE_CLIMA_V1';

export type SurveyLifecycleState =
  | 'DRAFT'
  | 'SCHEDULED'
  | 'ACTIVE'
  | 'CLOSED'
  | 'FINALIZED';

export type SurveyCampaignLifecycle = {
  state: SurveyLifecycleState;
  started: boolean;
  ended: boolean;
  finalized: boolean;
  remindersLocked: boolean;
  canScheduleInitialSend: boolean;
  canConfigureReminders: boolean;
  canCloseNow: boolean;
  canFinalize: boolean;
};

export type SurveyCampaignSummary = {
  id: string;
  slug: string;
  name: string;
  templateKey: SurveyTemplateKey;
  status: SurveyCampaignStatus;
  createdAt: string;
  startDate: string;
  endDate: string;
  totalEnabledDays: number;
  initialSendScheduledAt: string | null;
  remindersLockedAt: string | null;
  remindersLocked: boolean;
  finalizedAt: string | null;
  lifecycle: SurveyCampaignLifecycle;
  genericLinkPath: string;
  tutorialVideoUrl: string | null;
};

export type SurveyCampaignReminder = {
  id: string;
  scheduledAt: string;
  createdAt: string;
};

export type ReminderScheduleStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'FAILED'
  | 'COMPLETED';

export type SurveyCampaignReminderSchedule = {
  id: string;
  scheduledAt: string;
  status: ReminderScheduleStatus;
  attemptCount: number;
  lastAttemptAt: string | null;
  processedAt: string | null;
  nextRetryAt: string | null;
  createdAt: string;
  updatedAt: string;
  dispatchSummary: {
    total: number;
    pending: number;
    sent: number;
    failed: number;
    skipped: number;
  };
};

export type SurveyCampaignDetail = SurveyCampaignSummary & {
  companyId: string;
  updatedAt: string;
  content: {
    introGeneral: string;
    leaderIntro: string;
    leaderQuestions: string[];
    leaderExtraQuestion: string | null;
    teamIntro: string;
    teamQuestions: string[];
    teamExtraQuestion: string | null;
    organizationIntro: string;
    organizationQuestions: string[];
    organizationExtraQuestion: string | null;
    finalNpsQuestion: string;
    finalOpenQuestion: string;
    closingText: string;
  };
  reminders: SurveyCampaignReminder[];
  reminderSchedules: SurveyCampaignReminderSchedule[];
};

export type SurveyCampaignListData = {
  company: {
    id: string;
    name: string;
    slug: string;
  };
  rows: SurveyCampaignSummary[];
};

export type GlobalSurveyCampaignRow = SurveyCampaignSummary & {
  company: {
    id: string;
    name: string;
    slug: string;
    status: 'PENDING_SETUP' | 'ACTIVE' | 'INACTIVE';
  };
};

export type GlobalSurveyCampaignListData = {
  rows: GlobalSurveyCampaignRow[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

export type SurveyCampaignUpsertInput = {
  templateKey: SurveyTemplateKey;
  name: string;
  startDate: string;
  endDate: string;
  introGeneral: string;
  leaderIntro: string;
  leaderQuestions: string[];
  leaderExtraQuestion?: string | null;
  teamIntro: string;
  teamQuestions: string[];
  teamExtraQuestion?: string | null;
  organizationIntro: string;
  organizationQuestions: string[];
  organizationExtraQuestion?: string | null;
  finalNpsQuestion: string;
  finalOpenQuestion: string;
  closingText: string;
  tutorialVideoUrl?: string | null;
};

export type ScheduleSurveySendInput = {
  scheduledAt: string;
};

export type ConfigureSurveyRemindersInput = {
  reminders: Array<{
    scheduledAt: string;
  }>;
};

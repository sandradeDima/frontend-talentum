import type {
  ReminderScheduleStatus,
  SurveyCampaignReminderSchedule
} from '@/types/survey';

export type ReminderScheduleHealth = 'pending' | 'processing' | 'sent' | 'failed';

export const deriveReminderScheduleHealth = (input: {
  status: ReminderScheduleStatus;
  dispatchSummary: Pick<SurveyCampaignReminderSchedule['dispatchSummary'], 'failed'>;
}): ReminderScheduleHealth => {
  if (input.status === 'PROCESSING') {
    return 'processing';
  }

  if (input.status === 'FAILED') {
    return 'failed';
  }

  if (input.dispatchSummary.failed > 0) {
    return 'failed';
  }

  if (input.status === 'COMPLETED') {
    return 'sent';
  }

  return 'pending';
};

export const reminderScheduleHealthPresentation: Record<
  ReminderScheduleHealth,
  { label: string; className: string }
> = {
  pending: {
    label: 'Pendiente',
    className: 'bg-slate-100 text-slate-700 ring-slate-200'
  },
  processing: {
    label: 'Procesando',
    className: 'bg-blue-50 text-blue-700 ring-blue-200'
  },
  sent: {
    label: 'Enviado',
    className: 'bg-emerald-50 text-emerald-700 ring-emerald-200'
  },
  failed: {
    label: 'Con fallos',
    className: 'bg-rose-50 text-rose-700 ring-rose-200'
  }
};

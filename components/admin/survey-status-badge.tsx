import type { SurveyCampaignStatus, SurveyLifecycleState } from '@/types/survey';

const statusConfig: Record<
  SurveyCampaignStatus,
  { label: string; className: string }
> = {
  BORRADOR: {
    label: 'Borrador',
    className: 'bg-slate-100 text-slate-700 ring-slate-200'
  },
  CREADA: {
    label: 'Creada',
    className: 'bg-blue-50 text-blue-700 ring-blue-200'
  },
  EN_PROCESO: {
    label: 'En proceso',
    className: 'bg-emerald-50 text-emerald-700 ring-emerald-200'
  },
  FINALIZADA: {
    label: 'Finalizada',
    className: 'bg-amber-50 text-amber-700 ring-amber-200'
  }
};

const lifecycleStateConfig: Record<
  SurveyLifecycleState,
  { label: string; className: string }
> = {
  DRAFT: {
    label: 'Borrador',
    className: 'bg-slate-100 text-slate-700 ring-slate-200'
  },
  SCHEDULED: {
    label: 'Programada',
    className: 'bg-blue-50 text-blue-700 ring-blue-200'
  },
  ACTIVE: {
    label: 'Activa',
    className: 'bg-emerald-50 text-emerald-700 ring-emerald-200'
  },
  CLOSED: {
    label: 'Cerrada',
    className: 'bg-amber-50 text-amber-700 ring-amber-200'
  },
  FINALIZED: {
    label: 'Finalizada',
    className: 'bg-rose-50 text-rose-700 ring-rose-200'
  }
};

type SurveyStatusBadgeProps = {
  status: SurveyCampaignStatus;
  lifecycleState?: SurveyLifecycleState;
};

export function SurveyStatusBadge({ status, lifecycleState }: SurveyStatusBadgeProps) {
  const config = lifecycleState
    ? lifecycleStateConfig[lifecycleState]
    : statusConfig[status];

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${config.className}`}
    >
      {config.label}
    </span>
  );
}

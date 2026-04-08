import type { SurveyCampaignStatus, SurveyLifecycleState } from '@/types/survey';

const statusConfig: Record<
  SurveyCampaignStatus,
  { label: string; className: string }
> = {
  BORRADOR: {
    label: 'Borrador',
    className: 'border-white/12 bg-white/8 text-cooltura-light/78'
  },
  CREADA: {
    label: 'Creada',
    className: 'border-sky-300/30 bg-sky-400/10 text-sky-100'
  },
  EN_PROCESO: {
    label: 'En proceso',
    className: 'border-cooltura-lime/35 bg-cooltura-lime/12 text-cooltura-light'
  },
  FINALIZADA: {
    label: 'Finalizada',
    className: 'border-amber-300/35 bg-amber-400/10 text-amber-100'
  }
};

const lifecycleStateConfig: Record<
  SurveyLifecycleState,
  { label: string; className: string }
> = {
  DRAFT: {
    label: 'Borrador',
    className: 'border-white/12 bg-white/8 text-cooltura-light/78'
  },
  SCHEDULED: {
    label: 'Programada',
    className: 'border-sky-300/30 bg-sky-400/10 text-sky-100'
  },
  ACTIVE: {
    label: 'Activa',
    className: 'border-cooltura-lime/35 bg-cooltura-lime/12 text-cooltura-light'
  },
  CLOSED: {
    label: 'Cerrada',
    className: 'border-amber-300/35 bg-amber-400/10 text-amber-100'
  },
  FINALIZED: {
    label: 'Finalizada',
    className: 'border-rose-300/35 bg-rose-500/10 text-rose-100'
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
    <span className={`admin-status-badge ${config.className}`}>
      {config.label}
    </span>
  );
}

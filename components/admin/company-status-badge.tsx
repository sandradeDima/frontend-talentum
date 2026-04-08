import type { CompanyStatus } from '@/types/company';

const statusConfig: Record<
  CompanyStatus,
  { label: string; className: string }
> = {
  PENDING_SETUP: {
    label: 'Pendiente',
    className: 'border-amber-300/35 bg-amber-400/10 text-amber-100'
  },
  ACTIVE: {
    label: 'Activa',
    className: 'border-cooltura-lime/35 bg-cooltura-lime/12 text-cooltura-light'
  },
  INACTIVE: {
    label: 'Inactiva',
    className: 'border-white/12 bg-white/8 text-cooltura-light/78'
  }
};

type CompanyStatusBadgeProps = {
  status: CompanyStatus;
};

export function CompanyStatusBadge({ status }: CompanyStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span className={`admin-status-badge ${config.className}`}>
      {config.label}
    </span>
  );
}

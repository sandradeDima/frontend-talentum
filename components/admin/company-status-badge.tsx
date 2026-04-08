import type { CompanyStatus } from '@/types/company';

const statusConfig: Record<
  CompanyStatus,
  { label: string; className: string }
> = {
  PENDING_SETUP: {
    label: 'Pendiente',
    className: 'bg-amber-50 text-amber-700 ring-amber-200'
  },
  ACTIVE: {
    label: 'Activa',
    className: 'bg-emerald-50 text-emerald-700 ring-emerald-200'
  },
  INACTIVE: {
    label: 'Inactiva',
    className: 'bg-slate-100 text-slate-700 ring-slate-200'
  }
};

type CompanyStatusBadgeProps = {
  status: CompanyStatus;
};

export function CompanyStatusBadge({ status }: CompanyStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${config.className}`}
    >
      {config.label}
    </span>
  );
}

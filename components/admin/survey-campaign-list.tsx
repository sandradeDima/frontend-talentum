import Link from 'next/link';
import { env } from '@/lib/env';
import type { SurveyCampaignSummary } from '@/types/survey';
import { SurveyStatusBadge } from './survey-status-badge';

type SurveyCampaignListProps = {
  companySlug: string;
  rows: SurveyCampaignSummary[];
  canManage: boolean;
};

const dateFormatter = new Intl.DateTimeFormat('es-BO', {
  dateStyle: 'medium'
});

export function SurveyCampaignList({ companySlug, rows, canManage }: SurveyCampaignListProps) {
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
        <p className="text-base font-semibold text-ink">Aún no hay encuestas creadas</p>
        <p className="mt-1 text-sm text-slate-600">
          Crea la primera campaña para comenzar la medición del clima.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
            <tr>
              <th className="px-4 py-3 font-semibold">Nombre</th>
              <th className="px-4 py-3 font-semibold">Fecha de creación</th>
              <th className="px-4 py-3 font-semibold">Fecha inicial</th>
              <th className="px-4 py-3 font-semibold">Fecha de fin</th>
              <th className="px-4 py-3 font-semibold">Finalizada</th>
              <th className="px-4 py-3 font-semibold">Total de días habilitados</th>
              <th className="px-4 py-3 font-semibold">Estado</th>
              <th className="px-4 py-3 font-semibold">Link genérico de encuesta</th>
              <th className="px-4 py-3 text-right font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((survey) => {
              const publicLink = `${env.appUrl}${survey.genericLinkPath}`;

              return (
                <tr key={survey.id} className="align-top">
                  <td className="px-4 py-3 font-medium text-ink">{survey.name}</td>
                  <td className="px-4 py-3 text-slate-700">
                    {dateFormatter.format(new Date(survey.createdAt))}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {dateFormatter.format(new Date(survey.startDate))}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {dateFormatter.format(new Date(survey.endDate))}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {survey.finalizedAt
                      ? dateFormatter.format(new Date(survey.finalizedAt))
                      : 'Pendiente'}
                  </td>
                  <td className="px-4 py-3 text-slate-700">{survey.totalEnabledDays}</td>
                  <td className="px-4 py-3">
                    <SurveyStatusBadge
                      status={survey.status}
                      lifecycleState={survey.lifecycle.state}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <a
                      href={publicLink}
                      target="_blank"
                      rel="noreferrer"
                      className="break-all text-xs text-brand transition hover:text-brandDark"
                    >
                      {publicLink}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2 whitespace-nowrap">
                      <Link
                        href={`/admin/companies/${companySlug}/surveys/${survey.slug}/reporting`}
                        className="inline-flex min-w-24 justify-center rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                      >
                        Resultados
                      </Link>
                      <Link
                        href={`/admin/companies/${companySlug}/surveys/${survey.slug}/operations`}
                        className="inline-flex min-w-24 justify-center rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                      >
                        Operaciones
                      </Link>
                      <Link
                        href={`/admin/companies/${companySlug}/surveys/${survey.slug}`}
                        className="inline-flex min-w-24 justify-center rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                      >
                        {canManage ? 'Editar' : 'Ver detalle'}
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireSession } from '@/lib/auth-session';
import { extractErrorMessage } from '@/lib/auth-shared';
import { getGlobalSurveyCampaignsServer } from '@/services/survey.server';
import type { SurveyCampaignStatus } from '@/types/survey';
import { SurveyStatusBadge } from '@/components/admin/survey-status-badge';

type AdminSurveysPageProps = {
  searchParams: Promise<{
    page?: string;
    search?: string;
    company?: string;
    status?: string;
  }>;
};

const dateFormatter = new Intl.DateTimeFormat('es-BO', {
  dateStyle: 'medium'
});

const statusOptions: Array<{ value: SurveyCampaignStatus; label: string }> = [
  { value: 'BORRADOR', label: 'Borrador' },
  { value: 'CREADA', label: 'Creada' },
  { value: 'EN_PROCESO', label: 'En proceso' },
  { value: 'FINALIZADA', label: 'Finalizada' }
];

const statusSet = new Set(statusOptions.map((option) => option.value));

const toPositiveNumber = (value: string | undefined, fallback: number) => {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const buildHref = (input: {
  page: number;
  search?: string;
  company?: string;
  status?: SurveyCampaignStatus;
}) => {
  const params = new URLSearchParams();
  params.set('page', String(input.page));

  if (input.search) {
    params.set('search', input.search);
  }

  if (input.company) {
    params.set('company', input.company);
  }

  if (input.status) {
    params.set('status', input.status);
  }

  return `/admin/surveys?${params.toString()}`;
};

export default async function AdminSurveysPage({ searchParams }: AdminSurveysPageProps) {
  const session = await requireSession(['ADMIN', 'CLIENT_ADMIN']);

  if (session.user.role !== 'ADMIN') {
    if (session.user.companySlug) {
      redirect(`/admin/companies/${session.user.companySlug}/surveys`);
    }
    redirect('/admin/home');
  }

  const query = await searchParams;
  const page = toPositiveNumber(query.page, 1);
  const search = query.search?.trim() || undefined;
  const company = query.company?.trim() || undefined;
  const status =
    query.status && statusSet.has(query.status as SurveyCampaignStatus)
      ? (query.status as SurveyCampaignStatus)
      : undefined;

  try {
    const result = await getGlobalSurveyCampaignsServer({
      page,
      pageSize: 10,
      search,
      company,
      status
    });

    return (
      <section className="space-y-4">
        <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-semibold text-ink">Encuestas</h1>
              <p className="text-sm text-slate-600">
                Vista global de campañas por empresa.
              </p>
            </div>
            <Link
              href="/admin/surveys/history"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Ver histórico finalizado
            </Link>
          </div>

          <form className="mt-4 grid gap-3 md:grid-cols-[1fr,220px,180px,auto]">
            <input
              type="text"
              name="search"
              defaultValue={search ?? ''}
              placeholder="Buscar por nombre, slug o empresa"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-brand transition focus:ring-2"
            />

            <input
              type="text"
              name="company"
              defaultValue={company ?? ''}
              placeholder="Empresa o slug"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-brand transition focus:ring-2"
            />

            <select
              name="status"
              defaultValue={status ?? ''}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-brand transition focus:ring-2"
            >
              <option value="">Todos los estados</option>
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <button
              type="submit"
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Buscar
            </button>
          </form>
        </header>

        {result.rows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-600">
            No hay encuestas para mostrar con estos filtros.
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Encuesta</th>
                    <th className="px-4 py-3 font-semibold">Empresa</th>
                    <th className="px-4 py-3 font-semibold">Creada</th>
                    <th className="px-4 py-3 font-semibold">Inicio</th>
                    <th className="px-4 py-3 font-semibold">Fin</th>
                    <th className="px-4 py-3 font-semibold">Estado</th>
                    <th className="px-4 py-3 text-right font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {result.rows.map((row) => (
                    <tr key={row.id} className="align-top">
                      <td className="px-4 py-3 font-medium text-ink">{row.name}</td>
                      <td className="px-4 py-3 text-slate-700">
                        <Link
                          href={`/admin/companies/${row.company.slug}`}
                          className="font-medium text-brand transition hover:text-brandDark"
                        >
                          {row.company.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {dateFormatter.format(new Date(row.createdAt))}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {dateFormatter.format(new Date(row.startDate))}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {dateFormatter.format(new Date(row.endDate))}
                      </td>
                      <td className="px-4 py-3">
                        <SurveyStatusBadge
                          status={row.status}
                          lifecycleState={row.lifecycle.state}
                        />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <Link
                            href={`/admin/companies/${row.company.slug}/surveys/${row.slug}/reporting`}
                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                          >
                            Resultados
                          </Link>
                          <Link
                            href={`/admin/companies/${row.company.slug}/surveys/${row.slug}/operations`}
                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                          >
                            Operaciones
                          </Link>
                          <Link
                            href={`/admin/companies/${row.company.slug}/surveys/${row.slug}`}
                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                          >
                            Ver detalle
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <footer className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
          <p>
            Mostrando {result.rows.length} de {result.pagination.total} encuestas
          </p>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wide text-slate-500">
              Página {result.pagination.page} de {result.pagination.totalPages}
            </span>
            <Link
              href={buildHref({
                page: Math.max(1, result.pagination.page - 1),
                search,
                company,
                status
              })}
              className={`rounded-lg border px-3 py-1.5 ${
                result.pagination.page === 1
                  ? 'pointer-events-none border-slate-200 text-slate-400'
                  : 'border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              Anterior
            </Link>
            <Link
              href={buildHref({
                page: Math.min(result.pagination.totalPages, result.pagination.page + 1),
                search,
                company,
                status
              })}
              className={`rounded-lg border px-3 py-1.5 ${
                result.pagination.page >= result.pagination.totalPages
                  ? 'pointer-events-none border-slate-200 text-slate-400'
                  : 'border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              Siguiente
            </Link>
          </div>
        </footer>
      </section>
    );
  } catch (error) {
    return (
      <section className="rounded-xl border border-rose-200 bg-white p-5 shadow-sm">
        <h1 className="text-lg font-semibold text-ink">Encuestas</h1>
        <p className="mt-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {extractErrorMessage(error)}
        </p>
      </section>
    );
  }
}

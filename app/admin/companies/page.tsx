import Link from 'next/link';
import { getCompaniesServer } from '@/services/company.server';
import { CompanyTable } from '@/components/admin/company-table';
import { requireSession } from '@/lib/auth-session';
import { extractErrorMessage } from '@/lib/auth-shared';
import type { CompanyStatus } from '@/types/company';

type CompaniesPageProps = {
  searchParams: Promise<{
    page?: string;
    search?: string;
    status?: string;
    success?: string;
  }>;
};

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
  status?: CompanyStatus;
}) => {
  const params = new URLSearchParams();
  params.set('page', String(input.page));

  if (input.search) {
    params.set('search', input.search);
  }

  if (input.status) {
    params.set('status', input.status);
  }

  return `/admin/companies?${params.toString()}`;
};

const statusOptions: Array<{ value: CompanyStatus; label: string }> = [
  { value: 'PENDING_SETUP', label: 'Pendiente' },
  { value: 'ACTIVE', label: 'Activa' },
  { value: 'INACTIVE', label: 'Inactiva' }
];

const statusSet = new Set(statusOptions.map((option) => option.value));

export default async function CompaniesPage({ searchParams }: CompaniesPageProps) {
  const session = await requireSession(['ADMIN', 'CLIENT_ADMIN']);
  const query = await searchParams;

  const page = toPositiveNumber(query.page, 1);
  const search = query.search?.trim() || undefined;
  const status = query.status && statusSet.has(query.status as CompanyStatus)
    ? (query.status as CompanyStatus)
    : undefined;
  const success = query.success;

  try {
    const result = await getCompaniesServer({
      page,
      pageSize: 10,
      search,
      status
    });

    return (
      <section className="space-y-4">
        <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-semibold text-ink">Directorio de empresas</h1>
              <p className="text-sm text-slate-600">
                Gestión de compañías multiempresa y sus administradores.
              </p>
            </div>
            {session.user.role === 'ADMIN' ? (
              <Link
                href="/admin/companies/new"
                className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition hover:bg-brandDark"
              >
                Crear empresa
              </Link>
            ) : null}
          </div>

          <form className="mt-4 grid gap-3 md:grid-cols-[1fr,220px,auto]">
            <input
              type="text"
              name="search"
              defaultValue={search ?? ''}
              placeholder="Buscar por nombre, slug o correo de contacto"
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

        {success === 'created' ? (
          <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            Empresa creada correctamente.
          </p>
        ) : null}

        <CompanyTable rows={result.rows} />

        <footer className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
          <p>
            Mostrando {result.rows.length} de {result.pagination.total} empresas
          </p>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wide text-slate-500">
              Página {result.pagination.page} de {result.pagination.totalPages}
            </span>
            <Link
              href={buildHref({
                page: Math.max(1, result.pagination.page - 1),
                search,
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
        <h1 className="text-lg font-semibold text-ink">Directorio de empresas</h1>
        <p className="mt-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {extractErrorMessage(error)}
        </p>
      </section>
    );
  }
}

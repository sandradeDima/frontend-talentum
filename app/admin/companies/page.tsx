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
        <header className="admin-panel">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="admin-kicker">Administración global</p>
              <h1 className="admin-title mt-3">Directorio de empresas</h1>
              <p className="admin-subtitle mt-3">
                Gestión de compañías multiempresa y sus administradores.
              </p>
            </div>
            {session.user.role === 'ADMIN' ? (
              <Link
                href="/admin/companies/new"
                className="admin-button-primary"
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
              className="admin-input"
            />

            <select
              name="status"
              defaultValue={status ?? ''}
              className="admin-select"
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
              className="admin-button-secondary"
            >
              Buscar
            </button>
          </form>
        </header>

        {success === 'created' ? (
          <p className="admin-banner-success">
            Empresa creada correctamente.
          </p>
        ) : null}

        <CompanyTable rows={result.rows} />

        <footer className="admin-panel-soft flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
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
              className={`rounded-[1rem] border px-3 py-1.5 ${
                result.pagination.page === 1
                  ? 'pointer-events-none border-white/8 text-cooltura-light/28'
                  : 'border-white/14 text-cooltura-light/78 hover:bg-white/8'
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
              className={`rounded-[1rem] border px-3 py-1.5 ${
                result.pagination.page >= result.pagination.totalPages
                  ? 'pointer-events-none border-white/8 text-cooltura-light/28'
                  : 'border-white/14 text-cooltura-light/78 hover:bg-white/8'
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
      <section className="admin-panel">
        <h1 className="admin-title text-[1rem] sm:text-[1.15rem]">Directorio de empresas</h1>
        <p className="admin-banner-error mt-3">
          {extractErrorMessage(error)}
        </p>
      </section>
    );
  }
}

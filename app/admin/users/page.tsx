import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireSession } from '@/lib/auth-session';
import { extractErrorMessage } from '@/lib/auth-shared';
import { getGlobalCompanyUsersServer } from '@/services/company-user.server';
import type { CompanyUserActivationStatus } from '@/types/company-user';

type AdminUsersPageProps = {
  searchParams: Promise<{
    page?: string;
    search?: string;
    company?: string;
    activationStatus?: string;
  }>;
};

const dateFormatter = new Intl.DateTimeFormat('es-BO', {
  dateStyle: 'medium'
});

const dateTimeFormatter = new Intl.DateTimeFormat('es-BO', {
  dateStyle: 'medium',
  timeStyle: 'short'
});

const statusLabels: Record<CompanyUserActivationStatus, string> = {
  PENDIENTE_ACTIVACION: 'Pendiente',
  ACTIVO: 'Activo',
  INACTIVO: 'Inactivo'
};

const statusClassMap: Record<CompanyUserActivationStatus, string> = {
  PENDIENTE_ACTIVACION: 'border border-amber-200 bg-amber-50 text-amber-800',
  ACTIVO: 'border border-emerald-200 bg-emerald-50 text-emerald-800',
  INACTIVO: 'border border-slate-200 bg-slate-100 text-slate-700'
};

const statusOptions: Array<{ value: CompanyUserActivationStatus; label: string }> = [
  { value: 'PENDIENTE_ACTIVACION', label: 'Pendiente' },
  { value: 'ACTIVO', label: 'Activo' },
  { value: 'INACTIVO', label: 'Inactivo' }
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
  activationStatus?: CompanyUserActivationStatus;
}) => {
  const params = new URLSearchParams();
  params.set('page', String(input.page));

  if (input.search) {
    params.set('search', input.search);
  }

  if (input.company) {
    params.set('company', input.company);
  }

  if (input.activationStatus) {
    params.set('activationStatus', input.activationStatus);
  }

  return `/admin/users?${params.toString()}`;
};

export default async function AdminUsersPage({ searchParams }: AdminUsersPageProps) {
  const session = await requireSession(['ADMIN', 'CLIENT_ADMIN']);

  if (session.user.role !== 'ADMIN') {
    if (session.user.companySlug) {
      redirect(`/admin/companies/${session.user.companySlug}#usuarios`);
    }
    redirect('/admin/home');
  }

  const query = await searchParams;
  const page = toPositiveNumber(query.page, 1);
  const search = query.search?.trim() || undefined;
  const company = query.company?.trim() || undefined;
  const activationStatus =
    query.activationStatus && statusSet.has(query.activationStatus as CompanyUserActivationStatus)
      ? (query.activationStatus as CompanyUserActivationStatus)
      : undefined;

  try {
    const result = await getGlobalCompanyUsersServer({
      page,
      pageSize: 10,
      search,
      company,
      activationStatus
    });

    return (
      <section className="space-y-4">
        <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h1 className="text-xl font-semibold text-ink">Usuarios</h1>
          <p className="text-sm text-slate-600">
            Vista global de usuarios administrativos por empresa.
          </p>

          <form className="mt-4 grid gap-3 md:grid-cols-[1fr,220px,180px,auto]">
            <input
              type="text"
              name="search"
              defaultValue={search ?? ''}
              placeholder="Buscar por nombre, correo o empresa"
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
              name="activationStatus"
              defaultValue={activationStatus ?? ''}
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
            No hay usuarios para mostrar con estos filtros.
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Usuario</th>
                    <th className="px-4 py-3 font-semibold">Empresa</th>
                    <th className="px-4 py-3 font-semibold">Correo</th>
                    <th className="px-4 py-3 font-semibold">Estado</th>
                    <th className="px-4 py-3 font-semibold">Acceso</th>
                    <th className="px-4 py-3 font-semibold">Creado</th>
                    <th className="px-4 py-3 font-semibold">Último acceso</th>
                    <th className="px-4 py-3 text-right font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {result.rows.map((row) => (
                    <tr key={row.id} className="align-top">
                      <td className="px-4 py-3 font-medium text-ink">{row.fullName}</td>
                      <td className="px-4 py-3 text-slate-700">
                        {row.company ? (
                          <Link
                            href={`/admin/companies/${row.company.slug}`}
                            className="font-medium text-brand transition hover:text-brandDark"
                          >
                            {row.company.name}
                          </Link>
                        ) : (
                          'Sin empresa'
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-700">{row.email}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${statusClassMap[row.activationStatus]}`}
                        >
                          {statusLabels[row.activationStatus]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{row.accessModeLabel}</td>
                      <td className="px-4 py-3 text-slate-700">
                        {dateFormatter.format(new Date(row.createdAt))}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {row.lastLoginAt
                          ? dateTimeFormatter.format(new Date(row.lastLoginAt))
                          : 'Sin acceso'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {row.company ? (
                          <Link
                            href={`/admin/companies/${row.company.slug}#usuarios`}
                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                          >
                            Ver empresa
                          </Link>
                        ) : (
                          <span className="text-xs text-slate-400">Sin acción</span>
                        )}
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
            Mostrando {result.rows.length} de {result.pagination.total} usuarios
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
                activationStatus
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
                activationStatus
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
        <h1 className="text-lg font-semibold text-ink">Usuarios</h1>
        <p className="mt-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {extractErrorMessage(error)}
        </p>
      </section>
    );
  }
}

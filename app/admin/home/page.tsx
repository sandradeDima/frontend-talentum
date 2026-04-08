import Link from 'next/link';
import { requireSession } from '@/lib/auth-session';
import { extractErrorMessage } from '@/lib/auth-shared';
import { getCompanyBySlugServer, getCompaniesServer } from '@/services/company.server';
import {
  getCompanyUsersBySlugServer,
  getGlobalCompanyUsersServer
} from '@/services/company-user.server';
import {
  getGlobalSurveyCampaignsServer,
  getSurveyCampaignsByCompanySlugServer
} from '@/services/survey.server';

export default async function AdminHomePage() {
  const session = await requireSession(['ADMIN', 'CLIENT_ADMIN']);

  if (session.user.role === 'ADMIN') {
    try {
      const [companies, users, surveys] = await Promise.all([
        getCompaniesServer({ page: 1, pageSize: 1 }),
        getGlobalCompanyUsersServer({ page: 1, pageSize: 1 }),
        getGlobalSurveyCampaignsServer({ page: 1, pageSize: 1 })
      ]);

      return (
        <section className="space-y-4">
          <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h1 className="text-xl font-semibold text-ink">Home</h1>
            <p className="text-sm text-slate-600">
              Accesos rápidos para gestión global de empresas, encuestas y usuarios.
            </p>
          </header>

          <div className="grid gap-3 md:grid-cols-3">
            <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-slate-500">Empresas</p>
              <p className="mt-1 text-2xl font-semibold text-ink">
                {companies.pagination.total}
              </p>
              <Link
                href="/admin/companies"
                className="mt-3 inline-flex text-sm font-medium text-brand transition hover:text-brandDark"
              >
                Ver directorio
              </Link>
            </article>

            <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-slate-500">Usuarios</p>
              <p className="mt-1 text-2xl font-semibold text-ink">{users.pagination.total}</p>
              <Link
                href="/admin/users"
                className="mt-3 inline-flex text-sm font-medium text-brand transition hover:text-brandDark"
              >
                Ver usuarios
              </Link>
            </article>

            <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-slate-500">Encuestas</p>
              <p className="mt-1 text-2xl font-semibold text-ink">{surveys.pagination.total}</p>
              <Link
                href="/admin/surveys"
                className="mt-3 inline-flex text-sm font-medium text-brand transition hover:text-brandDark"
              >
                Ver encuestas
              </Link>
            </article>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-ink">Quick actions</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                href="/admin/companies/new"
                className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition hover:bg-brandDark"
              >
                Crear empresa
              </Link>
              <Link
                href="/admin/companies"
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Gestionar empresas
              </Link>
              <Link
                href="/admin/surveys"
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Revisar encuestas
              </Link>
              <Link
                href="/admin/users"
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Revisar usuarios
              </Link>
            </div>
          </div>
        </section>
      );
    } catch (error) {
      return (
        <section className="rounded-xl border border-rose-200 bg-white p-5 shadow-sm">
          <h1 className="text-lg font-semibold text-ink">Home</h1>
          <p className="mt-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {extractErrorMessage(error)}
          </p>
        </section>
      );
    }
  }

  if (!session.user.companySlug) {
    return (
      <section className="rounded-xl border border-amber-300 bg-white p-5 shadow-sm">
        <h1 className="text-lg font-semibold text-ink">Home</h1>
        <p className="mt-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Tu cuenta no tiene empresa asignada todavía.
        </p>
      </section>
    );
  }

  try {
    const [company, usersData, surveysData] = await Promise.all([
      getCompanyBySlugServer(session.user.companySlug),
      getCompanyUsersBySlugServer(session.user.companySlug),
      getSurveyCampaignsByCompanySlugServer(session.user.companySlug)
    ]);

    return (
      <section className="space-y-4">
        <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h1 className="text-xl font-semibold text-ink">Home</h1>
          <p className="text-sm text-slate-600">Resumen de tu empresa: {company.name}</p>
        </header>

        <div className="grid gap-3 md:grid-cols-3">
          <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-slate-500">Empresa</p>
            <p className="mt-1 text-lg font-semibold text-ink">{company.name}</p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-slate-500">Usuarios</p>
            <p className="mt-1 text-2xl font-semibold text-ink">{usersData.rows.length}</p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-slate-500">Encuestas</p>
            <p className="mt-1 text-2xl font-semibold text-ink">{surveysData.rows.length}</p>
          </article>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-ink">Quick actions</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href={`/admin/companies/${company.slug}`}
              className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition hover:bg-brandDark"
            >
              Ver empresa
            </Link>
            <Link
              href={`/admin/companies/${company.slug}/surveys`}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Ver encuestas
            </Link>
          </div>
        </div>
      </section>
    );
  } catch (error) {
    return (
      <section className="rounded-xl border border-rose-200 bg-white p-5 shadow-sm">
        <h1 className="text-lg font-semibold text-ink">Home</h1>
        <p className="mt-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {extractErrorMessage(error)}
        </p>
      </section>
    );
  }
}

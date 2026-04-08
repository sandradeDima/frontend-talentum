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
          <header className="admin-panel">
            <p className="admin-kicker">Overview</p>
            <h1 className="admin-title mt-3">Home</h1>
            <p className="admin-subtitle mt-3">
              Accesos rápidos para gestión global de empresas, encuestas y usuarios.
            </p>
          </header>

          <div className="grid gap-3 md:grid-cols-3">
            <article className="admin-panel-soft">
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

            <article className="admin-panel-soft">
              <p className="text-xs uppercase tracking-wide text-slate-500">Usuarios</p>
              <p className="mt-1 text-2xl font-semibold text-ink">{users.pagination.total}</p>
              <Link
                href="/admin/users"
                className="mt-3 inline-flex text-sm font-medium text-brand transition hover:text-brandDark"
              >
                Ver usuarios
              </Link>
            </article>

            <article className="admin-panel-soft">
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

          <div className="admin-panel">
            <h2 className="admin-title text-[1rem] sm:text-[1.15rem]">Quick actions</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                href="/admin/companies/new"
                className="admin-button-primary"
              >
                Crear empresa
              </Link>
              <Link
                href="/admin/companies"
                className="admin-button-secondary"
              >
                Gestionar empresas
              </Link>
              <Link
                href="/admin/surveys"
                className="admin-button-secondary"
              >
                Revisar encuestas
              </Link>
              <Link
                href="/admin/users"
                className="admin-button-secondary"
              >
                Revisar usuarios
              </Link>
            </div>
          </div>
        </section>
      );
    } catch (error) {
      return (
        <section className="admin-panel">
          <h1 className="admin-title text-[1rem] sm:text-[1.15rem]">Home</h1>
          <p className="admin-banner-error mt-3">
            {extractErrorMessage(error)}
          </p>
        </section>
      );
    }
  }

  if (!session.user.companySlug) {
    return (
      <section className="admin-panel">
        <h1 className="admin-title text-[1rem] sm:text-[1.15rem]">Home</h1>
        <p className="admin-banner-warning mt-3">
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
        <header className="admin-panel">
          <p className="admin-kicker">Mi empresa</p>
          <h1 className="admin-title mt-3">Home</h1>
          <p className="admin-subtitle mt-3">Resumen de tu empresa: {company.name}</p>
        </header>

        <div className="grid gap-3 md:grid-cols-3">
          <article className="admin-panel-soft">
            <p className="text-xs uppercase tracking-wide text-slate-500">Empresa</p>
            <p className="mt-1 text-lg font-semibold text-ink">{company.name}</p>
          </article>
          <article className="admin-panel-soft">
            <p className="text-xs uppercase tracking-wide text-slate-500">Usuarios</p>
            <p className="mt-1 text-2xl font-semibold text-ink">{usersData.rows.length}</p>
          </article>
          <article className="admin-panel-soft">
            <p className="text-xs uppercase tracking-wide text-slate-500">Encuestas</p>
            <p className="mt-1 text-2xl font-semibold text-ink">{surveysData.rows.length}</p>
          </article>
        </div>

        <div className="admin-panel">
          <h2 className="admin-title text-[1rem] sm:text-[1.15rem]">Quick actions</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href={`/admin/companies/${company.slug}`}
              className="admin-button-primary"
            >
              Ver empresa
            </Link>
            <Link
              href={`/admin/companies/${company.slug}/surveys`}
              className="admin-button-secondary"
            >
              Ver encuestas
            </Link>
          </div>
        </div>
      </section>
    );
  } catch (error) {
    return (
      <section className="admin-panel">
        <h1 className="admin-title text-[1rem] sm:text-[1.15rem]">Home</h1>
        <p className="admin-banner-error mt-3">
          {extractErrorMessage(error)}
        </p>
      </section>
    );
  }
}

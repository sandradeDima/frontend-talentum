import Link from 'next/link';
import { redirect } from 'next/navigation';
import { CompanyForm } from '@/components/admin/company-form';
import { CompanyStatusBadge } from '@/components/admin/company-status-badge';
import { CompanyUsersManager } from '@/components/admin/company-users-manager';
import { SurveyCampaignList } from '@/components/admin/survey-campaign-list';
import { getCompanyBySlugServer } from '@/services/company.server';
import { getCompanyUsersBySlugServer } from '@/services/company-user.server';
import { getSurveyCampaignsByCompanySlugServer } from '@/services/survey.server';
import { requireSession } from '@/lib/auth-session';
import { extractErrorMessage } from '@/lib/auth-shared';

type CompanyDetailPageProps = {
  params: Promise<{ slug: string }>;
};

const dateFormatter = new Intl.DateTimeFormat('es-BO', {
  dateStyle: 'medium'
});

export default async function CompanyDetailPage({ params }: CompanyDetailPageProps) {
  const { slug } = await params;
  const session = await requireSession(['ADMIN', 'CLIENT_ADMIN']);

  if (session.user.role === 'CLIENT_ADMIN' && session.user.companySlug !== slug) {
    if (session.user.companySlug) {
      redirect(`/admin/companies/${session.user.companySlug}`);
    }
    redirect('/admin/companies');
  }

  try {
    const [company, usersData, surveysData] = await Promise.all([
      getCompanyBySlugServer(slug),
      getCompanyUsersBySlugServer(slug),
      getSurveyCampaignsByCompanySlugServer(slug)
    ]);

    return (
      <section className="space-y-4">
        <header className="admin-panel">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="admin-kicker">Empresa</p>
              <h1 className="admin-title mt-3">{company.name}</h1>
              <p className="admin-subtitle mt-3">
                Configura el perfil de la empresa y sus datos de gestión.
              </p>
            </div>
            <CompanyStatusBadge status={company.status} />
          </div>

          <nav className="mt-4 flex flex-wrap gap-2 text-sm">
            <Link
              href={`/admin/companies/${company.slug}#perfil`}
              className="admin-button-primary px-3 py-1.5"
            >
              Configurar/modificar perfil
            </Link>
            <Link
              href={`/admin/companies/${company.slug}#usuarios`}
              className="admin-button-secondary px-3 py-1.5"
            >
              Usuarios
            </Link>
            <Link
              href={`/admin/companies/${company.slug}#encuestas`}
              className="admin-button-secondary px-3 py-1.5"
            >
              Encuestas
            </Link>
          </nav>

          <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <p className="text-xs uppercase tracking-wide text-slate-500">Slug</p>
              <p className="text-sm font-medium text-slate-800">{company.slug}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Correo de contacto
              </p>
              <p className="text-sm font-medium text-slate-800">{company.contactEmail}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <p className="text-xs uppercase tracking-wide text-slate-500">Trabajadores</p>
              <p className="text-sm font-medium text-slate-800">{company.workerCount}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <p className="text-xs uppercase tracking-wide text-slate-500">Creación</p>
              <p className="text-sm font-medium text-slate-800">
                {dateFormatter.format(new Date(company.createdAt))}
              </p>
            </div>
          </div>
        </header>

        <div id="perfil" className="admin-panel">
          <CompanyForm
            mode="edit"
            companySlug={company.slug}
            initialCompany={company}
            allowRestrictedFields={session.user.role === 'ADMIN'}
          />
        </div>

        <div id="usuarios" className="admin-panel">
          <CompanyUsersManager
            companySlug={company.slug}
            initialRows={usersData.rows}
            canManage={session.user.role === 'ADMIN'}
          />
        </div>

        <div id="encuestas" className="admin-panel">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="admin-title text-[1rem] sm:text-[1.15rem]">Encuestas de la empresa</h2>
              <p className="admin-subtitle mt-2">
                Información específica de campañas para {company.name}.
              </p>
            </div>
            <Link
              href={`/admin/companies/${company.slug}/surveys`}
              className="admin-button-secondary px-3 py-1.5 text-sm"
            >
              Gestionar encuestas
            </Link>
          </div>
          <SurveyCampaignList
            companySlug={company.slug}
            rows={surveysData.rows}
            canManage={session.user.role === 'ADMIN'}
          />
        </div>
      </section>
    );
  } catch (error) {
    return (
      <section className="admin-panel">
        <h1 className="admin-title text-[1rem] sm:text-[1.15rem]">Detalle de empresa</h1>
        <p className="admin-banner-error mt-3">
          {extractErrorMessage(error)}
        </p>
      </section>
    );
  }
}

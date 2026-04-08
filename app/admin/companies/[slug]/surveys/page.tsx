import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireSession } from '@/lib/auth-session';
import { SurveyCampaignList } from '@/components/admin/survey-campaign-list';
import { getSurveyCampaignsByCompanySlugServer } from '@/services/survey.server';
import { extractErrorMessage } from '@/lib/auth-shared';
import { splitMeasurementsByLifecycle } from '@/lib/survey-measurements';

type CompanySurveysPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function CompanySurveysPage({ params }: CompanySurveysPageProps) {
  const { slug } = await params;
  const session = await requireSession(['ADMIN', 'CLIENT_ADMIN']);
  const canManage = session.user.role === 'ADMIN';

  if (session.user.role === 'CLIENT_ADMIN' && session.user.companySlug !== slug) {
    if (session.user.companySlug) {
      redirect(`/admin/companies/${session.user.companySlug}/surveys`);
    }
    redirect('/admin/companies');
  }

  try {
    const result = await getSurveyCampaignsByCompanySlugServer(slug);
    const company = result.company;
    const measurements = splitMeasurementsByLifecycle(result.rows);

    return (
      <section className="space-y-4">
        <header className="admin-panel">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="admin-kicker">Encuestas</p>
              <h1 className="admin-title mt-3">Gestión de encuestas</h1>
              <p className="admin-subtitle mt-3">Empresa: {company.name}</p>
              <p className="mt-2 text-xs text-cooltura-light/56">
                Crea, configura y programa campañas desde el modelo base de Talentum.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {canManage ? (
                <Link
                  href={`/admin/companies/${company.slug}/surveys/new`}
                  className="admin-button-primary"
                >
                  Crear encuesta
                </Link>
              ) : null}
              <Link
                href={`/admin/companies/${company.slug}`}
                className="admin-button-secondary"
              >
                Volver al perfil de empresa
              </Link>
              <Link
                href={`/admin/companies/${company.slug}/surveys/history`}
                className="admin-button-secondary"
              >
                Historial finalizado
              </Link>
            </div>
          </div>

          {!canManage ? (
            <p className="admin-banner-warning mt-4">
              En esta fase solo ADMIN puede crear, editar o programar encuestas.
            </p>
          ) : null}
        </header>

        <article className="admin-panel space-y-2">
          <h2 className="admin-title text-[1rem] sm:text-[1.15rem]">Mediciones en curso</h2>
          <p className="admin-subtitle">
            Incluye campañas en borrador, programadas, activas o cerradas pendientes de finalización.
          </p>
          {measurements.inProgress.length > 0 ? (
            <SurveyCampaignList
              companySlug={company.slug}
              rows={measurements.inProgress}
              canManage={canManage}
            />
          ) : (
            <div className="admin-panel-soft border-dashed text-sm text-cooltura-light/66">
              No hay mediciones en curso en esta empresa.
            </div>
          )}
        </article>

        <article className="admin-panel space-y-2">
          <h2 className="admin-title text-[1rem] sm:text-[1.15rem]">Histórico finalizado</h2>
          <p className="admin-subtitle">
            Campañas cerradas y finalizadas formalmente, listas para consulta histórica.
          </p>
          {measurements.finalized.length > 0 ? (
            <SurveyCampaignList
              companySlug={company.slug}
              rows={measurements.finalized}
              canManage={canManage}
            />
          ) : (
            <div className="admin-panel-soft border-dashed text-sm text-cooltura-light/66">
              Aún no hay mediciones finalizadas para mostrar en histórico.
            </div>
          )}
        </article>
      </section>
    );
  } catch (error) {
    return (
      <section className="admin-panel">
        <h1 className="admin-title text-[1rem] sm:text-[1.15rem]">Encuestas de empresa</h1>
        <p className="admin-banner-error mt-3">
          {extractErrorMessage(error)}
        </p>
        <div className="mt-4">
          <Link href="/admin/companies" className="inline-flex text-sm font-medium text-brand transition hover:text-brandDark">
            Volver al directorio
          </Link>
        </div>
      </section>
    );
  }
}

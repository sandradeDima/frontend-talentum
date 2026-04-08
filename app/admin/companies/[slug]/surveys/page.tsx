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
        <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-semibold text-ink">Gestión de encuestas</h1>
              <p className="text-sm text-slate-600">Empresa: {company.name}</p>
              <p className="mt-1 text-xs text-slate-500">
                Crea, configura y programa campañas desde el modelo base de Talentum.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {canManage ? (
                <Link
                  href={`/admin/companies/${company.slug}/surveys/new`}
                  className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition hover:bg-brandDark"
                >
                  Crear encuesta
                </Link>
              ) : null}
              <Link
                href={`/admin/companies/${company.slug}`}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Volver al perfil de empresa
              </Link>
              <Link
                href={`/admin/companies/${company.slug}/surveys/history`}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Historial finalizado
              </Link>
            </div>
          </div>

          {!canManage ? (
            <p className="mt-4 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              En esta fase solo ADMIN puede crear, editar o programar encuestas.
            </p>
          ) : null}
        </header>

        <article className="space-y-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-ink">Mediciones en curso</h2>
          <p className="text-sm text-slate-600">
            Incluye campañas en borrador, programadas, activas o cerradas pendientes de finalización.
          </p>
          {measurements.inProgress.length > 0 ? (
            <SurveyCampaignList
              companySlug={company.slug}
              rows={measurements.inProgress}
              canManage={canManage}
            />
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
              No hay mediciones en curso en esta empresa.
            </div>
          )}
        </article>

        <article className="space-y-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-ink">Histórico finalizado</h2>
          <p className="text-sm text-slate-600">
            Campañas cerradas y finalizadas formalmente, listas para consulta histórica.
          </p>
          {measurements.finalized.length > 0 ? (
            <SurveyCampaignList
              companySlug={company.slug}
              rows={measurements.finalized}
              canManage={canManage}
            />
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
              Aún no hay mediciones finalizadas para mostrar en histórico.
            </div>
          )}
        </article>
      </section>
    );
  } catch (error) {
    return (
      <section className="rounded-xl border border-rose-200 bg-white p-5 shadow-sm">
        <h1 className="text-lg font-semibold text-ink">Encuestas de empresa</h1>
        <p className="mt-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {extractErrorMessage(error)}
        </p>
        <div className="mt-4">
          <Link
            href="/admin/companies"
            className="inline-flex text-sm font-medium text-brand transition hover:text-brandDark"
          >
            Volver al directorio
          </Link>
        </div>
      </section>
    );
  }
}

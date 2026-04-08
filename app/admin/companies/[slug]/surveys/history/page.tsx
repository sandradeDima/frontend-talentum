import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireSession } from '@/lib/auth-session';
import { extractErrorMessage } from '@/lib/auth-shared';
import { SurveyCampaignList } from '@/components/admin/survey-campaign-list';
import { splitMeasurementsByLifecycle } from '@/lib/survey-measurements';
import { getSurveyCampaignsByCompanySlugServer } from '@/services/survey.server';

type CompanySurveyHistoryPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function CompanySurveyHistoryPage({
  params
}: CompanySurveyHistoryPageProps) {
  const { slug } = await params;
  const session = await requireSession(['ADMIN', 'CLIENT_ADMIN']);
  const canManage = session.user.role === 'ADMIN';

  if (session.user.role === 'CLIENT_ADMIN' && session.user.companySlug !== slug) {
    if (session.user.companySlug) {
      redirect(`/admin/companies/${session.user.companySlug}/surveys/history`);
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
              <h1 className="text-xl font-semibold text-ink">Histórico de mediciones</h1>
              <p className="text-sm text-slate-600">Empresa: {company.name}</p>
              <p className="mt-1 text-xs text-slate-500">
                Consulta campañas finalizadas y sus reportes consolidados.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/admin/companies/${company.slug}/surveys`}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Volver a encuestas
              </Link>
            </div>
          </div>
        </header>

        {measurements.finalized.length > 0 ? (
          <SurveyCampaignList
            companySlug={company.slug}
            rows={measurements.finalized}
            canManage={canManage}
          />
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <p className="text-base font-semibold text-ink">No hay campañas finalizadas aún</p>
            <p className="mt-1 text-sm text-slate-600">
              Finaliza una medición para que aparezca en el histórico.
            </p>
          </div>
        )}
      </section>
    );
  } catch (error) {
    return (
      <section className="rounded-xl border border-rose-200 bg-white p-5 shadow-sm">
        <h1 className="text-lg font-semibold text-ink">Histórico de mediciones</h1>
        <p className="mt-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {extractErrorMessage(error)}
        </p>
      </section>
    );
  }
}

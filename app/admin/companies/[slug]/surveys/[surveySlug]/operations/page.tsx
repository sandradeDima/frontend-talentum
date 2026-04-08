import Link from 'next/link';
import { redirect } from 'next/navigation';
import { SurveyOperationsDashboard } from '@/components/admin/survey-operations-dashboard';
import { requireSession } from '@/lib/auth-session';
import { extractErrorMessage } from '@/lib/auth-shared';
import { getCompanyBySlugServer } from '@/services/company.server';
import { getSurveyCampaignBySlugServer } from '@/services/survey.server';
import { getSurveyCampaignOperationsSummaryServer } from '@/services/survey-operations.server';

type SurveyOperationsPageProps = {
  params: Promise<{
    slug: string;
    surveySlug: string;
  }>;
};

export default async function SurveyOperationsPage({ params }: SurveyOperationsPageProps) {
  const { slug, surveySlug } = await params;
  const session = await requireSession(['ADMIN', 'CLIENT_ADMIN']);

  if (session.user.role === 'CLIENT_ADMIN' && session.user.companySlug !== slug) {
    if (session.user.companySlug) {
      redirect(`/admin/companies/${session.user.companySlug}/surveys`);
    }
    redirect('/admin/companies');
  }

  try {
    const [company, survey] = await Promise.all([
      getCompanyBySlugServer(slug),
      getSurveyCampaignBySlugServer(slug, surveySlug)
    ]);

    const summaryResult = await getSurveyCampaignOperationsSummaryServer(slug, surveySlug)
      .then((value) => ({ data: value, error: null }))
      .catch((error) => ({
        data: null,
        error: extractErrorMessage(error)
      }));

    return (
      <SurveyOperationsDashboard
        companySlug={company.slug}
        companyName={company.name}
        canManage={session.user.role === 'ADMIN'}
        initialSurvey={survey}
        initialOperationsSummary={summaryResult.data}
        initialSummaryError={summaryResult.error}
      />
    );
  } catch (error) {
    return (
      <section className="rounded-xl border border-rose-200 bg-white p-5 shadow-sm">
        <h1 className="text-lg font-semibold text-ink">Operaciones de campaña</h1>
        <p className="mt-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {extractErrorMessage(error)}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href={`/admin/companies/${slug}/surveys/${surveySlug}`}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Ir al editor
          </Link>
          <Link
            href={`/admin/companies/${slug}/surveys`}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Volver a encuestas
          </Link>
        </div>
      </section>
    );
  }
}

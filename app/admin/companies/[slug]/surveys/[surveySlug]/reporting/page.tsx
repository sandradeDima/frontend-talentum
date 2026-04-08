import Link from 'next/link';
import { redirect } from 'next/navigation';
import { SurveyReportingDashboard } from '@/components/admin/survey-reporting-dashboard';
import { requireSession } from '@/lib/auth-session';
import { extractErrorMessage } from '@/lib/auth-shared';
import { getCompanyBySlugServer } from '@/services/company.server';
import {
  getDashboardProgressServer,
  getDashboardResultsServer,
  listDashboardExportJobsServer
} from '@/services/dashboard.server';
import { getSurveyCampaignBySlugServer } from '@/services/survey.server';
import type { DashboardGroupBy } from '@/types/dashboard-reporting';

type SurveyReportingPageProps = {
  params: Promise<{
    slug: string;
    surveySlug: string;
  }>;
  searchParams: Promise<{
    groupBy?: string;
  }>;
};

const resolveGroupBy = (value: string | undefined): DashboardGroupBy => {
  if (value === 'GERENCIA' || value === 'CENTRO') {
    return value;
  }

  return 'COMPANY';
};

export default async function SurveyReportingPage({
  params,
  searchParams
}: SurveyReportingPageProps) {
  const { slug, surveySlug } = await params;
  const query = await searchParams;
  const initialGroupBy = resolveGroupBy(query.groupBy);
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

    const reportingResult = await Promise.all([
      getDashboardProgressServer({
        surveySlug: survey.slug,
        groupBy: initialGroupBy
      }),
      getDashboardResultsServer({
        surveySlug: survey.slug,
        groupBy: initialGroupBy
      })
    ])
      .then(([progress, results]) => ({
        progress,
        results,
        error: null as string | null
      }))
      .catch((error) => ({
        progress: null,
        results: null,
        error: extractErrorMessage(error)
      }));

    const exportHistoryResult = await listDashboardExportJobsServer({
      surveySlug: survey.slug,
      groupBy: initialGroupBy,
      limit: 10
    })
      .then((result) => ({
        jobs: result.jobs,
        supportedFormats: result.supportedFormats,
        error: null as string | null
      }))
      .catch((error) => ({
        jobs: [],
        supportedFormats: ['XLSX'] as const,
        error: extractErrorMessage(error)
      }));

    return (
      <SurveyReportingDashboard
        companySlug={company.slug}
        companyName={company.name}
        canManage={session.user.role === 'ADMIN'}
        survey={survey}
        initialGroupBy={initialGroupBy}
        initialProgress={reportingResult.progress}
        initialResults={reportingResult.results}
        initialError={reportingResult.error}
        initialExportJobs={exportHistoryResult.jobs}
        initialExportSupportedFormats={[...exportHistoryResult.supportedFormats]}
        initialExportError={exportHistoryResult.error}
      />
    );
  } catch (error) {
    return (
      <section className="rounded-xl border border-rose-200 bg-white p-5 shadow-sm">
        <h1 className="text-lg font-semibold text-ink">Reportes de campaña</h1>
        <p className="mt-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {extractErrorMessage(error)}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href={`/admin/companies/${slug}/surveys/${surveySlug}/operations`}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Volver a operaciones
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

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { SurveyEditor } from '@/components/admin/survey-editor';
import { requireSession } from '@/lib/auth-session';
import { extractErrorMessage } from '@/lib/auth-shared';
import { getCompanyBySlugServer } from '@/services/company.server';
import { getSurveyCampaignBySlugServer } from '@/services/survey.server';

type SurveyDetailPageProps = {
  params: Promise<{
    slug: string;
    surveySlug: string;
  }>;
};

export default async function SurveyDetailPage({ params }: SurveyDetailPageProps) {
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

    return (
      <SurveyEditor
        mode="edit"
        companySlug={company.slug}
        companyName={company.name}
        canManage={session.user.role === 'ADMIN'}
        initialSurvey={survey}
      />
    );
  } catch (error) {
    return (
      <section className="admin-panel">
        <h1 className="admin-title text-[1rem] sm:text-[1.15rem]">Detalle de encuesta</h1>
        <p className="admin-banner-error mt-3">
          {extractErrorMessage(error)}
        </p>
        <div className="mt-4">
          <Link
            href={`/admin/companies/${slug}/surveys`}
            className="inline-flex text-sm font-medium text-brand transition hover:text-brandDark"
          >
            Volver a encuestas
          </Link>
        </div>
      </section>
    );
  }
}

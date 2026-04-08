import Link from 'next/link';
import { redirect } from 'next/navigation';
import { SurveyEditor } from '@/components/admin/survey-editor';
import { requireSession } from '@/lib/auth-session';
import { extractErrorMessage } from '@/lib/auth-shared';
import { getCompanyBySlugServer } from '@/services/company.server';

type NewSurveyPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function NewSurveyPage({ params }: NewSurveyPageProps) {
  const { slug } = await params;
  const session = await requireSession(['ADMIN', 'CLIENT_ADMIN']);

  if (session.user.role === 'CLIENT_ADMIN') {
    if (session.user.companySlug) {
      redirect(`/admin/companies/${session.user.companySlug}/surveys`);
    }
    redirect('/admin/companies');
  }

  try {
    const company = await getCompanyBySlugServer(slug);

    return (
      <SurveyEditor
        mode="create"
        companySlug={company.slug}
        companyName={company.name}
        canManage
      />
    );
  } catch (error) {
    return (
      <section className="rounded-xl border border-rose-200 bg-white p-5 shadow-sm">
        <h1 className="text-lg font-semibold text-ink">Crear encuesta</h1>
        <p className="mt-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
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

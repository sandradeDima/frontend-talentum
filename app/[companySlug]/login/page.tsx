import { LoginForm } from '@/components/login-form';
import { PageShell } from '@/components/page-shell';
import { getCompanyContextBySlugServer } from '@/services/auth.server';
import {
  getSessionOrNull
} from '@/lib/auth-session';
import {
  extractErrorMessage,
  isUnauthorizedError,
  resolveLoginErrorMessageFromSearch,
  resolvePostLoginPath
} from '@/lib/auth-shared';
import { getPublicSupportConfigServer } from '@/services/support-config.server';
import { redirect } from 'next/navigation';

type CompanyLoginPageProps = {
  params: Promise<{ companySlug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CompanyLoginPage({
  params,
  searchParams
}: CompanyLoginPageProps) {
  const { companySlug } = await params;
  const currentSearchParams = await searchParams;
  const session = await getSessionOrNull();

  if (session) {
    redirect(resolvePostLoginPath(session.user));
  }

  let companyContext: Awaited<ReturnType<typeof getCompanyContextBySlugServer>> | null = null;
  let companyError: string | null = null;
  let supportConfig: Awaited<ReturnType<typeof getPublicSupportConfigServer>>['config'] | null =
    null;
  const initialError = resolveLoginErrorMessageFromSearch({
    error: currentSearchParams.error,
    authMessage: currentSearchParams.authMessage
  });

  try {
    companyContext = await getCompanyContextBySlugServer(companySlug);
  } catch (error) {
    if (!isUnauthorizedError(error)) {
      companyError = extractErrorMessage(error);
    }
  }

  try {
    const support = await getPublicSupportConfigServer(companySlug);
    supportConfig = support.config;
  } catch {
    supportConfig = null;
  }

  return (
    <PageShell
      title={companyContext ? `Acceso de ${companyContext.name}` : `Acceso de ${companySlug}`}
      subtitle="Ingreso para administradores de cliente."
      supportConfig={supportConfig}
    >
      {companyError ? (
        <p className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {companyError}
        </p>
      ) : null}

      <LoginForm
        companySlug={companyContext?.slug ?? companySlug}
        companyName={companyContext?.name}
        companyStatus={companyContext?.status ?? null}
        disabled={!companyContext}
        initialError={initialError}
      />
    </PageShell>
  );
}

import { LoginForm } from '@/components/login-form';
import { PageShell } from '@/components/page-shell';
import { getSessionOrNull } from '@/lib/auth-session';
import {
  resolveLoginErrorMessageFromSearch,
  resolvePostLoginPath
} from '@/lib/auth-shared';
import { getPublicSupportConfigServer } from '@/services/support-config.server';
import { redirect } from 'next/navigation';

type LoginPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await getSessionOrNull();
  const currentSearchParams = await searchParams;

  if (session) {
    redirect(resolvePostLoginPath(session.user));
  }

  const initialError = resolveLoginErrorMessageFromSearch({
    error: currentSearchParams.error,
    authMessage: currentSearchParams.authMessage
  });
  let supportConfig = null;

  try {
    const support = await getPublicSupportConfigServer();
    supportConfig = support.config;
  } catch {
    supportConfig = null;
  }

  return (
    <PageShell
      title="Acceso de plataforma"
      subtitle="Ingreso global para administradores de plataforma."
      supportConfig={supportConfig}
    >
      <LoginForm initialError={initialError} />
    </PageShell>
  );
}

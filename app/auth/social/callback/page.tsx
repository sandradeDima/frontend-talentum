'use client';

import { Suspense, useEffect, useMemo, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PageShell } from '@/components/page-shell';
import {
  finalizeSocialSignInClient,
  logoutClient
} from '@/services/auth.client';
import { extractErrorMessage } from '@/lib/auth-shared';

const getCompanySlug = (value: string | null): string | undefined => {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

function SocialCallbackLoader() {
  return (
    <PageShell
      title="Validando acceso social"
      subtitle="Estamos completando tu inicio de sesión. Esto puede tardar unos segundos."
    >
      <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
        Procesando autenticación con Google/Microsoft...
      </p>
    </PageShell>
  );
}

function SocialCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hasStartedRef = useRef(false);

  const companySlug = useMemo(
    () => getCompanySlug(searchParams.get('companySlug')),
    [searchParams]
  );

  useEffect(() => {
    if (hasStartedRef.current) {
      return;
    }

    hasStartedRef.current = true;

    const loginPath = companySlug
      ? `/${encodeURIComponent(companySlug)}/login`
      : '/login';

    const run = async () => {
      try {
        const result = await finalizeSocialSignInClient({
          companySlug
        });

        router.replace(result.redirectPath);
        router.refresh();
      } catch (error) {
        // Keep middleware/session checks consistent by explicitly clearing stale session cookies.
        await logoutClient().catch(() => undefined);

        const message = extractErrorMessage(error);
        const query = new URLSearchParams({ authMessage: message });

        router.replace(`${loginPath}?${query.toString()}`);
      }
    };

    run().catch(async (error) => {
      await logoutClient().catch(() => undefined);

      const message = extractErrorMessage(error);
      const query = new URLSearchParams({ authMessage: message });

      router.replace(`${loginPath}?${query.toString()}`);
    });
  }, [companySlug, router]);

  return <SocialCallbackLoader />;
}

export default function SocialCallbackPage() {
  return (
    <Suspense fallback={<SocialCallbackLoader />}>
      <SocialCallbackInner />
    </Suspense>
  );
}

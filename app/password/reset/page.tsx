import Link from 'next/link';
import { PageShell } from '@/components/page-shell';
import { PasswordResetForm } from '@/components/password-reset-form';
import { validatePasswordResetTokenServer } from '@/services/password-reset.server';
import { ApiRequestError } from '@/types/api';

type PasswordResetPageProps = {
  searchParams: Promise<{ token?: string }>;
};

const tokenErrorContent = (error: unknown) => {
  if (error instanceof ApiRequestError) {
    if (error.status === 410) {
      return {
        title: 'Enlace de recuperación expirado',
        description:
          'Este enlace ya no está disponible. Solicita uno nuevo al administrador.'
      };
    }

    if (error.status === 409) {
      return {
        title: 'Enlace ya utilizado',
        description: 'Este enlace ya fue usado. Solicita un nuevo reseteo si lo necesitas.'
      };
    }

    if (error.status === 404) {
      return {
        title: 'Enlace inválido',
        description: 'No se encontró un token de recuperación válido para este enlace.'
      };
    }

    return {
      title: 'No se pudo validar el enlace',
      description: error.message
    };
  }

  return {
    title: 'No se pudo validar el enlace',
    description: 'Intenta nuevamente en unos minutos.'
  };
};

export default async function PasswordResetPage({ searchParams }: PasswordResetPageProps) {
  const query = await searchParams;
  const token = query.token?.trim();

  if (!token) {
    return (
      <PageShell title="Restablecer contraseña" subtitle="Acceso seguro para administradores.">
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          Token de recuperación faltante o inválido.
        </p>
      </PageShell>
    );
  }

  try {
    const resetContext = await validatePasswordResetTokenServer(token);

    return (
      <PageShell
        title="Restablecer contraseña"
        subtitle="Define una nueva contraseña para continuar."
      >
        <PasswordResetForm
          token={token}
          email={resetContext.email}
          companyName={resetContext.company?.name}
        />
      </PageShell>
    );
  } catch (error) {
    const content = tokenErrorContent(error);

    return (
      <PageShell title={content.title} subtitle="No fue posible continuar con este enlace.">
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {content.description}
        </p>
        <div className="mt-4">
          <Link
            href="/login"
            className="text-sm font-medium text-brand transition hover:text-brandDark"
          >
            Ir al login
          </Link>
        </div>
      </PageShell>
    );
  }
}

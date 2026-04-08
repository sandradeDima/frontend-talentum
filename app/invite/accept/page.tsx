import Link from 'next/link';
import { PageShell } from '@/components/page-shell';
import { InviteAcceptForm } from '@/components/invite-accept-form';
import { validateInvitationTokenServer } from '@/services/invitation.server';
import { ApiRequestError } from '@/types/api';

type InviteAcceptPageProps = {
  searchParams: Promise<{ token?: string }>;
};

const tokenErrorContent = (error: unknown) => {
  if (error instanceof ApiRequestError) {
    if (error.status === 410) {
      return {
        title: 'Invitación expirada o revocada',
        description:
          'El enlace de invitación ya no está disponible. Solicita un nuevo enlace al administrador.'
      };
    }

    if (error.status === 409) {
      return {
        title: 'Invitación ya utilizada',
        description: 'Esta invitación ya fue aceptada. Inicia sesión con tu cuenta.'
      };
    }

    if (error.status === 404) {
      return {
        title: 'Invitación inválida',
        description: 'No se encontró una invitación válida para este token.'
      };
    }

    return {
      title: 'No se pudo validar la invitación',
      description: error.message
    };
  }

  return {
    title: 'No se pudo validar la invitación',
    description: 'Intenta nuevamente en unos minutos.'
  };
};

export default async function InviteAcceptPage({ searchParams }: InviteAcceptPageProps) {
  const query = await searchParams;
  const token = query.token?.trim();

  if (!token) {
    return (
      <PageShell
        title="Completar invitación"
        subtitle="Acceso de administradores de empresa por invitación."
      >
        <p className="auth-banner-error">
          Token de invitación faltante o inválido.
        </p>
      </PageShell>
    );
  }

  try {
    const invitation = await validateInvitationTokenServer(token);

    return (
      <PageShell
        title="Completar invitación"
        subtitle="Define tu contraseña para activar tu cuenta."
      >
        <InviteAcceptForm
          token={token}
          email={invitation.email}
          companyName={invitation.company.name}
        />
      </PageShell>
    );
  } catch (error) {
    const content = tokenErrorContent(error);

    return (
      <PageShell
        title={content.title}
        subtitle="No fue posible continuar con este enlace."
      >
        <p className="auth-banner-error">{content.description}</p>
        <div className="mt-4">
          <Link href="/login" className="auth-link text-sm">
            Ir al login global
          </Link>
        </div>
      </PageShell>
    );
  }
}

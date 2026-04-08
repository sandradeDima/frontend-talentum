import 'server-only';
import { redirect } from 'next/navigation';
import type { MeResponse, UserRole } from '@/types/auth';
import { getMeServer } from '@/services/auth.server';
import { resolvePostLoginPath } from './auth-shared';

export async function getSessionOrNull(): Promise<MeResponse | null> {
  try {
    return await getMeServer();
  } catch {
    return null;
  }
}

export async function requireSession(allowedRoles?: UserRole[]): Promise<MeResponse> {
  const session = await getSessionOrNull();

  if (!session) {
    redirect('/login');
  }

  if (allowedRoles && !allowedRoles.includes(session.user.role)) {
    redirect('/login?error=sin-permisos');
  }

  return session;
}

export async function requireAdminSession(): Promise<MeResponse> {
  return requireSession(['ADMIN']);
}

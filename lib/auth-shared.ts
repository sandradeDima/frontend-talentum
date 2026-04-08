import type { AuthUser } from '@/types/auth';
import { ApiRequestError } from '@/types/api';

export const resolvePostLoginPath = (user: AuthUser): string => {
  if (user.role === 'ADMIN') {
    return '/admin/home';
  }

  if (user.companySlug) {
    return `/admin/companies/${user.companySlug}`;
  }

  return '/admin/companies';
};

export const isUnauthorizedError = (error: unknown): boolean => {
  return error instanceof ApiRequestError && error.status === 401;
};

export const extractErrorMessage = (error: unknown): string => {
  if (error instanceof ApiRequestError) {
    if (error.mensajeTecnico === 'CSRF_TOKEN_INVALID') {
      return 'Tu sesión de seguridad expiró. Intenta nuevamente.';
    }

    if (error.mensajeTecnico === 'RATE_LIMIT_EXCEEDED') {
      return 'Detectamos muchas solicitudes seguidas. Espera unos segundos e intenta de nuevo.';
    }

    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Ocurrió un error inesperado';
};

const socialErrorMessages: Record<string, string> = {
  signup_disabled:
    'Tu correo no está habilitado para ingresar. Solicita acceso al ADMIN de Talentum.',
  account_not_linked:
    'Tu correo no está habilitado para ingresar. Solicita acceso al ADMIN de Talentum.',
  unable_to_link_account:
    'No pudimos vincular tu cuenta social. Contacta al administrador.',
  oauth_provider_not_found: 'Proveedor social no disponible. Intenta nuevamente.',
  email_not_found: 'El proveedor no devolvió un correo válido para iniciar sesión.',
  invalid_code: 'No se pudo validar el acceso social. Intenta nuevamente.',
  no_callback_url: 'No se pudo completar el acceso social. Intenta nuevamente.',
  access_denied: 'Cancelaste el inicio con proveedor social.',
  invalid_company_context:
    'Esta cuenta no pertenece a esta empresa o contexto.'
};

const pickFirst = (value: string | string[] | undefined): string | null => {
  if (typeof value === 'string') {
    return value;
  }

  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return null;
};

export const resolveLoginErrorMessageFromSearch = (params: {
  error?: string | string[];
  authMessage?: string | string[];
}): string | null => {
  const authMessage = pickFirst(params.authMessage);
  if (authMessage) {
    return authMessage;
  }

  const errorCode = pickFirst(params.error);
  if (!errorCode) {
    return null;
  }

  if (errorCode === 'sin-permisos') {
    return 'No tienes permisos para acceder a esa sección.';
  }

  return (
    socialErrorMessages[errorCode] ??
    'No se pudo completar el acceso social. Intenta nuevamente.'
  );
};

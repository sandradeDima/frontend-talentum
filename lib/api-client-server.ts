import { headers } from 'next/headers';
import { env } from './env';
import type { ApiEnvelope } from '@/types/api';
import { ApiRequestError } from '@/types/api';

const buildUrl = (path: string) => {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  return `${env.apiUrl}${path.startsWith('/') ? path : `/${path}`}`;
};

const defaultHeaders = {
  Accept: 'application/json'
};

async function parseEnvelope<T>(response: Response): Promise<ApiEnvelope<T> | null> {
  try {
    return (await response.json()) as ApiEnvelope<T>;
  } catch {
    return null;
  }
}

function resolveErrorMessage(
  payload: ApiEnvelope<unknown> | null,
  response: Response
): string {
  if (payload?.mensaje) {
    return payload.mensaje;
  }

  return `Error HTTP ${response.status}`;
}

export async function requestApiServer<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const incomingHeaders = await headers();
  const cookieHeader = incomingHeaders.get('cookie');

  const mergedHeaders: HeadersInit = {
    ...defaultHeaders,
    ...(init.body ? { 'Content-Type': 'application/json' } : {}),
    ...(cookieHeader ? { Cookie: cookieHeader } : {}),
    ...(init.headers ?? {})
  };

  const response = await fetch(buildUrl(path), {
    ...init,
    cache: 'no-store',
    headers: mergedHeaders
  });

  const payload = await parseEnvelope<T>(response);

  if (!response.ok || !payload || payload.error) {
    throw new ApiRequestError(
      resolveErrorMessage(payload, response),
      response.status,
      payload?.mensajeTecnico ?? null
    );
  }

  return payload.data;
}

import { headers } from 'next/headers';
import { env } from './env';
import type { ApiEnvelope } from '@/types/api';
import { ApiRequestError } from '@/types/api';

const buildUrl = (path: string, requestHeaders: Headers) => {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  if (env.apiUrl.startsWith('http://') || env.apiUrl.startsWith('https://')) {
    return `${env.apiUrl}${normalizedPath}`;
  }

  const forwardedHost =
    requestHeaders.get('x-forwarded-host') ?? requestHeaders.get('host');
  const forwardedProto =
    requestHeaders.get('x-forwarded-proto') ??
    (forwardedHost?.includes('localhost') ? 'http' : 'https');
  const origin = forwardedHost ? `${forwardedProto}://${forwardedHost}` : env.appUrl;

  return `${origin}${env.apiUrl}${normalizedPath}`;
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

  const response = await fetch(buildUrl(path, incomingHeaders), {
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

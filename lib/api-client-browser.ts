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

const UNSAFE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const CSRF_HEADER_NAME = 'x-csrf-token';
let csrfTokenCache: string | null = null;
let csrfTokenPromise: Promise<string> | null = null;

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

const resolveMethod = (init: RequestInit): string => {
  return (init.method ?? 'GET').toUpperCase();
};

const fetchCsrfToken = async (): Promise<string> => {
  if (csrfTokenCache) {
    return csrfTokenCache;
  }

  if (csrfTokenPromise) {
    return csrfTokenPromise;
  }

  csrfTokenPromise = (async () => {
    const response = await fetch(buildUrl('/auth/csrf'), {
      method: 'GET',
      credentials: 'include',
      cache: 'no-store',
      headers: defaultHeaders
    });

    const payload = await parseEnvelope<{ token: string }>(response);

    if (!response.ok || !payload || payload.error || !payload.data?.token) {
      throw new ApiRequestError(
        resolveErrorMessage(payload, response),
        response.status,
        payload?.mensajeTecnico ?? null
      );
    }

    csrfTokenCache = payload.data.token;
    return csrfTokenCache;
  })().finally(() => {
    csrfTokenPromise = null;
  });

  return csrfTokenPromise;
};

async function performRequest<T>(
  path: string,
  init: RequestInit,
  retryOnCsrfFailure: boolean
): Promise<T> {
  const method = resolveMethod(init);
  const shouldAttachCsrf = UNSAFE_METHODS.has(method) && !path.startsWith('/auth/csrf');

  let mergedHeaders: HeadersInit = {
    ...defaultHeaders,
    ...(init.body ? { 'Content-Type': 'application/json' } : {}),
    ...(init.headers ?? {})
  };

  if (shouldAttachCsrf) {
    const csrfToken = await fetchCsrfToken();
    mergedHeaders = {
      ...mergedHeaders,
      [CSRF_HEADER_NAME]: csrfToken
    };
  }

  const response = await fetch(buildUrl(path), {
    ...init,
    credentials: 'include',
    cache: 'no-store',
    headers: mergedHeaders
  });

  const payload = await parseEnvelope<T>(response);

  if (!response.ok || !payload || payload.error) {
    if (
      shouldAttachCsrf &&
      retryOnCsrfFailure &&
      payload?.mensajeTecnico === 'CSRF_TOKEN_INVALID'
    ) {
      csrfTokenCache = null;
      return performRequest(path, init, false);
    }

    throw new ApiRequestError(
      resolveErrorMessage(payload, response),
      response.status,
      payload?.mensajeTecnico ?? null
    );
  }

  return payload.data;
}

export async function requestApiClient<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  return performRequest(path, init, true);
}

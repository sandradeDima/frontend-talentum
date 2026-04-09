import type { NextRequest } from 'next/server';
import { env } from '@/lib/env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const hopByHopHeaders = new Set([
  'accept-encoding',
  'connection',
  'content-length',
  'host',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade'
]);

const responseHeadersToDrop = new Set([
  'content-encoding',
  'content-length',
  'set-cookie',
  'transfer-encoding'
]);

const buildUpstreamUrl = (request: NextRequest, path: string[]): URL => {
  const upstreamBase = `${env.backendApiUrl.replace(/\/+$/, '')}/`;
  const upstreamPath = path.map((segment) => encodeURIComponent(segment)).join('/');
  const url = new URL(upstreamPath, upstreamBase);

  request.nextUrl.searchParams.forEach((value, key) => {
    url.searchParams.append(key, value);
  });

  return url;
};

const cloneRequestHeaders = (request: NextRequest): Headers => {
  const headers = new Headers(request.headers);

  for (const headerName of hopByHopHeaders) {
    headers.delete(headerName);
  }

  return headers;
};

const appendUpstreamSetCookies = (target: Headers, source: Headers) => {
  const sourceWithGetSetCookie = source as Headers & {
    getSetCookie?: () => string[];
  };

  if (typeof sourceWithGetSetCookie.getSetCookie === 'function') {
    for (const cookie of sourceWithGetSetCookie.getSetCookie()) {
      target.append('set-cookie', cookie);
    }
    return;
  }

  const singleCookie = source.get('set-cookie');
  if (singleCookie) {
    target.append('set-cookie', singleCookie);
  }
};

const handler = async (
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) => {
  const { path } = await context.params;
  const upstreamUrl = buildUpstreamUrl(request, path);
  const requestHeaders = cloneRequestHeaders(request);
  const requestBody =
    request.method === 'GET' || request.method === 'HEAD'
      ? undefined
      : await request.arrayBuffer();

  const upstreamResponse = await fetch(upstreamUrl, {
    method: request.method,
    headers: requestHeaders,
    body: requestBody,
    redirect: 'manual'
  });

  const responseHeaders = new Headers();

  upstreamResponse.headers.forEach((value, key) => {
    if (responseHeadersToDrop.has(key.toLowerCase())) {
      return;
    }

    responseHeaders.set(key, value);
  });

  appendUpstreamSetCookies(responseHeaders, upstreamResponse.headers);

  return new Response(upstreamResponse.body, {
    status: upstreamResponse.status,
    headers: responseHeaders
  });
};

export {
  handler as GET,
  handler as POST,
  handler as PUT,
  handler as PATCH,
  handler as DELETE,
  handler as OPTIONS,
  handler as HEAD
};

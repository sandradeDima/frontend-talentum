'use client';

import { useEffect } from 'react';

type AdminErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function AdminErrorPage({ error, reset }: AdminErrorPageProps) {
  useEffect(() => {
    console.error('admin_route_error', error);
  }, [error]);

  return (
    <div className="rounded-2xl border border-rose-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-ink">Ocurrió un error</h2>
      <p className="mt-2 text-sm text-rose-700">
        No pudimos cargar esta sección del panel. Intenta nuevamente.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-4 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
      >
        Reintentar
      </button>
    </div>
  );
}

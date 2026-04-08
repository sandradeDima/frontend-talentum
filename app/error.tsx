'use client';

import { useEffect } from 'react';

type RootErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function RootErrorPage({ error, reset }: RootErrorPageProps) {
  useEffect(() => {
    console.error('root_route_error', error);
  }, [error]);

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-10">
      <div className="rounded-2xl border border-rose-200 bg-white p-6 shadow-sm">
        <h1 className="text-lg font-semibold text-ink">Error inesperado</h1>
        <p className="mt-2 text-sm text-rose-700">
          Tuvimos un problema al procesar la solicitud. Puedes volver a intentar.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-4 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          Reintentar
        </button>
      </div>
    </main>
  );
}

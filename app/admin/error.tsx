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
    <div className="admin-panel">
      <p className="admin-kicker">Admin Route</p>
      <h2 className="admin-title mt-3 text-[1rem] sm:text-[1.15rem]">Ocurrió un error</h2>
      <p className="admin-banner-error mt-3">
        No pudimos cargar esta sección del panel. Intenta nuevamente.
      </p>
      <button
        type="button"
        onClick={reset}
        className="admin-button-secondary mt-4"
      >
        Reintentar
      </button>
    </div>
  );
}

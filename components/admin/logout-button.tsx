'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { logoutClient } from '@/services/auth.client';
import { extractErrorMessage } from '@/lib/auth-shared';

type LogoutButtonProps = {
  fullWidth?: boolean;
};

export function LogoutButton({ fullWidth = false }: LogoutButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogout = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await logoutClient();
      router.replace('/login');
      router.refresh();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`flex flex-col gap-2 ${fullWidth ? 'items-stretch' : 'items-end'}`}>
      <button
        type="button"
        onClick={handleLogout}
        disabled={isLoading}
        className={`rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70 ${
          fullWidth ? 'w-full text-left' : ''
        }`}
      >
        {isLoading ? 'Cerrando sesión...' : 'Cerrar sesión'}
      </button>
      {error ? <p className="text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}

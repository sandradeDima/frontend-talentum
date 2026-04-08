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
        className={`admin-button-secondary ${
          fullWidth ? 'w-full text-left' : ''
        }`}
      >
        {isLoading ? 'Cerrando sesión...' : 'Cerrar sesión'}
      </button>
      {error ? <p className="text-xs text-rose-300">{error}</p> : null}
    </div>
  );
}

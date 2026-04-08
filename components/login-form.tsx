'use client';

import { useState, type FormEventHandler } from 'react';
import { useRouter } from 'next/navigation';
import {
  loginClient,
  startSocialSignInClient
} from '@/services/auth.client';
import { extractErrorMessage, resolvePostLoginPath } from '@/lib/auth-shared';
import type { SocialProvider } from '@/types/auth';

type LoginFormProps = {
  companySlug?: string;
  companyName?: string;
  companyStatus?: 'PENDING_SETUP' | 'ACTIVE' | 'INACTIVE' | null;
  disabled?: boolean;
  initialError?: string | null;
};

export function LoginForm({
  companySlug,
  companyName,
  companyStatus = null,
  disabled = false,
  initialError = null
}: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [socialLoadingProvider, setSocialLoadingProvider] =
    useState<SocialProvider | null>(null);
  const [error, setError] = useState<string | null>(initialError);

  const isCompanyLogin = Boolean(companySlug);
  const isBlockedByCompanyStatus =
    companyStatus === 'INACTIVE' || companyStatus === 'PENDING_SETUP';
  const isSocialLoading = socialLoadingProvider !== null;
  const submitDisabled =
    disabled || isBlockedByCompanyStatus || isLoading || isSocialLoading;

  const handleSubmit: FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const result = await loginClient({
        email,
        password,
        rememberMe,
        companySlug: companySlug ?? undefined
      });

      const path = resolvePostLoginPath(result.user);
      router.replace(path);
      router.refresh();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: SocialProvider) => {
    if (submitDisabled) {
      return;
    }

    setError(null);
    setSocialLoadingProvider(provider);

    try {
      const result = await startSocialSignInClient({
        provider,
        companySlug: companySlug ?? undefined
      });

      window.location.assign(result.url);
    } catch (err) {
      setError(extractErrorMessage(err));
      setSocialLoadingProvider(null);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {isCompanyLogin ? (
        <div className="auth-banner-info">
          <p className="font-medium">
            Contexto de empresa: {companyName ?? companySlug}
          </p>
          <p className="text-xs">
            Solo usuarios vinculados a esta empresa pueden ingresar.
          </p>
        </div>
      ) : null}

      {isBlockedByCompanyStatus ? (
        <p className="auth-banner-warning">
          Esta empresa no tiene acceso habilitado todavía. Contacta al administrador global.
        </p>
      ) : null}

      <div>
        <label htmlFor="email" className="auth-label">
          Correo electrónico
        </label>
        <input
          id="email"
          name="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          autoComplete="email"
          placeholder="admin@empresa.com"
          className="auth-input"
        />
      </div>

      <div>
        <label htmlFor="password" className="auth-label">
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          autoComplete="current-password"
          placeholder="••••••••"
          className="auth-input"
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-cooltura-light/72">
        <input
          type="checkbox"
          checked={rememberMe}
          onChange={(event) => setRememberMe(event.target.checked)}
          className="auth-checkbox"
        />
        Mantener sesión iniciada
      </label>

      {error ? (
        <p className="auth-banner-error">{error}</p>
      ) : null}

      <button
        type="submit"
        disabled={submitDisabled}
        className="auth-button-primary"
      >
        {isLoading ? 'Ingresando...' : 'Ingresar'}
      </button>

      <div className="space-y-2">
        <button
          type="button"
          onClick={() => handleSocialLogin('google')}
          disabled={submitDisabled}
          className="auth-button-secondary"
        >
          {socialLoadingProvider === 'google'
            ? 'Redirigiendo a Google...'
            : 'Continuar con Google'}
        </button>
        <button
          type="button"
          onClick={() => handleSocialLogin('microsoft')}
          disabled={submitDisabled}
          className="auth-button-secondary"
        >
          {socialLoadingProvider === 'microsoft'
            ? 'Redirigiendo a Microsoft...'
            : 'Continuar con Microsoft'}
        </button>
      </div>

      <p className="text-xs leading-6 text-cooltura-light/62">
        Acceso por invitación únicamente. También puedes ingresar con Google o
        Microsoft si tu correo ya fue registrado en la plataforma.
      </p>
    </form>
  );
}

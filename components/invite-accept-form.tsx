'use client';

import { useMemo, useState, type FormEventHandler } from 'react';
import { useRouter } from 'next/navigation';
import { acceptInvitationClient } from '@/services/invitation.client';
import { extractErrorMessage, resolvePostLoginPath } from '@/lib/auth-shared';

type InviteAcceptFormProps = {
  token: string;
  email: string;
  companyName: string;
};

export function InviteAcceptForm({ token, email, companyName }: InviteAcceptFormProps) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const passwordRules = useMemo(() => {
    const hasMinLength = password.length >= 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSymbol = /[^A-Za-z0-9]/.test(password);

    return {
      hasMinLength,
      hasUppercaseAndLowercase: hasUppercase && hasLowercase,
      hasNumber,
      hasSymbol
    };
  }, [password]);

  const isPasswordValid = Object.values(passwordRules).every(Boolean);

  const handleSubmit: FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();

    if (!isPasswordValid) {
      setError('La contraseña debe cumplir todas las reglas de seguridad.');
      return;
    }

    if (password !== confirmPassword) {
      setError('La confirmación de contraseña no coincide.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await acceptInvitationClient({
        token,
        name: name.trim(),
        password
      });

      setSuccess('Cuenta configurada correctamente. Redirigiendo...');
      const redirectPath = resolvePostLoginPath(result.user);

      router.replace(redirectPath);
      router.refresh();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
        <p>
          <span className="font-medium">Empresa:</span> {companyName}
        </p>
        <p>
          <span className="font-medium">Invitación para:</span> {email}
        </p>
      </div>

      <div>
        <label htmlFor="name" className="mb-1 block text-sm font-medium">
          Nombre completo
        </label>
        <input
          id="name"
          name="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
          minLength={2}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-brand transition focus:ring-2"
          placeholder="Juan Pérez"
        />
      </div>

      <div>
        <label htmlFor="password" className="mb-1 block text-sm font-medium">
          Contraseña
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 pr-20 text-sm outline-none ring-brand transition focus:ring-2"
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-100"
          >
            {showPassword ? 'Ocultar' : 'Mostrar'}
          </button>
        </div>
        <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
          <p className="mb-1 font-medium">La contraseña debe incluir:</p>
          <ul className="space-y-1">
            <li className={passwordRules.hasMinLength ? 'text-emerald-700' : 'text-slate-600'}>
              • Mínimo 8 caracteres
            </li>
            <li
              className={
                passwordRules.hasUppercaseAndLowercase ? 'text-emerald-700' : 'text-slate-600'
              }
            >
              • Mayúsculas y minúsculas
            </li>
            <li className={passwordRules.hasNumber ? 'text-emerald-700' : 'text-slate-600'}>
              • Al menos un número
            </li>
            <li className={passwordRules.hasSymbol ? 'text-emerald-700' : 'text-slate-600'}>
              • Al menos un símbolo
            </li>
          </ul>
        </div>
      </div>

      <div>
        <label htmlFor="confirmPassword" className="mb-1 block text-sm font-medium">
          Confirmar contraseña
        </label>
        <div className="relative">
          <input
            id="confirmPassword"
            name="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 pr-20 text-sm outline-none ring-brand transition focus:ring-2"
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword((current) => !current)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-100"
          >
            {showConfirmPassword ? 'Ocultar' : 'Mostrar'}
          </button>
        </div>
      </div>

      {error ? (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {success}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition hover:bg-brandDark disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting ? 'Completando registro...' : 'Completar registro'}
      </button>
    </form>
  );
}

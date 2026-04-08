'use client';

import { useMemo, useState, type FormEventHandler } from 'react';
import { useRouter } from 'next/navigation';
import { confirmPasswordResetClient } from '@/services/password-reset.client';
import { extractErrorMessage } from '@/lib/auth-shared';

type PasswordResetFormProps = {
  token: string;
  email: string;
  companyName?: string;
};

export function PasswordResetForm({ token, email, companyName }: PasswordResetFormProps) {
  const router = useRouter();
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
      await confirmPasswordResetClient({
        token,
        password
      });

      setSuccess('Contraseña actualizada correctamente. Redirigiendo al login...');
      setTimeout(() => {
        router.replace('/login?reset=ok');
      }, 800);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="auth-banner-info">
        <p>
          <span className="font-medium">Usuario:</span> {email}
        </p>
        {companyName ? (
          <p>
            <span className="font-medium">Empresa:</span> {companyName}
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor="password" className="auth-label">
          Nueva contraseña
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
            className="auth-input pr-24"
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            className="auth-button-toggle"
          >
            {showPassword ? 'Ocultar' : 'Mostrar'}
          </button>
        </div>
        <div className="auth-rule-card mt-2">
          <p className="mb-1 font-medium">La contraseña debe incluir:</p>
          <ul className="space-y-1">
            <li className={passwordRules.hasMinLength ? 'text-cooltura-lime' : 'text-cooltura-light/62'}>
              • Mínimo 8 caracteres
            </li>
            <li
              className={
                passwordRules.hasUppercaseAndLowercase ? 'text-cooltura-lime' : 'text-cooltura-light/62'
              }
            >
              • Mayúsculas y minúsculas
            </li>
            <li className={passwordRules.hasNumber ? 'text-cooltura-lime' : 'text-cooltura-light/62'}>
              • Al menos un número
            </li>
            <li className={passwordRules.hasSymbol ? 'text-cooltura-lime' : 'text-cooltura-light/62'}>
              • Al menos un símbolo
            </li>
          </ul>
        </div>
      </div>

      <div>
        <label htmlFor="confirmPassword" className="auth-label">
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
            className="auth-input pr-24"
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword((current) => !current)}
            className="auth-button-toggle"
          >
            {showConfirmPassword ? 'Ocultar' : 'Mostrar'}
          </button>
        </div>
      </div>

      {error ? <p className="auth-banner-error">{error}</p> : null}
      {success ? <p className="auth-banner-success">{success}</p> : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="auth-button-primary"
      >
        {isSubmitting ? 'Actualizando contraseña...' : 'Guardar nueva contraseña'}
      </button>
    </form>
  );
}

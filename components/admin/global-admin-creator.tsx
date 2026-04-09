'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createGlobalAdminClient } from '@/services/company-user.client';
import { extractErrorMessage } from '@/lib/auth-shared';
import { ApiRequestError } from '@/types/api';

type GlobalAdminCreatorProps = {
  className?: string;
};

type FormState = {
  name: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
};

const EMPTY_FORM: FormState = {
  name: '',
  lastName: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: ''
};

const mapApiError = (error: unknown): string => {
  if (error instanceof ApiRequestError) {
    if (error.mensajeTecnico === 'ADMIN_USER_EMAIL_ALREADY_EXISTS') {
      return 'Ya existe un administrador global con ese correo.';
    }
  }

  return extractErrorMessage(error);
};

export function GlobalAdminCreator({ className }: GlobalAdminCreatorProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formState, setFormState] = useState<FormState>(EMPTY_FORM);
  const [message, setMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

  const resetForm = () => {
    setFormState(EMPTY_FORM);
    setMessage(null);
  };

  const closePanel = () => {
    setIsOpen(false);
    resetForm();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);

    if (formState.name.trim().length < 2) {
      setMessage({ kind: 'error', text: 'El nombre es obligatorio.' });
      return;
    }

    if (!formState.email.includes('@')) {
      setMessage({ kind: 'error', text: 'Debes ingresar un correo válido.' });
      return;
    }

    if (formState.password.length < 8) {
      setMessage({ kind: 'error', text: 'La contraseña debe tener al menos 8 caracteres.' });
      return;
    }

    if (formState.password !== formState.confirmPassword) {
      setMessage({ kind: 'error', text: 'Las contraseñas no coinciden.' });
      return;
    }

    setIsSubmitting(true);

    try {
      await createGlobalAdminClient({
        name: formState.name.trim(),
        lastName: formState.lastName.trim() || undefined,
        email: formState.email.trim(),
        phone: formState.phone.trim() || undefined,
        password: formState.password
      });

      setMessage({ kind: 'success', text: 'Administrador global creado correctamente.' });
      setFormState(EMPTY_FORM);
      router.refresh();
    } catch (error) {
      setMessage({ kind: 'error', text: mapApiError(error) });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className={className}>
      <div className="admin-panel-soft">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="admin-kicker">Seguridad de plataforma</p>
            <h2 className="admin-title mt-2 text-[1rem] sm:text-[1.15rem]">
              Administradores globales
            </h2>
            <p className="admin-subtitle mt-2">
              Crea accesos `ADMIN` con contraseña para operar toda la plataforma.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setIsOpen((current) => !current);
              setMessage(null);
            }}
            className="admin-button-primary"
          >
            {isOpen ? 'Ocultar formulario' : 'Crear administrador global'}
          </button>
        </div>

        {isOpen ? (
          <form onSubmit={handleSubmit} className="mt-4 space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <input
                value={formState.name}
                onChange={(event) =>
                  setFormState((previous) => ({ ...previous, name: event.target.value }))
                }
                placeholder="Nombre"
                required
                className="admin-input"
              />
              <input
                value={formState.lastName}
                onChange={(event) =>
                  setFormState((previous) => ({ ...previous, lastName: event.target.value }))
                }
                placeholder="Apellido (opcional)"
                className="admin-input"
              />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <input
                type="email"
                value={formState.email}
                onChange={(event) =>
                  setFormState((previous) => ({ ...previous, email: event.target.value }))
                }
                placeholder="Correo electrónico"
                required
                className="admin-input"
              />
              <input
                value={formState.phone}
                onChange={(event) =>
                  setFormState((previous) => ({ ...previous, phone: event.target.value }))
                }
                placeholder="Teléfono (opcional)"
                className="admin-input"
              />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <input
                type="password"
                value={formState.password}
                onChange={(event) =>
                  setFormState((previous) => ({ ...previous, password: event.target.value }))
                }
                placeholder="Contraseña"
                required
                className="admin-input"
              />
              <input
                type="password"
                value={formState.confirmPassword}
                onChange={(event) =>
                  setFormState((previous) => ({
                    ...previous,
                    confirmPassword: event.target.value
                  }))
                }
                placeholder="Confirmar contraseña"
                required
                className="admin-input"
              />
            </div>

            {message ? (
              <p
                className={
                  message.kind === 'success' ? 'admin-banner-success' : 'admin-banner-error'
                }
              >
                {message.text}
              </p>
            ) : null}

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="admin-button-primary"
              >
                {isSubmitting ? 'Creando...' : 'Crear administrador'}
              </button>
              <button
                type="button"
                onClick={closePanel}
                disabled={isSubmitting}
                className="admin-button-secondary"
              >
                Cancelar
              </button>
            </div>
          </form>
        ) : null}
      </div>
    </section>
  );
}

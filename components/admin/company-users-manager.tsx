'use client';

import { useMemo, useState, type FormEvent, type ReactNode } from 'react';
import {
  createCompanyUserClient,
  deactivateCompanyUserClient,
  resendCompanyUserInviteClient,
  resetCompanyUserPasswordClient,
  updateCompanyUserClient
} from '@/services/company-user.client';
import { extractErrorMessage } from '@/lib/auth-shared';
import { ApiRequestError } from '@/types/api';
import type {
  CompanyUserActivationStatus,
  CompanyUserRow,
  UpdateCompanyUserInput
} from '@/types/company-user';

type CompanyUsersManagerProps = {
  companySlug: string;
  initialRows: CompanyUserRow[];
  canManage: boolean;
};

type ToastState = {
  kind: 'success' | 'error';
  message: string;
};

type UserFormState = {
  name: string;
  lastName: string;
  email: string;
  phone: string;
  activationStatus: CompanyUserActivationStatus;
};

const EMPTY_FORM: UserFormState = {
  name: '',
  lastName: '',
  email: '',
  phone: '',
  activationStatus: 'PENDIENTE_ACTIVACION'
};

const statusLabels: Record<CompanyUserActivationStatus, string> = {
  PENDIENTE_ACTIVACION: 'Pendiente de activación',
  ACTIVO: 'Activo',
  INACTIVO: 'Inactivo'
};

const statusBadgeClassMap: Record<CompanyUserActivationStatus, string> = {
  PENDIENTE_ACTIVACION: 'border border-amber-200 bg-amber-50 text-amber-800',
  ACTIVO: 'border border-emerald-200 bg-emerald-50 text-emerald-800',
  INACTIVO: 'border border-slate-200 bg-slate-100 text-slate-700'
};

const dateFormatter = new Intl.DateTimeFormat('es-BO', {
  dateStyle: 'medium'
});

const dateTimeFormatter = new Intl.DateTimeFormat('es-BO', {
  dateStyle: 'medium',
  timeStyle: 'short'
});

const mapApiError = (error: unknown): string => {
  if (error instanceof ApiRequestError) {
    switch (error.mensajeTecnico) {
      case 'COMPANY_USER_EMAIL_ALREADY_EXISTS':
        return 'Ya existe un usuario con ese correo.';
      case 'USER_ACTIVATION_REQUIRES_INVITATION':
        return 'El usuario pendiente debe activar su cuenta desde la invitación.';
      case 'USER_INVITE_RESEND_NOT_ALLOWED':
        return 'Solo se puede reenviar invitación a usuarios pendientes de activación.';
      case 'USER_RESET_PASSWORD_NOT_ALLOWED':
      case 'USER_PENDING_ACTIVATION':
        return 'Solo usuarios activos pueden recibir un reseteo de contraseña.';
      case 'USER_SOCIAL_ONLY':
        return 'Este usuario está marcado como solo acceso social.';
      case 'ROLE_FORBIDDEN':
        return 'No tienes permisos para gestionar usuarios de empresa.';
      default:
        return error.message;
    }
  }

  return extractErrorMessage(error);
};

const Modal = ({
  children,
  onClose
}: {
  children: ReactNode;
  onClose: () => void;
}) => {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-5 shadow-lg">
        {children}
        <button
          type="button"
          onClick={onClose}
          className="mt-4 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
};

export function CompanyUsersManager({
  companySlug,
  initialRows,
  canManage
}: CompanyUsersManagerProps) {
  const [rows, setRows] = useState<CompanyUserRow[]>(initialRows);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<CompanyUserRow | null>(null);
  const [formState, setFormState] = useState<UserFormState>(EMPTY_FORM);

  const statusOptions = useMemo(
    () => [
      { value: 'PENDIENTE_ACTIVACION' as const, label: statusLabels.PENDIENTE_ACTIVACION },
      { value: 'ACTIVO' as const, label: statusLabels.ACTIVO },
      { value: 'INACTIVO' as const, label: statusLabels.INACTIVO }
    ],
    []
  );

  const showToast = (kind: ToastState['kind'], message: string) => {
    setToast({ kind, message });
    setTimeout(() => {
      setToast((current) => (current?.message === message ? null : current));
    }, 4200);
  };

  const resetModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
    setFormState(EMPTY_FORM);
  };

  const openCreateModal = () => {
    setEditingUser(null);
    setFormState(EMPTY_FORM);
    setIsModalOpen(true);
  };

  const openEditModal = (row: CompanyUserRow) => {
    setEditingUser(row);
    setFormState({
      name: row.name,
      lastName: row.lastName ?? '',
      email: row.email,
      phone: row.phone ?? '',
      activationStatus: row.activationStatus
    });
    setIsModalOpen(true);
  };

  const upsertRow = (next: CompanyUserRow) => {
    setRows((previous) => {
      const existingIndex = previous.findIndex((row) => row.id === next.id);
      if (existingIndex === -1) {
        return [next, ...previous];
      }

      return previous.map((row) => (row.id === next.id ? next : row));
    });
  };

  const validateForm = (): string | null => {
    if (formState.name.trim().length < 2) {
      return 'El nombre es obligatorio.';
    }

    if (formState.lastName.trim().length < 2) {
      return 'El apellido es obligatorio.';
    }

    if (!formState.email.includes('@')) {
      return 'Debes ingresar un correo válido.';
    }

    if (formState.phone.trim().length < 6) {
      return 'Debes ingresar un teléfono válido.';
    }

    return null;
  };

  const handleSubmitForm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canManage) {
      showToast('error', 'Solo ADMIN puede gestionar usuarios.');
      return;
    }

    const validationMessage = validateForm();
    if (validationMessage) {
      showToast('error', validationMessage);
      return;
    }

    setIsBusy(true);

    try {
      if (!editingUser) {
        const created = await createCompanyUserClient(companySlug, {
          name: formState.name.trim(),
          lastName: formState.lastName.trim(),
          email: formState.email.trim(),
          phone: formState.phone.trim(),
          role: 'CLIENT_ADMIN'
        });

        upsertRow(created.user);
        showToast('success', 'Usuario creado e invitación enviada.');
        resetModal();
        return;
      }

      const payload: UpdateCompanyUserInput = {
        name: formState.name.trim(),
        lastName: formState.lastName.trim(),
        email: formState.email.trim(),
        phone: formState.phone.trim(),
        role: 'CLIENT_ADMIN',
        activationStatus: formState.activationStatus
      };

      const updated = await updateCompanyUserClient(companySlug, editingUser.id, payload);
      upsertRow(updated);
      showToast('success', 'Usuario actualizado correctamente.');
      resetModal();
    } catch (error) {
      showToast('error', mapApiError(error));
    } finally {
      setIsBusy(false);
    }
  };

  const handleDeactivate = async (row: CompanyUserRow) => {
    if (!canManage) {
      return;
    }

    const confirmed = window.confirm(
      `¿Deseas desactivar a ${row.fullName}? Esta acción no elimina el historial.`
    );

    if (!confirmed) {
      return;
    }

    setIsBusy(true);

    try {
      const updated = await deactivateCompanyUserClient(companySlug, row.id);
      upsertRow(updated);
      showToast('success', 'Usuario desactivado correctamente.');
    } catch (error) {
      showToast('error', mapApiError(error));
    } finally {
      setIsBusy(false);
    }
  };

  const handleResetPassword = async (row: CompanyUserRow) => {
    if (!canManage) {
      return;
    }

    const confirmed = window.confirm(
      `¿Enviar correo de reseteo de contraseña a ${row.email}?`
    );

    if (!confirmed) {
      return;
    }

    setIsBusy(true);

    try {
      await resetCompanyUserPasswordClient(companySlug, row.id);
      showToast('success', 'Correo de reseteo enviado.');
    } catch (error) {
      showToast('error', mapApiError(error));
    } finally {
      setIsBusy(false);
    }
  };

  const handleResendInvite = async (row: CompanyUserRow) => {
    if (!canManage) {
      return;
    }

    setIsBusy(true);

    try {
      await resendCompanyUserInviteClient(companySlug, row.id);
      showToast('success', 'Invitación reenviada correctamente.');
    } catch (error) {
      showToast('error', mapApiError(error));
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <section className="space-y-4">
      {toast ? (
        <div
          role="status"
          aria-live="polite"
          className={`fixed right-4 top-4 z-50 max-w-sm rounded-lg px-3 py-2 text-sm font-medium shadow-lg ${
            toast.kind === 'success'
              ? 'border border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border border-rose-200 bg-rose-50 text-rose-800'
          }`}
        >
          {toast.message}
        </div>
      ) : null}

      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-ink">Usuarios</h2>
          <p className="text-sm text-slate-600">
            Gestión de usuarios administrativos de la empresa (rol CLIENT_ADMIN).
          </p>
        </div>
        {canManage ? (
          <button
            type="button"
            onClick={openCreateModal}
            className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition hover:bg-brandDark"
          >
            Agregar usuario
          </button>
        ) : (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs text-amber-800">
            Solo ADMIN puede gestionar usuarios.
          </p>
        )}
      </header>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-600">
          Esta empresa todavía no tiene usuarios administrativos cargados.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-semibold">Nombre completo</th>
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold">Teléfono</th>
                  <th className="px-4 py-3 font-semibold">Rol</th>
                  <th className="px-4 py-3 font-semibold">Estado</th>
                  <th className="px-4 py-3 font-semibold">Acceso</th>
                  <th className="px-4 py-3 font-semibold">Fecha de creación</th>
                  <th className="px-4 py-3 font-semibold">Último acceso</th>
                  <th className="px-4 py-3 text-right font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row) => (
                  <tr key={row.id} className="align-top">
                    <td className="px-4 py-3 font-medium text-ink">{row.fullName}</td>
                    <td className="px-4 py-3 text-slate-700">{row.email}</td>
                    <td className="px-4 py-3 text-slate-700">{row.phone ?? 'Sin dato'}</td>
                    <td className="px-4 py-3 text-slate-700">{row.role}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${statusBadgeClassMap[row.activationStatus]}`}
                      >
                        {statusLabels[row.activationStatus]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      <div className="flex flex-wrap gap-1">
                        {row.hasCredentialAccess ? (
                          <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
                            Acceso con contraseña
                          </span>
                        ) : null}
                        {row.hasGoogleLinked ? (
                          <span className="rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-xs text-sky-700">
                            Google vinculado
                          </span>
                        ) : null}
                        {row.hasMicrosoftLinked ? (
                          <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-xs text-indigo-700">
                            Microsoft vinculado
                          </span>
                        ) : null}
                        {row.isSocialOnly ? (
                          <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs text-amber-800">
                            Solo acceso social
                          </span>
                        ) : null}
                        {!row.hasCredentialAccess &&
                        !row.hasGoogleLinked &&
                        !row.hasMicrosoftLinked ? (
                          <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
                            {row.accessModeLabel}
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {dateFormatter.format(new Date(row.createdAt))}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {row.lastLoginAt
                        ? dateTimeFormatter.format(new Date(row.lastLoginAt))
                        : 'Sin acceso'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col items-stretch gap-1 min-w-[130px]">
                        <button
                          type="button"
                          onClick={() => openEditModal(row)}
                          disabled={!canManage || isBusy}
                          className="rounded-md border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeactivate(row)}
                          disabled={!canManage || isBusy || row.activationStatus === 'INACTIVO'}
                          className="rounded-md border border-rose-300 px-2 py-1 text-xs font-medium text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Desactivar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleResetPassword(row)}
                          disabled={!canManage || isBusy || !row.canResetPassword}
                          title={
                            !row.canResetPassword && row.isSocialOnly
                              ? 'Este usuario usa solo acceso social.'
                              : undefined
                          }
                          className="rounded-md border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Resetear contraseña
                        </button>
                        <button
                          type="button"
                          onClick={() => handleResendInvite(row)}
                          disabled={!canManage || isBusy || !row.canResendInvite}
                          className="rounded-md border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Reenviar invitación
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isModalOpen ? (
        <Modal onClose={resetModal}>
          <h3 className="text-base font-semibold text-ink">
            {editingUser ? 'Editar usuario' : 'Agregar usuario'}
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            {editingUser
              ? 'Actualiza la información del usuario administrativo.'
              : 'Se creará en estado pendiente y se enviará invitación por correo.'}
          </p>

          <form onSubmit={handleSubmitForm} className="mt-4 space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <input
                value={formState.name}
                onChange={(event) =>
                  setFormState((previous) => ({ ...previous, name: event.target.value }))
                }
                placeholder="Nombre"
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-brand transition focus:ring-2"
              />
              <input
                value={formState.lastName}
                onChange={(event) =>
                  setFormState((previous) => ({ ...previous, lastName: event.target.value }))
                }
                placeholder="Apellido"
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-brand transition focus:ring-2"
              />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <input
                type="email"
                value={formState.email}
                onChange={(event) =>
                  setFormState((previous) => ({ ...previous, email: event.target.value }))
                }
                placeholder="Email"
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-brand transition focus:ring-2"
              />
              <input
                value={formState.phone}
                onChange={(event) =>
                  setFormState((previous) => ({ ...previous, phone: event.target.value }))
                }
                placeholder="Teléfono"
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-brand transition focus:ring-2"
              />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <select
                value="CLIENT_ADMIN"
                disabled
                className="w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-600"
              >
                <option value="CLIENT_ADMIN">CLIENT_ADMIN</option>
              </select>

              <select
                value={formState.activationStatus}
                onChange={(event) =>
                  setFormState((previous) => ({
                    ...previous,
                    activationStatus: event.target.value as CompanyUserActivationStatus
                  }))
                }
                disabled={!editingUser}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-brand transition focus:ring-2 disabled:bg-slate-100"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {!editingUser ? (
              <p className="text-xs text-slate-500">
                El estado inicial siempre será pendiente de activación.
              </p>
            ) : null}

            <div className="flex items-center gap-2 pt-1">
              <button
                type="submit"
                disabled={isBusy}
                className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition hover:bg-brandDark disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isBusy ? 'Guardando...' : editingUser ? 'Guardar' : 'Crear usuario'}
              </button>
            </div>
          </form>
        </Modal>
      ) : null}
    </section>
  );
}

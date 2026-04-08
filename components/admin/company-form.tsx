'use client';

import Image from 'next/image';
import {
  useEffect,
  useRef,
  useState,
  type ChangeEventHandler,
  type FormEventHandler
} from 'react';
import { useRouter } from 'next/navigation';
import {
  createCompanyClient,
  getCompanySlugSuggestionsClient,
  updateCompanyBySlugClient
} from '@/services/company.client';
import { uploadCompanyLogoClient } from '@/services/upload.service';
import { extractErrorMessage } from '@/lib/auth-shared';
import { env } from '@/lib/env';
import { ApiRequestError } from '@/types/api';
import type { CompanyRow, CompanyStatus } from '@/types/company';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
const TOAST_DURATION_MS = 4200;

const STATUS_OPTIONS: Array<{ value: CompanyStatus; label: string }> = [
  { value: 'PENDING_SETUP', label: 'Pendiente' },
  { value: 'ACTIVE', label: 'Activa' },
  { value: 'INACTIVE', label: 'Inactiva' }
];

type CompanyFormProps = {
  mode: 'create' | 'edit';
  companySlug?: string;
  initialCompany?: CompanyRow;
  allowRestrictedFields: boolean;
};

type CompanyFormState = {
  name: string;
  slug: string;
  workerCount: string;
  contactEmail: string;
  supportWhatsappPhone: string;
  status: CompanyStatus;
  logoUrl: string;
};

type ToastState = {
  kind: 'success' | 'error';
  message: string;
};

const slugify = (value: string): string => {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
};

const toPublicLogoUrl = (logoUrl: string): string => {
  if (!logoUrl) {
    return '';
  }

  if (logoUrl.startsWith('http://') || logoUrl.startsWith('https://')) {
    return logoUrl;
  }

  return `${env.backendOrigin}${logoUrl.startsWith('/') ? logoUrl : `/${logoUrl}`}`;
};

const buildInitialState = (initialCompany?: CompanyRow): CompanyFormState => ({
  name: initialCompany?.name ?? '',
  slug: initialCompany?.slug ?? '',
  workerCount: initialCompany ? String(initialCompany.workerCount) : '',
  contactEmail: initialCompany?.contactEmail ?? '',
  supportWhatsappPhone: initialCompany?.supportWhatsappPhone ?? '',
  status: initialCompany?.status ?? 'PENDING_SETUP',
  logoUrl: initialCompany?.logoUrl ?? ''
});

const resolveMutationErrorMessage = (error: unknown): string => {
    if (error instanceof ApiRequestError) {
      if (error.mensajeTecnico === 'COMPANY_SLUG_ALREADY_EXISTS') {
        return 'El slug ya está en uso. Elige una de las sugerencias o escribe otro.';
      }

      if (error.mensajeTecnico === 'SLUG_EDIT_FORBIDDEN') {
        return 'Solo un ADMIN puede modificar el slug de una empresa.';
      }

      if (error.mensajeTecnico === 'COMPANY_ADMIN_REQUIRED') {
        return 'Solo ADMIN puede modificar datos de empresas.';
      }

      if (error.mensajeTecnico === 'ACTIVE_COMPANY_SLUG_LOCKED') {
        return 'No puedes modificar el slug porque la empresa está activa.';
      }
  }

  return extractErrorMessage(error);
};

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function CompanyForm({
  mode,
  companySlug,
  initialCompany,
  allowRestrictedFields
}: CompanyFormProps) {
  const router = useRouter();
  const [state, setState] = useState<CompanyFormState>(buildInitialState(initialCompany));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [isSlugTouched, setIsSlugTouched] = useState(mode === 'edit');
  const [slugSuggestions, setSlugSuggestions] = useState<string[]>([]);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  const canEditCompany = allowRestrictedFields;
  const isActiveCompany = mode === 'edit' && initialCompany?.status === 'ACTIVE';
  const isFormReadOnly = mode === 'edit' && !canEditCompany;
  const isSlugReadOnly = isFormReadOnly || (mode === 'edit' && isActiveCompany);
  const logoPreview = toPublicLogoUrl(state.logoUrl);

  const showToast = (kind: ToastState['kind'], message: string) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }

    setToast({ kind, message });
    toastTimeoutRef.current = setTimeout(() => {
      setToast((current) => (current?.message === message ? null : current));
    }, TOAST_DURATION_MS);
  };

  const updateField = <T extends keyof CompanyFormState>(field: T, value: CompanyFormState[T]) => {
    setState((previous) => ({
      ...previous,
      [field]: value
    }));
  };

  const resetForm = () => {
    setState(buildInitialState(initialCompany));
    setFormError(null);
    setIsSlugTouched(mode === 'edit');
    setSlugSuggestions([]);
  };

  const handleNameChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    const nextName = event.target.value;

    setState((previous) => {
      const shouldAutofillSlug = mode === 'create' && !isSlugTouched;

      return {
        ...previous,
        name: nextName,
        slug: shouldAutofillSlug ? slugify(nextName) : previous.slug
      };
    });

    setSlugSuggestions([]);
  };

  const handleLogoChange: ChangeEventHandler<HTMLInputElement> = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      const message = 'Solo se permiten imágenes PNG, JPG, WEBP o GIF.';
      setFormError(message);
      showToast('error', message);
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      const message = 'La imagen supera el límite de 5MB.';
      setFormError(message);
      showToast('error', message);
      return;
    }

    setFormError(null);
    setIsUploadingLogo(true);

    try {
      const result = await uploadCompanyLogoClient(file);
      updateField('logoUrl', result.logoUrl);
      showToast('success', 'Logo subido correctamente.');
    } catch (error) {
      const message = extractErrorMessage(error);
      setFormError(message);
      showToast('error', message);
    } finally {
      setIsUploadingLogo(false);
      event.target.value = '';
    }
  };

  const handleSubmit: FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();

    if (mode === 'edit' && isFormReadOnly) {
      const message = 'Solo ADMIN puede modificar datos de la empresa.';
      setFormError(message);
      showToast('error', message);
      return;
    }

    const workerCount = Number(state.workerCount);
    if (!Number.isInteger(workerCount) || workerCount <= 0) {
      const message = 'La cantidad de trabajadores debe ser un número entero positivo.';
      setFormError(message);
      showToast('error', message);
      return;
    }

    const normalizedSlug = slugify(state.slug);
    if (!normalizedSlug || normalizedSlug.length < 2) {
      const message = 'Debes ingresar un slug válido de al menos 2 caracteres.';
      setFormError(message);
      showToast('error', message);
      return;
    }

    if (!state.contactEmail.includes('@')) {
      const message = 'Debes ingresar un correo de contacto válido.';
      setFormError(message);
      showToast('error', message);
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    setSlugSuggestions([]);

    try {
      if (mode === 'create') {
        await createCompanyClient({
          name: state.name.trim(),
          slug: normalizedSlug,
          workerCount,
          contactEmail: state.contactEmail.trim(),
          logoUrl: state.logoUrl || undefined,
          supportWhatsappPhone: state.supportWhatsappPhone.trim() || undefined
        });

        showToast('success', 'Empresa creada correctamente.');
        await wait(700);
        router.replace('/admin/companies?success=created');
        router.refresh();
        return;
      }

      if (!companySlug) {
        const message = 'No se encontró el slug de la empresa.';
        setFormError(message);
        showToast('error', message);
        return;
      }

      await updateCompanyBySlugClient(companySlug, {
        name: state.name.trim(),
        workerCount,
        logoUrl: state.logoUrl || null,
        supportWhatsappPhone: state.supportWhatsappPhone.trim() || null,
        ...(canEditCompany
          ? {
              slug: normalizedSlug,
              contactEmail: state.contactEmail.trim(),
              status: state.status
            }
          : {})
      });

      showToast('success', 'Empresa actualizada correctamente.');
      router.refresh();
    } catch (error) {
      const message = resolveMutationErrorMessage(error);
      setFormError(message);
      showToast('error', message);

      if (error instanceof ApiRequestError && error.mensajeTecnico === 'COMPANY_SLUG_ALREADY_EXISTS') {
        try {
          const result = await getCompanySlugSuggestionsClient({
            slug: normalizedSlug,
            ...(mode === 'edit' && initialCompany?.slug
              ? { excludeSlug: initialCompany.slug }
              : {})
          });
          setSlugSuggestions(result.suggestions.slice(0, 3));
        } catch {
          setSlugSuggestions([]);
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const applySuggestedSlug = (slug: string) => {
    updateField('slug', slug);
    setIsSlugTouched(true);
    setSlugSuggestions([]);
  };

  return (
    <>
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

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <label htmlFor="company-name" className="text-sm font-medium text-slate-700">
              Nombre de la empresa
            </label>
            <input
              id="company-name"
              name="name"
              value={state.name}
              onChange={handleNameChange}
              required
              disabled={isFormReadOnly}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-brand transition focus:ring-2 disabled:bg-slate-100"
              placeholder="Empresa Ejemplo S.A."
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="company-workers" className="text-sm font-medium text-slate-700">
              Cantidad de trabajadores
            </label>
            <input
              id="company-workers"
              name="workerCount"
              type="number"
              min={1}
              value={state.workerCount}
              onChange={(event) => updateField('workerCount', event.target.value)}
              required
              disabled={isFormReadOnly}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-brand transition focus:ring-2 disabled:bg-slate-100"
              placeholder="10"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="company-contact-email" className="text-sm font-medium text-slate-700">
              Correo de contacto
            </label>
            <input
              id="company-contact-email"
              name="contactEmail"
              type="email"
              value={state.contactEmail}
              onChange={(event) => updateField('contactEmail', event.target.value)}
              required
              disabled={isFormReadOnly}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-brand transition focus:ring-2 disabled:bg-slate-100"
              placeholder="contacto@empresa.com"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="company-support-whatsapp" className="text-sm font-medium text-slate-700">
              WhatsApp de soporte
            </label>
            <input
              id="company-support-whatsapp"
              name="supportWhatsappPhone"
              value={state.supportWhatsappPhone}
              onChange={(event) => updateField('supportWhatsappPhone', event.target.value)}
              disabled={isFormReadOnly}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-brand transition focus:ring-2 disabled:bg-slate-100"
              placeholder="+59170000000"
            />
            <p className="text-xs text-slate-500">
              Se usará para el botón flotante de WhatsApp en la intro pública de encuestas.
            </p>
          </div>

          <div className="space-y-1">
            <label htmlFor="company-logo" className="text-sm font-medium text-slate-700">
              Logo de la empresa (opcional)
            </label>
            <input
              id="company-logo"
              name="logo"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={handleLogoChange}
              disabled={isUploadingLogo || isFormReadOnly}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-emerald-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-emerald-700"
            />
            <p className="text-xs text-slate-500">
              Formatos permitidos: PNG, JPG, WEBP, GIF (máx. 5MB)
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <label htmlFor="company-slug" className="text-sm font-medium text-slate-700">
              Slug de acceso
            </label>
            <input
              id="company-slug"
              name="slug"
              value={state.slug}
              onChange={(event) => {
                setIsSlugTouched(true);
                updateField('slug', slugify(event.target.value));
                setSlugSuggestions([]);
              }}
              readOnly={isSlugReadOnly}
              disabled={isSlugReadOnly}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-brand transition focus:ring-2 disabled:bg-slate-100"
              placeholder="empresa-ejemplo"
            />
            {mode === 'create' ? (
              <p className="text-xs text-slate-500">
                Se usa en el login contextual, configuración y encuestas públicas.
              </p>
            ) : isFormReadOnly ? (
              <p className="text-xs text-slate-500">Solo ADMIN puede modificar el slug.</p>
            ) : isActiveCompany ? (
              <p className="text-xs text-amber-700">
                El slug no se puede editar cuando la empresa está activa.
              </p>
            ) : (
              <p className="text-xs text-slate-500">
                El slug identifica rutas de acceso y enlaces públicos de la empresa.
              </p>
            )}
            {slugSuggestions.length > 0 ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                <p className="font-medium">El slug ya está en uso. Sugerencias:</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {slugSuggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => applySuggestedSlug(suggestion)}
                      className="rounded-md border border-amber-300 bg-white px-2 py-1 font-medium text-amber-900 transition hover:bg-amber-100"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <div className="space-y-1">
            <label htmlFor="company-status" className="text-sm font-medium text-slate-700">
              Estado
            </label>
            <select
              id="company-status"
              name="status"
              value={state.status}
              onChange={(event) => updateField('status', event.target.value as CompanyStatus)}
              disabled={!canEditCompany}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-brand transition focus:ring-2 disabled:bg-slate-100"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {logoPreview ? (
          <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
            <p className="text-sm font-medium text-slate-700">Logo cargado</p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
              <div className="relative h-24 w-40 overflow-hidden rounded-lg border border-slate-200 bg-white">
                <Image
                  src={logoPreview}
                  alt={`Logo de ${state.name || 'la empresa'}`}
                  fill
                  sizes="160px"
                  className="object-contain p-2"
                />
              </div>
              <div className="space-y-1">
                <a
                  href={logoPreview}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-medium text-brand transition hover:text-brandDark"
                >
                  Abrir archivo del logo
                </a>
                <p className="break-all text-xs text-slate-500">{state.logoUrl}</p>
              </div>
            </div>
          </div>
        ) : null}

        {formError ? (
          <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {formError}
          </p>
        ) : null}

        {isFormReadOnly ? (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Solo un usuario ADMIN puede editar la configuración de la empresa.
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={isSubmitting || isUploadingLogo || isFormReadOnly}
            className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition hover:bg-brandDark disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting
              ? 'Guardando...'
              : mode === 'create'
                ? 'Crear empresa'
                : 'Guardar cambios'}
          </button>
          {mode === 'edit' ? (
            <button
              type="button"
              onClick={resetForm}
              disabled={isSubmitting}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
            >
              Descartar cambios
            </button>
          ) : null}
        </div>
      </form>
    </>
  );
}

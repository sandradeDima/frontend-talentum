'use client';

import { useState } from 'react';
import type { CoolturaConfig, UpsertCoolturaConfigInput } from '@/types/cooltura-config';
import { upsertCoolturaConfigClient } from '@/services/cooltura-config.client';
import { extractErrorMessage } from '@/lib/auth-shared';

type Props = {
  initialConfig: CoolturaConfig | null;
};

const emptyForm = (): UpsertCoolturaConfigInput => ({
  linkedinUrl: null,
  youtubeUrl: null,
  instagramUrl: null,
  facebookUrl: null,
  tiktokUrl: null,
  whatsappLink: null,
  boliviaDireccion: null,
  boliviaTelefono: null,
  boliviaEmail: null,
  paraguayDireccion: null,
  paraguayTelefono: null,
  paraguayEmail: null
});

const configToForm = (config: CoolturaConfig | null): UpsertCoolturaConfigInput => {
  if (!config) return emptyForm();
  return {
    linkedinUrl: config.linkedinUrl,
    youtubeUrl: config.youtubeUrl,
    instagramUrl: config.instagramUrl,
    facebookUrl: config.facebookUrl,
    tiktokUrl: config.tiktokUrl,
    whatsappLink: config.whatsappLink,
    boliviaDireccion: config.boliviaDireccion,
    boliviaTelefono: config.boliviaTelefono,
    boliviaEmail: config.boliviaEmail,
    paraguayDireccion: config.paraguayDireccion,
    paraguayTelefono: config.paraguayTelefono,
    paraguayEmail: config.paraguayEmail
  };
};

type FieldProps = {
  label: string;
  value: string | null;
  onChange: (value: string | null) => void;
  type?: 'text' | 'email' | 'url' | 'tel';
  placeholder?: string;
};

function Field({ label, value, onChange, type = 'text', placeholder }: FieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      <input
        type={type}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value === '' ? null : e.target.value)}
        placeholder={placeholder}
        className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-ink shadow-sm placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
      />
    </div>
  );
}

export function CoolturaConfigEditor({ initialConfig }: Props) {
  const [form, setForm] = useState<UpsertCoolturaConfigInput>(() =>
    configToForm(initialConfig)
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  const set = <K extends keyof UpsertCoolturaConfigInput>(
    key: K,
    value: UpsertCoolturaConfigInput[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSavedAt(null);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      await upsertCoolturaConfigClient(form);
      setSavedAt(new Date());
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Redes sociales */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-ink">Redes sociales</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="LinkedIn"
            value={form.linkedinUrl}
            onChange={(v) => set('linkedinUrl', v)}
            type="url"
            placeholder="https://linkedin.com/company/..."
          />
          <Field
            label="YouTube"
            value={form.youtubeUrl}
            onChange={(v) => set('youtubeUrl', v)}
            type="url"
            placeholder="https://youtube.com/@..."
          />
          <Field
            label="Instagram"
            value={form.instagramUrl}
            onChange={(v) => set('instagramUrl', v)}
            type="url"
            placeholder="https://instagram.com/..."
          />
          <Field
            label="Facebook"
            value={form.facebookUrl}
            onChange={(v) => set('facebookUrl', v)}
            type="url"
            placeholder="https://facebook.com/..."
          />
          <Field
            label="TikTok"
            value={form.tiktokUrl}
            onChange={(v) => set('tiktokUrl', v)}
            type="url"
            placeholder="https://tiktok.com/@..."
          />
          <Field
            label="WhatsApp (enlace)"
            value={form.whatsappLink}
            onChange={(v) => set('whatsappLink', v)}
            type="url"
            placeholder="https://wa.me/..."
          />
        </div>
      </section>

      {/* Bolivia */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-ink">Bolivia</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field
            label="Dirección"
            value={form.boliviaDireccion}
            onChange={(v) => set('boliviaDireccion', v)}
            placeholder="Av. ..."
          />
          <Field
            label="Teléfono"
            value={form.boliviaTelefono}
            onChange={(v) => set('boliviaTelefono', v)}
            type="tel"
            placeholder="+591 ..."
          />
          <Field
            label="Email"
            value={form.boliviaEmail}
            onChange={(v) => set('boliviaEmail', v)}
            type="email"
            placeholder="contacto@..."
          />
        </div>
      </section>

      {/* Paraguay */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-ink">Paraguay</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field
            label="Dirección"
            value={form.paraguayDireccion}
            onChange={(v) => set('paraguayDireccion', v)}
            placeholder="Av. ..."
          />
          <Field
            label="Teléfono"
            value={form.paraguayTelefono}
            onChange={(v) => set('paraguayTelefono', v)}
            type="tel"
            placeholder="+595 ..."
          />
          <Field
            label="Email"
            value={form.paraguayEmail}
            onChange={(v) => set('paraguayEmail', v)}
            type="email"
            placeholder="contacto@..."
          />
        </div>
      </section>

      {/* Footer */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="rounded-lg bg-brand px-5 py-2 text-sm font-medium text-white transition hover:bg-brandDark disabled:opacity-60"
        >
          {isSaving ? 'Guardando...' : 'Guardar cambios'}
        </button>
        {savedAt && (
          <p className="text-sm text-emerald-600">
            Guardado correctamente a las{' '}
            {savedAt.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
        {error && <p className="text-sm text-rose-600">{error}</p>}
      </div>
    </div>
  );
}

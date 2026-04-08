import { requireSession } from '@/lib/auth-session';
import { extractErrorMessage } from '@/lib/auth-shared';
import { getCoolturaConfigServer } from '@/services/cooltura-config.server';
import { CoolturaConfigEditor } from '@/components/admin/cooltura-config-editor';
import { redirect } from 'next/navigation';

export default async function CoolturaConfigPage() {
  const session = await requireSession(['ADMIN']);

  if (session.user.role !== 'ADMIN') {
    redirect('/admin/home');
  }

  try {
    const config = await getCoolturaConfigServer();

    return (
      <section className="space-y-4">
        <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h1 className="text-xl font-semibold text-ink">Configuraciones Cooltura</h1>
          <p className="text-sm text-slate-600">
            Gestiona los enlaces de redes sociales e información de contacto por país.
          </p>
        </header>
        <CoolturaConfigEditor initialConfig={config} />
      </section>
    );
  } catch (error) {
    return (
      <section className="space-y-4">
        <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h1 className="text-xl font-semibold text-ink">Configuraciones Cooltura</h1>
        </header>
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {extractErrorMessage(error)}
        </div>
      </section>
    );
  }
}

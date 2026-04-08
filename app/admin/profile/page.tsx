import { requireSession } from '@/lib/auth-session';

const roleLabel = {
  ADMIN: 'Administrador global',
  CLIENT_ADMIN: 'Administrador de cliente'
} as const;

export default async function AdminProfilePage() {
  const session = await requireSession(['ADMIN', 'CLIENT_ADMIN']);
  const user = session.user;

  return (
    <section className="space-y-4">
      <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold text-ink">Mi perfil</h1>
        <p className="text-sm text-slate-600">
          Información de cuenta y alcance dentro del panel.
        </p>
      </header>

      <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <dl className="grid gap-3 md:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500">Nombre</dt>
            <dd className="text-sm font-medium text-ink">{user.name}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500">Correo</dt>
            <dd className="text-sm font-medium text-ink">{user.email}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500">Rol</dt>
            <dd className="text-sm font-medium text-ink">{roleLabel[user.role]}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500">
              Alcance de empresa
            </dt>
            <dd className="text-sm font-medium text-ink">
              {user.companySlug ?? 'Global (todas las empresas)'}
            </dd>
          </div>
        </dl>
      </article>
    </section>
  );
}

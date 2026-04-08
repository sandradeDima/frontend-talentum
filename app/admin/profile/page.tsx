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
      <header className="admin-panel">
        <p className="admin-kicker">Cuenta</p>
        <h1 className="admin-title mt-3">Mi perfil</h1>
        <p className="admin-subtitle mt-3">
          Información de cuenta y alcance dentro del panel.
        </p>
      </header>

      <article className="admin-panel">
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

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { CompanyForm } from '@/components/admin/company-form';
import { requireSession } from '@/lib/auth-session';

export default async function NewCompanyPage() {
  const session = await requireSession(['ADMIN', 'CLIENT_ADMIN']);

  if (session.user.role !== 'ADMIN') {
    if (session.user.companySlug) {
      redirect(`/admin/companies/${session.user.companySlug}`);
    }
    redirect('/admin/companies');
  }

  return (
    <section className="space-y-4">
      <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold text-ink">Crear nueva empresa</h1>
        <p className="text-sm text-slate-600">
          Completa los datos base de la empresa para habilitar su gestión.
        </p>
      </header>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <CompanyForm mode="create" allowRestrictedFields />
      </div>

      <Link
        href="/admin/companies"
        className="inline-flex text-sm font-medium text-brand transition hover:text-brandDark"
      >
        Volver al directorio
      </Link>
    </section>
  );
}

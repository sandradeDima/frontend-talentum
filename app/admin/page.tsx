import { redirect } from 'next/navigation';
import { requireSession } from '@/lib/auth-session';

export default async function AdminLandingPage() {
  const session = await requireSession(['ADMIN', 'CLIENT_ADMIN']);

  if (session.user.role === 'ADMIN') {
    redirect('/admin/home');
  }

  if (session.user.companySlug) {
    redirect(`/admin/companies/${session.user.companySlug}`);
  }

  redirect('/admin/home');
}

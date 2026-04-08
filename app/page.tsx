import { redirect } from 'next/navigation';
import { getSessionOrNull } from '@/lib/auth-session';
import { resolvePostLoginPath } from '@/lib/auth-shared';

export default async function HomePage() {
  const session = await getSessionOrNull();

  if (session) {
    redirect(resolvePostLoginPath(session.user));
  }

  redirect('/login');
}

import type { ReactNode } from 'react';
import { requireSession } from '@/lib/auth-session';
import { AdminShell } from '@/components/admin/admin-shell';

export default async function AdminLayout({
  children
}: Readonly<{ children: ReactNode }>) {
  const session = await requireSession(['ADMIN', 'CLIENT_ADMIN']);

  return <AdminShell user={session.user}>{children}</AdminShell>;
}

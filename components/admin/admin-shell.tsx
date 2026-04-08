import type { ReactNode } from 'react';
import type { AuthUser } from '@/types/auth';
import { AdminSideNav } from './admin-side-nav';

type AdminShellProps = {
  user: AuthUser;
  children: ReactNode;
};

export function AdminShell({ user, children }: AdminShellProps) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col gap-4 px-4 py-4 md:flex-row md:gap-5 md:px-5">
      <AdminSideNav user={user} />
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}

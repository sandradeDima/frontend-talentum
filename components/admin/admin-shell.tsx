import type { ReactNode } from 'react';
import type { AuthUser } from '@/types/auth';
import { AdminSideNav } from './admin-side-nav';

type AdminShellProps = {
  user: AuthUser;
  children: ReactNode;
};

export function AdminShell({ user, children }: AdminShellProps) {
  return (
    <div className="admin-theme">
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1480px] flex-col gap-4 px-4 py-4 md:flex-row md:gap-5 md:px-5 md:py-5">
        <AdminSideNav user={user} />
        <main className="admin-main">{children}</main>
      </div>
    </div>
  );
}

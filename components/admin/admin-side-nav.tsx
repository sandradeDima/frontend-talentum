'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { AuthUser } from '@/types/auth';
import { LogoutButton } from './logout-button';

type AdminSideNavProps = {
  user: AuthUser;
};

type NavItem = {
  label: string;
  href: string;
  matchPrefix: string;
};

const roleLabel: Record<AuthUser['role'], string> = {
  ADMIN: 'Administrador global',
  CLIENT_ADMIN: 'Administrador de cliente'
};

const isActivePath = (pathname: string, item: NavItem, items: NavItem[]) => {
  const matches = items.filter((candidate) => {
    return (
      pathname === candidate.matchPrefix ||
      pathname.startsWith(`${candidate.matchPrefix}/`)
    );
  });

  if (matches.length === 0) {
    return false;
  }

  const mostSpecific = matches.reduce((selected, candidate) => {
    return candidate.matchPrefix.length > selected.matchPrefix.length ? candidate : selected;
  }, matches[0] as NavItem);

  return mostSpecific.matchPrefix === item.matchPrefix;
};

const buildNavItems = (user: AuthUser): NavItem[] => {
  if (user.role === 'ADMIN') {
    return [
      {
        label: 'Home',
        href: '/admin/home',
        matchPrefix: '/admin/home'
      },
      {
        label: 'Empresas',
        href: '/admin/companies',
        matchPrefix: '/admin/companies'
      },
      {
        label: 'Encuestas',
        href: '/admin/surveys',
        matchPrefix: '/admin/surveys'
      },
      {
        label: 'Historial',
        href: '/admin/surveys/history',
        matchPrefix: '/admin/surveys/history'
      },
      {
        label: 'Usuarios',
        href: '/admin/users',
        matchPrefix: '/admin/users'
      },
      {
        label: 'Configuraciones Cooltura',
        href: '/admin/cooltura',
        matchPrefix: '/admin/cooltura'
      }
    ];
  }

  const companyPath = user.companySlug
    ? `/admin/companies/${user.companySlug}`
    : '/admin/companies';
  const surveysPath = user.companySlug
    ? `/admin/companies/${user.companySlug}/surveys`
    : '/admin/companies';
  const historyPath = user.companySlug
    ? `/admin/companies/${user.companySlug}/surveys/history`
    : '/admin/companies';

  return [
    {
      label: 'Home',
      href: '/admin/home',
      matchPrefix: '/admin/home'
    },
    {
      label: 'Mi empresa',
      href: companyPath,
      matchPrefix: companyPath
    },
    {
      label: 'Encuestas',
      href: surveysPath,
      matchPrefix: surveysPath
    },
    {
      label: 'Historial',
      href: historyPath,
      matchPrefix: historyPath
    }
  ];
};

export function AdminSideNav({ user }: AdminSideNavProps) {
  const pathname = usePathname();
  const items = buildNavItems(user);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  return (
    <aside className="w-full shrink-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:sticky md:top-4 md:w-72">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Panel de administración
          </p>
          <p className="mt-1 text-sm font-semibold text-ink">{user.name}</p>
          <p className="text-xs text-slate-600">{roleLabel[user.role]}</p>
        </div>
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen((current) => !current)}
          className="inline-flex rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 md:hidden"
        >
          {isMobileMenuOpen ? 'Cerrar' : 'Menú'}
        </button>
      </div>

      <div className={`${isMobileMenuOpen ? 'block' : 'hidden'} md:block`}>
        <nav className="space-y-1">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
                className={`block rounded-lg px-3 py-2 text-sm font-medium transition ${
                isActivePath(pathname, item, items)
                  ? 'bg-brand text-white'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="mt-6 border-t border-slate-200 pt-4">
          <Link
            href="/admin/profile"
              className={`mb-2 block rounded-lg px-3 py-2 text-sm font-medium transition ${
              isActivePath(
                pathname,
                {
                  label: 'Mi perfil',
                  href: '/admin/profile',
                  matchPrefix: '/admin/profile'
                },
                [
                  ...items,
                  {
                    label: 'Mi perfil',
                    href: '/admin/profile',
                    matchPrefix: '/admin/profile'
                  }
                ]
              )
                ? 'bg-brand text-white'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            Mi perfil
          </Link>
          <LogoutButton fullWidth />
        </div>
      </div>
    </aside>
  );
}

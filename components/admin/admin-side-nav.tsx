'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import coolturaLogo from '@/public/assets/logos/header-logo.png';
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
    <aside className="admin-sidebar w-full shrink-0 p-4 md:sticky md:top-4 md:w-[295px]">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="w-full rounded-[1.4rem] border border-white/10 bg-white/6 px-4 py-4">
          <Image
            src={coolturaLogo}
            alt="COOLtura"
            width={174}
            height={52}
            className="h-auto w-[162px]"
            priority
          />
          <p className="mt-5 text-[0.68rem] uppercase tracking-[0.22em] text-cooltura-lime cooltura-display">
            Panel de administración
          </p>
          <p className="mt-2 text-sm text-cooltura-light">{user.name}</p>
          <p className="text-xs text-cooltura-light/62">{roleLabel[user.role]}</p>
        </div>
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen((current) => !current)}
          className="admin-button-secondary px-3 py-2 text-xs md:hidden"
        >
          {isMobileMenuOpen ? 'Cerrar' : 'Menú'}
        </button>
      </div>

      <div className={`${isMobileMenuOpen ? 'block' : 'hidden'} md:block`}>
        <nav className="space-y-1.5">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-[1rem] px-4 py-3 text-sm transition ${
                isActivePath(pathname, item, items)
                  ? 'border border-cooltura-lime/40 bg-white/8 text-cooltura-lime shadow-cooltura'
                  : 'text-cooltura-light/72 hover:bg-white/8 hover:text-cooltura-lime'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="mt-6 border-t border-white/10 pt-4">
          <Link
            href="/admin/profile"
            className={`mb-2 block rounded-[1rem] px-4 py-3 text-sm transition ${
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
                ? 'border border-cooltura-lime/40 bg-white/8 text-cooltura-lime shadow-cooltura'
                : 'text-cooltura-light/72 hover:bg-white/8 hover:text-cooltura-lime'
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

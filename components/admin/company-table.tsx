'use client';

import Link from 'next/link';
import type { CompanyRow } from '@/types/company';
import { CompanyStatusBadge } from './company-status-badge';

type CompanyTableProps = {
  rows: CompanyRow[];
};

const dateFormatter = new Intl.DateTimeFormat('es-BO', {
  dateStyle: 'medium'
});

function SettingsIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4">
      <path
        fill="currentColor"
        d="M19.14 12.94c.04-.31.06-.63.06-.94s-.02-.63-.07-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7.2 7.2 0 0 0-1.63-.94l-.36-2.54a.5.5 0 0 0-.49-.42h-3.84a.5.5 0 0 0-.49.42l-.36 2.54c-.58.22-1.12.52-1.62.94l-2.4-.96a.5.5 0 0 0-.6.22L2.7 8.84a.5.5 0 0 0 .12.64l2.03 1.58c-.05.31-.08.63-.08.94s.03.63.08.94L2.82 14.5a.5.5 0 0 0-.12.64l1.92 3.32c.13.22.39.31.6.22l2.4-.96c.5.41 1.04.72 1.62.94l.36 2.54c.04.24.25.42.49.42h3.84c.24 0 .45-.18.49-.42l.36-2.54c.59-.22 1.13-.53 1.63-.94l2.39.96c.22.09.47 0 .6-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.02-1.56ZM12 15.5a3.5 3.5 0 1 1 0-7.01 3.5 3.5 0 0 1 0 7.01Z"
      />
    </svg>
  );
}

function FormIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4">
      <path
        fill="currentColor"
        d="M6 3.75A2.25 2.25 0 0 0 3.75 6v12A2.25 2.25 0 0 0 6 20.25h12A2.25 2.25 0 0 0 20.25 18V9.56a2.25 2.25 0 0 0-.66-1.59l-3.31-3.31A2.25 2.25 0 0 0 14.69 4H6Zm7.25 1.6c.19.04.37.13.51.28l3.31 3.31a.74.74 0 0 1 .22.53V18c0 .41-.34.75-.75.75H6A.75.75 0 0 1 5.25 18V6c0-.41.34-.75.75-.75h7.25ZM7.5 10a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5A.75.75 0 0 1 7.5 10Zm0 4a.75.75 0 0 1 .75-.75h4.5a.75.75 0 0 1 0 1.5h-4.5A.75.75 0 0 1 7.5 14Z"
      />
    </svg>
  );
}

export function CompanyTable({ rows }: CompanyTableProps) {
  if (rows.length === 0) {
    return (
      <div className="admin-panel border-dashed p-8 text-center text-sm text-cooltura-light/66">
        No hay empresas para mostrar.
      </div>
    );
  }

  return (
    <div className="admin-table-shell">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-cooltura-gray">
            <tr>
              <th className="px-4 py-3 font-semibold">Nombre</th>
              <th className="px-4 py-3 font-semibold">Cantidad de trabajadores</th>
              <th className="px-4 py-3 font-semibold">Correo de contacto</th>
              <th className="px-4 py-3 font-semibold">Estado</th>
              <th className="px-4 py-3 font-semibold">Fecha de creación</th>
              <th className="px-4 py-3 text-right font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((company) => (
              <tr key={company.id} className="align-top">
                <td className="px-4 py-3 font-medium text-ink">
                  {company.name}
                </td>
                <td className="px-4 py-3 text-slate-700">{company.workerCount}</td>
                <td className="px-4 py-3 text-slate-700">{company.contactEmail}</td>
                <td className="px-4 py-3">
                  <CompanyStatusBadge status={company.status} />
                </td>
                <td className="px-4 py-3 text-slate-700">
                  {dateFormatter.format(new Date(company.createdAt))}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <Link
                      href={`/admin/companies/${company.slug}`}
                      className="admin-button-ghost rounded-md p-2"
                      aria-label={`Abrir configuración de ${company.name}`}
                      title="Configuración"
                    >
                      <SettingsIcon />
                    </Link>
                    <Link
                      href={`/admin/companies/${company.slug}/surveys`}
                      className="admin-button-ghost rounded-md p-2"
                      aria-label={`Abrir encuestas de ${company.name}`}
                      title="Encuestas"
                    >
                      <FormIcon />
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

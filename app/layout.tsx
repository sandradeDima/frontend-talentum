import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'Talentum Admin',
  description: 'Base de administración multiempresa'
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="bg-surface">
        <div className="min-h-screen">{children}</div>
      </body>
    </html>
  );
}

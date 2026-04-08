import Image from 'next/image';
import type { ReactNode } from 'react';
import handIllustration from '@/public/assets/images/hand.png';
import lightbulbIllustration from '@/public/assets/images/lightbulb.png';
import coolturaLogo from '@/public/assets/logos/header-logo.png';
import type { PublicSupportConfigData } from '@/types/support-config';

type PageShellProps = {
  title: string;
  subtitle?: string;
  supportConfig?: PublicSupportConfigData['config'];
  children: ReactNode;
};

export function PageShell({ title, subtitle, supportConfig = null, children }: PageShellProps) {
  return (
    <main className="auth-page">
      <div className="auth-shell">
        <div className="auth-grid">
          <section className="auth-brand-panel hidden lg:block">
            <Image
              src={coolturaLogo}
              alt="COOLtura"
              width={188}
              height={58}
              className="h-auto w-[180px]"
              priority
            />
            <p className="auth-kicker mt-10">Back Office Experience</p>
            <h1 className="auth-title max-w-[12ch]">COOLtura Admin</h1>
            <p className="auth-subtitle">
              Un acceso unificado para operar encuestas, empresas y usuarios dentro de la misma
              experiencia premium que vive cada participante.
            </p>
          </section>

          <div className="space-y-4">
            <section className="auth-card">
              <div className="lg:hidden">
                <Image
                  src={coolturaLogo}
                  alt="COOLtura"
                  width={188}
                  height={58}
                  className="h-auto w-[164px]"
                  priority
                />
              </div>
              <header className="mb-6">
                <p className="auth-kicker">Panel COOLtura</p>
                <h1 className="auth-title text-[1.55rem] sm:text-[1.9rem]">{title}</h1>
                {subtitle ? <p className="auth-subtitle mt-3">{subtitle}</p> : null}
              </header>
              <section>{children}</section>
            </section>

            {supportConfig ? (
              <section className="auth-card">
                <p className="auth-kicker">Soporte</p>
                <h2 className="mt-3 text-base uppercase text-cooltura-light cooltura-display">
                  ¿Necesitas ayuda?
                </h2>
                <p className="mt-3 text-sm leading-6 text-cooltura-light/72">
                  Contacta al equipo de soporte por cualquiera de estos canales.
                </p>
                <div className="mt-4 flex flex-wrap gap-2 text-sm">
                  {supportConfig.whatsappLink ? (
                    <a
                      href={supportConfig.whatsappLink}
                      target="_blank"
                      rel="noreferrer"
                      className="auth-button-secondary w-auto px-4 py-2"
                    >
                      WhatsApp
                    </a>
                  ) : null}
                  {supportConfig.supportEmail ? (
                    <a
                      href={`mailto:${supportConfig.supportEmail}`}
                      className="auth-button-secondary w-auto px-4 py-2"
                    >
                      Email
                    </a>
                  ) : null}
                  {supportConfig.helpCenterUrl ? (
                    <a
                      href={supportConfig.helpCenterUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="auth-button-secondary w-auto px-4 py-2"
                    >
                      Centro de ayuda
                    </a>
                  ) : null}
                </div>
              </section>
            ) : null}
          </div>
        </div>
      </div>

      <Image
        src={handIllustration}
        alt=""
        width={92}
        height={92}
        className="pointer-events-none absolute bottom-10 left-[8%] hidden h-auto w-[92px] opacity-95 md:block"
      />
      <Image
        src={lightbulbIllustration}
        alt=""
        width={78}
        height={78}
        className="pointer-events-none absolute bottom-10 right-[8%] hidden h-auto w-[78px] opacity-95 md:block"
      />
    </main>
  );
}

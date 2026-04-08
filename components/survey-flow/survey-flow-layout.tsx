import type { ReactNode } from 'react';
import { SurveyBrandedShell } from '@/components/survey-landing/survey-branded-shell';
import { WhatsAppFab } from '@/components/survey-landing/whatsapp-fab';
import type { CompanyBranding } from '@/types/survey-branding';

type SurveyFlowLayoutProps = {
  branding: CompanyBranding;
  children: ReactNode;
};

export function SurveyFlowLayout({ branding, children }: SurveyFlowLayoutProps) {
  return (
    <SurveyBrandedShell branding={branding}>
      <section className="border-b border-white/20 bg-cooltura-panel px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        <div className="mx-auto max-w-[1220px]">{children}</div>
      </section>
      <WhatsAppFab phone={branding.supportWhatsappPhone} />
    </SurveyBrandedShell>
  );
}

import type { ReactNode } from 'react';
import { ResponsiveHeroBanner } from '@/components/survey-landing/responsive-hero-banner';
import { SurveyFooter } from '@/components/survey-landing/survey-footer';
import { SurveyHeader } from '@/components/survey-landing/survey-header';
import type { CompanyBranding } from '@/types/survey-branding';

type SurveyBrandedShellProps = {
  branding: CompanyBranding;
  children: ReactNode;
  showHero?: boolean;
};

export function SurveyBrandedShell({
  branding,
  children,
  showHero = false
}: SurveyBrandedShellProps) {
  return (
    <main className="min-h-screen bg-cooltura-dark text-cooltura-light">
      <SurveyHeader
        companyName={branding.companyName}
        topRightLogoUrl={branding.topRightLogoUrl}
      />
      {showHero ? <ResponsiveHeroBanner /> : null}
      {children}
      <SurveyFooter branding={branding} />
    </main>
  );
}

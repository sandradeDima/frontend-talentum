import type { ReactNode } from 'react';
import { ConfidentialitySection } from '@/components/survey-landing/confidentiality-section';
import { SurveyBrandedShell } from '@/components/survey-landing/survey-branded-shell';
import type { CompanyBranding } from '@/types/survey-branding';

type SurveyLandingPageProps = {
  branding: CompanyBranding;
  accessSection: ReactNode;
};

export function SurveyLandingPage({ branding, accessSection }: SurveyLandingPageProps) {
  return (
    <SurveyBrandedShell branding={branding} showHero>
      {accessSection}
      <ConfidentialitySection />
    </SurveyBrandedShell>
  );
}

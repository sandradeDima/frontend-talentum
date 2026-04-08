import Image from 'next/image';
import footerLogo from '@/public/assets/logos/footer-logo.png';
import { CompanyLocations } from '@/components/survey-landing/company-locations';
import { SocialLinksRow } from '@/components/survey-landing/social-links-row';
import type { CompanyBranding } from '@/types/survey-branding';

type SurveyFooterProps = {
  branding: CompanyBranding;
};

export function SurveyFooter({ branding }: SurveyFooterProps) {
  return (
    <footer className="bg-cooltura-panel px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
      <div className="mx-auto grid max-w-[1280px] gap-10 lg:grid-cols-[minmax(0,360px)_1px_minmax(0,1fr)] lg:items-start lg:gap-12">
        <div className="space-y-6">
          <div className="flex justify-center">
            <Image
              src={footerLogo}
              alt="COOLtura"
              width={300}
              height={140}
              className="h-auto w-[210px] sm:w-[250px] lg:w-[300px]"
            />
          </div>
          <div className="space-y-4 text-sm leading-6 text-cooltura-light/92 flex flex-row items-center">
            <div className="flex flex-row items-center gap-4">
              <p className="font-coolturaDisplay text-xs text-center font-bold uppercase leading-tight tracking-[0.06em] text-cooltura-lime">
                <span className="block">Únete a nuestra</span>
                <span className="block">Comunidad digital</span>
              </p>
              <SocialLinksRow socialLinks={branding.socialLinks} />
            </div>
          </div>
        </div>

        <div className="hidden h-full w-px bg-white/25 lg:block" aria-hidden="true" />

        <CompanyLocations locations={branding.locations} />
      </div>
    </footer>
  );
}

import Image from 'next/image';
import headerLogo from '@/public/assets/logos/header-logo.png';
import { resolvePublicAssetUrl } from '@/lib/public-asset';
import type { CompanyBranding } from '@/types/survey-branding';

type SurveyHeaderProps = {
  companyName: string;
  topRightLogoUrl?: CompanyBranding['topRightLogoUrl'];
};

export function SurveyHeader({ companyName, topRightLogoUrl }: SurveyHeaderProps) {
  const resolvedLogoUrl = resolvePublicAssetUrl(topRightLogoUrl);

  return (
    <header className="border-b border-white/20 bg-cooltura-dark">
      <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between gap-4 px-4 py-3 sm:gap-5 sm:px-6 sm:py-4 lg:px-8">
        <Image
          src={headerLogo}
          alt="COOLtura"
          priority
          width={138}
          height={108}
          className="h-auto w-[108px] sm:w-[128px]"
        />

        {resolvedLogoUrl ? (
          <div className="relative h-14 w-[164px] shrink-0 sm:h-16 sm:w-[208px] lg:h-[72px] lg:w-[248px]">
            <Image
              src={resolvedLogoUrl}
              alt={`Logo de ${companyName}`}
              fill
              unoptimized
              sizes="(max-width: 640px) 164px, (max-width: 1024px) 208px, 248px"
              className="object-contain object-right"
            />
          </div>
        ) : (
          <p className="max-w-[180px] text-right text-xs uppercase tracking-[0.12em] text-cooltura-light/80 sm:text-sm">
            {companyName}
          </p>
        )}
      </div>
    </header>
  );
}

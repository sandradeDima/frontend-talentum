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
      <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between gap-6 px-4 py-4 sm:px-6 lg:px-8">
        <Image
          src={headerLogo}
          alt="COOLtura"
          priority
          width={92}
          height={72}
          className="h-auto w-[72px] sm:w-[88px]"
        />

        {resolvedLogoUrl ? (
          <div className="relative h-10 w-[120px] shrink-0 sm:h-12 sm:w-[156px] lg:h-14 lg:w-[188px]">
            <Image
              src={resolvedLogoUrl}
              alt={`Logo de ${companyName}`}
              fill
              unoptimized
              sizes="(max-width: 640px) 120px, (max-width: 1024px) 156px, 188px"
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

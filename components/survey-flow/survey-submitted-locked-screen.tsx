'use client';

import Image from 'next/image';
import handIllustration from '@/public/assets/images/hand.png';
import lightbulbIllustration from '@/public/assets/images/lightbulb.png';
import { SurveyProgressModule } from '@/components/survey-flow/survey-progress-module';

type SurveySubmittedLockedScreenProps = {
  campaignName?: string | null;
  submittedAt?: string | null;
  closingLines?: string[];
};

const formatDateTime = (rawValue: string | null | undefined) => {
  if (!rawValue) {
    return null;
  }

  const value = new Date(rawValue);
  if (Number.isNaN(value.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat('es-BO', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(value);
};

export function SurveySubmittedLockedScreen({
  campaignName,
  submittedAt,
  closingLines = []
}: SurveySubmittedLockedScreenProps) {
  const formattedSubmittedAt = formatDateTime(submittedAt);

  return (
    <div className="relative min-h-[780px] overflow-hidden text-cooltura-light">
      <div className="mx-auto flex min-h-[660px] max-w-[920px] flex-col items-center justify-center px-2 pb-28 pt-16 text-center sm:pt-20">
        <h1 className="font-coolturaDisplay text-[2.4rem] uppercase tracking-[0.05em] text-cooltura-light sm:text-[3.2rem]">
          ¡GRACIAS!
        </h1>
        <div className="mt-8 max-w-[760px] space-y-4 text-sm leading-7 text-cooltura-light/88 sm:text-[1.02rem] sm:leading-8">
          <p>Gracias por tomarte el tiempo para responder.</p>
          <p>
            {campaignName
              ? `Tu opinión en ${campaignName} es clave para seguir construyendo un mejor lugar para trabajar.`
              : 'Tu opinión es clave para seguir construyendo un mejor lugar para trabajar.'}
          </p>
          {formattedSubmittedAt ? (
            <p className="text-xs uppercase tracking-[0.16em] text-cooltura-light/60">
              Respuesta registrada el {formattedSubmittedAt}
            </p>
          ) : null}
        </div>

        {closingLines.length > 0 ? (
          <div className="mt-8 max-w-[760px] space-y-3 rounded-[2rem] border border-white/10 bg-white/5 px-6 py-6 text-left text-sm leading-7 text-cooltura-light/84">
            {closingLines.map((line, index) => (
              <p key={`${line}-${index}`}>{line}</p>
            ))}
          </div>
        ) : null}

        <div className="mt-8 w-full">
          <SurveyProgressModule
            progressPercent={100}
            label="Fin"
            currentStep={1}
            totalSteps={1}
          />
        </div>
      </div>

      <Image
        src={handIllustration}
        alt=""
        width={92}
        height={92}
        className="pointer-events-none absolute bottom-12 left-[11%] hidden h-auto w-[92px] opacity-95 md:block"
      />
      <Image
        src={lightbulbIllustration}
        alt=""
        width={78}
        height={78}
        className="pointer-events-none absolute bottom-12 right-[11%] hidden h-auto w-[78px] opacity-95 md:block"
      />
    </div>
  );
}

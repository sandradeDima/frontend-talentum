'use client';

import Image from 'next/image';
import handIllustration from '@/public/assets/images/hand.png';
import lightbulbIllustration from '@/public/assets/images/lightbulb.png';
import { SurveyProgressModule } from '@/components/survey-flow/survey-progress-module';

type SurveySectionIntroScreenProps = {
  title: string;
  description: string;
  progressPercent: number;
  progressLabel: string;
  currentStep: number;
  totalSteps: number;
  isBusy: boolean;
  disableBack?: boolean;
  onBack: () => void;
  onNext: () => void;
};

export function SurveySectionIntroScreen({
  title,
  description,
  progressPercent,
  progressLabel,
  currentStep,
  totalSteps,
  isBusy,
  disableBack = false,
  onBack,
  onNext
}: SurveySectionIntroScreenProps) {
  return (
    <div className="relative min-h-[780px] overflow-hidden text-cooltura-light">
      <button
        type="button"
        onClick={onBack}
        disabled={disableBack || isBusy}
        className="text-left text-[1.85rem] leading-none text-cooltura-light transition hover:text-cooltura-lime disabled:cursor-not-allowed disabled:opacity-45"
      >
        Volver
      </button>

      <div className="mx-auto flex min-h-[660px] max-w-[900px] flex-col items-center justify-center px-2 pb-28 pt-16 text-center sm:pt-20">
        <h1 className="font-coolturaDisplay text-[1.9rem] uppercase tracking-[0.05em] text-cooltura-light sm:text-[2.55rem]">
          {title}
        </h1>
        <p className="mt-8 max-w-[760px] text-sm leading-7 text-cooltura-light/88 sm:text-[1.02rem] sm:leading-8">
          {description}
        </p>

        <button
          type="button"
          onClick={onNext}
          disabled={isBusy}
          className="cooltura-pill-button mt-10 min-w-[280px]"
        >
          Siguiente
        </button>

        <div className="mt-8 w-full">
          <SurveyProgressModule
            progressPercent={progressPercent}
            label={progressLabel}
            currentStep={currentStep}
            totalSteps={totalSteps}
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

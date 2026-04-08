'use client';

import Image from 'next/image';
import handIllustration from '@/public/assets/images/hand.png';
import lightbulbIllustration from '@/public/assets/images/lightbulb.png';
import { SurveyProgressModule } from '@/components/survey-flow/survey-progress-module';

type SurveyFinalConfirmationScreenProps = {
  progressPercent: number;
  progressLabel: string;
  currentStep: number;
  totalSteps: number;
  isSubmitting: boolean;
  submitError: string | null;
  onBack: () => void;
  onSubmit: () => void;
};

export function SurveyFinalConfirmationScreen({
  progressPercent,
  progressLabel,
  currentStep,
  totalSteps,
  isSubmitting,
  submitError,
  onBack,
  onSubmit
}: SurveyFinalConfirmationScreenProps) {
  return (
    <div className="relative min-h-[780px] overflow-hidden text-cooltura-light">
      <button
        type="button"
        onClick={onBack}
        disabled={isSubmitting}
        className="text-left text-[1.85rem] leading-none text-cooltura-light transition hover:text-cooltura-lime disabled:cursor-not-allowed disabled:opacity-45"
      >
        Volver
      </button>

      <div className="mx-auto flex min-h-[660px] max-w-[900px] flex-col items-center justify-center px-2 pb-28 pt-16 text-center sm:pt-20">
        <h1 className="font-coolturaDisplay text-[2.5rem] uppercase tracking-[0.05em] text-cooltura-light sm:text-[3.4rem]">
          ¡GRACIAS!
        </h1>
        <div className="mt-8 max-w-[700px] space-y-3 text-sm leading-7 text-cooltura-light/88 sm:text-[1.02rem] sm:leading-8">
          <p>Gracias por tomarte el tiempo para responder.</p>
          <p>
            Tu opinión es clave para seguir construyendo un mejor lugar para trabajar.
          </p>
        </div>

        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting}
          className="cooltura-pill-button mt-10 min-w-[280px]"
        >
          {isSubmitting ? 'Enviando encuesta...' : 'Enviar'}
        </button>

        {submitError ? (
          <p
            role="alert"
            className="mt-5 max-w-[620px] rounded-[1.4rem] border border-[#ff8e95]/45 bg-[#381b24] px-5 py-3 text-sm text-[#ffd4d7]"
          >
            {submitError}
          </p>
        ) : null}

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

'use client';

import { useEffect, useState } from 'react';
import { SurveyProgressModule } from '@/components/survey-flow/survey-progress-module';
import { SurveyScaleQuestion } from '@/components/survey-flow/survey-scale-question';

type SurveyFinalBlockScreenProps = {
  npsHelperText: string;
  npsPrompt: string;
  npsValue: number | undefined;
  openPromptPrefix: string;
  openPrompt: string;
  openValue: string;
  progressPercent: number;
  progressLabel: string;
  currentStep: number;
  totalSteps: number;
  validationError: string | null;
  autosaveMessage: string;
  autosaveError: string | null;
  isBusy: boolean;
  onBack: () => void;
  onNext: () => void;
  onRetryAutosave: () => void;
  onNpsChange: (value: number) => void;
  onOpenChange: (value: string) => void;
};

export function SurveyFinalBlockScreen({
  npsHelperText,
  npsPrompt,
  npsValue,
  openPromptPrefix,
  openPrompt,
  openValue,
  progressPercent,
  progressLabel,
  currentStep,
  totalSteps,
  validationError,
  autosaveMessage,
  autosaveError,
  isBusy,
  onBack,
  onNext,
  onRetryAutosave,
  onNpsChange,
  onOpenChange
}: SurveyFinalBlockScreenProps) {
  const [isHeaderElevated, setIsHeaderElevated] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsHeaderElevated(window.scrollY > 18);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <div className="min-h-[780px] text-cooltura-light">
      <div className="sticky top-0 z-30 -mx-1.5 mb-6 px-1.5 sm:-mx-2 sm:mb-10 sm:px-2">
        <div
          className={`mx-auto max-w-[1160px] rounded-[1.4rem] border px-3 py-3 transition-all duration-300 sm:rounded-[1.7rem] sm:px-5 sm:py-4 lg:px-6 ${
            isHeaderElevated
              ? 'border-white/10 bg-[#141417]/92 shadow-[0_20px_48px_rgba(0,0,0,0.34)] backdrop-blur-md'
              : 'border-transparent bg-transparent'
          }`}
        >
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <button
              type="button"
              onClick={onBack}
              disabled={isBusy}
              className="shrink-0 text-left text-[1.55rem] leading-none text-cooltura-light transition hover:text-cooltura-lime disabled:cursor-not-allowed disabled:opacity-45 sm:text-[1.85rem]"
            >
              Volver
            </button>

            <SurveyProgressModule
              progressPercent={progressPercent}
              label={progressLabel}
              currentStep={currentStep}
              totalSteps={totalSteps}
              className="mx-0 w-full max-w-[420px] lg:ml-auto"
            />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[920px] px-1.5 pb-24 pt-1 sm:px-2 sm:pb-12 sm:pt-2">
        <div className="space-y-14">
          <SurveyScaleQuestion
            helperText={npsHelperText}
            prompt={npsPrompt}
            value={npsValue}
            max={10}
            leftLabel="Muy en desacuerdo"
            rightLabel="Muy de acuerdo"
            disabled={isBusy}
            onChange={onNpsChange}
          />

          <div className="space-y-4 rounded-[1.85rem] border border-white/10 bg-white/[0.035] px-3.5 py-4 text-cooltura-light shadow-[0_18px_44px_rgba(0,0,0,0.16)] sm:px-5 sm:py-6">
            <label
              htmlFor="survey-final-comment"
              className="block space-y-1.5 text-left text-base leading-8"
            >
              <span className="block text-[1rem] font-semibold italic text-cooltura-lime sm:text-[1.05rem]">
                {openPromptPrefix}
              </span>
              <span className="block text-cooltura-light">{openPrompt}</span>
            </label>
            <textarea
              id="survey-final-comment"
              value={openValue}
              onChange={(event) => onOpenChange(event.target.value)}
              disabled={isBusy}
              rows={7}
              className="w-full rounded-[1.2rem] border border-white/15 bg-white px-5 py-4 text-base text-cooltura-dark outline-none transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cooltura-lime disabled:cursor-not-allowed disabled:bg-white/75"
            />
          </div>

          <div className="space-y-4 pt-2 text-center">
            <p
              className={`text-xs leading-6 ${
                autosaveError ? 'text-[#ffca75]' : 'text-cooltura-light/58'
              }`}
            >
              {autosaveMessage}
            </p>

            {autosaveError ? (
              <button
                type="button"
                onClick={onRetryAutosave}
                disabled={isBusy}
                className="rounded-full border border-[#ffca75]/55 px-4 py-2 text-sm text-[#ffe1a5] transition hover:bg-[#ffca75]/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Reintentar guardado
              </button>
            ) : null}

            {validationError ? (
              <p
                role="alert"
                className="mx-auto max-w-[620px] rounded-[1.4rem] border border-[#ffca75]/45 bg-[#2d2414] px-5 py-3 text-sm text-[#ffe1a5]"
              >
                {validationError}
              </p>
            ) : null}

            <button
              type="button"
              onClick={onNext}
              disabled={isBusy}
              className="cooltura-pill-button w-full sm:min-w-[280px] sm:w-auto"
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

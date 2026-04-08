'use client';

import { SurveyProgressModule } from '@/components/survey-flow/survey-progress-module';
import { SurveyScaleQuestion } from '@/components/survey-flow/survey-scale-question';

type SurveyFinalBlockScreenProps = {
  introText: string;
  npsPrompt: string;
  npsValue: number | undefined;
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
  introText,
  npsPrompt,
  npsValue,
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
  return (
    <div className="min-h-[780px] text-cooltura-light">
      <button
        type="button"
        onClick={onBack}
        disabled={isBusy}
        className="text-left text-[1.85rem] leading-none text-cooltura-light transition hover:text-cooltura-lime disabled:cursor-not-allowed disabled:opacity-45"
      >
        Volver
      </button>

      <div className="mx-auto max-w-[920px] px-2 pb-8 pt-4 sm:pt-6">
        <p className="text-sm leading-7 text-cooltura-light/90 sm:text-base">{introText}</p>

        <div className="mt-12 space-y-14">
          <SurveyScaleQuestion
            prompt={npsPrompt}
            value={npsValue}
            max={10}
            leftLabel="Muy en desacuerdo"
            rightLabel="Muy de acuerdo"
            disabled={isBusy}
            onChange={onNpsChange}
          />

          <div className="space-y-4 text-cooltura-light">
            <label htmlFor="survey-final-comment" className="block text-center text-base leading-8">
              {openPrompt}
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
        </div>

        <div className="mt-14 space-y-4 text-center">
          <SurveyProgressModule
            progressPercent={progressPercent}
            label={progressLabel}
            currentStep={currentStep}
            totalSteps={totalSteps}
          />

          <p className={`text-xs leading-6 ${autosaveError ? 'text-[#ffca75]' : 'text-cooltura-light/58'}`}>
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
            className="cooltura-pill-button min-w-[280px]"
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
}

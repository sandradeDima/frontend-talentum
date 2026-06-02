'use client';

import { useEffect, useState } from 'react';
import { SurveyProgressModule } from '@/components/survey-flow/survey-progress-module';
import { SurveyScaleQuestion } from '@/components/survey-flow/survey-scale-question';

type SectionQuestion = {
  key: string;
  prompt: string;
};

type SurveySectionQuestionsScreenProps = {
  helperText: string;
  questions: SectionQuestion[];
  answers: Record<string, string | number>;
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
  onAnswerChange: (questionKey: string, value: number) => void;
};

export function SurveySectionQuestionsScreen({
  helperText,
  questions,
  answers,
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
  onAnswerChange
}: SurveySectionQuestionsScreenProps) {
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
        <div className="space-y-10">
          <p className="mx-auto max-w-[850px] text-sm leading-7 text-cooltura-light/90 sm:text-base sm:leading-8 lg:mx-0">
            {helperText}
          </p>

          <div className="space-y-6 sm:space-y-7">
            {questions.map((question, index) => (
              <SurveyScaleQuestion
                key={question.key}
                questionNumber={index + 1}
                prompt={question.prompt}
                value={
                  typeof answers[question.key] === 'number'
                    ? (answers[question.key] as number)
                    : undefined
                }
                max={5}
                leftLabel="Muy en desacuerdo"
                rightLabel="Muy de acuerdo"
                disabled={isBusy}
                onChange={(value) => onAnswerChange(question.key, value)}
              />
            ))}
          </div>

          <div className="space-y-4 pt-2 text-center">
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

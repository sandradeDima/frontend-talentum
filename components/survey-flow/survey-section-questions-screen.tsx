'use client';

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
        <p className="mx-auto max-w-[850px] text-sm leading-7 text-cooltura-light/90 sm:text-base sm:leading-8">
          {helperText}
        </p>

        <div className="mt-12 space-y-14 sm:space-y-16">
          {questions.map((question) => (
            <SurveyScaleQuestion
              key={question.key}
              prompt={question.prompt}
              value={typeof answers[question.key] === 'number' ? (answers[question.key] as number) : undefined}
              max={5}
              leftLabel="Muy en desacuerdo"
              rightLabel="Muy de acuerdo"
              disabled={isBusy}
              onChange={(value) => onAnswerChange(question.key, value)}
            />
          ))}
        </div>

        <div className="mt-16 space-y-4 text-center">
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

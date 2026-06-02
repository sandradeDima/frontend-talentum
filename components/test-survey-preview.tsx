'use client';

import { useState } from 'react';
import { RespondentSurveyRunner } from '@/components/respondent-survey-runner';
import { SurveyFlowLayout } from '@/components/survey-flow/survey-flow-layout';
import { SurveySubmittedLockedScreen } from '@/components/survey-flow/survey-submitted-locked-screen';
import { SurveyAccessSection } from '@/components/survey-landing/survey-access-section';
import { SurveyIntroPage } from '@/components/survey-landing/survey-intro-page';
import { SurveyLandingPage } from '@/components/survey-landing/survey-landing-page';
import type { SurveyPreviewStage } from '@/lib/test-survey-preview';
import {
  testSurveyPreviewAccessContext,
  testSurveyPreviewBranding
} from '@/lib/test-survey-preview';

type TestSurveyPreviewProps = {
  initialStage: SurveyPreviewStage;
};

const STAGE_OPTIONS: Array<{ value: SurveyPreviewStage; label: string }> = [
  { value: 'access', label: 'Acceso' },
  { value: 'intro', label: 'Inicio' },
  { value: 'survey', label: 'Encuesta' },
  { value: 'submitted', label: 'Gracias' }
];

export function TestSurveyPreview({ initialStage }: TestSurveyPreviewProps) {
  const [stage, setStage] = useState<SurveyPreviewStage>(initialStage);
  const [runnerKey, setRunnerKey] = useState(0);
  const [submittedAt, setSubmittedAt] = useState('2026-06-01T12:00:00.000Z');
  const [isPanelVisible, setIsPanelVisible] = useState(true);

  const moveToStage = (nextStage: SurveyPreviewStage, options?: { resetRunner?: boolean }) => {
    setStage(nextStage);

    if (nextStage === 'submitted') {
      setSubmittedAt(new Date().toISOString());
    }

    if (options?.resetRunner) {
      setRunnerKey((current) => current + 1);
    }
  };

  return (
    <>
      {isPanelVisible ? (
        <aside className="fixed left-4 top-4 z-50 w-[min(92vw,360px)] rounded-[1.6rem] border border-[#ffca75]/50 bg-[#20180c]/95 px-4 py-4 text-sm text-[#ffe7bc] shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-coolturaDisplay text-base uppercase tracking-[0.12em] text-cooltura-lime">
                Test only
              </p>
              <p className="mt-2 leading-6 text-[#ffe7bc]/88">
                Vista previa local para revisar textos y UI sin crear empresas, campanas ni accesos
                reales.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsPanelVisible(false)}
              className="rounded-full border border-white/15 px-3 py-1 text-[11px] uppercase tracking-[0.12em] text-cooltura-light transition hover:border-cooltura-lime hover:text-cooltura-lime"
            >
              Ocultar
            </button>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {STAGE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() =>
                  moveToStage(option.value, {
                    resetRunner: option.value === 'survey'
                  })
                }
                className={`rounded-full border px-3 py-2 text-xs uppercase tracking-[0.12em] transition ${
                  stage === option.value
                    ? 'border-cooltura-lime bg-cooltura-lime text-cooltura-dark'
                    : 'border-white/15 bg-white/5 text-cooltura-light hover:border-cooltura-lime hover:text-cooltura-lime'
                }`}
              >
                {option.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => moveToStage('survey', { resetRunner: true })}
              className="rounded-full border border-[#ffca75]/55 px-3 py-2 text-xs uppercase tracking-[0.12em] text-[#ffe7bc] transition hover:bg-[#ffca75]/10"
            >
              Reiniciar
            </button>
          </div>
        </aside>
      ) : (
        <button
          type="button"
          onClick={() => setIsPanelVisible(true)}
          className="fixed left-4 top-4 z-50 rounded-full border border-[#ffca75]/50 bg-[#20180c]/95 px-4 py-2 text-xs uppercase tracking-[0.12em] text-[#ffe7bc] shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur transition hover:border-cooltura-lime hover:text-cooltura-lime"
        >
          Test only
        </button>
      )}

      {stage === 'access' ? (
        <SurveyLandingPage
          branding={testSurveyPreviewBranding}
          accessSection={
            <SurveyAccessSection>
              <article className="cooltura-surface-card space-y-4 px-4 py-5 text-left text-cooltura-light sm:px-6 sm:py-7">
                <h1 className="font-coolturaDisplay text-[1.35rem] uppercase leading-[1.18] tracking-[0.05em] text-cooltura-lime sm:text-[1.8rem] sm:tracking-[0.06em]">
                  Vista previa de encuesta
                </h1>
                <p className="text-[0.94rem] leading-6 text-cooltura-light/84 sm:text-sm sm:leading-7">
                  Esta pantalla existe solo para pruebas. No valida codigos, no usa empresas
                  reales y no guarda respuestas fuera de este navegador.
                </p>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => moveToStage('intro')}
                    className="cooltura-pill-button w-full sm:min-w-[240px] sm:w-auto"
                  >
                    Ver pantalla de inicio
                  </button>
                  <button
                    type="button"
                    onClick={() => moveToStage('survey', { resetRunner: true })}
                    className="rounded-full border border-white/15 px-5 py-3 text-sm text-cooltura-light transition hover:border-cooltura-lime hover:text-cooltura-lime sm:w-auto"
                  >
                    Ir directo a la encuesta
                  </button>
                </div>
              </article>
            </SurveyAccessSection>
          }
        />
      ) : null}

      {stage === 'intro' ? (
        <SurveyIntroPage
          branding={testSurveyPreviewBranding}
          campaign={testSurveyPreviewAccessContext.campaign}
          respondent={testSurveyPreviewAccessContext.respondent}
          isStarting={false}
          issue={null}
          onStart={() => moveToStage('survey', { resetRunner: true })}
          onChangeAccess={() => moveToStage('access')}
        />
      ) : null}

      {stage === 'survey' ? (
        <RespondentSurveyRunner
          key={runnerKey}
          branding={testSurveyPreviewBranding}
          sessionToken={testSurveyPreviewAccessContext.sessionToken}
          campaign={testSurveyPreviewAccessContext.campaign}
          progressStorageKey={null}
          initialResponseStatus={testSurveyPreviewAccessContext.response.status}
          previewMode
          onSubmitted={() => moveToStage('submitted')}
          onFatalError={() => moveToStage('access')}
          onExitToIntro={() => moveToStage('intro')}
        />
      ) : null}

      {stage === 'submitted' ? (
        <SurveyFlowLayout branding={testSurveyPreviewBranding}>
          <SurveySubmittedLockedScreen
            campaignName={testSurveyPreviewAccessContext.campaign.name}
            submittedAt={submittedAt}
          />
        </SurveyFlowLayout>
      ) : null}
    </>
  );
}

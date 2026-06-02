'use client';

import { SurveyBrandedShell } from '@/components/survey-landing/survey-branded-shell';
import { TutorialVideoGate } from '@/components/survey-landing/tutorial-video-gate';
import { WhatsAppFab } from '@/components/survey-landing/whatsapp-fab';
import type { RespondentAccessIssue } from '@/lib/respondent-survey-errors';
import type { ValidateSurveyAccessResult } from '@/types/respondent-survey';
import type { CompanyBranding } from '@/types/survey-branding';

type SurveyIntroPageProps = {
  branding: CompanyBranding;
  campaign: ValidateSurveyAccessResult['campaign'];
  respondent: ValidateSurveyAccessResult['respondent'];
  isStarting: boolean;
  issue: RespondentAccessIssue | null;
  onStart: () => void;
  onChangeAccess: () => void;
};

const buildTutorialStorageKey = (campaignId: string, respondentId: string) => {
  return `talentum:survey-tutorial-complete:${campaignId}:${respondentId}`;
};

const likertScale = ['1', '2', '3', '4', '5'];

export function SurveyIntroPage({
  branding,
  campaign,
  respondent,
  isStarting,
  issue,
  onStart,
  onChangeAccess
}: SurveyIntroPageProps) {
  const greetingName = respondent.fullName?.trim() || null;
  const bodyTextStyle = {
    fontFamily: 'Montserrat, sans-serif',
    fontWeight: 400 as const
  };

  return (
    <SurveyBrandedShell branding={branding}>
      <section className="border-b border-white/20 bg-cooltura-panel px-5 py-6 sm:px-7 sm:py-7 lg:px-8 lg:py-8">
        <div className="mx-auto flex max-w-[1180px] flex-col items-center space-y-7">
          <div
            className="w-full max-w-[760px] space-y-5 text-left text-[0.84rem] leading-6 text-cooltura-light/88 sm:text-[0.94rem] sm:leading-7"
            style={bodyTextStyle}
          >
              {greetingName ? (
                <p
                  className="text-[0.95rem] leading-6 text-cooltura-light sm:text-[1.02rem] sm:leading-7"
                  style={{ ...bodyTextStyle, fontWeight: 600 }}
                >
                  Hola {greetingName}!
                </p>
              ) : null}

              <div className="space-y-4">
                <p>
                  Esta encuesta tiene como objetivo conocer tu percepción sobre el clima y la{' '}
                  <span className="font-semibold text-cooltura-lime">cultura</span> de trabajo.
                </p>
                <p>
                  El <span className="font-semibold text-cooltura-lime">clima</span> se relaciona
                  con cómo te sientes en tu trabajo actualmente. La{' '}
                  <span className="font-semibold text-cooltura-lime">cultura</span> tiene que ver
                  con los hábitos, formas de trabajo y decisiones que se dan en el día a día
                  dentro de la organización.
                </p>
                <p>
                  Tus respuestas son{' '}
                  <span className="font-semibold text-cooltura-lime">
                    anónimas y confidenciales
                  </span>
                  , y serán utilizadas únicamente con fines de análisis y mejora. No existen
                  respuestas correctas o incorrectas.
                </p>
                <div className="space-y-3 pt-1">
                  <p className="text-cooltura-light" style={{ ...bodyTextStyle, fontWeight: 600 }}>
                    Revisa cada afirmación y califica tu nivel de acuerdo del 1 al 5, donde:
                  </p>

                  <div aria-label="Escala de acuerdo del uno al cinco" className="space-y-2.5 text-cooltura-light/84">
                    <span className="block text-[0.68rem] leading-4 sm:hidden">
                      Muy en desacuerdo
                    </span>
                    <div className="flex max-w-[470px] items-end justify-between gap-2 sm:gap-3">
                      <span className="hidden w-[90px] pb-1 text-[0.7rem] leading-4 sm:block">
                        Muy en desacuerdo
                      </span>
                      {likertScale.map((value) => (
                        <div
                          key={value}
                          className="flex min-w-[24px] flex-1 flex-col items-center gap-1.5 text-center sm:min-w-[28px] sm:flex-none"
                        >
                          <span className="text-[0.68rem] leading-none text-cooltura-light/88 sm:text-[0.72rem]">
                            {value}
                          </span>
                          <span
                            className="h-[14px] w-[14px] rounded-full border border-cooltura-light/55 bg-transparent sm:h-[15px] sm:w-[15px]"
                            aria-hidden="true"
                          />
                        </div>
                      ))}
                      <span className="hidden w-[90px] pb-1 text-right text-[0.7rem] leading-4 sm:block">
                        Muy de acuerdo
                      </span>
                    </div>
                    <span className="block text-right text-[0.68rem] leading-4 sm:hidden">
                      Muy de acuerdo
                    </span>
                  </div>
                </div>
              </div>
          </div>

          {issue ? (
            <article className="cooltura-surface-card w-full max-w-[760px] border-rose-300/40 bg-rose-950/30 px-5 py-4 text-left text-rose-100">
              <h2 className="text-base">{issue.title}</h2>
              <p className="mt-2 text-sm leading-6 text-rose-100/85">{issue.description}</p>
            </article>
          ) : null}

          <div className="grid w-full max-w-[760px] gap-x-6 gap-y-4 lg:grid-cols-[minmax(0,430px)_200px] lg:items-center lg:justify-center">
            <TutorialVideoGate
              tutorialVideoUrl={campaign.tutorialVideoUrl}
              storageKey={buildTutorialStorageKey(campaign.id, respondent.id)}
              onProceed={onStart}
              isStarting={isStarting}
            />

            <aside className="order-2 flex w-full items-center gap-4 self-center text-left text-cooltura-light lg:max-w-[200px]">
              <div className="h-[62px] w-px shrink-0 bg-cooltura-lime sm:h-[72px]" aria-hidden="true" />
              <div className="space-y-1.5" style={bodyTextStyle}>
                <h2 className="font-coolturaDisplay text-[1.3rem] uppercase leading-none tracking-[0.04em] text-cooltura-light sm:text-[1.55rem]">
                  TUTORIAL
                </h2>
                <p className="max-w-[180px] text-[0.88rem] leading-5 text-cooltura-light/86 sm:text-[0.92rem] sm:leading-[1.35]">
                  Mira este breve tutorial para responder la medición.
                </p>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <WhatsAppFab phone={branding.supportWhatsappPhone} />
    </SurveyBrandedShell>
  );
}

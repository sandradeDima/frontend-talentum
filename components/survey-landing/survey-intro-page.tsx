'use client';

import Image from 'next/image';
import handIllustration from '@/public/assets/images/hand.png';
import lightbulbIllustration from '@/public/assets/images/lightbulb.png';
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

  return (
    <SurveyBrandedShell branding={branding}>
      <section className="relative overflow-hidden border-b border-white/20 bg-cooltura-panel px-4 py-7 sm:px-6 sm:py-9 lg:px-8 lg:py-10">
        <div className="mx-auto max-w-[1040px]">
          <div className="space-y-6 lg:space-y-7">
            <div className="space-y-3">
              <h1 className="font-coolturaDisplay text-[2.1rem] uppercase tracking-[0.05em] text-cooltura-light sm:text-[2.5rem]">
                INICIO
              </h1>

              <div className="max-w-[980px] space-y-5 text-balance text-sm leading-8 text-cooltura-light/92 sm:text-[1.03rem]">
                <p>
                  Esta encuesta tiene como objetivo conocer tu percepción sobre el clima y la
                  cultura de trabajo.
                </p>
                <p>
                  El <span className="font-bold text-cooltura-lime">clima</span> se relaciona con
                  cómo te sientes en tu trabajo actualmente. La{' '}
                  <span className="font-bold text-cooltura-lime">cultura</span> tiene que ver con
                  los hábitos, formas de trabajo y decisiones que se dan en el día a día dentro de
                  la organización.
                </p>
                <p>
                  Tus respuestas son{' '}
                  <span className="font-bold text-cooltura-lime">
                    anónimas y confidenciales
                  </span>
                  , y serán utilizadas únicamente con fines de análisis y mejora. No existen
                  respuestas correctas o incorrectas.
                </p>
                <p>Revisa cada afirmación y califica tu nivel de acuerdo del 1 al 5, donde:</p>
                <p className="font-bold text-cooltura-lime">
                  1 = Muy en desacuerdo · 2 · 3 · 4 · 5 = Muy de acuerdo
                </p>
              </div>
            </div>

            {issue ? (
              <article className="cooltura-surface-card border-rose-300/40 bg-rose-950/30 px-5 py-4 text-left text-rose-100">
                <h2 className="text-base">{issue.title}</h2>
                <p className="mt-2 text-sm leading-6 text-rose-100/85">{issue.description}</p>
              </article>
            ) : null}

            <div className="grid gap-x-10 gap-y-5 lg:grid-cols-[minmax(0,520px)_minmax(260px,320px)] lg:items-start lg:justify-center">
              <TutorialVideoGate
                tutorialVideoUrl={campaign.tutorialVideoUrl}
                storageKey={buildTutorialStorageKey(campaign.id, respondent.id)}
                onProceed={onStart}
                isStarting={isStarting}
              />

              <aside className="order-2 mx-auto flex w-full max-w-[320px] flex-col items-start space-y-4 self-start pt-1 text-left text-cooltura-light lg:pt-2">
                <h2 className="font-coolturaDisplay text-[1.7rem] font-bold leading-none text-cooltura-light sm:text-[2rem]">
                  Tutorial
                </h2>
                <div className="max-w-[320px] space-y-1 text-left text-base leading-[1.15] text-cooltura-light/92">
                  {greetingName ? <p>Hola {greetingName}!</p> : null}
                  <p>Mira este breve tutorial para responder la medición.</p>
                </div>
              </aside>
            </div>
          </div>
        </div>

        <Image
          src={handIllustration}
          alt=""
          width={88}
          height={88}
          className="pointer-events-none absolute bottom-10 left-[11%] hidden h-auto w-[92px] opacity-95 md:block"
        />
        <Image
          src={lightbulbIllustration}
          alt=""
          width={88}
          height={88}
          className="pointer-events-none absolute bottom-10 right-[11%] hidden h-auto w-[78px] opacity-95 md:block"
        />
      </section>

      <WhatsAppFab phone={branding.supportWhatsappPhone} />
    </SurveyBrandedShell>
  );
}

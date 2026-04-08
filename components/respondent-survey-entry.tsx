'use client';

import Link from 'next/link';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEventHandler
} from 'react';
import { SurveyAccessSection } from '@/components/survey-landing/survey-access-section';
import { SurveyIntroPage } from '@/components/survey-landing/survey-intro-page';
import { SurveyLandingPage } from '@/components/survey-landing/survey-landing-page';
import { RespondentSurveyRunner } from '@/components/respondent-survey-runner';
import { SurveyFlowLayout } from '@/components/survey-flow/survey-flow-layout';
import { SurveySubmittedLockedScreen } from '@/components/survey-flow/survey-submitted-locked-screen';
import {
  isCompletedLockoutCode,
  resolveRespondentAccessIssue,
  type RespondentAccessIssue,
  type RespondentAccessIssueKind
} from '@/lib/respondent-survey-errors';
import { buildSurveyProgressStorageKey } from '@/lib/respondent-survey-progress';
import {
  startSurveyResponseClient,
  validateSurveyAccessClient
} from '@/services/respondent-survey.client';
import type {
  RespondentCredentialType,
  StartSurveyResponseResult,
  SubmitSurveyResponseResult,
  ValidateSurveyAccessResult
} from '@/types/respondent-survey';
import type { CompanyBranding } from '@/types/survey-branding';

type RespondentEntryMode = 'magic-link' | 'access-code';

type RespondentSurveyEntryProps = {
  branding: CompanyBranding;
  campaignSlug: string;
  initialToken?: string | null;
  entryMode?: RespondentEntryMode;
};

type EntryStage =
  | 'collecting'
  | 'validating'
  | 'validated'
  | 'starting'
  | 'running'
  | 'submitted';

type StoredSurveyEntrySession = {
  campaignSlug: string;
  sessionToken: string;
  sessionExpiresAt: string;
  responseId: string;
  responseStatus: string;
  respondent: {
    id: string;
    identifier: string;
    fullName: string;
  };
  campaign: {
    id: string;
    slug: string;
    name: string;
  };
  preparedAt: string;
};

type EntryCopy = {
  credentialType: RespondentCredentialType;
  inputId: string;
  label: string;
  placeholder: string;
  helperText: string;
  submitLabel: string;
  submitBusyLabel: string;
  retryBusyLabel: string;
  switchHref: string;
  switchLabel: string;
  sectionHeading: string;
  sectionDescription: string;
  readyLabel: string;
};

const SURVEY_ENTRY_STORAGE_KEY_PREFIX = 'talentum:survey-entry:';

const resolveIssuePalette = (kind: RespondentAccessIssueKind) => {
  if (kind === 'expired') {
    return 'border-[#ffca75] bg-[#2d2414] text-[#ffe1a5]';
  }

  if (kind === 'locked') {
    return 'border-white/15 bg-white/5 text-cooltura-light';
  }

  return 'border-[#ff8e95] bg-[#381b24] text-[#ffd4d7]';
};

const shouldRenderTerminalState = (issue: RespondentAccessIssue | null): boolean => {
  if (!issue) {
    return false;
  }

  return issue.kind === 'expired' || issue.kind === 'locked';
};

const buildStorageKey = (campaignSlug: string) => {
  return `${SURVEY_ENTRY_STORAGE_KEY_PREFIX}${campaignSlug}`;
};

const persistPreparedSession = (
  campaignSlug: string,
  access: ValidateSurveyAccessResult,
  started: StartSurveyResponseResult
) => {
  if (typeof window === 'undefined') {
    return;
  }

  const payload: StoredSurveyEntrySession = {
    campaignSlug,
    sessionToken: access.sessionToken,
    sessionExpiresAt: started.sessionExpiresAt,
    responseId: started.response.id,
    responseStatus: started.response.status,
    respondent: access.respondent,
    campaign: {
      id: access.campaign.id,
      slug: access.campaign.slug,
      name: access.campaign.name
    },
    preparedAt: new Date().toISOString()
  };

  window.sessionStorage.setItem(buildStorageKey(campaignSlug), JSON.stringify(payload));
};

const clearPreparedSession = (campaignSlug: string) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.sessionStorage.removeItem(buildStorageKey(campaignSlug));
};

const splitNonEmptyLines = (value: string): string[] => {
  return value
    .split(/\r?\n/g)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
};

const resolveEntryCopy = (
  entryMode: RespondentEntryMode,
  campaignSlug: string,
  hasTokenFromLink: boolean
): EntryCopy => {
  const encodedCampaignSlug = encodeURIComponent(campaignSlug);

  if (entryMode === 'access-code') {
    return {
      credentialType: 'PIN',
      inputId: 'accessCode',
      label: 'Código de acceso',
      placeholder: 'Escribe tu Código',
      helperText:
        'Ingresa el código de acceso que se te mandó por correo electrónico.',
      submitLabel: 'Ingresar',
      submitBusyLabel: 'Validando acceso...',
      retryBusyLabel: 'Validando acceso...',
      switchHref: `/survey/${encodedCampaignSlug}`,
      switchLabel: 'Ingresar con magic link',
      sectionHeading: 'CÓDIGO DE ACCESO',
      sectionDescription:
        'Accede con el documento o código que recibiste en tu invitación y entra a la encuesta en un solo paso.',
      readyLabel: 'Código validado'
    };
  }

  return {
    credentialType: 'TOKEN',
    inputId: 'credentialToken',
    label: 'Magic link',
    placeholder: 'Pega aquí tu token de acceso',
    helperText: hasTokenFromLink
      ? 'Detectamos un token en tu enlace. Validaremos tu acceso automáticamente.'
      : 'Usa el token que recibiste por correo para ingresar mediante magic link.',
    submitLabel: 'Ingresar',
    submitBusyLabel: 'Validando acceso...',
    retryBusyLabel: 'Reintentando...',
    switchHref: `/survey/${encodedCampaignSlug}/codigo`,
    switchLabel: 'Ingresar con código de acceso',
    sectionHeading: 'MAGIC LINK',
    sectionDescription:
      'Si llegaste desde tu correo, validaremos tu acceso y mantendremos la misma experiencia segura y confidencial.',
    readyLabel: 'Magic link validado'
  };
};

export function RespondentSurveyEntry({
  branding,
  campaignSlug,
  initialToken = null,
  entryMode = 'magic-link'
}: RespondentSurveyEntryProps) {
  const initialTokenValue = initialToken?.trim() ?? '';
  const hasTokenFromLink = entryMode === 'magic-link' && initialTokenValue.length > 0;
  const initialCredential = entryMode === 'magic-link' ? initialTokenValue : '';

  const [credential, setCredential] = useState(initialCredential);
  const [stage, setStage] = useState<EntryStage>('collecting');
  const [issue, setIssue] = useState<RespondentAccessIssue | null>(null);
  const [accessContext, setAccessContext] = useState<ValidateSurveyAccessResult | null>(null);
  const [submittedResult, setSubmittedResult] = useState<SubmitSurveyResponseResult | null>(
    null
  );
  const autoValidateWasAttempted = useRef(false);

  const entryCopy = useMemo(
    () => resolveEntryCopy(entryMode, campaignSlug, hasTokenFromLink),
    [campaignSlug, entryMode, hasTokenFromLink]
  );

  const isBusy = stage === 'validating' || stage === 'starting';
  const isAutoValidatingMagicLink =
    entryMode === 'magic-link' &&
    hasTokenFromLink &&
    stage === 'validating' &&
    credential.trim() === initialTokenValue;

  const canValidate = useMemo(() => {
    if (isBusy) {
      return false;
    }

    return credential.trim().length >= 4;
  }, [credential, isBusy]);

  const runValidate = useCallback(
    async (input: {
      credentialValue: string;
    }) => {
      setIssue(null);
      setStage('validating');

      try {
        const validated = await validateSurveyAccessClient({
          campaignSlug,
          credentialType: entryCopy.credentialType,
          credential: input.credentialValue
        });

        setAccessContext(validated);
        setStage('validated');
      } catch (error) {
        setAccessContext(null);
        setStage('collecting');
        setIssue(resolveRespondentAccessIssue(error));
      }
    },
    [campaignSlug, entryCopy.credentialType]
  );

  const handleValidate: FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();

    if (!canValidate) {
      return;
    }

    await runValidate({
      credentialValue: credential.trim()
    });
  };

  const resetToManualAccess = () => {
    setAccessContext(null);
    setSubmittedResult(null);
    setStage('collecting');
    setIssue(null);
    setCredential('');
    clearPreparedSession(campaignSlug);
  };

  const handleStartSurvey = async () => {
    if (!accessContext || isBusy) {
      return;
    }

    setIssue(null);
    setStage('starting');

    try {
      const started = await startSurveyResponseClient({
        sessionToken: accessContext.sessionToken
      });

      persistPreparedSession(campaignSlug, accessContext, started);

      setAccessContext((previous) => {
        if (!previous) {
          return previous;
        }

        return {
          ...previous,
          sessionExpiresAt: started.sessionExpiresAt,
          response: started.response
        };
      });
      setStage('running');
    } catch (error) {
      setStage('validated');
      setIssue(resolveRespondentAccessIssue(error));
    }
  };

  const handleRetry = async () => {
    if (isBusy) {
      return;
    }

    if (stage === 'validated' && accessContext) {
      await handleStartSurvey();
      return;
    }

    if (stage !== 'collecting') {
      return;
    }

    const normalizedCredential = credential.trim();
    if (normalizedCredential.length < 4) {
      return;
    }

    await runValidate({
      credentialValue: normalizedCredential
    });
  };

  const handleRunnerSubmitted = (result: SubmitSurveyResponseResult) => {
    setSubmittedResult(result);
    setStage('submitted');
    clearPreparedSession(campaignSlug);
  };

  const handleRunnerFatalError = (error: unknown) => {
    setIssue(resolveRespondentAccessIssue(error));
    setAccessContext(null);
    setSubmittedResult(null);
    setStage('collecting');
    clearPreparedSession(campaignSlug);
  };

  useEffect(() => {
    if (!hasTokenFromLink || autoValidateWasAttempted.current) {
      return;
    }

    autoValidateWasAttempted.current = true;

    void runValidate({
      credentialValue: initialTokenValue
    });
  }, [hasTokenFromLink, initialTokenValue, runValidate]);

  if (stage === 'running' && accessContext) {
    const progressStorageKey = buildSurveyProgressStorageKey(
      accessContext.campaign.id,
      accessContext.respondent.id
    );

    return (
      <RespondentSurveyRunner
        branding={branding}
        sessionToken={accessContext.sessionToken}
        campaign={accessContext.campaign}
        progressStorageKey={progressStorageKey}
        initialResponseStatus={accessContext.response.status}
        onSubmitted={handleRunnerSubmitted}
        onFatalError={handleRunnerFatalError}
        onExitToIntro={() => {
          setStage('validated');
          setIssue(null);
        }}
      />
    );
  }

  const terminalIssue = shouldRenderTerminalState(issue) ? issue : null;
  const isCompletedTerminalIssue = Boolean(
    terminalIssue && isCompletedLockoutCode(terminalIssue.technicalCode)
  );
  const closingLines =
    stage === 'submitted' && accessContext
      ? splitNonEmptyLines(accessContext.campaign.content.closingText)
      : [];

  if (stage === 'submitted') {
    return (
      <SurveyFlowLayout branding={branding}>
        <SurveySubmittedLockedScreen
          campaignName={accessContext?.campaign.name ?? null}
          submittedAt={submittedResult?.submittedAt ?? null}
          closingLines={closingLines}
        />
      </SurveyFlowLayout>
    );
  }

  if (isCompletedTerminalIssue) {
    return (
      <SurveyFlowLayout branding={branding}>
        <SurveySubmittedLockedScreen
          campaignName={accessContext?.campaign.name ?? null}
        />
      </SurveyFlowLayout>
    );
  }

  if ((stage === 'validated' || stage === 'starting') && accessContext && !terminalIssue) {
    return (
      <SurveyIntroPage
        branding={branding}
        campaign={accessContext.campaign}
        respondent={accessContext.respondent}
        isStarting={stage === 'starting'}
        issue={issue}
        onStart={() => void handleStartSurvey()}
        onChangeAccess={resetToManualAccess}
      />
    );
  }

  const accessSection = (
    <SurveyAccessSection>
      <div className="space-y-6">
        {issue ? (
          <article
            role="alert"
            className={`cooltura-surface-card px-5 py-4 text-left ${resolveIssuePalette(issue.kind)}`}
          >
            <h2 className="text-base text-inherit">{issue.title}</h2>
            <p className="mt-2 text-sm leading-6 opacity-90">{issue.description}</p>
            {issue.kind === 'temporary' ? (
              <button
                type="button"
                onClick={handleRetry}
                disabled={isBusy}
                className="mt-4 rounded-full border border-current/30 px-4 py-2 text-sm transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {stage === 'validating' ? entryCopy.retryBusyLabel : 'Reintentar'}
              </button>
            ) : null}
          </article>
        ) : null}

        {terminalIssue ? (
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={resetToManualAccess}
              className="w-full rounded-full border border-white/15 px-5 py-3 text-sm text-cooltura-light transition hover:border-cooltura-lime hover:text-cooltura-lime sm:w-auto"
            >
              {isCompletedLockoutCode(terminalIssue.technicalCode)
                ? 'Volver al inicio'
                : 'Intentar con otro acceso'}
            </button>
            <Link
              href={entryCopy.switchHref}
              className="w-full rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm text-cooltura-light transition hover:border-cooltura-lime hover:text-cooltura-lime sm:w-auto"
            >
              {entryCopy.switchLabel}
            </Link>
          </div>
        ) : isAutoValidatingMagicLink ? (
          <article className="cooltura-surface-card px-6 py-8 text-center text-cooltura-light">
            <p className="font-coolturaDisplay text-lg uppercase tracking-[0.08em] text-cooltura-lime">
              Validando acceso
            </p>
            <p className="mt-3 text-sm leading-7 text-cooltura-light/80">
              Estamos comprobando tu magic link para que ingreses directamente a la encuesta.
            </p>
          </article>
        ) : (
          <form onSubmit={handleValidate} className="space-y-5">
            <div className="space-y-3 text-left">
              <label
                htmlFor={entryCopy.inputId}
                className="block text-sm uppercase tracking-[0.14em] text-cooltura-light"
              >
                {entryCopy.label}
              </label>
              <input
                id={entryCopy.inputId}
                name={entryCopy.inputId}
                value={credential}
                onChange={(event) => setCredential(event.target.value)}
                required
                minLength={4}
                autoComplete="off"
                spellCheck={false}
                className="cooltura-input"
                placeholder={entryCopy.placeholder}
              />
              <p className="text-center text-xs leading-6 text-cooltura-light/60">
                {entryCopy.helperText}
              </p>
            </div>

            <div className="flex flex-col items-center gap-4">
              <button type="submit" disabled={!canValidate} className="cooltura-pill-button w-full sm:w-[360px]">
                {stage === 'validating' ? entryCopy.submitBusyLabel : entryCopy.submitLabel}
              </button>

              <Link
                href={entryCopy.switchHref}
                className="text-sm text-cooltura-light/76 transition hover:text-cooltura-lime"
              >
                {entryCopy.switchLabel}
              </Link>
            </div>
          </form>
        )}

        {issue?.technicalCode ? (
          <p className="text-center text-[0.68rem] uppercase tracking-[0.18em] text-cooltura-light/38">
            Código técnico: {issue.technicalCode}
          </p>
        ) : null}
      </div>
    </SurveyAccessSection>
  );

  return <SurveyLandingPage branding={branding} accessSection={accessSection} />;
}

'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SurveyFinalBlockScreen } from '@/components/survey-flow/survey-final-block-screen';
import { SurveyFinalConfirmationScreen } from '@/components/survey-flow/survey-final-confirmation-screen';
import { SurveyFlowLayout } from '@/components/survey-flow/survey-flow-layout';
import { SurveySectionIntroScreen } from '@/components/survey-flow/survey-section-intro-screen';
import { SurveySectionQuestionsScreen } from '@/components/survey-flow/survey-section-questions-screen';
import { extractErrorMessage } from '@/lib/auth-shared';
import {
  FATAL_RUNNER_CODES,
  isCompletedLockoutCode,
  parseRespondentTechnicalCode
} from '@/lib/respondent-survey-errors';
import {
  clearSurveyProgressSnapshot,
  loadSurveyProgressSnapshot,
  saveSurveyProgressSnapshot
} from '@/lib/respondent-survey-progress';
import {
  autosaveSurveyResponseClient,
  submitSurveyResponseClient
} from '@/services/respondent-survey.client';
import { ApiRequestError } from '@/types/api';
import type {
  SubmitSurveyResponseResult,
  SurveyAnswerInput,
  SurveyCampaignExecutionContext,
  SurveyResponseStatus,
  SurveySectionKey
} from '@/types/respondent-survey';
import type { CompanyBranding } from '@/types/survey-branding';

type RespondentSurveyRunnerProps = {
  branding: CompanyBranding;
  sessionToken: string;
  campaign: SurveyCampaignExecutionContext;
  progressStorageKey: string | null;
  initialResponseStatus: SurveyResponseStatus;
  onSubmitted: (result: SubmitSurveyResponseResult) => void;
  onFatalError: (error: unknown) => void;
  onExitToIntro: () => void;
};

type RunnerQuestionType = 'scale5' | 'scale10' | 'text';
type IntroSectionKey = Exclude<SurveySectionKey, 'final'>;

type RunnerQuestion = {
  key: string;
  prompt: string;
  type: RunnerQuestionType;
  sectionKey: SurveySectionKey;
  required: boolean;
};

type AnswerValue = string | number;

type SectionIntroPage = {
  kind: 'section-intro';
  sectionKey: IntroSectionKey;
  title: string;
  description: string;
  progressLabel: string;
};

type SectionQuestionsPage = {
  kind: 'section-questions';
  sectionKey: IntroSectionKey;
  helperText: string;
  progressLabel: string;
  questions: RunnerQuestion[];
};

type FinalBlockPage = {
  kind: 'final-block';
  progressLabel: string;
  introText: string;
  questions: [RunnerQuestion, RunnerQuestion];
};

type FinalConfirmationPage = {
  kind: 'final-confirmation';
  progressLabel: string;
};

type SurveyPage =
  | SectionIntroPage
  | SectionQuestionsPage
  | FinalBlockPage
  | FinalConfirmationPage;

type SectionDefinition = {
  sectionKey: IntroSectionKey;
  introTitle: string;
  progressLabel: string;
  description: string;
  questions: RunnerQuestion[];
};

const AUTOSAVE_DEBOUNCE_MS = 1400;

const SECTION_DISPLAY: Record<
  IntroSectionKey,
  { introTitle: string; progressLabel: string; introFallback: string; questionFallbackPrefix: string }
> = {
  leader: {
    introTitle: 'PRIMERA SECCIÓN: LÍDERES',
    progressLabel: 'Líderes',
    introFallback:
      'Las siguientes afirmaciones se refieren a la forma de trabajar y relacionarse de los líderes de la organización. Piensa en tu experiencia habitual y en cómo se dan las situaciones en el día a día de trabajo.',
    questionFallbackPrefix: 'Pregunta de liderazgo'
  },
  team: {
    introTitle: 'SEGUNDA SECCIÓN: EQUIPO',
    progressLabel: 'Equipo',
    introFallback:
      'Las siguientes afirmaciones se enfocan en tu experiencia dentro del equipo. Considera cómo colaboran, se comunican y resuelven situaciones en el trabajo cotidiano.',
    questionFallbackPrefix: 'Pregunta de equipo'
  },
  organization: {
    introTitle: 'TERCERA SECCIÓN: ORGANIZACIÓN',
    progressLabel: 'Organización',
    introFallback:
      'Las siguientes afirmaciones están relacionadas con la organización en general. Piensa en las prácticas, decisiones y ambiente que se viven en el día a día.',
    questionFallbackPrefix: 'Pregunta de organización'
  }
};

const FINAL_BLOCK_PROGRESS_LABEL = 'Consideraciones finales';

const normalizePrompt = (prompt: string, fallback: string): string => {
  const cleaned = prompt.trim();
  return cleaned.length > 0 ? cleaned : fallback;
};

const buildSectionDefinitions = (
  campaign: SurveyCampaignExecutionContext
): SectionDefinition[] => {
  const leaderQuestions = campaign.content.leaderQuestions.map((prompt, index) => ({
    key: `leader_q${index + 1}`,
    prompt: normalizePrompt(prompt, `${SECTION_DISPLAY.leader.questionFallbackPrefix} ${index + 1}`),
    type: 'scale5' as const,
    sectionKey: 'leader' as const,
    required: true
  }));

  const teamQuestions = campaign.content.teamQuestions.map((prompt, index) => ({
    key: `team_q${index + 1}`,
    prompt: normalizePrompt(prompt, `${SECTION_DISPLAY.team.questionFallbackPrefix} ${index + 1}`),
    type: 'scale5' as const,
    sectionKey: 'team' as const,
    required: true
  }));

  const organizationQuestions = campaign.content.organizationQuestions.map((prompt, index) => ({
    key: `organization_q${index + 1}`,
    prompt: normalizePrompt(
      prompt,
      `${SECTION_DISPLAY.organization.questionFallbackPrefix} ${index + 1}`
    ),
    type: 'scale5' as const,
    sectionKey: 'organization' as const,
    required: true
  }));

  return [
    {
      sectionKey: 'leader',
      introTitle: SECTION_DISPLAY.leader.introTitle,
      progressLabel: SECTION_DISPLAY.leader.progressLabel,
      description: normalizePrompt(
        campaign.content.leaderIntro,
        SECTION_DISPLAY.leader.introFallback
      ),
      questions: leaderQuestions
    },
    {
      sectionKey: 'team',
      introTitle: SECTION_DISPLAY.team.introTitle,
      progressLabel: SECTION_DISPLAY.team.progressLabel,
      description: normalizePrompt(campaign.content.teamIntro, SECTION_DISPLAY.team.introFallback),
      questions: teamQuestions
    },
    {
      sectionKey: 'organization',
      introTitle: SECTION_DISPLAY.organization.introTitle,
      progressLabel: SECTION_DISPLAY.organization.progressLabel,
      description: normalizePrompt(
        campaign.content.organizationIntro,
        SECTION_DISPLAY.organization.introFallback
      ),
      questions: organizationQuestions
    }
  ];
};

const buildPages = (campaign: SurveyCampaignExecutionContext): SurveyPage[] => {
  const sections = buildSectionDefinitions(campaign);
  const finalQuestions: [RunnerQuestion, RunnerQuestion] = [
    {
      key: 'final_nps',
      prompt: normalizePrompt(
        campaign.content.finalNpsQuestion,
        'Del 1 al 10, donde 1 es la nota más baja y 10 la más alta, ¿qué tan probable es que recomiendes a un amigo o alguien cercano trabajar en esta organización?'
      ),
      type: 'scale10',
      sectionKey: 'final',
      required: true
    },
    {
      key: 'final_open',
      prompt: normalizePrompt(
        campaign.content.finalOpenQuestion,
        'Queremos escucharte: ¿Qué podríamos hacer para mejorar tu experiencia como colaborador?'
      ),
      type: 'text',
      sectionKey: 'final',
      required: false
    }
  ];

  return [
    ...sections.flatMap((section) => [
      {
        kind: 'section-intro' as const,
        sectionKey: section.sectionKey,
        title: section.introTitle,
        description: section.description,
        progressLabel: section.progressLabel
      },
      {
        kind: 'section-questions' as const,
        sectionKey: section.sectionKey,
        helperText: section.description,
        progressLabel: section.progressLabel,
        questions: section.questions
      }
    ]),
    {
      kind: 'final-block',
      progressLabel: FINAL_BLOCK_PROGRESS_LABEL,
      introText: 'Este es el bloque final.',
      questions: finalQuestions
    },
    {
      kind: 'final-confirmation',
      progressLabel: 'Fin'
    }
  ];
};

const isQuestionAnswered = (
  question: RunnerQuestion,
  value: AnswerValue | undefined
): boolean => {
  if (value === undefined) {
    return false;
  }

  if (question.type === 'text') {
    return typeof value === 'string' && value.trim().length > 0;
  }

  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return false;
  }

  if (question.type === 'scale5') {
    return value >= 1 && value <= 5;
  }

  return value >= 1 && value <= 10;
};

const toAnswerPayload = (
  answers: Record<string, AnswerValue>,
  allQuestions: RunnerQuestion[],
  questionKeys?: string[]
): SurveyAnswerInput[] => {
  const byKey = new Map(allQuestions.map((question) => [question.key, question]));
  const keys = questionKeys ?? Object.keys(answers);
  const result: SurveyAnswerInput[] = [];

  keys.forEach((questionKey) => {
    const value = answers[questionKey];
    if (value === undefined) {
      return;
    }

    const question = byKey.get(questionKey);
    result.push({
      questionKey,
      sectionKey: question?.sectionKey ?? null,
      value
    });
  });

  return result;
};

const resolveRestoredPageIndex = (
  pages: SurveyPage[],
  allQuestions: RunnerQuestion[],
  answers: Record<string, AnswerValue>
): number => {
  const findPageIndex = (kind: SurveyPage['kind'], sectionKey?: SurveySectionKey) => {
    return pages.findIndex((page) => {
      if (page.kind !== kind) {
        return false;
      }

      if (!sectionKey) {
        return true;
      }

      if (page.kind === 'final-block' || page.kind === 'final-confirmation') {
        return sectionKey === 'final';
      }

      return page.sectionKey === sectionKey;
    });
  };

  const resolveSectionIndex = (sectionKey: IntroSectionKey) => {
    const sectionQuestions = allQuestions.filter((question) => question.sectionKey === sectionKey);
    const requiredQuestions = sectionQuestions.filter((question) => question.required);
    const requiredAnswered = requiredQuestions.filter((question) =>
      isQuestionAnswered(question, answers[question.key])
    );
    const hasSectionAnswer = sectionQuestions.some((question) =>
      isQuestionAnswered(question, answers[question.key])
    );

    if (requiredAnswered.length < requiredQuestions.length) {
      return findPageIndex(hasSectionAnswer ? 'section-questions' : 'section-intro', sectionKey);
    }

    return null;
  };

  const leaderIndex = resolveSectionIndex('leader');
  if (leaderIndex !== null && leaderIndex >= 0) {
    return leaderIndex;
  }

  const teamIndex = resolveSectionIndex('team');
  if (teamIndex !== null && teamIndex >= 0) {
    return teamIndex;
  }

  const organizationIndex = resolveSectionIndex('organization');
  if (organizationIndex !== null && organizationIndex >= 0) {
    return organizationIndex;
  }

  const finalIndex = findPageIndex('final-block', 'final');
  return finalIndex >= 0 ? finalIndex : 0;
};

export function RespondentSurveyRunner({
  branding,
  sessionToken,
  campaign,
  progressStorageKey,
  initialResponseStatus: _initialResponseStatus,
  onSubmitted,
  onFatalError,
  onExitToIntro
}: RespondentSurveyRunnerProps) {
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [autosaveError, setAutosaveError] = useState<string | null>(null);
  const [isAutosaving, setIsAutosaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  const autosaveTimerRef = useRef<number | null>(null);
  const autosaveInFlightRef = useRef(false);
  const pendingAutosaveRef = useRef(false);
  const dirtyQuestionKeysRef = useRef<Set<string>>(new Set());
  const isSubmittingRef = useRef(false);

  const pages = useMemo(() => buildPages(campaign), [campaign]);

  const allQuestions = useMemo(
    () =>
      pages.flatMap((page) => {
        if (page.kind === 'section-questions') {
          return page.questions;
        }

        if (page.kind === 'final-block') {
          return page.questions;
        }

        return [];
      }),
    [pages]
  );

  const currentPage = pages[currentPageIndex] ?? pages[0];
  const progressPercent = Math.round(((currentPageIndex + 1) / pages.length) * 100);
  const displayProgressPercent =
    currentPage.kind === 'section-intro' && currentPage.sectionKey === 'leader'
      ? 0
      : progressPercent;

  const autosaveStatusMessage = useMemo(() => {
    if (isAutosaving) {
      return 'Guardando respuestas...';
    }

    if (autosaveError) {
      return autosaveError;
    }

    if (lastSavedAt) {
      const dateValue = new Date(lastSavedAt);
      if (!Number.isNaN(dateValue.getTime())) {
        return `Guardado automático: ${new Intl.DateTimeFormat('es-BO', {
          dateStyle: 'short',
          timeStyle: 'short'
        }).format(dateValue)}`;
      }
    }

    return 'Tus respuestas se guardan automáticamente.';
  }, [autosaveError, isAutosaving, lastSavedAt]);

  const executeAutosave = useCallback(async () => {
    if (isSubmittingRef.current || isSubmitting) {
      return;
    }

    if (autosaveInFlightRef.current) {
      pendingAutosaveRef.current = true;
      return;
    }

    const queuedKeys = Array.from(dirtyQuestionKeysRef.current);
    if (queuedKeys.length === 0) {
      return;
    }

    dirtyQuestionKeysRef.current = new Set();
    const answersPayload = toAnswerPayload(answers, allQuestions, queuedKeys);
    if (answersPayload.length === 0) {
      return;
    }

    autosaveInFlightRef.current = true;
    setIsAutosaving(true);
    setAutosaveError(null);

    try {
      const result = await autosaveSurveyResponseClient({
        sessionToken,
        answers: answersPayload
      });

      setLastSavedAt(result.lastActivityAt);
    } catch (error) {
      dirtyQuestionKeysRef.current = new Set([
        ...queuedKeys,
        ...Array.from(dirtyQuestionKeysRef.current)
      ]);

      if (error instanceof ApiRequestError) {
        const technicalCode = parseRespondentTechnicalCode(
          typeof error.mensajeTecnico === 'string' ? error.mensajeTecnico : null
        );
        if (technicalCode && FATAL_RUNNER_CODES.has(technicalCode)) {
          if (progressStorageKey && isCompletedLockoutCode(technicalCode)) {
            clearSurveyProgressSnapshot(progressStorageKey);
          }
          onFatalError(error);
          return;
        }
      }

      setAutosaveError(
        'No pudimos guardar automáticamente. Tus respuestas siguen en pantalla, intenta continuar o enviar.'
      );
    } finally {
      autosaveInFlightRef.current = false;
      setIsAutosaving(false);

      if (pendingAutosaveRef.current) {
        pendingAutosaveRef.current = false;
        if (typeof window !== 'undefined') {
          autosaveTimerRef.current = window.setTimeout(() => {
            void executeAutosave();
          }, 500);
        }
      }
    }
  }, [answers, allQuestions, isSubmitting, onFatalError, progressStorageKey, sessionToken]);

  useEffect(() => {
    if (!progressStorageKey) {
      return;
    }

    const snapshot = loadSurveyProgressSnapshot(progressStorageKey);
    if (!snapshot) {
      return;
    }

    const answerKeys = Object.keys(snapshot.answers);
    if (answerKeys.length === 0) {
      return;
    }

    setAnswers(snapshot.answers);
    setLastSavedAt(snapshot.lastSavedAt);
    setCurrentPageIndex(resolveRestoredPageIndex(pages, allQuestions, snapshot.answers));
    dirtyQuestionKeysRef.current = new Set(answerKeys);
  }, [allQuestions, pages, progressStorageKey]);

  useEffect(() => {
    if (!progressStorageKey || Object.keys(answers).length === 0) {
      return;
    }

    saveSurveyProgressSnapshot(progressStorageKey, {
      lastSavedAt,
      currentPageIndex,
      answers
    });
  }, [answers, currentPageIndex, lastSavedAt, progressStorageKey]);

  useEffect(() => {
    if (typeof window === 'undefined' || Object.keys(answers).length === 0) {
      return;
    }

    if (autosaveTimerRef.current !== null) {
      window.clearTimeout(autosaveTimerRef.current);
    }

    autosaveTimerRef.current = window.setTimeout(() => {
      void executeAutosave();
    }, AUTOSAVE_DEBOUNCE_MS);

    return () => {
      if (autosaveTimerRef.current !== null) {
        window.clearTimeout(autosaveTimerRef.current);
        autosaveTimerRef.current = null;
      }
    };
  }, [answers, executeAutosave]);

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && autosaveTimerRef.current !== null) {
        window.clearTimeout(autosaveTimerRef.current);
        autosaveTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && dirtyQuestionKeysRef.current.size > 0) {
        void executeAutosave();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [executeAutosave]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      const hasPendingWork =
        dirtyQuestionKeysRef.current.size > 0 ||
        autosaveInFlightRef.current ||
        pendingAutosaveRef.current;

      if (!hasPendingWork) {
        return;
      }

      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  const scrollToTop = () => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const setAnswer = (questionKey: string, value: AnswerValue) => {
    if (answers[questionKey] === value) {
      return;
    }

    setAnswers((previous) => ({ ...previous, [questionKey]: value }));
    dirtyQuestionKeysRef.current.add(questionKey);
    setValidationError(null);
    setSubmitError(null);
  };

  const handleRetryAutosave = () => {
    if (isAutosaving || isSubmittingRef.current) {
      return;
    }

    if (dirtyQuestionKeysRef.current.size === 0 && Object.keys(answers).length > 0) {
      Object.keys(answers).forEach((key) => dirtyQuestionKeysRef.current.add(key));
    }

    void executeAutosave();
  };

  const validateCurrentPage = (): string | null => {
    if (currentPage.kind === 'section-intro') {
      return null;
    }

    if (currentPage.kind === 'final-confirmation') {
      return null;
    }

    const pageQuestions = currentPage.questions;
    const missing = pageQuestions.find(
      (question) => question.required && !isQuestionAnswered(question, answers[question.key])
    );

    return missing
      ? 'Por favor responde todas las preguntas obligatorias antes de continuar.'
      : null;
  };

  const handleNext = () => {
    const error = validateCurrentPage();
    if (error) {
      setValidationError(error);
      return;
    }

    setValidationError(null);
    setCurrentPageIndex((previous) => Math.min(previous + 1, pages.length - 1));
    scrollToTop();
  };

  const handlePrevious = () => {
    setValidationError(null);
    setSubmitError(null);

    if (currentPageIndex === 0) {
      onExitToIntro();
      scrollToTop();
      return;
    }

    setCurrentPageIndex((previous) => Math.max(previous - 1, 0));
    scrollToTop();
  };

  const handleSubmit = async () => {
    if (isSubmittingRef.current || isSubmitting) {
      return;
    }

    const error = validateCurrentPage();
    if (error) {
      setValidationError(error);
      return;
    }

    if (typeof window !== 'undefined' && autosaveTimerRef.current !== null) {
      window.clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = null;
    }
    pendingAutosaveRef.current = false;

    isSubmittingRef.current = true;
    setIsSubmitting(true);
    setSubmitError(null);
    setValidationError(null);

    try {
      const answersPayload = toAnswerPayload(answers, allQuestions);
      const result = await submitSurveyResponseClient({
        sessionToken,
        answers: answersPayload.length > 0 ? answersPayload : undefined
      });

      if (progressStorageKey) {
        clearSurveyProgressSnapshot(progressStorageKey);
      }

      onSubmitted(result);
    } catch (error) {
      if (error instanceof ApiRequestError && typeof error.mensajeTecnico === 'string') {
        const technicalCode = parseRespondentTechnicalCode(error.mensajeTecnico);
        if (technicalCode && FATAL_RUNNER_CODES.has(technicalCode)) {
          if (progressStorageKey && isCompletedLockoutCode(technicalCode)) {
            clearSurveyProgressSnapshot(progressStorageKey);
          }
          onFatalError(error);
          return;
        }
      }

      setSubmitError(extractErrorMessage(error));
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const commonProgressProps = {
    progressPercent: displayProgressPercent,
    currentStep: currentPageIndex + 1,
    totalSteps: pages.length
  };

  return (
    <SurveyFlowLayout branding={branding}>
      {currentPage.kind === 'section-intro' ? (
        <SurveySectionIntroScreen
          title={currentPage.title}
          description={currentPage.description}
          progressLabel={currentPage.progressLabel}
          isBusy={isSubmitting}
          onBack={handlePrevious}
          onNext={handleNext}
          {...commonProgressProps}
        />
      ) : null}

      {currentPage.kind === 'section-questions' ? (
        <SurveySectionQuestionsScreen
          helperText={currentPage.helperText}
          questions={currentPage.questions}
          answers={answers}
          validationError={validationError}
          autosaveMessage={autosaveStatusMessage}
          autosaveError={autosaveError}
          isBusy={isSubmitting}
          progressLabel={currentPage.progressLabel}
          onBack={handlePrevious}
          onNext={handleNext}
          onRetryAutosave={handleRetryAutosave}
          onAnswerChange={setAnswer}
          {...commonProgressProps}
        />
      ) : null}

      {currentPage.kind === 'final-block' ? (
        <SurveyFinalBlockScreen
          introText={currentPage.introText}
          npsPrompt={currentPage.questions[0].prompt}
          npsValue={
            typeof answers[currentPage.questions[0].key] === 'number'
              ? (answers[currentPage.questions[0].key] as number)
              : undefined
          }
          openPrompt={currentPage.questions[1].prompt}
          openValue={
            typeof answers[currentPage.questions[1].key] === 'string'
              ? (answers[currentPage.questions[1].key] as string)
              : ''
          }
          validationError={validationError}
          autosaveMessage={autosaveStatusMessage}
          autosaveError={autosaveError}
          isBusy={isSubmitting}
          progressLabel={currentPage.progressLabel}
          onBack={handlePrevious}
          onNext={handleNext}
          onRetryAutosave={handleRetryAutosave}
          onNpsChange={(value) => setAnswer(currentPage.questions[0].key, value)}
          onOpenChange={(value) => setAnswer(currentPage.questions[1].key, value)}
          {...commonProgressProps}
        />
      ) : null}

      {currentPage.kind === 'final-confirmation' ? (
        <SurveyFinalConfirmationScreen
          progressPercent={displayProgressPercent}
          progressLabel={currentPage.progressLabel}
          currentStep={currentPageIndex + 1}
          totalSteps={pages.length}
          isSubmitting={isSubmitting}
          submitError={submitError}
          onBack={handlePrevious}
          onSubmit={() => void handleSubmit()}
        />
      ) : null}
    </SurveyFlowLayout>
  );
}

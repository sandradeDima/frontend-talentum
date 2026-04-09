'use client';

import Link from 'next/link';
import { useMemo, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import {
  closeSurveyCampaignClient,
  configureSurveyRemindersClient,
  createSurveyCampaignClient,
  finalizeSurveyCampaignClient,
  scheduleSurveySendClient,
  updateSurveyCampaignClient
} from '@/services/survey.client';
import {
  deriveReminderScheduleHealth,
  reminderScheduleHealthPresentation
} from '@/lib/reminder-schedule-status';
import {
  buildSurveyDraftInput,
  SURVEY_TEMPLATE_KEY
} from '@/lib/survey-template';
import { isSurveyImportEnabled } from '@/lib/survey-operations';
import { extractErrorMessage } from '@/lib/auth-shared';
import { ApiRequestError } from '@/types/api';
import type {
  SurveyCampaignDetail,
  SurveyLifecycleState,
  SurveyCampaignStatus,
  SurveyCampaignUpsertInput
} from '@/types/survey';
import { SurveyParticipantImportModal } from './survey-participant-import-modal';
import { SurveyStatusBadge } from './survey-status-badge';

const dateFormatter = new Intl.DateTimeFormat('es-BO', {
  dateStyle: 'medium'
});

const dateTimeFormatter = new Intl.DateTimeFormat('es-BO', {
  dateStyle: 'medium',
  timeStyle: 'short'
});

const REMINDER_LIMIT = 20;

const lifecycleOrder: SurveyLifecycleState[] = [
  'DRAFT',
  'SCHEDULED',
  'ACTIVE',
  'CLOSED',
  'FINALIZED'
];

const lifecycleStateCopy: Record<
  SurveyLifecycleState,
  { label: string; description: string }
> = {
  DRAFT: {
    label: 'Borrador',
    description: 'Configura contenido y fechas antes de programar el envío inicial.'
  },
  SCHEDULED: {
    label: 'Programada',
    description: 'El envío inicial ya está programado y la encuesta espera su fecha de inicio.'
  },
  ACTIVE: {
    label: 'Activa',
    description: 'La encuesta está recibiendo respuestas y permite cierre manual.'
  },
  CLOSED: {
    label: 'Cerrada',
    description: 'La ventana de respuesta terminó. Revisa resultados y finaliza formalmente.'
  },
  FINALIZED: {
    label: 'Finalizada',
    description: 'Estado final operativo. No admite nuevas transiciones.'
  }
};

type ToastState = {
  kind: 'success' | 'error';
  message: string;
};

type SurveyEditorProps = {
  mode: 'create' | 'edit';
  companySlug: string;
  companyName: string;
  canManage: boolean;
  initialSurvey?: SurveyCampaignDetail;
};

type ReminderRow = {
  id: string;
  scheduledAt: string;
};

const toDateInputValue = (isoDate: string): string => {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const toDateTimeLocalValue = (isoDate: string): string => {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  const hour = `${date.getHours()}`.padStart(2, '0');
  const minute = `${date.getMinutes()}`.padStart(2, '0');

  return `${year}-${month}-${day}T${hour}:${minute}`;
};

const formatOptionalDateTime = (value: string | null): string => {
  if (!value) {
    return 'Sin registro';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return 'Sin registro';
  }

  return dateTimeFormatter.format(parsed);
};

const calculateEnabledDaysFromInputs = (
  startDate: string,
  endDate: string
): number | null => {
  if (!startDate || !endDate) {
    return null;
  }

  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return null;
  }

  const diff = end.getTime() - start.getTime();
  if (diff < 0) {
    return null;
  }

  return Math.floor(diff / (24 * 60 * 60 * 1000)) + 1;
};

const toEditorInputFromSurvey = (
  survey: SurveyCampaignDetail
): SurveyCampaignUpsertInput => ({
  templateKey: survey.templateKey,
  name: survey.name,
  startDate: toDateInputValue(survey.startDate),
  endDate: toDateInputValue(survey.endDate),
  introGeneral: survey.content.introGeneral,
  leaderIntro: survey.content.leaderIntro,
  leaderQuestions: [...survey.content.leaderQuestions],
  leaderExtraQuestion: survey.content.leaderExtraQuestion,
  teamIntro: survey.content.teamIntro,
  teamQuestions: [...survey.content.teamQuestions],
  teamExtraQuestion: survey.content.teamExtraQuestion,
  organizationIntro: survey.content.organizationIntro,
  organizationQuestions: [...survey.content.organizationQuestions],
  organizationExtraQuestion: survey.content.organizationExtraQuestion,
  finalNpsQuestion: survey.content.finalNpsQuestion,
  finalOpenQuestion: survey.content.finalOpenQuestion,
  closingText: survey.content.closingText,
  tutorialVideoUrl: survey.tutorialVideoUrl
});

const normalizeOptionalValue = (value: string | null | undefined): string | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const makeReminderRows = (survey: SurveyCampaignDetail | null): ReminderRow[] => {
  if (!survey || survey.reminders.length === 0) {
    return [{ id: crypto.randomUUID(), scheduledAt: '' }];
  }

  return survey.reminders.map((reminder) => ({
    id: reminder.id,
    scheduledAt: toDateTimeLocalValue(reminder.scheduledAt)
  }));
};

const getApiErrorMessage = (error: unknown): string => {
  if (error instanceof ApiRequestError) {
    switch (error.mensajeTecnico) {
      case 'SURVEY_EXTRA_QUESTIONS_LOCKED':
        return 'Las preguntas opcionales ya no pueden editarse para esta encuesta.';
      case 'SURVEY_EDIT_WINDOW_CLOSED':
        return 'La encuesta ya inició y no admite cambios de configuración.';
      case 'SURVEY_REMINDERS_LOCKED':
        return 'Los recordatorios ya fueron confirmados y quedaron bloqueados.';
      case 'SURVEY_INITIAL_SEND_REQUIRED':
        return 'Debes programar el envío inicial antes de configurar recordatorios.';
      case 'INVALID_SURVEY_SEND_SCHEDULE':
        return 'La fecha u hora del envío inicial no es válida.';
      case 'SURVEY_SEND_MUST_BE_FUTURE':
        return 'El envío inicial debe programarse en una fecha y hora futura.';
      case 'SURVEY_SEND_AFTER_START':
        return 'El envío inicial debe ocurrir antes del inicio de la encuesta.';
      case 'SURVEY_INITIAL_SEND_OUTSIDE_WINDOW':
        return 'La fecha del envío inicial quedó fuera de la ventana permitida.';
      case 'REMINDER_BEFORE_SURVEY_WINDOW':
      case 'REMINDER_AFTER_SURVEY_WINDOW':
        return 'Cada recordatorio debe quedar dentro del periodo activo de la encuesta.';
      case 'REMINDER_MUST_BE_FUTURE':
        return 'Los recordatorios deben programarse en fechas futuras.';
      case 'SURVEY_CLOSE_REQUIRES_ACTIVE':
        return 'Solo puedes cerrar la encuesta cuando esté activa.';
      case 'SURVEY_FINALIZE_REQUIRES_CLOSED':
        return 'Debes cerrar la encuesta antes de finalizarla.';
      case 'SURVEY_ALREADY_FINALIZED':
        return 'La encuesta ya se encuentra finalizada.';
      default:
        return error.message;
    }
  }

  return extractErrorMessage(error);
};

const sanitizePayload = (input: SurveyCampaignUpsertInput): SurveyCampaignUpsertInput => ({
  ...input,
  name: input.name.trim(),
  introGeneral: input.introGeneral.trim(),
  leaderIntro: input.leaderIntro.trim(),
  leaderQuestions: input.leaderQuestions.map((question) => question.trim()),
  leaderExtraQuestion: normalizeOptionalValue(input.leaderExtraQuestion),
  teamIntro: input.teamIntro.trim(),
  teamQuestions: input.teamQuestions.map((question) => question.trim()),
  teamExtraQuestion: normalizeOptionalValue(input.teamExtraQuestion),
  organizationIntro: input.organizationIntro.trim(),
  organizationQuestions: input.organizationQuestions.map((question) => question.trim()),
  organizationExtraQuestion: normalizeOptionalValue(input.organizationExtraQuestion),
  finalNpsQuestion: input.finalNpsQuestion.trim(),
  finalOpenQuestion: input.finalOpenQuestion.trim(),
  closingText: input.closingText.trim(),
  tutorialVideoUrl: normalizeOptionalValue(input.tutorialVideoUrl)
});

const Modal = ({ children }: { children: ReactNode }) => {
  return (
    <div className="admin-modal-overlay">
      <div className="admin-modal-shell admin-modal-shell-sm">
        {children}
      </div>
    </div>
  );
};

export function SurveyEditor({
  mode,
  companySlug,
  companyName,
  canManage,
  initialSurvey
}: SurveyEditorProps) {
  const router = useRouter();

  const [survey, setSurvey] = useState<SurveyCampaignDetail | null>(initialSurvey ?? null);
  const [formState, setFormState] = useState<SurveyCampaignUpsertInput>(
    initialSurvey ? toEditorInputFromSurvey(initialSurvey) : buildSurveyDraftInput()
  );
  const [toast, setToast] = useState<ToastState | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleDateTime, setScheduleDateTime] = useState('');
  const [isScheduling, setIsScheduling] = useState(false);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [reminderRows, setReminderRows] = useState<ReminderRow[]>(
    makeReminderRows(initialSurvey ?? null)
  );
  const [isSavingReminders, setIsSavingReminders] = useState(false);
  const [isParticipantImportModalOpen, setIsParticipantImportModalOpen] = useState(false);
  const [isClosingSurvey, setIsClosingSurvey] = useState(false);
  const [isFinalizingSurvey, setIsFinalizingSurvey] = useState(false);
  const [isActivatingNow, setIsActivatingNow] = useState(false);

  const totalEnabledDays = useMemo(
    () => calculateEnabledDaysFromInputs(formState.startDate, formState.endDate),
    [formState.startDate, formState.endDate]
  );

  const creationDateLabel = useMemo(() => {
    const source = survey?.createdAt ?? new Date().toISOString();
    return dateFormatter.format(new Date(source));
  }, [survey?.createdAt]);

  const surveyStatus: SurveyCampaignStatus | null = survey?.status ?? null;
  const lifecycleState = survey?.lifecycle.state ?? null;
  const isEditLockedByStatus =
    surveyStatus === 'EN_PROCESO' || surveyStatus === 'FINALIZADA';
  const hasReachedStartWindow = survey
    ? Date.now() >= new Date(survey.startDate).getTime()
    : false;
  const hasSurveyEnded = survey ? Date.now() > new Date(survey.endDate).getTime() : false;
  const isEditLocked = isEditLockedByStatus || hasReachedStartWindow;
  const canEdit = canManage && !isEditLocked;
  const canEditExtraQuestions = canEdit && (mode === 'create' || surveyStatus === 'BORRADOR');
  const hasLockedReminders = Boolean(survey?.remindersLockedAt);
  const canImportParticipants = Boolean(
    mode === 'edit' &&
      survey &&
      canManage &&
      isSurveyImportEnabled(survey.status) &&
      !hasSurveyEnded
  );
  const canCloseSurveyNow = Boolean(
    mode === 'edit' &&
      survey &&
      canManage &&
      survey.lifecycle.canCloseNow &&
      !isClosingSurvey &&
      !isFinalizingSurvey
  );
  const canFinalizeSurvey = Boolean(
    mode === 'edit' &&
      survey &&
      canManage &&
      survey.lifecycle.canFinalize &&
      !isClosingSurvey &&
      !isFinalizingSurvey
  );
  const canActivateNow = Boolean(
    mode === 'edit' &&
      survey &&
      canManage &&
      hasReachedStartWindow &&
      !hasSurveyEnded &&
      survey.lifecycle.canScheduleInitialSend &&
      !isActivatingNow
  );
  const currentLifecycleIndex = lifecycleState
    ? lifecycleOrder.indexOf(lifecycleState)
    : -1;

  const showToast = (kind: ToastState['kind'], message: string) => {
    setToast({ kind, message });
    setTimeout(() => {
      setToast((previous) => (previous?.message === message ? null : previous));
    }, 4200);
  };

  const setField = <K extends keyof SurveyCampaignUpsertInput>(
    key: K,
    value: SurveyCampaignUpsertInput[K]
  ) => {
    setFormState((previous) => ({
      ...previous,
      [key]: value
    }));
  };

  const setQuestionAtIndex = (
    section: 'leaderQuestions' | 'teamQuestions' | 'organizationQuestions',
    index: number,
    value: string
  ) => {
    setFormState((previous) => ({
      ...previous,
      [section]: previous[section].map((question, questionIndex) =>
        questionIndex === index ? value : question
      )
    }));
  };

  const validateForm = (): string | null => {
    if (!formState.templateKey) {
      return 'Debes seleccionar un modelo de encuesta.';
    }

    if (formState.name.trim().length < 2) {
      return 'El nombre de la encuesta debe tener al menos 2 caracteres.';
    }

    if (!formState.startDate || !formState.endDate) {
      return 'Debes seleccionar fecha inicial y fecha de fin.';
    }

    if (totalEnabledDays === null || totalEnabledDays <= 0) {
      return 'La fecha de fin debe ser igual o posterior a la fecha inicial.';
    }

    const sections = [
      formState.leaderQuestions,
      formState.teamQuestions,
      formState.organizationQuestions
    ];

    if (sections.some((questions) => questions.some((question) => question.trim().length === 0))) {
      return 'Todas las preguntas base deben tener contenido.';
    }

    const textFields = [
      formState.introGeneral,
      formState.leaderIntro,
      formState.teamIntro,
      formState.organizationIntro,
      formState.finalNpsQuestion,
      formState.finalOpenQuestion,
      formState.closingText
    ];

    if (textFields.some((value) => value.trim().length === 0)) {
      return 'Todos los campos de texto obligatorios deben completarse.';
    }

    return null;
  };

  const handleSave = async () => {
    if (!canEdit) {
      return;
    }

    const validationError = validateForm();
    if (validationError) {
      setFormError(validationError);
      showToast('error', validationError);
      return;
    }

    setFormError(null);
    setIsSaving(true);

    const payload = sanitizePayload(formState);

    try {
      if (mode === 'create') {
        const created = await createSurveyCampaignClient(companySlug, payload);
        showToast('success', 'Encuesta creada en estado BORRADOR.');
        router.replace(
          `/admin/companies/${companySlug}/surveys/${created.slug}?success=created`
        );
        router.refresh();
        return;
      }

      if (!survey) {
        throw new Error('No se encontró la encuesta para actualizar.');
      }

      const updated = await updateSurveyCampaignClient(companySlug, survey.slug, payload);
      setSurvey(updated);
      setFormState(toEditorInputFromSurvey(updated));
      showToast('success', 'Encuesta actualizada correctamente.');
      router.refresh();
    } catch (error) {
      const message = getApiErrorMessage(error);
      setFormError(message);
      showToast('error', message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscardChanges = () => {
    setFormError(null);

    if (survey) {
      setFormState(toEditorInputFromSurvey(survey));
      showToast('success', 'Cambios descartados.');
      return;
    }

    setFormState(buildSurveyDraftInput());
    showToast('success', 'Formulario reiniciado.');
  };

  const openScheduleModal = () => {
    if (!survey) {
      return;
    }

    setScheduleDateTime(
      survey.initialSendScheduledAt
        ? toDateTimeLocalValue(survey.initialSendScheduledAt)
        : ''
    );
    setIsScheduleModalOpen(true);
  };

  const handleScheduleSend = async () => {
    if (!survey) {
      return;
    }

    if (!scheduleDateTime) {
      showToast('error', 'Debes elegir fecha y hora para programar el envío inicial.');
      return;
    }

    setIsScheduling(true);
    try {
      const updated = await scheduleSurveySendClient(companySlug, survey.slug, {
        scheduledAt: scheduleDateTime
      });

      setSurvey(updated);
      setFormState(toEditorInputFromSurvey(updated));
      setIsScheduleModalOpen(false);
      showToast('success', 'Envío inicial programado.');
      router.refresh();
    } catch (error) {
      showToast('error', getApiErrorMessage(error));
    } finally {
      setIsScheduling(false);
    }
  };

  const handleActivateNow = async () => {
    if (!survey || !canActivateNow) {
      return;
    }

    setIsActivatingNow(true);
    try {
      // startDate is already in the past; backend will use it as scheduledAt for retroactive activation
      const updated = await scheduleSurveySendClient(companySlug, survey.slug, {
        scheduledAt: survey.startDate
      });

      setSurvey(updated);
      setFormState(toEditorInputFromSurvey(updated));
      showToast('success', 'Encuesta activada correctamente.');
      router.refresh();
    } catch (error) {
      showToast('error', getApiErrorMessage(error));
    } finally {
      setIsActivatingNow(false);
    }
  };

  const openReminderModal = () => {
    setReminderRows(makeReminderRows(survey));
    setIsReminderModalOpen(true);
  };

  const openParticipantImportModal = () => {
    if (!canImportParticipants) {
      return;
    }

    setIsParticipantImportModalOpen(true);
  };

  const setReminderValue = (id: string, value: string) => {
    setReminderRows((previous) =>
      previous.map((row) => (row.id === id ? { ...row, scheduledAt: value } : row))
    );
  };

  const addReminderRow = () => {
    if (reminderRows.length >= REMINDER_LIMIT) {
      return;
    }

    setReminderRows((previous) => [
      ...previous,
      { id: crypto.randomUUID(), scheduledAt: '' }
    ]);
  };

  const removeReminderRow = (id: string) => {
    setReminderRows((previous) => {
      if (previous.length === 1) {
        return previous;
      }

      return previous.filter((row) => row.id !== id);
    });
  };

  const handleConfirmReminders = async () => {
    if (!survey) {
      return;
    }

    const reminderPayload = reminderRows
      .map((row) => row.scheduledAt.trim())
      .filter((value) => value.length > 0)
      .map((scheduledAt) => ({ scheduledAt }));

    if (reminderPayload.length === 0) {
      showToast('error', 'Debes cargar al menos un recordatorio antes de confirmar.');
      return;
    }

    setIsSavingReminders(true);

    try {
      const updated = await configureSurveyRemindersClient(companySlug, survey.slug, {
        reminders: reminderPayload
      });

      setSurvey(updated);
      setFormState(toEditorInputFromSurvey(updated));
      setReminderRows(makeReminderRows(updated));
      setIsReminderModalOpen(false);
      showToast('success', 'Recordatorios programados y bloqueados.');
      router.refresh();
    } catch (error) {
      showToast('error', getApiErrorMessage(error));
    } finally {
      setIsSavingReminders(false);
    }
  };

  const handleCloseSurveyNow = async () => {
    if (!survey || !canManage || !survey.lifecycle.canCloseNow || isClosingSurvey) {
      return;
    }

    const confirmed = window.confirm(
      'Cerrar la encuesta finalizará inmediatamente la ventana de respuestas. ¿Deseas continuar?'
    );

    if (!confirmed) {
      return;
    }

    setIsClosingSurvey(true);

    try {
      const updated = await closeSurveyCampaignClient(companySlug, survey.slug);
      setSurvey(updated);
      setFormState(toEditorInputFromSurvey(updated));
      showToast('success', 'Encuesta cerrada correctamente.');
      router.refresh();
    } catch (error) {
      showToast('error', getApiErrorMessage(error));
    } finally {
      setIsClosingSurvey(false);
    }
  };

  const handleFinalizeSurvey = async () => {
    if (!survey || !canManage || !survey.lifecycle.canFinalize || isFinalizingSurvey) {
      return;
    }

    const confirmed = window.confirm(
      'Finalizar dejará la encuesta en estado terminal. Esta acción no se puede deshacer. ¿Continuar?'
    );

    if (!confirmed) {
      return;
    }

    setIsFinalizingSurvey(true);

    try {
      const updated = await finalizeSurveyCampaignClient(companySlug, survey.slug);
      setSurvey(updated);
      setFormState(toEditorInputFromSurvey(updated));
      showToast('success', 'Encuesta finalizada.');
      router.refresh();
    } catch (error) {
      showToast('error', getApiErrorMessage(error));
    } finally {
      setIsFinalizingSurvey(false);
    }
  };

  return (
    <section className="space-y-4">
      {toast ? (
        <div
          role="status"
          aria-live="polite"
          className={`fixed right-4 top-4 z-50 max-w-sm rounded-lg px-3 py-2 text-sm font-medium shadow-lg ${
            toast.kind === 'success'
              ? 'border border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border border-rose-200 bg-rose-50 text-rose-800'
          }`}
        >
          {toast.message}
        </div>
      ) : null}

      <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-ink">
              {mode === 'create' ? 'Crear encuesta' : `Editar encuesta: ${formState.name}`}
            </h1>
            <p className="text-sm text-slate-600">Empresa: {companyName}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {mode === 'edit' && survey ? (
              <Link
                href={`/admin/companies/${companySlug}/surveys/${survey.slug}/operations`}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Ver operaciones
              </Link>
            ) : null}
            {surveyStatus ? (
              <SurveyStatusBadge
                status={surveyStatus}
                lifecycleState={survey?.lifecycle.state}
              />
            ) : null}
          </div>
        </div>

        {survey ? (
          <div className="mt-4 space-y-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
            <p>
              <span className="font-medium">Link genérico de encuesta:</span>{' '}
              <a
                href={survey.genericLinkPath}
                target="_blank"
                rel="noreferrer"
                className="text-brand hover:text-brandDark"
              >
                {survey.genericLinkPath}
              </a>
            </p>
            <p>
              <span className="font-medium">Envío inicial:</span>{' '}
              {survey.initialSendScheduledAt
                ? dateTimeFormatter.format(new Date(survey.initialSendScheduledAt))
                : 'Sin programar'}
            </p>
            <p>
              <span className="font-medium">Recordatorios:</span>{' '}
              {hasLockedReminders ? 'Configuración confirmada (bloqueada)' : 'Sin confirmar'}
            </p>
          </div>
        ) : null}
      </header>

      {!canManage ? (
        <p className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Solo ADMIN puede crear, editar y programar encuestas en esta etapa.
        </p>
      ) : null}

      {isEditLocked ? (
        <p className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          La fecha de inicio ya fue alcanzada o la encuesta está finalizada. La configuración quedó en modo solo lectura.
        </p>
      ) : null}

      {mode === 'edit' && survey && lifecycleState ? (
        <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-ink">Ciclo de vida de la encuesta</h2>
              <p className="text-sm text-slate-600">
                {lifecycleStateCopy[lifecycleState].description}
              </p>
            </div>
            <SurveyStatusBadge
              status={survey.status}
              lifecycleState={survey.lifecycle.state}
            />
          </div>

          <div className="grid gap-2 md:grid-cols-5">
            {lifecycleOrder.map((state, index) => {
              const isCurrent = state === lifecycleState;
              const isCompleted = currentLifecycleIndex > index;
              const textClass = isCurrent
                ? 'border-brand bg-blue-50 text-blue-800'
                : isCompleted
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                  : 'border-slate-200 bg-white text-slate-600';

              return (
                <div
                  key={state}
                  className={`rounded-lg border px-3 py-2 text-xs ${textClass}`}
                >
                  <p className="font-semibold">{lifecycleStateCopy[state].label}</p>
                  <p className="mt-0.5 text-[11px] opacity-80">
                    {isCurrent ? 'Actual' : isCompleted ? 'Completada' : 'Pendiente'}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <label htmlFor="survey-template" className="text-sm font-medium text-slate-700">
              Seleccionar encuesta
            </label>
            <select
              id="survey-template"
              value={formState.templateKey}
              onChange={(event) =>
                setField('templateKey', event.target.value as typeof SURVEY_TEMPLATE_KEY)
              }
              disabled={!canEdit || mode === 'edit'}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-brand transition focus:ring-2 disabled:bg-slate-100"
            >
              <option value={SURVEY_TEMPLATE_KEY}>Encuesta Base de Clima y Cultura (v1)</option>
            </select>
          </div>

          <div className="space-y-1">
            <label htmlFor="survey-name" className="text-sm font-medium text-slate-700">
              Nombre
            </label>
            <input
              id="survey-name"
              value={formState.name}
              onChange={(event) => setField('name', event.target.value)}
              disabled={!canEdit}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-brand transition focus:ring-2 disabled:bg-slate-100"
              placeholder="Encuesta Clima 2026"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Fecha de creación</label>
            <input
              readOnly
              value={creationDateLabel}
              className="w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-700"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="start-date" className="text-sm font-medium text-slate-700">
              Fecha inicial
            </label>
            <input
              id="start-date"
              type="date"
              value={formState.startDate}
              onChange={(event) => setField('startDate', event.target.value)}
              disabled={!canEdit}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-brand transition focus:ring-2 disabled:bg-slate-100"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="end-date" className="text-sm font-medium text-slate-700">
              Fecha de fin
            </label>
            <input
              id="end-date"
              type="date"
              value={formState.endDate}
              onChange={(event) => setField('endDate', event.target.value)}
              disabled={!canEdit}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-brand transition focus:ring-2 disabled:bg-slate-100"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Total de días habilitados</label>
            <input
              readOnly
              value={totalEnabledDays ?? 'Completa fechas válidas'}
              className="w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-700"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">Introducción general</label>
          <textarea
            rows={5}
            value={formState.introGeneral}
            onChange={(event) => setField('introGeneral', event.target.value)}
            disabled={!canEdit}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-brand transition focus:ring-2 disabled:bg-slate-100"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">
            URL del video tutorial
          </label>
          <input
            type="url"
            value={formState.tutorialVideoUrl ?? ''}
            onChange={(event) => setField('tutorialVideoUrl', event.target.value)}
            disabled={!canEdit}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-brand transition focus:ring-2 disabled:bg-slate-100"
            placeholder="https://cdn.ejemplo.com/tutorial.mp4"
          />
          <p className="text-xs text-slate-500">
            Configura una URL directa del video tutorial del respondente. Este campo queda listo
            para conectarse a una subida de video dedicada cuando se habilite ese endpoint.
          </p>
        </div>
      </div>

      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-ink">Sección Líderes</h2>

        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">
            Introducción sección Líderes
          </label>
          <textarea
            rows={4}
            value={formState.leaderIntro}
            onChange={(event) => setField('leaderIntro', event.target.value)}
            disabled={!canEdit}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-brand transition focus:ring-2 disabled:bg-slate-100"
          />
        </div>

        <div className="grid gap-3">
          {formState.leaderQuestions.map((question, index) => (
            <div key={`leader-question-${index}`} className="space-y-1">
              <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Pregunta base {index + 1}
              </label>
              <textarea
                rows={2}
                value={question}
                onChange={(event) =>
                  setQuestionAtIndex('leaderQuestions', index, event.target.value)
                }
                disabled={!canEdit}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-brand transition focus:ring-2 disabled:bg-slate-100"
              />
            </div>
          ))}
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">
            Pregunta opcional adicional (Líderes)
          </label>
          <textarea
            rows={2}
            value={formState.leaderExtraQuestion ?? ''}
            onChange={(event) => setField('leaderExtraQuestion', event.target.value)}
            disabled={!canEditExtraQuestions}
            placeholder="Opcional"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-brand transition focus:ring-2 disabled:bg-slate-100"
          />
          {!canEditExtraQuestions ? (
            <p className="text-xs text-amber-700">
              Las preguntas opcionales se bloquean después de salir de BORRADOR.
            </p>
          ) : null}
        </div>
      </div>

      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-ink">Sección Equipo</h2>

        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">Introducción sección Equipo</label>
          <textarea
            rows={4}
            value={formState.teamIntro}
            onChange={(event) => setField('teamIntro', event.target.value)}
            disabled={!canEdit}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-brand transition focus:ring-2 disabled:bg-slate-100"
          />
        </div>

        <div className="grid gap-3">
          {formState.teamQuestions.map((question, index) => (
            <div key={`team-question-${index}`} className="space-y-1">
              <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Pregunta base {index + 1}
              </label>
              <textarea
                rows={2}
                value={question}
                onChange={(event) => setQuestionAtIndex('teamQuestions', index, event.target.value)}
                disabled={!canEdit}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-brand transition focus:ring-2 disabled:bg-slate-100"
              />
            </div>
          ))}
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">Pregunta opcional adicional (Equipo)</label>
          <textarea
            rows={2}
            value={formState.teamExtraQuestion ?? ''}
            onChange={(event) => setField('teamExtraQuestion', event.target.value)}
            disabled={!canEditExtraQuestions}
            placeholder="Opcional"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-brand transition focus:ring-2 disabled:bg-slate-100"
          />
        </div>
      </div>

      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-ink">Sección Organización</h2>

        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">
            Introducción sección Organización
          </label>
          <textarea
            rows={4}
            value={formState.organizationIntro}
            onChange={(event) => setField('organizationIntro', event.target.value)}
            disabled={!canEdit}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-brand transition focus:ring-2 disabled:bg-slate-100"
          />
        </div>

        <div className="grid gap-3">
          {formState.organizationQuestions.map((question, index) => (
            <div key={`organization-question-${index}`} className="space-y-1">
              <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Pregunta base {index + 1}
              </label>
              <textarea
                rows={2}
                value={question}
                onChange={(event) =>
                  setQuestionAtIndex('organizationQuestions', index, event.target.value)
                }
                disabled={!canEdit}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-brand transition focus:ring-2 disabled:bg-slate-100"
              />
            </div>
          ))}
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">
            Pregunta opcional adicional (Organización)
          </label>
          <textarea
            rows={2}
            value={formState.organizationExtraQuestion ?? ''}
            onChange={(event) => setField('organizationExtraQuestion', event.target.value)}
            disabled={!canEditExtraQuestions}
            placeholder="Opcional"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-brand transition focus:ring-2 disabled:bg-slate-100"
          />
        </div>
      </div>

      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-ink">Bloque final</h2>

        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">Pregunta final 1 (1 a 10)</label>
          <textarea
            rows={3}
            value={formState.finalNpsQuestion}
            onChange={(event) => setField('finalNpsQuestion', event.target.value)}
            disabled={!canEdit}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-brand transition focus:ring-2 disabled:bg-slate-100"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">Pregunta final abierta</label>
          <textarea
            rows={3}
            value={formState.finalOpenQuestion}
            onChange={(event) => setField('finalOpenQuestion', event.target.value)}
            disabled={!canEdit}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-brand transition focus:ring-2 disabled:bg-slate-100"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">Cierre</label>
          <textarea
            rows={3}
            value={formState.closingText}
            onChange={(event) => setField('closingText', event.target.value)}
            disabled={!canEdit}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-brand transition focus:ring-2 disabled:bg-slate-100"
          />
        </div>
      </div>

      {formError ? (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {formError}
        </p>
      ) : null}

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          {canManage ? (
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || !canEdit}
              className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition hover:bg-brandDark disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSaving
                ? 'Guardando...'
                : mode === 'create'
                  ? 'Crear Encuesta'
                  : 'Guardar'}
            </button>
          ) : null}

          {canManage ? (
            <button
              type="button"
              onClick={handleDiscardChanges}
              disabled={isSaving}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
            >
              Descartar cambios
            </button>
          ) : null}

          <Link
            href={`/admin/companies/${companySlug}/surveys`}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Volver a menú principal
          </Link>
        </div>

        {mode === 'edit' && survey && canManage ? (
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={openParticipantImportModal}
              disabled={!canImportParticipants}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
            >
              Importar participantes
            </button>

            <button
              type="button"
              onClick={openScheduleModal}
              disabled={isEditLocked}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
            >
              Programar envíos
            </button>

            {canActivateNow ? (
              <button
                type="button"
                onClick={handleActivateNow}
                disabled={isActivatingNow}
                className="rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isActivatingNow ? 'Activando...' : 'Activar encuesta ahora'}
              </button>
            ) : null}

            <button
              type="button"
              onClick={openReminderModal}
              disabled={
                isEditLocked ||
                hasLockedReminders ||
                !survey.initialSendScheduledAt
              }
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
            >
              Programar recordatorios
            </button>

            <button
              type="button"
              onClick={handleCloseSurveyNow}
              disabled={!canCloseSurveyNow}
              className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-800 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isClosingSurvey ? 'Cerrando encuesta...' : 'Cerrar encuesta ahora'}
            </button>

            <button
              type="button"
              onClick={handleFinalizeSurvey}
              disabled={!canFinalizeSurvey}
              className="rounded-lg border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-800 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isFinalizingSurvey ? 'Finalizando encuesta...' : 'Finalizar encuesta'}
            </button>
          </div>
        ) : null}

        {mode === 'edit' && survey && !survey.initialSendScheduledAt && canManage ? (
          <p className="mt-3 text-xs text-slate-500">
            Debes programar envíos antes de confirmar recordatorios.
          </p>
        ) : null}

        {mode === 'edit' &&
        survey &&
        canManage &&
        !canImportParticipants &&
        survey.status === 'BORRADOR' ? (
          <p className="mt-3 text-xs text-slate-500">
            Para importar participantes, primero debes salir del estado BORRADOR y programar el
            envío inicial.
          </p>
        ) : null}

        {mode === 'edit' &&
        survey &&
        canManage &&
        !canImportParticipants &&
        hasSurveyEnded ? (
          <p className="mt-3 text-xs text-slate-500">
            La ventana de la encuesta ya terminó. La importación de participantes quedó bloqueada.
          </p>
        ) : null}

        {mode === 'edit' && hasLockedReminders ? (
          <p className="mt-3 text-xs text-amber-700">
            Los recordatorios ya fueron confirmados y el botón quedó deshabilitado.
          </p>
        ) : null}

        {mode === 'edit' &&
        survey &&
        canManage &&
        survey.lifecycle.state === 'SCHEDULED' ? (
          <p className="mt-3 text-xs text-slate-500">
            El cierre manual se habilita cuando la encuesta entre en estado activa.
          </p>
        ) : null}

        {mode === 'edit' &&
        survey &&
        canManage &&
        survey.lifecycle.state === 'CLOSED' ? (
          <p className="mt-3 text-xs text-slate-500">
            La encuesta ya está cerrada. Puedes finalizarla para dejarla en estado terminal.
          </p>
        ) : null}
      </div>

      {mode === 'edit' && survey && survey.reminderSchedules.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <header className="border-b border-slate-200 bg-slate-50 px-4 py-3">
            <h3 className="text-sm font-semibold text-ink">Estado de recordatorios</h3>
            <p className="mt-1 text-xs text-slate-600">
              Monitorea cada ejecución para identificar pendientes, enviados y fallos.
            </p>
          </header>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-semibold">Programado</th>
                  <th className="px-4 py-3 font-semibold">Estado</th>
                  <th className="px-4 py-3 font-semibold">Pendientes</th>
                  <th className="px-4 py-3 font-semibold">Enviados</th>
                  <th className="px-4 py-3 font-semibold">Fallidos</th>
                  <th className="px-4 py-3 font-semibold">Omitidos</th>
                  <th className="px-4 py-3 font-semibold">Total</th>
                  <th className="px-4 py-3 font-semibold">Intentos</th>
                  <th className="px-4 py-3 font-semibold">Último intento</th>
                  <th className="px-4 py-3 font-semibold">Próximo reintento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {survey.reminderSchedules.map((schedule) => {
                  const health = deriveReminderScheduleHealth({
                    status: schedule.status,
                    dispatchSummary: schedule.dispatchSummary
                  });
                  const statusConfig = reminderScheduleHealthPresentation[health];

                  return (
                    <tr key={schedule.id} className="align-top">
                      <td className="px-4 py-3 text-slate-700">
                        {dateTimeFormatter.format(new Date(schedule.scheduledAt))}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${statusConfig.className}`}
                        >
                          {statusConfig.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {schedule.dispatchSummary.pending}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {schedule.dispatchSummary.sent}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {schedule.dispatchSummary.failed}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {schedule.dispatchSummary.skipped}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {schedule.dispatchSummary.total}
                      </td>
                      <td className="px-4 py-3 text-slate-700">{schedule.attemptCount}</td>
                      <td className="px-4 py-3 text-slate-700">
                        {formatOptionalDateTime(schedule.lastAttemptAt)}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {formatOptionalDateTime(schedule.nextRetryAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {isScheduleModalOpen ? (
        <Modal>
          <h3 className="text-lg font-semibold text-ink">Programar envíos</h3>
          <p className="mt-1 text-sm text-slate-600">
            Define la fecha y hora del envío inicial de invitaciones.
          </p>

          <div className="mt-4 space-y-1">
            <label className="text-sm font-medium text-slate-700">Fecha y hora</label>
            <input
              type="datetime-local"
              value={scheduleDateTime}
              onChange={(event) => setScheduleDateTime(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-brand transition focus:ring-2"
            />
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleScheduleSend}
              disabled={isScheduling}
              className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition hover:bg-brandDark disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isScheduling ? 'Programando...' : 'Programar'}
            </button>
            <button
              type="button"
              onClick={() => setIsScheduleModalOpen(false)}
              disabled={isScheduling}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Volver a revisar
            </button>
          </div>
        </Modal>
      ) : null}

      {isReminderModalOpen ? (
        <Modal>
          <h3 className="text-lg font-semibold text-ink">Programar recordatorios</h3>
          <p className="mt-1 text-sm text-slate-600">
            Configura múltiples recordatorios para quienes no iniciaron o no terminaron.
          </p>

          <div className="mt-4 space-y-3">
            {reminderRows.map((row, index) => (
              <div key={row.id} className="rounded-lg border border-slate-200 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Recordatorio {index + 1}
                  </p>
                  <button
                    type="button"
                    onClick={() => removeReminderRow(row.id)}
                    className="text-xs font-medium text-rose-700 transition hover:text-rose-800"
                    disabled={reminderRows.length === 1}
                  >
                    Eliminar
                  </button>
                </div>

                <input
                  type="datetime-local"
                  value={row.scheduledAt}
                  onChange={(event) => setReminderValue(row.id, event.target.value)}
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-brand transition focus:ring-2"
                />
              </div>
            ))}
          </div>

          <div className="mt-4">
            <button
              type="button"
              onClick={addReminderRow}
              disabled={reminderRows.length >= REMINDER_LIMIT}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
            >
              Agregar recordatorio
            </button>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleConfirmReminders}
              disabled={isSavingReminders}
              className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition hover:bg-brandDark disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSavingReminders ? 'Confirmando...' : 'Confirmar programación'}
            </button>
            <button
              type="button"
              onClick={() => setIsReminderModalOpen(false)}
              disabled={isSavingReminders}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Volver a revisar
            </button>
          </div>
        </Modal>
      ) : null}

      {mode === 'edit' && survey ? (
        <SurveyParticipantImportModal
          isOpen={isParticipantImportModalOpen}
          companySlug={companySlug}
          surveySlug={survey.slug}
          onClose={() => setIsParticipantImportModalOpen(false)}
        />
      ) : null}
    </section>
  );
}

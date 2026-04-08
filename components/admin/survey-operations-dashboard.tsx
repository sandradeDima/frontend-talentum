'use client';

import Link from 'next/link';
import { useMemo, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import {
  closeSurveyCampaignClient,
  finalizeSurveyCampaignClient,
  scheduleSurveySendClient
} from '@/services/survey.client';
import {
  getSurveyCampaignOperationsSummaryClient,
  sendSurveyInvitationsNowClient
} from '@/services/survey-operations.client';
import {
  deriveReminderScheduleHealth,
  reminderScheduleHealthPresentation
} from '@/lib/reminder-schedule-status';
import {
  toCompletionPercent,
  toEmailCoveragePercent
} from '@/lib/survey-operations-summary';
import { isSurveyImportEnabled } from '@/lib/survey-operations';
import { extractErrorMessage } from '@/lib/auth-shared';
import { ApiRequestError } from '@/types/api';
import type { SurveyCampaignDetail } from '@/types/survey';
import type {
  ImportSurveyRespondentsResult,
  SurveyCampaignOperationsSummary
} from '@/types/survey-operations';
import { SurveyParticipantImportModal } from './survey-participant-import-modal';
import { SurveyStatusBadge } from './survey-status-badge';

const dateFormatter = new Intl.DateTimeFormat('es-BO', {
  dateStyle: 'medium'
});

const dateTimeFormatter = new Intl.DateTimeFormat('es-BO', {
  dateStyle: 'medium',
  timeStyle: 'short'
});

type ToastState = {
  kind: 'success' | 'error';
  message: string;
};

type SurveyOperationsDashboardProps = {
  companySlug: string;
  companyName: string;
  canManage: boolean;
  initialSurvey: SurveyCampaignDetail;
  initialOperationsSummary: SurveyCampaignOperationsSummary | null;
  initialSummaryError?: string | null;
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

const getApiErrorMessage = (error: unknown): string => {
  if (error instanceof ApiRequestError) {
    switch (error.mensajeTecnico) {
      case 'SURVEY_INITIAL_SEND_REQUIRED':
        return 'Debes programar el envío inicial antes de continuar.';
      case 'INVALID_SURVEY_SEND_SCHEDULE':
        return 'La fecha u hora del envío inicial no es válida.';
      case 'SURVEY_SEND_MUST_BE_FUTURE':
        return 'El envío inicial debe programarse en una fecha y hora futura.';
      case 'SURVEY_SEND_AFTER_START':
        return 'El envío inicial debe ocurrir antes del inicio de la encuesta.';
      case 'SURVEY_CLOSE_REQUIRES_ACTIVE':
        return 'Solo puedes cerrar la encuesta cuando esté activa.';
      case 'SURVEY_FINALIZE_REQUIRES_CLOSED':
        return 'Debes cerrar la encuesta antes de finalizarla.';
      case 'SURVEY_ALREADY_FINALIZED':
        return 'La encuesta ya fue finalizada.';
      case 'SURVEY_ADMIN_REQUIRED':
      case 'SURVEY_OPERATIONS_ADMIN_REQUIRED':
        return 'No tienes permisos para ejecutar esta acción.';
      default:
        return error.message;
    }
  }

  return extractErrorMessage(error);
};

const Modal = ({ children }: { children: ReactNode }) => {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-5 shadow-lg">
        {children}
      </div>
    </div>
  );
};

export function SurveyOperationsDashboard({
  companySlug,
  companyName,
  canManage,
  initialSurvey,
  initialOperationsSummary,
  initialSummaryError
}: SurveyOperationsDashboardProps) {
  const router = useRouter();
  const [survey, setSurvey] = useState(initialSurvey);
  const [operationsSummary, setOperationsSummary] = useState<SurveyCampaignOperationsSummary | null>(
    initialOperationsSummary
  );
  const [summaryError, setSummaryError] = useState<string | null>(initialSummaryError ?? null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [isRefreshingSummary, setIsRefreshingSummary] = useState(false);
  const [isParticipantImportModalOpen, setIsParticipantImportModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleDateTime, setScheduleDateTime] = useState('');
  const [isSchedulingSend, setIsSchedulingSend] = useState(false);
  const [isClosingSurvey, setIsClosingSurvey] = useState(false);
  const [isFinalizingSurvey, setIsFinalizingSurvey] = useState(false);
  const [isSendingInvitations, setIsSendingInvitations] = useState(false);

  const canImportParticipants = Boolean(
    canManage &&
      isSurveyImportEnabled(survey.status) &&
      !survey.lifecycle.ended &&
      !isClosingSurvey &&
      !isFinalizingSurvey
  );
  const canScheduleInitialSend = Boolean(
    canManage &&
      survey.lifecycle.canScheduleInitialSend &&
      !isSchedulingSend &&
      !isClosingSurvey &&
      !isFinalizingSurvey
  );
  const canCloseSurvey = Boolean(
    canManage &&
      survey.lifecycle.canCloseNow &&
      !isSchedulingSend &&
      !isClosingSurvey &&
      !isFinalizingSurvey
  );
  const canFinalizeSurvey = Boolean(
    canManage &&
      survey.lifecycle.canFinalize &&
      !isSchedulingSend &&
      !isClosingSurvey &&
      !isFinalizingSurvey
  );
  const canSendInvitationsNow = Boolean(
    canManage &&
      isSurveyImportEnabled(survey.status) &&
      !survey.lifecycle.ended &&
      !isSendingInvitations &&
      !isClosingSurvey &&
      !isFinalizingSurvey
  );

  const completionPercent = useMemo(() => {
    return toCompletionPercent(operationsSummary?.responses.completionRate ?? 0);
  }, [operationsSummary?.responses.completionRate]);

  const emailCoveragePercent = useMemo(() => {
    if (!operationsSummary) {
      return 0;
    }

    return toEmailCoveragePercent(
      operationsSummary.participants.withEmail,
      operationsSummary.participants.active
    );
  }, [operationsSummary]);

  const showToast = (kind: ToastState['kind'], message: string) => {
    setToast({ kind, message });
    setTimeout(() => {
      setToast((previous) => (previous?.message === message ? null : previous));
    }, 4200);
  };

  const refreshSummary = async () => {
    setIsRefreshingSummary(true);
    try {
      const refreshed = await getSurveyCampaignOperationsSummaryClient(
        companySlug,
        survey.slug
      );
      setOperationsSummary(refreshed);
      setSummaryError(null);
    } catch (error) {
      const message = getApiErrorMessage(error);
      setSummaryError(message);
      showToast('error', message);
    } finally {
      setIsRefreshingSummary(false);
    }
  };

  const openScheduleModal = () => {
    setScheduleDateTime(
      survey.initialSendScheduledAt ? toDateTimeLocalValue(survey.initialSendScheduledAt) : ''
    );
    setIsScheduleModalOpen(true);
  };

  const handleScheduleInitialSend = async () => {
    if (!scheduleDateTime) {
      showToast('error', 'Debes elegir una fecha y hora para programar el envío inicial.');
      return;
    }

    setIsSchedulingSend(true);
    try {
      const updatedSurvey = await scheduleSurveySendClient(companySlug, survey.slug, {
        scheduledAt: scheduleDateTime
      });

      setSurvey(updatedSurvey);
      setIsScheduleModalOpen(false);
      await refreshSummary();
      showToast('success', 'Envío inicial programado.');
      router.refresh();
    } catch (error) {
      showToast('error', getApiErrorMessage(error));
    } finally {
      setIsSchedulingSend(false);
    }
  };

  const handleCloseSurvey = async () => {
    if (!canCloseSurvey) {
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
      const updatedSurvey = await closeSurveyCampaignClient(companySlug, survey.slug);
      setSurvey(updatedSurvey);
      await refreshSummary();
      showToast('success', 'Encuesta cerrada.');
      router.refresh();
    } catch (error) {
      showToast('error', getApiErrorMessage(error));
    } finally {
      setIsClosingSurvey(false);
    }
  };

  const handleFinalizeSurvey = async () => {
    if (!canFinalizeSurvey) {
      return;
    }

    const confirmed = window.confirm(
      'Finalizar la encuesta la dejará en estado terminal. Esta acción no se puede deshacer. ¿Continuar?'
    );

    if (!confirmed) {
      return;
    }

    setIsFinalizingSurvey(true);
    try {
      const updatedSurvey = await finalizeSurveyCampaignClient(companySlug, survey.slug);
      setSurvey(updatedSurvey);
      await refreshSummary();
      showToast('success', 'Encuesta finalizada.');
      router.refresh();
    } catch (error) {
      showToast('error', getApiErrorMessage(error));
    } finally {
      setIsFinalizingSurvey(false);
    }
  };

  const handleSendInvitationsNow = async () => {
    if (!canSendInvitationsNow) {
      return;
    }

    const confirmed = window.confirm(
      'Esto enviará invitaciones a todos los participantes activos con correo electrónico y regenerará sus credenciales de acceso. ¿Deseas continuar?'
    );

    if (!confirmed) {
      return;
    }

    setIsSendingInvitations(true);
    try {
      const result = await sendSurveyInvitationsNowClient(companySlug, survey.slug);
      await refreshSummary();
      showToast(
        'success',
        `Invitaciones enviadas: ${result.summary.invitationsSent} enviadas, ${result.summary.invitationFailures} fallidas.`
      );
    } catch (error) {
      showToast('error', getApiErrorMessage(error));
    } finally {
      setIsSendingInvitations(false);
    }
  };

  const handleImportCompleted = async (result: ImportSurveyRespondentsResult) => {
    await refreshSummary();
    showToast(
      'success',
      `Importación completada: ${result.summary.createdRespondents ?? 0} creados, ${result.summary.updatedRespondents ?? 0} actualizados.`
    );
    router.refresh();
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
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-ink">Operaciones de campaña</h1>
            <p className="text-sm text-slate-600">
              {survey.name} - Empresa: {companyName}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Centro operativo para importación, progreso, recordatorios y ciclo de vida.
            </p>
          </div>
          <SurveyStatusBadge status={survey.status} lifecycleState={survey.lifecycle.state} />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setIsParticipantImportModalOpen(true)}
            disabled={!canImportParticipants}
            className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition hover:bg-brandDark disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            Importar participantes
          </button>
          <button
            type="button"
            onClick={handleSendInvitationsNow}
            disabled={!canSendInvitationsNow}
            className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition hover:bg-brandDark disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isSendingInvitations ? 'Enviando...' : 'Enviar ahora'}
          </button>
          <button
            type="button"
            onClick={openScheduleModal}
            disabled={!canScheduleInitialSend}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100"
          >
            Programar envío inicial
          </button>
          <button
            type="button"
            onClick={handleCloseSurvey}
            disabled={!canCloseSurvey}
            className="rounded-lg border border-amber-300 px-4 py-2 text-sm font-medium text-amber-800 transition hover:bg-amber-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
          >
            Cerrar encuesta
          </button>
          <button
            type="button"
            onClick={handleFinalizeSurvey}
            disabled={!canFinalizeSurvey}
            className="rounded-lg border border-rose-300 px-4 py-2 text-sm font-medium text-rose-800 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
          >
            Finalizar encuesta
          </button>
          <button
            type="button"
            onClick={refreshSummary}
            disabled={isRefreshingSummary}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100"
          >
            {isRefreshingSummary ? 'Actualizando...' : 'Actualizar resumen'}
          </button>
          <Link
            href={`/admin/companies/${companySlug}/surveys/${survey.slug}`}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Abrir editor completo
          </Link>
          <Link
            href={`/admin/companies/${companySlug}/surveys/${survey.slug}/reporting`}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Ver reportes
          </Link>
          <Link
            href={`/admin/companies/${companySlug}/surveys/history`}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Historial
          </Link>
          <Link
            href={`/admin/companies/${companySlug}/surveys`}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Volver a encuestas
          </Link>
        </div>
      </header>

      {!canManage ? (
        <p className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Solo ADMIN puede ejecutar operaciones de campaña en esta etapa.
        </p>
      ) : null}

      {summaryError ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          <p>No se pudo cargar el resumen operativo: {summaryError}</p>
          <button
            type="button"
            onClick={refreshSummary}
            disabled={isRefreshingSummary}
            className="mt-2 rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-xs font-medium text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-70"
          >
            Reintentar
          </button>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <article className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-ink">Estado y metadatos</h2>
          <div className="grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
            <p>
              <span className="font-medium">Inicio:</span>{' '}
              {dateFormatter.format(new Date(survey.startDate))}
            </p>
            <p>
              <span className="font-medium">Fin:</span>{' '}
              {dateFormatter.format(new Date(survey.endDate))}
            </p>
            <p>
              <span className="font-medium">Envío inicial:</span>{' '}
              {formatOptionalDateTime(survey.initialSendScheduledAt)}
            </p>
            <p>
              <span className="font-medium">Recordatorios:</span>{' '}
              {survey.remindersLockedAt ? 'Confirmados (bloqueados)' : 'Sin confirmar'}
            </p>
            <p>
              <span className="font-medium">Finalizada:</span>{' '}
              {formatOptionalDateTime(survey.finalizedAt)}
            </p>
            <p className="sm:col-span-2">
              <span className="font-medium">Link genérico:</span>{' '}
              <a
                href={survey.genericLinkPath}
                target="_blank"
                rel="noreferrer"
                className="break-all text-brand transition hover:text-brandDark"
              >
                {survey.genericLinkPath}
              </a>
            </p>
          </div>
        </article>

        <article className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-ink">Participantes e importación</h2>
          {operationsSummary ? (
            <>
              <div className="grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
                <p>
                  <span className="font-medium">Total:</span> {operationsSummary.participants.total}
                </p>
                <p>
                  <span className="font-medium">Activos:</span>{' '}
                  {operationsSummary.participants.active}
                </p>
                <p>
                  <span className="font-medium">Con correo:</span>{' '}
                  {operationsSummary.participants.withEmail}
                </p>
                <p>
                  <span className="font-medium">Sin correo:</span>{' '}
                  {operationsSummary.participants.withoutEmail}
                </p>
              </div>
              <p className="text-xs text-slate-500">
                Cobertura de correo en participantes activos: {emailCoveragePercent}%
              </p>
              <p className="text-xs text-slate-500">
                Última actualización de padrón:{' '}
                {formatOptionalDateTime(operationsSummary.participants.lastImportedAt)}
              </p>

              {operationsSummary.participants.total === 0 ? (
                <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                  Aún no hay participantes cargados para esta campaña.
                </p>
              ) : null}
            </>
          ) : (
            <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-600">
              Resumen de participantes no disponible por el momento.
            </p>
          )}
        </article>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <article className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-ink">Progreso de respuestas</h2>
          {operationsSummary ? (
            <>
              <div className="h-3 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-brand transition-all"
                  style={{ width: `${completionPercent}%` }}
                />
              </div>
              <p className="text-sm font-medium text-slate-700">
                Completado: {completionPercent}%
              </p>
              <div className="grid gap-2 text-sm text-slate-700 sm:grid-cols-3">
                <p>
                  <span className="font-medium">No iniciadas:</span>{' '}
                  {operationsSummary.responses.notStarted}
                </p>
                <p>
                  <span className="font-medium">En progreso:</span>{' '}
                  {operationsSummary.responses.inProgress}
                </p>
                <p>
                  <span className="font-medium">Enviadas:</span>{' '}
                  {operationsSummary.responses.submitted}
                </p>
              </div>
            </>
          ) : (
            <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-600">
              Progreso no disponible por el momento.
            </p>
          )}
        </article>

        <article className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-ink">Accesos y credenciales</h2>
          {operationsSummary ? (
            operationsSummary.credentials.totalIssued > 0 ? (
              <>
                <div className="grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
                  <p>
                    <span className="font-medium">Emitidas:</span>{' '}
                    {operationsSummary.credentials.totalIssued}
                  </p>
                  <p>
                    <span className="font-medium">Activas:</span>{' '}
                    {operationsSummary.credentials.active}
                  </p>
                  <p>
                    <span className="font-medium">Expiradas:</span>{' '}
                    {operationsSummary.credentials.expired}
                  </p>
                  <p>
                    <span className="font-medium">Consumidas:</span>{' '}
                    {operationsSummary.credentials.consumed}
                  </p>
                  <p>
                    <span className="font-medium">Revocadas:</span>{' '}
                    {operationsSummary.credentials.revoked}
                  </p>
                  <p>
                    <span className="font-medium">PIN:</span>{' '}
                    {operationsSummary.credentials.byType.PIN} |{' '}
                    <span className="font-medium">TOKEN:</span>{' '}
                    {operationsSummary.credentials.byType.TOKEN}
                  </p>
                </div>
                <p className="text-xs text-slate-500">
                  Última emisión:{' '}
                  {formatOptionalDateTime(operationsSummary.credentials.latestIssuedAt)}
                </p>
              </>
            ) : (
              <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                Aún no se emitieron credenciales para esta campaña.
              </p>
            )
          ) : (
            <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-600">
              Resumen de credenciales no disponible por el momento.
            </p>
          )}
        </article>
      </div>

      <article className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-ink">Recordatorios</h2>
          <Link
            href={`/admin/companies/${companySlug}/surveys/${survey.slug}`}
            className="text-sm font-medium text-brand transition hover:text-brandDark"
          >
            Configurar recordatorios en editor
          </Link>
        </div>

        {operationsSummary ? (
          <div className="grid gap-2 text-sm text-slate-700 sm:grid-cols-3 lg:grid-cols-6">
            <p>
              <span className="font-medium">Total:</span>{' '}
              {operationsSummary.reminders.totalSchedules}
            </p>
            <p>
              <span className="font-medium">Pendientes:</span>{' '}
              {operationsSummary.reminders.pending}
            </p>
            <p>
              <span className="font-medium">Procesando:</span>{' '}
              {operationsSummary.reminders.processing}
            </p>
            <p>
              <span className="font-medium">Completados:</span>{' '}
              {operationsSummary.reminders.completed}
            </p>
            <p>
              <span className="font-medium">Fallidos:</span>{' '}
              {operationsSummary.reminders.failed}
            </p>
            <p>
              <span className="font-medium">Próximo:</span>{' '}
              {formatOptionalDateTime(operationsSummary.reminders.nextScheduledAt)}
            </p>
          </div>
        ) : (
          <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-600">
            Resumen de recordatorios no disponible por el momento.
          </p>
        )}

        {survey.reminderSchedules.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
                <tr>
                  <th className="px-3 py-2 font-semibold">Fecha</th>
                  <th className="px-3 py-2 font-semibold">Estado</th>
                  <th className="px-3 py-2 font-semibold">Intentos</th>
                  <th className="px-3 py-2 font-semibold">Envíos</th>
                  <th className="px-3 py-2 font-semibold">Fallos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {survey.reminderSchedules.map((schedule) => {
                  const health = deriveReminderScheduleHealth({
                    status: schedule.status,
                    dispatchSummary: {
                      failed: schedule.dispatchSummary.failed
                    }
                  });
                  const healthPresentation = reminderScheduleHealthPresentation[health];

                  return (
                    <tr key={schedule.id}>
                      <td className="px-3 py-2 text-slate-700">
                        {dateTimeFormatter.format(new Date(schedule.scheduledAt))}
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${healthPresentation.className}`}
                        >
                          {healthPresentation.label}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-slate-700">{schedule.attemptCount}</td>
                      <td className="px-3 py-2 text-slate-700">{schedule.dispatchSummary.sent}</td>
                      <td className="px-3 py-2 text-slate-700">{schedule.dispatchSummary.failed}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-600">
            Aún no hay recordatorios programados para esta campaña.
          </p>
        )}
      </article>

      {isScheduleModalOpen ? (
        <Modal>
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-ink">Programar envío inicial</h3>
            <p className="text-sm text-slate-600">
              Este envío habilita la campaña y permite iniciar la operación con participantes.
            </p>
            <div className="space-y-1">
              <label htmlFor="initial-send-at" className="text-sm font-medium text-slate-700">
                Fecha y hora
              </label>
              <input
                id="initial-send-at"
                type="datetime-local"
                value={scheduleDateTime}
                onChange={(event) => setScheduleDateTime(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-brand transition focus:ring-2"
              />
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsScheduleModalOpen(false)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                disabled={isSchedulingSend}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleScheduleInitialSend}
                className="rounded-lg bg-brand px-3 py-1.5 text-sm font-medium text-white transition hover:bg-brandDark disabled:bg-slate-300"
                disabled={isSchedulingSend}
              >
                {isSchedulingSend ? 'Guardando...' : 'Confirmar envío'}
              </button>
            </div>
          </div>
        </Modal>
      ) : null}

      <SurveyParticipantImportModal
        isOpen={isParticipantImportModalOpen}
        companySlug={companySlug}
        surveySlug={survey.slug}
        onClose={() => setIsParticipantImportModalOpen(false)}
        onImportCompleted={handleImportCompleted}
      />
    </section>
  );
}

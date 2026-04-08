'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  createDashboardExportJobClient,
  listDashboardExportJobsClient,
  getDashboardProgressClient,
  getDashboardResultsClient
} from '@/services/dashboard.client';
import { listSurveyRespondentsClient } from '@/services/survey-operations.client';
import { finalizeSurveyCampaignClient } from '@/services/survey.client';
import { extractErrorMessage } from '@/lib/auth-shared';
import {
  formatSupportedDashboardExportFormats,
  isDashboardExportDownloadReady,
  isDashboardExportPending
} from '@/lib/dashboard-exports';
import { deriveDashboardSuppressionDescriptor } from '@/lib/dashboard-suppression';
import { env } from '@/lib/env';
import { ApiRequestError } from '@/types/api';
import type {
  DashboardExportJobResult,
  DashboardExportFormat,
  DashboardExportJobStatus,
  DashboardGroupBy,
  DashboardProgressResult,
  DashboardResultsResult
} from '@/types/dashboard-reporting';
import type { RespondentListItem } from '@/types/survey-operations';
import type { SurveyCampaignDetail } from '@/types/survey';
import { SurveyStatusBadge } from './survey-status-badge';

const groupByOptions: Array<{ value: DashboardGroupBy; label: string }> = [
  { value: 'COMPANY', label: 'Empresa' },
  { value: 'GERENCIA', label: 'Gerencia' },
  { value: 'CENTRO', label: 'Centro' }
];

const groupByDescriptions: Record<DashboardGroupBy, string> = {
  COMPANY: 'Comparación global por empresa (sin cortes demográficos internos).',
  GERENCIA: 'Corte por gerencia, sujeto al umbral de anonimato.',
  CENTRO: 'Corte por centro de trabajo, sujeto al umbral de anonimato.'
};

const dateTimeFormatter = new Intl.DateTimeFormat('es-BO', {
  dateStyle: 'medium',
  timeStyle: 'short'
});

const numberFormatter = new Intl.NumberFormat('es-BO');

const exportStatusPresentation: Record<
  DashboardExportJobStatus,
  { label: string; className: string }
> = {
  PENDING: {
    label: 'Pendiente',
    className: 'bg-slate-100 text-slate-700 ring-slate-200'
  },
  PROCESSING: {
    label: 'Procesando',
    className: 'bg-blue-50 text-blue-700 ring-blue-200'
  },
  COMPLETED: {
    label: 'Completado',
    className: 'bg-emerald-50 text-emerald-700 ring-emerald-200'
  },
  FAILED: {
    label: 'Fallido',
    className: 'bg-rose-50 text-rose-700 ring-rose-200'
  }
};

const EMPTY_PROGRESS_ROWS: DashboardProgressResult['groups'] = [];
const EMPTY_OVERALL_ROWS: DashboardResultsResult['overall'] = [];
const EMPTY_SECTION_ROWS: DashboardResultsResult['sections'] = [];
const EMPTY_QUESTION_ROWS: DashboardResultsResult['questions'] = [];

type SurveyReportingDashboardProps = {
  companySlug: string;
  companyName: string;
  canManage: boolean;
  survey: SurveyCampaignDetail;
  initialGroupBy: DashboardGroupBy;
  initialProgress: DashboardProgressResult | null;
  initialResults: DashboardResultsResult | null;
  initialError: string | null;
  initialExportJobs: DashboardExportJobResult[];
  initialExportSupportedFormats: DashboardExportFormat[];
  initialExportError: string | null;
};

const toPercent = (value: number): string => {
  if (!Number.isFinite(value)) {
    return '0%';
  }

  const bounded = Math.min(1, Math.max(0, value));
  return `${Math.round(bounded * 100)}%`;
};

const toAverage = (value: number): string => {
  if (!Number.isFinite(value)) {
    return '0.00';
  }

  return value.toFixed(2);
};

const formatDateTime = (value: string | null): string => {
  if (!value) {
    return 'Sin registro';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return 'Sin registro';
  }

  return dateTimeFormatter.format(parsed);
};

const resolveDownloadUrl = (value: string | null): string | null => {
  if (!value) {
    return null;
  }

  if (value.startsWith('http://') || value.startsWith('https://')) {
    return value;
  }

  return `${env.backendOrigin}${value.startsWith('/') ? value : `/${value}`}`;
};

const resolveReportingError = (error: unknown): string => {
  if (error instanceof ApiRequestError) {
    switch (error.mensajeTecnico) {
      case 'SURVEY_CAMPAIGN_NOT_DASHBOARD_READY':
        return 'La encuesta aún está en borrador y no tiene reportes habilitados.';
      case 'SURVEY_CAMPAIGN_NOT_FOUND':
        return 'La campaña de encuesta no fue encontrada.';
      case 'COMPANY_SCOPE_FORBIDDEN':
        return 'No tienes permisos para consultar reportes de esta campaña.';
      case 'DASHBOARD_EXPORT_ADMIN_REQUIRED':
        return 'Solo ADMIN puede generar o descargar exportaciones.';
      case 'INVALID_EXPORT_JOB_ID':
      case 'DASHBOARD_EXPORT_JOB_NOT_FOUND':
        return 'No se encontró el job de exportación solicitado.';
      case 'DASHBOARD_EXPORT_NOT_READY':
        return 'La exportación aún no está lista para descargar.';
      case 'DASHBOARD_EXPORT_FILE_MISSING':
        return 'El archivo exportado ya no está disponible. Genera una nueva exportación.';
      default:
        return error.message;
    }
  }

  return extractErrorMessage(error);
};

function MetricCard({
  label,
  value,
  helper
}: {
  label: string;
  value: string;
  helper?: string;
}) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-ink">{value}</p>
      {helper ? <p className="mt-1 text-xs text-slate-500">{helper}</p> : null}
    </article>
  );
}

export function SurveyReportingDashboard({
  companySlug,
  companyName,
  canManage,
  survey,
  initialGroupBy,
  initialProgress,
  initialResults,
  initialError,
  initialExportJobs,
  initialExportSupportedFormats,
  initialExportError
}: SurveyReportingDashboardProps) {
  const router = useRouter();
  const requestSequenceRef = useRef(0);
  const [surveyState, setSurveyState] = useState(survey);
  const [groupBy, setGroupBy] = useState<DashboardGroupBy>(initialGroupBy);
  const [progress, setProgress] = useState<DashboardProgressResult | null>(initialProgress);
  const [results, setResults] = useState<DashboardResultsResult | null>(initialResults);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(false);
  const [dashboardError, setDashboardError] = useState<string | null>(initialError);
  const [isFinalizingSurvey, setIsFinalizingSurvey] = useState(false);
  const [lastDashboardRefreshAt, setLastDashboardRefreshAt] = useState<Date | null>(() => {
    return initialProgress || initialResults ? new Date() : null;
  });

  const [activeTab, setActiveTab] = useState<'reportes' | 'usuarios'>('reportes');
  const [respondents, setRespondents] = useState<RespondentListItem[] | null>(null);
  const [isLoadingRespondents, setIsLoadingRespondents] = useState(false);
  const [respondentsError, setRespondentsError] = useState<string | null>(null);

  const [exportJobs, setExportJobs] = useState<DashboardExportJobResult[]>(initialExportJobs);
  const [exportSupportedFormats, setExportSupportedFormats] = useState<DashboardExportFormat[]>(
    initialExportSupportedFormats
  );
  const [isCreatingExport, setIsCreatingExport] = useState(false);
  const [isRefreshingExports, setIsRefreshingExports] = useState(false);
  const [exportError, setExportError] = useState<string | null>(initialExportError);
  const [lastExportRefreshAt, setLastExportRefreshAt] = useState<Date | null>(() => {
    return initialExportJobs.length > 0 ? new Date() : null;
  });

  const refreshDashboard = useCallback(
    async (nextGroupBy: DashboardGroupBy) => {
      const requestId = requestSequenceRef.current + 1;
      requestSequenceRef.current = requestId;
      setIsLoadingDashboard(true);
      setDashboardError(null);

      try {
        const [nextProgress, nextResults] = await Promise.all([
          getDashboardProgressClient({
            surveySlug: surveyState.slug,
            groupBy: nextGroupBy
          }),
          getDashboardResultsClient({
            surveySlug: surveyState.slug,
            groupBy: nextGroupBy
          })
        ]);

        if (requestSequenceRef.current !== requestId) {
          return;
        }

        setProgress(nextProgress);
        setResults(nextResults);
        setDashboardError(null);
        setLastDashboardRefreshAt(new Date());
      } catch (error) {
        if (requestSequenceRef.current !== requestId) {
          return;
        }

        setDashboardError(resolveReportingError(error));
      } finally {
        if (requestSequenceRef.current === requestId) {
          setIsLoadingDashboard(false);
        }
      }
    },
    [surveyState.slug]
  );

  const refreshExportJobs = useCallback(
    async (nextGroupBy: DashboardGroupBy, silent = false) => {
      if (!silent) {
        setIsRefreshingExports(true);
      }

      try {
        const next = await listDashboardExportJobsClient({
          surveySlug: surveyState.slug,
          groupBy: nextGroupBy,
          limit: 10
        });
        setExportJobs(next.jobs);
        setExportSupportedFormats(next.supportedFormats);
        setExportError(null);
        setLastExportRefreshAt(new Date());
      } catch (error) {
        setExportError(resolveReportingError(error));
      } finally {
        if (!silent) {
          setIsRefreshingExports(false);
        }
      }
    },
    [surveyState.slug]
  );

  const shouldPollExports = exportJobs.some(
    (job) => isDashboardExportPending(job.status)
  );

  useEffect(() => {
    if (!shouldPollExports) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void refreshExportJobs(groupBy, true);
    }, 5000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [groupBy, refreshExportJobs, shouldPollExports]);

  const loadRespondents = useCallback(async () => {
    if (isLoadingRespondents) {
      return;
    }

    setIsLoadingRespondents(true);
    setRespondentsError(null);

    try {
      const result = await listSurveyRespondentsClient(companySlug, surveyState.slug);
      setRespondents(result);
    } catch (error) {
      setRespondentsError(extractErrorMessage(error));
    } finally {
      setIsLoadingRespondents(false);
    }
  }, [companySlug, isLoadingRespondents, surveyState.slug]);

  const handleTabChange = (tab: 'reportes' | 'usuarios') => {
    setActiveTab(tab);
    if (tab === 'usuarios' && respondents === null && !isLoadingRespondents) {
      void loadRespondents();
    }
  };

  const handleGroupByChange = async (value: DashboardGroupBy) => {
    if (groupBy === value) {
      return;
    }

    setGroupBy(value);
    setExportError(null);
    await Promise.all([refreshDashboard(value), refreshExportJobs(value)]);
  };

  const handleCreateExport = async () => {
    if (!canManage) {
      setExportError('Solo ADMIN puede generar nuevas exportaciones.');
      return;
    }

    setIsCreatingExport(true);
    setExportError(null);

    try {
      await createDashboardExportJobClient({
        surveySlug: surveyState.slug,
        groupBy
      });
      await refreshExportJobs(groupBy, true);
    } catch (error) {
      setExportError(resolveReportingError(error));
    } finally {
      setIsCreatingExport(false);
    }
  };

  const handleFinalizeSurvey = async () => {
    if (!canManage || surveyState.lifecycle.state !== 'CLOSED' || isFinalizingSurvey) {
      return;
    }

    const confirmed = window.confirm(
      'Finalizar esta medición la moverá al histórico oficial y no podrá volver a estado activo. ¿Continuar?'
    );

    if (!confirmed) {
      return;
    }

    setIsFinalizingSurvey(true);
    try {
      const updated = await finalizeSurveyCampaignClient(companySlug, surveyState.slug);
      setSurveyState(updated);
      router.refresh();
    } catch (error) {
      setDashboardError(resolveReportingError(error));
    } finally {
      setIsFinalizingSurvey(false);
    }
  };

  const latestExportJob = exportJobs[0] ?? null;

  const progressRows = progress?.groups ?? EMPTY_PROGRESS_ROWS;
  const overallRows = results?.overall ?? EMPTY_OVERALL_ROWS;
  const sectionRows = results?.sections ?? EMPTY_SECTION_ROWS;
  const questionRows = results?.questions ?? EMPTY_QUESTION_ROWS;
  const suppressedGroups = progress?.suppressedGroups ?? results?.suppressedGroups ?? 0;
  const anonymityMinCount = progress?.anonymityMinCount ?? results?.anonymityMinCount ?? null;
  const aggregateVisible = progress?.aggregateVisible ?? results?.aggregateVisible ?? false;
  const aggregateOnlyVisible = progressRows.length === 0 && aggregateVisible;
  const suppression = useMemo(() => {
    return deriveDashboardSuppressionDescriptor({
      anonymityMinCount,
      suppressedGroups,
      visibleGroups: progressRows.length
    });
  }, [anonymityMinCount, progressRows.length, suppressedGroups]);

  const totalNumericAnswers = useMemo(() => {
    return overallRows.reduce((acc, item) => acc + item.answerCount, 0);
  }, [overallRows]);

  const latestExportStatusMessage = useMemo(() => {
    if (!latestExportJob) {
      return null;
    }

    if (latestExportJob.status === 'PENDING') {
      return 'La exportación está en cola y se procesará cuando el worker tome el job.';
    }

    if (latestExportJob.status === 'PROCESSING') {
      return `La exportación está en proceso (intento ${latestExportJob.attemptCount}/${latestExportJob.maxAttempts}).`;
    }

    if (latestExportJob.status === 'COMPLETED') {
      return 'La exportación terminó correctamente y está lista para descarga.';
    }

    if (latestExportJob.nextRetryAt && latestExportJob.attemptCount < latestExportJob.maxAttempts) {
      return `El último intento falló (${latestExportJob.attemptCount}/${latestExportJob.maxAttempts}). Reintento programado para ${formatDateTime(latestExportJob.nextRetryAt)}.`;
    }

    return `La exportación falló tras ${latestExportJob.attemptCount} intento(s).`;
  }, [latestExportJob]);

  return (
    <section className="space-y-4">
      <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-ink">Reportes de campaña</h1>
            <p className="text-sm text-slate-600">
              {surveyState.name} - Empresa: {companyName}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Métricas de progreso y resultados agregados con anonimización.
            </p>
          </div>
          <SurveyStatusBadge status={surveyState.status} lifecycleState={surveyState.lifecycle.state} />
        </div>

        <div className="mt-4 flex flex-wrap items-end gap-2">
          <label className="text-sm font-medium text-slate-700">
            Agrupar por
            <select
              value={groupBy}
              onChange={(event) => void handleGroupByChange(event.target.value as DashboardGroupBy)}
              disabled={isLoadingDashboard}
              className="mt-1 block w-44 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 outline-none ring-brand transition focus:ring-2 disabled:bg-slate-100"
            >
              {groupByOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={() => void Promise.all([refreshDashboard(groupBy), refreshExportJobs(groupBy)])}
            disabled={isLoadingDashboard || isRefreshingExports}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100"
          >
            {isLoadingDashboard || isRefreshingExports ? 'Actualizando...' : 'Actualizar'}
          </button>
          <button
            type="button"
            onClick={handleCreateExport}
            disabled={!canManage || isCreatingExport || isLoadingDashboard}
            className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition hover:bg-brandDark disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isCreatingExport ? 'Generando exportación...' : 'Exportar XLSX'}
          </button>
          <Link
            href={`/admin/companies/${companySlug}/surveys/${surveyState.slug}/operations`}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Volver a operaciones
          </Link>
          <Link
            href={`/admin/companies/${companySlug}/surveys/history`}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Historial
          </Link>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Corte actual: <strong>{groupByOptions.find((option) => option.value === groupBy)?.label}</strong>.{' '}
          {groupByDescriptions[groupBy]}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Última actualización dashboard:{' '}
          {lastDashboardRefreshAt ? dateTimeFormatter.format(lastDashboardRefreshAt) : 'Sin registro'}.
        </p>
      </header>

      {canManage ? (
        <div className="flex gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
          <button
            type="button"
            onClick={() => handleTabChange('reportes')}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition ${
              activeTab === 'reportes'
                ? 'bg-white text-ink shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Reportes
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('usuarios')}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition ${
              activeTab === 'usuarios'
                ? 'bg-white text-ink shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Usuarios invitados
          </button>
        </div>
      ) : null}

      {canManage && activeTab === 'usuarios' ? (
        <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <header className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
            <div>
              <h2 className="text-sm font-semibold text-ink">Usuarios invitados</h2>
              <p className="mt-0.5 text-xs text-slate-600">
                Todos los participantes registrados en esta encuesta.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void loadRespondents()}
              disabled={isLoadingRespondents}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoadingRespondents ? 'Actualizando...' : 'Actualizar'}
            </button>
          </header>

          {respondentsError ? (
            <p className="px-4 py-3 text-sm text-rose-700">{respondentsError}</p>
          ) : isLoadingRespondents && respondents === null ? (
            <p className="px-4 py-3 text-sm text-slate-500">Cargando participantes...</p>
          ) : respondents !== null && respondents.length === 0 ? (
            <p className="px-4 py-3 text-sm text-slate-500">No hay participantes registrados.</p>
          ) : respondents !== null ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Identificador</th>
                    <th className="px-4 py-3 font-semibold">Nombre</th>
                    <th className="px-4 py-3 font-semibold">Email</th>
                    <th className="px-4 py-3 font-semibold">Gerencia</th>
                    <th className="px-4 py-3 font-semibold">Centro</th>
                    <th className="px-4 py-3 font-semibold">Estado respuesta</th>
                    <th className="px-4 py-3 font-semibold">Activo</th>
                    <th className="px-4 py-3 font-semibold">Fecha invitación</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {respondents.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="px-4 py-2 font-mono text-xs text-slate-700">{r.identifier ?? '—'}</td>
                      <td className="px-4 py-2 text-slate-700">{r.fullName ?? '—'}</td>
                      <td className="px-4 py-2 text-slate-500">{r.email ?? '—'}</td>
                      <td className="px-4 py-2 text-slate-500">{r.gerencia ?? '—'}</td>
                      <td className="px-4 py-2 text-slate-500">{r.centro ?? '—'}</td>
                      <td className="px-4 py-2">
                        {r.responseStatus === 'SUBMITTED' ? (
                          <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
                            Completada
                          </span>
                        ) : r.responseStatus === 'IN_PROGRESS' ? (
                          <span className="inline-flex rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-blue-200">
                            En progreso
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
                            Sin iniciar
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        {r.isActive ? (
                          <span className="text-xs text-emerald-700">Activo</span>
                        ) : (
                          <span className="text-xs text-slate-400">Inactivo</span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-xs text-slate-500">
                        {formatDateTime(r.invitedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </article>
      ) : null}

      {activeTab === 'reportes' || !canManage ? (
        <>

      {surveyState.lifecycle.state === 'FINALIZED' ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <p>
            Esta medición está finalizada y forma parte del histórico oficial.
          </p>
          <p className="mt-1">
            Fecha de finalización:{' '}
            <strong>{formatDateTime(surveyState.finalizedAt)}</strong>.
          </p>
        </div>
      ) : surveyState.lifecycle.state === 'CLOSED' ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <p>
            Esta medición está cerrada pero pendiente de finalización administrativa.
          </p>
          <p className="mt-1">
            Los resultados son consultables, pero aún no se consideran histórico oficial.
          </p>
          {canManage ? (
            <button
              type="button"
              onClick={handleFinalizeSurvey}
              disabled={isFinalizingSurvey}
              className="mt-2 rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-sm font-medium text-amber-800 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isFinalizingSurvey ? 'Finalizando...' : 'Finalizar medición'}
            </button>
          ) : null}
        </div>
      ) : (
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          <p>
            Medición en curso: los datos pueden seguir cambiando hasta cerrar y finalizar la campaña.
          </p>
          <p className="mt-1">Recomendación: usa esta vista como monitoreo operativo, no como histórico final.</p>
        </div>
      )}

      {dashboardError ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          <p>No pudimos cargar los reportes: {dashboardError}</p>
          <button
            type="button"
            onClick={() => void refreshDashboard(groupBy)}
            disabled={isLoadingDashboard}
            className="mt-2 rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-xs font-medium text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-70"
          >
            Reintentar
          </button>
        </div>
      ) : null}

      {isLoadingDashboard ? (
        <p className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-700">
          Actualizando métricas y resultados para el corte seleccionado...
        </p>
      ) : null}

      {suppression.mode !== 'unknown' ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <p>
            Umbral de anonimato activo: se muestran solo grupos con al menos{' '}
            <strong>{numberFormatter.format(suppression.anonymityMinCount ?? 0)}</strong> respuestas enviadas.
          </p>
          {suppression.mode === 'partial' ? (
            <p className="mt-1">
              Algunos segmentos no se muestran por privacidad. Grupos suprimidos:{' '}
              <strong>{numberFormatter.format(suppression.suppressedGroups)}</strong>. Grupos visibles:{' '}
              <strong>{numberFormatter.format(progressRows.length)}</strong>.
            </p>
          ) : null}
          {suppression.mode === 'full' ? (
            <p className="mt-1">
              {aggregateOnlyVisible
                ? 'Todos los segmentos de este corte quedaron por debajo del umbral y se ocultaron para proteger el anonimato. Aun así, mostramos el agregado general de la campaña porque el total enviado sí supera el umbral.'
                : 'Todos los segmentos de este corte quedaron por debajo del umbral y se ocultaron para proteger el anonimato.'}
            </p>
          ) : null}
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          No se recibió configuración de anonimización para este corte. Los datos mostrados pueden estar incompletos.
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Participantes"
          value={
            suppression.metricsUnavailable && !aggregateVisible
              ? 'N/D'
              : numberFormatter.format(progress?.totals.totalRespondents ?? 0)
          }
          helper={
            suppression.metricsUnavailable && !aggregateVisible
              ? 'No visible por anonimización del corte seleccionado.'
              : aggregateOnlyVisible
                ? 'Mostramos solo el agregado general de la campaña; los cortes por grupo siguen ocultos.'
              : suppression.metricsArePartial
                ? 'Solo participantes dentro de segmentos visibles.'
                : 'Total de participantes activos en el scope visible.'
          }
        />
        <MetricCard
          label="Iniciaron"
          value={
            suppression.metricsUnavailable && !aggregateVisible
              ? 'N/D'
              : numberFormatter.format(progress?.totals.startedRespondents ?? 0)
          }
          helper={
            suppression.metricsUnavailable && !aggregateVisible
              ? 'No visible por anonimización del corte seleccionado.'
              : aggregateOnlyVisible
                ? 'Mostramos solo el agregado general de la campaña; los cortes por grupo siguen ocultos.'
              : suppression.metricsArePartial
                ? 'Solo respuestas iniciadas en segmentos visibles.'
                : 'Respuestas con sesión iniciada.'
          }
        />
        <MetricCard
          label="Enviaron"
          value={
            suppression.metricsUnavailable && !aggregateVisible
              ? 'N/D'
              : numberFormatter.format(progress?.totals.submittedRespondents ?? 0)
          }
          helper={
            suppression.metricsUnavailable && !aggregateVisible
              ? 'No visible por anonimización del corte seleccionado.'
              : aggregateOnlyVisible
                ? 'Mostramos solo el agregado general de la campaña; los cortes por grupo siguen ocultos.'
              : suppression.metricsArePartial
                ? 'Solo envíos de segmentos visibles.'
                : 'Respuestas completadas y enviadas.'
          }
        />
        <MetricCard
          label="Completado"
          value={
            suppression.metricsUnavailable && !aggregateVisible
              ? 'N/D'
              : toPercent(progress?.totals.completionRate ?? 0)
          }
          helper={
            suppression.metricsUnavailable && !aggregateVisible
              ? 'No visible por anonimización del corte seleccionado.'
              : aggregateOnlyVisible
                ? 'Mostramos solo el agregado general de la campaña; los cortes por grupo siguen ocultos.'
              : suppression.metricsArePartial
                ? 'Calculado solo con segmentos visibles.'
                : 'Enviados / total visible.'
          }
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <article className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-ink">Progreso por grupo</h2>
          {progressRows.length > 0 ? (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Grupo</th>
                    <th className="px-3 py-2 font-semibold">Total</th>
                    <th className="px-3 py-2 font-semibold">Iniciaron</th>
                    <th className="px-3 py-2 font-semibold">Enviaron</th>
                    <th className="px-3 py-2 font-semibold">Completado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {progressRows.map((row) => (
                    <tr key={row.groupKey}>
                      <td className="px-3 py-2 text-slate-700">{row.groupLabel}</td>
                      <td className="px-3 py-2 text-slate-700">
                        {numberFormatter.format(row.totalRespondents)}
                      </td>
                      <td className="px-3 py-2 text-slate-700">
                        {numberFormatter.format(row.startedRespondents)}
                      </td>
                      <td className="px-3 py-2 text-slate-700">
                        {numberFormatter.format(row.submittedRespondents)}
                      </td>
                      <td className="px-3 py-2 text-slate-700">{toPercent(row.completionRate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : suppression.mode === 'full' ? (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              No mostramos cortes por grupo porque todos quedaron por debajo del umbral de anonimato ({numberFormatter.format(suppression.anonymityMinCount ?? 0)} respuestas enviadas).
            </p>
          ) : (
            <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-600">
              Aún no hay grupos visibles para este corte (puede faltar volumen mínimo para anonimización).
            </p>
          )}
        </article>

        <article className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-ink">Resumen de resultados</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <p className="text-xs uppercase tracking-wide text-slate-500">Grupos visibles</p>
              <p className="text-lg font-semibold text-ink">{numberFormatter.format(overallRows.length)}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <p className="text-xs uppercase tracking-wide text-slate-500">Respuestas numéricas</p>
              <p className="text-lg font-semibold text-ink">{numberFormatter.format(totalNumericAnswers)}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <p className="text-xs uppercase tracking-wide text-slate-500">Grupos suprimidos</p>
              <p className="text-lg font-semibold text-ink">{numberFormatter.format(suppressedGroups)}</p>
            </div>
          </div>
          {overallRows.length > 0 ? (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Grupo</th>
                    <th className="px-3 py-2 font-semibold">Respondentes</th>
                    <th className="px-3 py-2 font-semibold">Respuestas</th>
                    <th className="px-3 py-2 font-semibold">Promedio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {overallRows.map((row) => (
                    <tr key={row.groupKey}>
                      <td className="px-3 py-2 text-slate-700">{row.groupLabel}</td>
                      <td className="px-3 py-2 text-slate-700">
                        {numberFormatter.format(row.submittedRespondents)}
                      </td>
                      <td className="px-3 py-2 text-slate-700">{numberFormatter.format(row.answerCount)}</td>
                      <td className="px-3 py-2 text-slate-700">{toAverage(row.averageScore)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : suppression.mode === 'full' ? (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Los resultados agregados no están disponibles porque no hay segmentos que superen el umbral de anonimato.
            </p>
          ) : (
            <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-600">
              Todavía no hay resultados agregados visibles.
            </p>
          )}
        </article>
      </div>

      <article className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-ink">Promedios por sección</h2>
        {sectionRows.length > 0 ? (
          <div className="max-h-80 overflow-auto rounded-xl border border-slate-200">
            <table className="min-w-full text-left text-sm">
              <thead className="sticky top-0 bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
                <tr>
                  <th className="px-3 py-2 font-semibold">Grupo</th>
                  <th className="px-3 py-2 font-semibold">Sección</th>
                  <th className="px-3 py-2 font-semibold">Respuestas</th>
                  <th className="px-3 py-2 font-semibold">Promedio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sectionRows.map((row, index) => (
                  <tr key={`${row.groupKey}:${row.sectionKey}:${index}`}>
                    <td className="px-3 py-2 text-slate-700">{row.groupKey}</td>
                    <td className="px-3 py-2 text-slate-700">{row.sectionKey}</td>
                    <td className="px-3 py-2 text-slate-700">{numberFormatter.format(row.answerCount)}</td>
                    <td className="px-3 py-2 text-slate-700">{toAverage(row.averageScore)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : suppression.mode === 'full' ? (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            No hay detalle por sección disponible por anonimización del corte actual.
          </p>
        ) : (
          <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-600">
            No hay datos por sección para el filtro actual.
          </p>
        )}
      </article>

      <article className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-ink">Promedios por pregunta</h2>
        {questionRows.length > 0 ? (
          <div className="max-h-80 overflow-auto rounded-xl border border-slate-200">
            <table className="min-w-full text-left text-sm">
              <thead className="sticky top-0 bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
                <tr>
                  <th className="px-3 py-2 font-semibold">Grupo</th>
                  <th className="px-3 py-2 font-semibold">Sección</th>
                  <th className="px-3 py-2 font-semibold">Pregunta</th>
                  <th className="px-3 py-2 font-semibold">Respuestas</th>
                  <th className="px-3 py-2 font-semibold">Promedio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {questionRows.map((row, index) => (
                  <tr key={`${row.groupKey}:${row.sectionKey}:${row.questionKey}:${index}`}>
                    <td className="px-3 py-2 text-slate-700">{row.groupKey}</td>
                    <td className="px-3 py-2 text-slate-700">{row.sectionKey}</td>
                    <td className="px-3 py-2 text-slate-700">{row.questionKey}</td>
                    <td className="px-3 py-2 text-slate-700">{numberFormatter.format(row.answerCount)}</td>
                    <td className="px-3 py-2 text-slate-700">{toAverage(row.averageScore)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : suppression.mode === 'full' ? (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            No hay detalle por pregunta disponible por anonimización del corte actual.
          </p>
        ) : (
          <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-600">
            No hay datos por pregunta para el filtro actual.
          </p>
        )}
      </article>

      <article className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-ink">Exportación de resultados</h2>
          <button
            type="button"
            onClick={() => void refreshExportJobs(groupBy)}
            disabled={isRefreshingExports}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100"
          >
            {isRefreshingExports ? 'Actualizando exportaciones...' : 'Actualizar exportaciones'}
          </button>
        </div>

        <p className="text-xs text-slate-600">
          Formatos soportados actualmente: {formatSupportedDashboardExportFormats(exportSupportedFormats)}.
        </p>
        {!canManage ? (
          <p className="text-xs text-slate-500">
            Solo ADMIN puede crear y descargar exportaciones.
          </p>
        ) : null}
        <p className="text-xs text-slate-500">
          Última actualización de exportaciones:{' '}
          {lastExportRefreshAt ? dateTimeFormatter.format(lastExportRefreshAt) : 'Sin registro'}.
        </p>

        {suppression.metricsArePartial ? (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {aggregateOnlyVisible
              ? 'La exportación incluirá el agregado general visible de la campaña, pero no desgloses por grupo suprimidos por anonimato.'
              : 'La exportación incluye únicamente segmentos visibles según el umbral de anonimato.'}
          </p>
        ) : null}

        {exportError ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            <p>{exportError}</p>
            <button
              type="button"
              onClick={() => void refreshExportJobs(groupBy)}
              disabled={isRefreshingExports}
              className="mt-2 rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-xs font-medium text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-70"
            >
              Reintentar carga de exportaciones
            </button>
          </div>
        ) : null}

        {latestExportJob ? (
          <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${
                  exportStatusPresentation[latestExportJob.status].className
                }`}
              >
                {exportStatusPresentation[latestExportJob.status].label}
              </span>
              <span className="text-xs text-slate-600">Último job: {latestExportJob.id}</span>
            </div>
            <div className="grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
              <p>
                <span className="font-medium">Creado:</span> {formatDateTime(latestExportJob.createdAt)}
              </p>
              <p>
                <span className="font-medium">Actualizado:</span>{' '}
                {formatDateTime(latestExportJob.updatedAt)}
              </p>
              <p>
                <span className="font-medium">Iniciado:</span> {formatDateTime(latestExportJob.startedAt)}
              </p>
              <p>
                <span className="font-medium">Completado:</span>{' '}
                {formatDateTime(latestExportJob.completedAt)}
              </p>
            </div>
            {latestExportJob.status === 'FAILED' && latestExportJob.errorMessage ? (
              <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {latestExportJob.errorMessage}
              </p>
            ) : null}
            {latestExportStatusMessage ? (
              <p role="status" aria-live="polite" className="text-xs text-slate-600">
                {latestExportStatusMessage}
              </p>
            ) : null}
            {isDashboardExportDownloadReady(latestExportJob) ? (
              <a
                href={resolveDownloadUrl(latestExportJob.downloadUrl) ?? '#'}
                target="_blank"
                rel="noreferrer"
                className="inline-flex rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-emerald-700"
              >
                Descargar último archivo
              </a>
            ) : null}
            {shouldPollExports ? (
              <p className="text-xs text-slate-500">
                El estado se actualizará automáticamente cada 5 segundos.
              </p>
            ) : null}
          </div>
        ) : (
          <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-600">
            Aún no se generó un archivo para este filtro. Usa &quot;Exportar XLSX&quot; para iniciar la exportación.
          </p>
        )}

        {exportJobs.length > 0 ? (
          <div className="max-h-80 overflow-auto rounded-xl border border-slate-200">
            <table className="min-w-full text-left text-sm">
              <thead className="sticky top-0 bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
                <tr>
                  <th className="px-3 py-2 font-semibold">Job</th>
                  <th className="px-3 py-2 font-semibold">Formato</th>
                  <th className="px-3 py-2 font-semibold">Estado</th>
                  <th className="px-3 py-2 font-semibold">Intentos</th>
                  <th className="px-3 py-2 font-semibold">Creado</th>
                  <th className="px-3 py-2 font-semibold">Completado</th>
                  <th className="px-3 py-2 font-semibold">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {exportJobs.map((job) => {
                  const downloadUrl = resolveDownloadUrl(job.downloadUrl);
                  const actionLabel =
                    job.status === 'PENDING'
                      ? 'En cola'
                      : job.status === 'PROCESSING'
                        ? 'Procesando'
                        : job.status === 'FAILED' && job.nextRetryAt && job.attemptCount < job.maxAttempts
                          ? `Reintento ${formatDateTime(job.nextRetryAt)}`
                          : job.status === 'FAILED'
                            ? 'Fallido'
                            : 'Sin archivo';
                  return (
                    <tr key={job.id}>
                      <td className="px-3 py-2 text-slate-700">{job.id}</td>
                      <td className="px-3 py-2 text-slate-700">{job.format}</td>
                      <td className="px-3 py-2">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${
                            exportStatusPresentation[job.status].className
                          }`}
                        >
                          {exportStatusPresentation[job.status].label}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-slate-700">
                        {numberFormatter.format(job.attemptCount)} / {numberFormatter.format(job.maxAttempts)}
                      </td>
                      <td className="px-3 py-2 text-slate-700">{formatDateTime(job.createdAt)}</td>
                      <td className="px-3 py-2 text-slate-700">{formatDateTime(job.completedAt)}</td>
                      <td className="px-3 py-2">
                        {isDashboardExportDownloadReady(job) && downloadUrl ? (
                          <a
                            href={downloadUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex rounded-lg border border-emerald-300 bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100"
                          >
                            Descargar
                          </a>
                        ) : (
                          <span className="text-xs text-slate-500">{actionLabel}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : null}
      </article>
        </>
      ) : null}
    </section>
  );
}

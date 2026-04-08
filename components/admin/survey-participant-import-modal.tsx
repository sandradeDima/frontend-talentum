'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { extractErrorMessage } from '@/lib/auth-shared';
import {
  formatFileSize,
  resolveRespondentImportMimeType
} from '@/lib/survey-operations';
import { importSurveyRespondentsClient } from '@/services/survey-operations.client';
import { ApiRequestError } from '@/types/api';
import type { RespondentCredentialType } from '@/types/respondent-survey';
import type {
  ImportSurveyRespondentsResult,
  ImportSurveyRespondentRowError
} from '@/types/survey-operations';

const MAX_IMPORT_FILE_BYTES = 10 * 1024 * 1024;
const MAX_ERROR_ROWS_TO_RENDER = 200;
const MAX_CREDENTIAL_ROWS_TO_RENDER = 30;
const MAX_INVITATION_FAILURE_ROWS_TO_RENDER = 50;
const SAMPLE_TEMPLATE_PATH = '/templates/plantilla-importacion-participantes.xlsx';

const dateTimeFormatter = new Intl.DateTimeFormat('es-BO', {
  dateStyle: 'medium',
  timeStyle: 'short'
});

type SurveyParticipantImportModalProps = {
  isOpen: boolean;
  companySlug: string;
  surveySlug: string;
  onClose: () => void;
  onImportCompleted?: (result: ImportSurveyRespondentsResult) => void;
};

const mapImportApiError = (error: unknown): string => {
  if (error instanceof ApiRequestError) {
    switch (error.mensajeTecnico) {
      case 'SURVEY_CAMPAIGN_NOT_READY':
        return 'La encuesta sigue en BORRADOR. Programa el envío inicial antes de importar participantes.';
      case 'SURVEY_CAMPAIGN_FINISHED':
        return 'La encuesta ya finalizó y no admite nuevas importaciones.';
      case 'RESPONDENT_IMPORT_IDENTIFIER_COLUMN_MISSING':
        return 'No encontramos una columna de documento. Incluye una columna como "Documento", "CI" o "Identificador".';
      case 'EMPTY_RESPONDENT_IMPORT_FILE':
        return 'El archivo está vacío. Revisa su contenido y vuelve a intentar.';
      case 'INVALID_RESPONDENT_IMPORT_FILE':
      case 'INVALID_XLSX_SHEET':
        return 'No pudimos leer el archivo. Usa un CSV/XLSX válido y vuelve a intentar.';
      case 'INVALID_IMPORT_BASE64':
        return 'No pudimos procesar el archivo cargado. Vuelve a seleccionarlo e intenta de nuevo.';
      case 'INVALID_CREDENTIAL_EXPIRATION':
        return 'La fecha de expiración de credenciales no es válida.';
      case 'CREDENTIAL_EXPIRATION_MUST_BE_FUTURE':
        return 'La fecha de expiración de credenciales debe estar en el futuro.';
      case 'ROLE_FORBIDDEN':
      case 'COMPANY_SCOPE_FORBIDDEN':
        return 'No tienes permisos para importar participantes en esta encuesta.';
      default:
        return error.message;
    }
  }

  return extractErrorMessage(error);
};

const rowErrorKey = (row: ImportSurveyRespondentRowError) => {
  return `${row.rowNumber}:${row.identifier ?? 'sin-id'}:${row.errors.join('|')}`;
};

const buildFileFingerprint = (
  file: File | null,
  options: {
    generateCredentials: boolean;
    credentialType: RespondentCredentialType;
    credentialExpiresAt: string;
    regenerateCredentials: boolean;
    sendInvitations: boolean;
    includeRawCredentials: boolean;
  }
): string | null => {
  if (!file) {
    return null;
  }

  return [
    file.name,
    file.size,
    file.lastModified,
    options.generateCredentials,
    options.credentialType,
    options.credentialExpiresAt,
    options.regenerateCredentials,
    options.sendInvitations,
    options.includeRawCredentials
  ].join('|');
};

export function SurveyParticipantImportModal({
  isOpen,
  companySlug,
  surveySlug,
  onClose,
  onImportCompleted
}: SurveyParticipantImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [generateCredentials, setGenerateCredentials] = useState(true);
  const [credentialType, setCredentialType] = useState<RespondentCredentialType>('TOKEN');
  const [credentialExpiresAt, setCredentialExpiresAt] = useState('');
  const [regenerateCredentials, setRegenerateCredentials] = useState(false);
  const [sendInvitations, setSendInvitations] = useState(false);
  const [includeRawCredentials, setIncludeRawCredentials] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [validationResult, setValidationResult] =
    useState<ImportSurveyRespondentsResult | null>(null);
  const [importResult, setImportResult] = useState<ImportSurveyRespondentsResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [validatedFingerprint, setValidatedFingerprint] = useState<string | null>(null);

  const options = useMemo(
    () => ({
      generateCredentials,
      credentialType,
      credentialExpiresAt,
      regenerateCredentials,
      sendInvitations,
      includeRawCredentials
    }),
    [
      generateCredentials,
      credentialType,
      credentialExpiresAt,
      regenerateCredentials,
      sendInvitations,
      includeRawCredentials
    ]
  );

  const fileFingerprint = useMemo(() => {
    return buildFileFingerprint(file, options);
  }, [file, options]);

  const canImport = Boolean(
    file &&
      fileFingerprint &&
      validatedFingerprint &&
      fileFingerprint === validatedFingerprint &&
      !isValidating &&
      !isImporting
  );

  const clearExecutionState = useCallback(() => {
    setRequestError(null);
    setValidationResult(null);
    setImportResult(null);
    setValidatedFingerprint(null);
  }, []);

  const resetFlow = useCallback(() => {
    setFile(null);
    setGenerateCredentials(true);
    setCredentialType('TOKEN');
    setCredentialExpiresAt('');
    setRegenerateCredentials(false);
    setSendInvitations(false);
    setIncludeRawCredentials(false);
    clearExecutionState();
  }, [clearExecutionState]);

  useEffect(() => {
    if (!isOpen) {
      resetFlow();
    }
  }, [isOpen, resetFlow]);

  if (!isOpen) {
    return null;
  }

  const validateSelectedFile = (): string | null => {
    if (!file) {
      return 'Selecciona un archivo CSV, XLS o XLSX antes de continuar.';
    }

    if (file.size <= 0) {
      return 'El archivo seleccionado está vacío.';
    }

    if (file.size > MAX_IMPORT_FILE_BYTES) {
      return `El archivo supera el límite recomendado de ${formatFileSize(
        MAX_IMPORT_FILE_BYTES
      )}.`;
    }

    const mimeType = resolveRespondentImportMimeType({
      fileName: file.name,
      mimeType: file.type
    });

    if (!mimeType) {
      return 'Formato no soportado. Usa un archivo CSV, XLS o XLSX.';
    }

    return null;
  };

  const runImport = async (dryRun: boolean) => {
    const fileValidationMessage = validateSelectedFile();
    if (fileValidationMessage) {
      setRequestError(fileValidationMessage);
      return;
    }

    if (sendInvitations && !generateCredentials) {
      setRequestError(
        'Para enviar invitaciones debes mantener habilitada la generación de credenciales.'
      );
      return;
    }

    setRequestError(null);

    if (dryRun) {
      setIsValidating(true);
    } else {
      setIsImporting(true);
    }

    try {
      const result = await importSurveyRespondentsClient(companySlug, surveySlug, {
        file: file as File,
        dryRun,
        generateCredentials,
        credentialType,
        credentialExpiresAt: credentialExpiresAt.trim() || undefined,
        regenerateCredentials,
        sendInvitations: dryRun ? false : sendInvitations,
        includeRawCredentials
      });

      if (dryRun) {
        setValidationResult(result);
        setImportResult(null);
        setValidatedFingerprint(fileFingerprint);
      } else {
        setImportResult(result);
        onImportCompleted?.(result);
      }
    } catch (error) {
      setRequestError(mapImportApiError(error));
    } finally {
      if (dryRun) {
        setIsValidating(false);
      } else {
        setIsImporting(false);
      }
    }
  };

  const errorSource =
    importResult?.errors && importResult.errors.length > 0
      ? importResult.errors
      : validationResult?.errors ?? [];
  const displayedErrors = errorSource.slice(0, MAX_ERROR_ROWS_TO_RENDER);
  const hiddenErrorsCount = Math.max(0, errorSource.length - displayedErrors.length);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="w-full max-w-5xl rounded-2xl border border-slate-200 bg-white p-5 shadow-lg">
        <header className="space-y-2">
          <h3 className="text-lg font-semibold text-ink">Importar participantes</h3>
          <p className="text-sm text-slate-600">
            Sube un archivo y valida la estructura antes de ejecutar la importación definitiva.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <a
              href={SAMPLE_TEMPLATE_PATH}
              download
              className="inline-flex rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Descargar plantilla Excel
            </a>
            <p className="text-xs text-slate-500">
              Columnas base: <span className="font-medium">Documento, NombreCompleto, email, gerencia, centro</span>. Extras sugeridos: <span className="font-medium">edad, NivelCargo, telefono</span> y más identificadores.
            </p>
          </div>
        </header>

        <section className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Archivo de participantes</label>
              <input
                type="file"
                accept=".csv,.xls,.xlsx,text/csv,application/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                onChange={(event) => {
                  const selected = event.target.files?.[0] ?? null;
                  setFile(selected);
                  clearExecutionState();
                }}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-slate-200 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-300"
              />
              {file ? (
                <p className="text-xs text-slate-500">
                  Seleccionado: <span className="font-medium text-slate-700">{file.name}</span> (
                  {formatFileSize(file.size)})
                </p>
              ) : (
                <p className="text-xs text-slate-500">Formatos permitidos: CSV, XLS y XLSX.</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">
                Expiración de credenciales (opcional)
              </label>
              <input
                type="datetime-local"
                value={credentialExpiresAt}
                onChange={(event) => {
                  setCredentialExpiresAt(event.target.value);
                  clearExecutionState();
                }}
                disabled={!generateCredentials}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-brand transition focus:ring-2 disabled:bg-slate-100"
              />
              <p className="text-xs text-slate-500">
                Si no defines una fecha, se usa la expiración por defecto de la campaña.
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <label className="flex items-start gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={generateCredentials}
                onChange={(event) => {
                  const checked = event.target.checked;
                  setGenerateCredentials(checked);

                  if (!checked) {
                    setSendInvitations(false);
                    setRegenerateCredentials(false);
                    setIncludeRawCredentials(false);
                  }

                  clearExecutionState();
                }}
                className="mt-0.5"
              />
              Generar credenciales durante la importación
            </label>

            <label className="flex items-start gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={sendInvitations}
                onChange={(event) => {
                  const checked = event.target.checked;
                  setSendInvitations(checked);

                  if (checked) {
                    setRegenerateCredentials(true);
                  }

                  clearExecutionState();
                }}
                disabled={!generateCredentials}
                className="mt-0.5"
              />
              Enviar invitaciones por correo después de generar credenciales
            </label>

            <label className="flex items-start gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={regenerateCredentials}
                onChange={(event) => {
                  setRegenerateCredentials(event.target.checked);
                  clearExecutionState();
                }}
                disabled={!generateCredentials || sendInvitations}
                className="mt-0.5"
              />
              Forzar credenciales nuevas (revoca credenciales activas previas)
            </label>

            <label className="flex items-start gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={includeRawCredentials}
                onChange={(event) => {
                  setIncludeRawCredentials(event.target.checked);
                  clearExecutionState();
                }}
                disabled={!generateCredentials}
                className="mt-0.5"
              />
              Incluir credenciales en texto plano en la respuesta y en el correo
            </label>
          </div>

          <div className="mt-3">
            <label className="text-sm font-medium text-slate-700">Tipo de credencial</label>
            <select
              value={credentialType}
              onChange={(event) => {
                setCredentialType(event.target.value as RespondentCredentialType);
                clearExecutionState();
              }}
              disabled={!generateCredentials}
              className="mt-1 w-full max-w-sm rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-brand transition focus:ring-2 disabled:bg-slate-100"
            >
              <option value="TOKEN">TOKEN (magic link por correo)</option>
              <option value="PIN">CODIGO (documento del respondente)</option>
            </select>
          </div>
        </section>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void runImport(true)}
            disabled={isValidating || isImporting}
            className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition hover:bg-brandDark disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isValidating ? 'Validando archivo...' : 'Validar archivo'}
          </button>

          <button
            type="button"
            onClick={() => void runImport(false)}
            disabled={!canImport}
            className="rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isImporting ? 'Importando participantes...' : 'Importar participantes'}
          </button>

          <button
            type="button"
            onClick={resetFlow}
            disabled={isValidating || isImporting}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
          >
            Cargar otro archivo
          </button>

          <button
            type="button"
            onClick={onClose}
            disabled={isValidating || isImporting}
            className="ml-auto rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
          >
            Cerrar
          </button>
        </div>

        {requestError ? (
          <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {requestError}
          </p>
        ) : null}

        {validationResult ? (
          <section className="mt-4 rounded-xl border border-sky-200 bg-sky-50 p-4">
            <h4 className="text-sm font-semibold text-sky-900">Resumen de validación</h4>
            <p className="mt-1 text-sm text-sky-900/90">
              Total filas: {validationResult.summary.totalRows} | Válidas:{' '}
              {validationResult.summary.validRows} | Con errores:{' '}
              {validationResult.summary.invalidRows}
            </p>
            <p className="mt-1 text-xs text-sky-800">
              Si el resultado te parece correcto, ejecuta la importación definitiva.
            </p>
          </section>
        ) : null}

        {importResult ? (
          <section className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <h4 className="text-sm font-semibold text-emerald-900">Importación completada</h4>
            <p className="mt-1 text-sm text-emerald-900/90">
              Filas totales: {importResult.summary.totalRows} | Creados:{' '}
              {importResult.summary.createdRespondents ?? 0} | Actualizados:{' '}
              {importResult.summary.updatedRespondents ?? 0}
            </p>
            <p className="mt-1 text-sm text-emerald-900/90">
              Credenciales: {importResult.summary.credentialsGenerated ?? 0} | Invitaciones
              enviadas: {importResult.summary.invitationsSent ?? 0} | Fallos de invitación:{' '}
              {importResult.summary.invitationFailures ?? 0}
            </p>
            {importResult.summary.invalidRows > 0 ? (
              <p className="mt-1 text-xs text-emerald-800">
                La importación tuvo errores parciales. Revisa el detalle por fila para reintentar.
              </p>
            ) : null}
          </section>
        ) : null}

        {displayedErrors.length > 0 ? (
          <section className="mt-4 overflow-hidden rounded-xl border border-amber-200">
            <header className="border-b border-amber-200 bg-amber-50 px-4 py-2">
              <h4 className="text-sm font-semibold text-amber-900">
                Filas con errores ({errorSource.length})
              </h4>
            </header>
            <div className="max-h-56 overflow-auto bg-white">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Fila</th>
                    <th className="px-3 py-2 font-semibold">Documento</th>
                    <th className="px-3 py-2 font-semibold">Errores</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {displayedErrors.map((row) => (
                    <tr key={rowErrorKey(row)}>
                      <td className="px-3 py-2 text-slate-700">{row.rowNumber}</td>
                      <td className="px-3 py-2 text-slate-700">
                        {row.identifier ?? 'Sin documento'}
                      </td>
                      <td className="px-3 py-2 text-slate-700">{row.errors.join(' | ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {hiddenErrorsCount > 0 ? (
              <p className="border-t border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-800">
                Mostrando {displayedErrors.length} filas. Aún existen {hiddenErrorsCount} filas
                con error.
              </p>
            ) : null}
          </section>
        ) : null}

        {importResult?.invitationFailures && importResult.invitationFailures.length > 0 ? (
          <section className="mt-4 overflow-hidden rounded-xl border border-rose-200">
            <header className="border-b border-rose-200 bg-rose-50 px-4 py-2">
              <h4 className="text-sm font-semibold text-rose-900">
                Fallos de invitación ({importResult.invitationFailures.length})
              </h4>
            </header>
            <div className="max-h-44 overflow-auto bg-white">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Respondente</th>
                    <th className="px-3 py-2 font-semibold">Motivo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {importResult.invitationFailures
                    .slice(0, MAX_INVITATION_FAILURE_ROWS_TO_RENDER)
                    .map((failure) => (
                      <tr key={`${failure.respondentId}:${failure.reason}`}>
                        <td className="px-3 py-2 text-slate-700">{failure.respondentId}</td>
                        <td className="px-3 py-2 text-slate-700">{failure.reason}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        {importResult?.credentials && importResult.credentials.length > 0 ? (
          <section className="mt-4 overflow-hidden rounded-xl border border-slate-200">
            <header className="border-b border-slate-200 bg-slate-50 px-4 py-2">
              <h4 className="text-sm font-semibold text-slate-900">
                Vista de credenciales ({importResult.credentials.length})
              </h4>
            </header>
            <div className="max-h-52 overflow-auto bg-white">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Documento</th>
                    <th className="px-3 py-2 font-semibold">Tipo</th>
                    <th className="px-3 py-2 font-semibold">Expira</th>
                    <th className="px-3 py-2 font-semibold">Reusada</th>
                    <th className="px-3 py-2 font-semibold">Credencial</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {importResult.credentials
                    .slice(0, MAX_CREDENTIAL_ROWS_TO_RENDER)
                    .map((credential) => (
                      <tr key={credential.respondentId}>
                        <td className="px-3 py-2 text-slate-700">
                          {credential.identifier ?? credential.respondentId}
                        </td>
                        <td className="px-3 py-2 text-slate-700">{credential.credentialType}</td>
                        <td className="px-3 py-2 text-slate-700">
                          {dateTimeFormatter.format(new Date(credential.expiresAt))}
                        </td>
                        <td className="px-3 py-2 text-slate-700">
                          {credential.reused ? 'Sí' : 'No'}
                        </td>
                        <td className="px-3 py-2 text-slate-700">
                          {credential.rawCredential ?? 'No incluida'}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}

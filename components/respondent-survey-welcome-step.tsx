'use client';

import type { SurveyCampaignExecutionContext } from '@/types/respondent-survey';

type RespondentSurveyWelcomeStepProps = {
  campaign: SurveyCampaignExecutionContext;
  respondentName: string;
  sessionExpiresAtLabel: string;
  isStarting: boolean;
  onStart: () => void;
  onChangeAccess: () => void;
};

const splitNonEmptyLines = (value: string): string[] => {
  return value
    .split(/\r?\n/g)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
};

const normalizeUrlCandidate = (rawValue: string): string => {
  return rawValue.replace(/[),.;]+$/g, '');
};

const extractUrls = (value: string): string[] => {
  const matches = value.match(/https?:\/\/[^\s]+/g);
  if (!matches) {
    return [];
  }

  return matches.map(normalizeUrlCandidate);
};

const toYouTubeEmbedUrl = (urlValue: URL): string | null => {
  const host = urlValue.hostname.toLowerCase();

  if (host.includes('youtu.be')) {
    const videoId = urlValue.pathname.replace(/\//g, '');
    if (!videoId) {
      return null;
    }

    return `https://www.youtube.com/embed/${videoId}`;
  }

  if (host.includes('youtube.com')) {
    const videoId = urlValue.searchParams.get('v');
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}`;
    }

    const shortsMatch = urlValue.pathname.match(/\/shorts\/([^/]+)/);
    if (shortsMatch?.[1]) {
      return `https://www.youtube.com/embed/${shortsMatch[1]}`;
    }

    const embedMatch = urlValue.pathname.match(/\/embed\/([^/]+)/);
    if (embedMatch?.[1]) {
      return `https://www.youtube.com/embed/${embedMatch[1]}`;
    }
  }

  return null;
};

const toVimeoEmbedUrl = (urlValue: URL): string | null => {
  const host = urlValue.hostname.toLowerCase();
  if (!host.includes('vimeo.com')) {
    return null;
  }

  const pathSegments = urlValue.pathname.split('/').filter(Boolean);
  const numericSegment = pathSegments.find((segment) => /^\d+$/.test(segment));

  if (!numericSegment) {
    return null;
  }

  return `https://player.vimeo.com/video/${numericSegment}`;
};

const resolveEmbeddedVideo = (urls: string[]): { sourceUrl: string; embedUrl: string } | null => {
  for (const candidate of urls) {
    try {
      const parsed = new URL(candidate);
      const youtubeEmbed = toYouTubeEmbedUrl(parsed);
      if (youtubeEmbed) {
        return {
          sourceUrl: candidate,
          embedUrl: youtubeEmbed
        };
      }

      const vimeoEmbed = toVimeoEmbedUrl(parsed);
      if (vimeoEmbed) {
        return {
          sourceUrl: candidate,
          embedUrl: vimeoEmbed
        };
      }
    } catch {
      continue;
    }
  }

  return null;
};

const INTRO_PARAGRAPH_LIMIT = 8;
const SCALE_LINE_LIMIT = 4;

export function RespondentSurveyWelcomeStep({
  campaign,
  respondentName,
  sessionExpiresAtLabel,
  isStarting,
  onStart,
  onChangeAccess
}: RespondentSurveyWelcomeStepProps) {
  const introLines = splitNonEmptyLines(campaign.content.introGeneral);
  const scaleLines = introLines
    .filter((line) => /\d+\s*=/.test(line))
    .slice(0, SCALE_LINE_LIMIT);
  const introParagraphs = introLines
    .filter((line) => !/\d+\s*=/.test(line))
    .slice(0, INTRO_PARAGRAPH_LIMIT);

  const introUrls = extractUrls(campaign.content.introGeneral);
  const embeddedVideo = resolveEmbeddedVideo(introUrls);

  return (
    <article className="space-y-5 rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-emerald-950 sm:p-5">
      <header className="space-y-2">
        <h2 className="text-lg font-semibold">Bienvenido/a, {respondentName}</h2>
        <p className="text-sm">
          Tu acceso es válido para la campaña <span className="font-semibold">{campaign.name}</span>.
        </p>
        <p className="text-sm text-emerald-900/90">
          Antes de iniciar, revisa estas indicaciones para responder con calma y completar la
          encuesta de forma correcta.
        </p>
      </header>

      <section className="rounded-xl border border-emerald-200 bg-white/80 p-4 text-sm text-slate-700">
        <h3 className="font-semibold text-slate-900">Indicaciones</h3>
        <ul className="mt-2 space-y-1">
          <li>Responde según tu experiencia real en el trabajo.</li>
          <li>No existen respuestas correctas o incorrectas.</li>
          <li>Intenta completar la encuesta en una sola sesión.</li>
          <li>Tu sesión actual estará activa hasta: {sessionExpiresAtLabel}.</li>
        </ul>
      </section>

      {introParagraphs.length > 0 ? (
        <section className="space-y-2 rounded-xl border border-emerald-200 bg-white/80 p-4 text-sm text-slate-700">
          <h3 className="font-semibold text-slate-900">Mensaje de bienvenida</h3>
          {introParagraphs.map((line, index) => (
            <p key={`${line}-${index}`}>{line}</p>
          ))}
        </section>
      ) : null}

      {scaleLines.length > 0 ? (
        <section className="rounded-xl border border-emerald-200 bg-white/80 p-4 text-sm text-slate-700">
          <h3 className="font-semibold text-slate-900">Escala de respuesta</h3>
          <ul className="mt-2 space-y-1">
            {scaleLines.map((line, index) => (
              <li key={`${line}-${index}`}>{line}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {embeddedVideo ? (
        <section className="rounded-xl border border-emerald-200 bg-white/80 p-4 text-sm text-slate-700">
          <h3 className="font-semibold text-slate-900">Tutorial</h3>
          <p className="mt-1">
            Encontramos un recurso de apoyo en el contenido de la campaña. Puedes verlo antes de
            iniciar.
          </p>
          <div className="mt-3 overflow-hidden rounded-lg border border-slate-200">
            <div className="relative h-0 pb-[56.25%]">
              <iframe
                title="Tutorial de encuesta"
                src={embeddedVideo.embedUrl}
                className="absolute inset-0 h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          </div>
          <a
            href={embeddedVideo.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Abrir tutorial en otra pestaña
          </a>
        </section>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={onStart}
          disabled={isStarting}
          className="w-full rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition hover:bg-brandDark disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
        >
          {isStarting ? 'Iniciando encuesta...' : 'Iniciar encuesta'}
        </button>
      </div>
    </article>
  );
}

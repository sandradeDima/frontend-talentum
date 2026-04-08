'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';

type TutorialVideoGateProps = {
  tutorialVideoUrl: string | null;
  storageKey: string;
  onProceed: () => void;
  isStarting: boolean;
};

type EmbeddedVideo = {
  provider: 'youtube' | 'vimeo';
  sourceUrl: string;
  embedUrl: string;
};

type YouTubePlayerInstance = {
  destroy: () => void;
};

declare global {
  interface Window {
    YT?: {
      Player: new (
        elementId: string,
        config: {
          events?: {
            onStateChange?: (event: { data: number }) => void;
          };
        }
      ) => YouTubePlayerInstance;
      PlayerState?: {
        ENDED?: number;
      };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

const SEEK_TOLERANCE_SECONDS = 1;
const YOUTUBE_API_SCRIPT_ID = 'cooltura-youtube-iframe-api';

const normalizeUrlCandidate = (rawValue: string): string => {
  return rawValue.replace(/[),.;]+$/g, '');
};

const toYouTubeEmbedUrl = (urlValue: URL): string | null => {
  const host = urlValue.hostname.toLowerCase();

  if (host.includes('youtu.be')) {
    const videoId = urlValue.pathname.replace(/\//g, '');
    if (!videoId) {
      return null;
    }

    return `https://www.youtube.com/embed/${videoId}?enablejsapi=1&playsinline=1&rel=0`;
  }

  if (host.includes('youtube.com')) {
    const videoId = urlValue.searchParams.get('v');
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}?enablejsapi=1&playsinline=1&rel=0`;
    }

    const shortsMatch = urlValue.pathname.match(/\/shorts\/([^/]+)/);
    if (shortsMatch?.[1]) {
      return `https://www.youtube.com/embed/${shortsMatch[1]}?enablejsapi=1&playsinline=1&rel=0`;
    }

    const embedMatch = urlValue.pathname.match(/\/embed\/([^/]+)/);
    if (embedMatch?.[1]) {
      const query = urlValue.search ? `&${urlValue.search.replace(/^\?/, '')}` : '';
      return `https://www.youtube.com/embed/${embedMatch[1]}?enablejsapi=1&playsinline=1&rel=0${query}`;
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

const resolveEmbeddedVideo = (rawUrl: string | null): EmbeddedVideo | null => {
  const candidate = rawUrl?.trim();
  if (!candidate) {
    return null;
  }

  try {
    const parsed = new URL(normalizeUrlCandidate(candidate));
    const youtubeEmbed = toYouTubeEmbedUrl(parsed);
    if (youtubeEmbed) {
      return {
        provider: 'youtube',
        sourceUrl: candidate,
        embedUrl: youtubeEmbed
      };
    }

    const vimeoEmbed = toVimeoEmbedUrl(parsed);
    if (vimeoEmbed) {
      return {
        provider: 'vimeo',
        sourceUrl: candidate,
        embedUrl: vimeoEmbed
      };
    }
  } catch {
    return null;
  }

  return null;
};

const loadYouTubeIframeApi = (): Promise<void> => {
  if (typeof window === 'undefined' || window.YT?.Player) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const existingScript = document.getElementById(YOUTUBE_API_SCRIPT_ID) as HTMLScriptElement | null;
    const previousReady = window.onYouTubeIframeAPIReady;

    window.onYouTubeIframeAPIReady = () => {
      previousReady?.();
      resolve();
    };

    if (existingScript) {
      return;
    }

    const script = document.createElement('script');
    script.id = YOUTUBE_API_SCRIPT_ID;
    script.src = 'https://www.youtube.com/iframe_api';
    script.async = true;
    document.head.appendChild(script);
  });
};

export function TutorialVideoGate({
  tutorialVideoUrl,
  storageKey,
  onProceed,
  isStarting
}: TutorialVideoGateProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const youtubePlayerRef = useRef<YouTubePlayerInstance | null>(null);
  const maxAllowedTimeRef = useRef(0);
  const skipCorrectionRef = useRef(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [hasPlaybackError, setHasPlaybackError] = useState(false);
  const iframeId = useId().replace(/:/g, '');
  const tutorialUrl = tutorialVideoUrl?.trim() ?? '';
  const embeddedVideo = useMemo(() => resolveEmbeddedVideo(tutorialVideoUrl), [tutorialVideoUrl]);
  const hasTutorialVideo = tutorialUrl.length > 0 && (embeddedVideo !== null || !hasPlaybackError);

  const markCompleted = useCallback(() => {
    setIsUnlocked(true);

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(storageKey, 'completed');
    }
  }, [storageKey]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const storedValue = window.localStorage.getItem(storageKey);
    if (storedValue === 'completed') {
      setIsUnlocked(true);
    }
  }, [storageKey]);

  useEffect(() => {
    if (embeddedVideo?.provider !== 'youtube' || isUnlocked || !hasTutorialVideo) {
      youtubePlayerRef.current?.destroy();
      youtubePlayerRef.current = null;
      return;
    }

    let isCancelled = false;

    void loadYouTubeIframeApi().then(() => {
      if (isCancelled || !window.YT?.Player) {
        return;
      }

      youtubePlayerRef.current?.destroy();
      youtubePlayerRef.current = new window.YT.Player(iframeId, {
        events: {
          onStateChange: (event) => {
            const endedState = window.YT?.PlayerState?.ENDED ?? 0;
            if (event.data === endedState) {
              markCompleted();
            }
          }
        }
      });
    });

    return () => {
      isCancelled = true;
      youtubePlayerRef.current?.destroy();
      youtubePlayerRef.current = null;
    };
  }, [embeddedVideo, hasTutorialVideo, iframeId, isUnlocked, markCompleted]);

  const statusCopy = useMemo(() => {
    if (!tutorialUrl.length || !hasTutorialVideo) {
      return {
        message: 'Tutorial no disponible',
        detail:
          'No hay un video tutorial configurado o el archivo no pudo reproducirse. Puedes continuar directamente con la encuesta.',
        showProceedButton: true,
        proceedDisabled: false
      };
    }

    if (embeddedVideo?.provider === 'vimeo' && !isUnlocked) {
      return {
        message: 'Mira el tutorial antes de continuar',
        detail: 'El tutorial está disponible. Cuando termines, puedes continuar con la encuesta.',
        showProceedButton: true,
        proceedDisabled: false
      };
    }

    if (!isUnlocked) {
      return {
        message: 'Finalice el video para acceder a la siguiente etapa',
        detail: null,
        showProceedButton: false,
        proceedDisabled: true
      };
    }

    return {
      message: null,
      detail: null,
      showProceedButton: true,
      proceedDisabled: false
    };
  }, [embeddedVideo, hasTutorialVideo, isUnlocked, tutorialUrl.length]);

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    maxAllowedTimeRef.current = Math.max(maxAllowedTimeRef.current, video.currentTime);
  };

  const handleSeeking = () => {
    const video = videoRef.current;
    if (!video || isUnlocked) {
      return;
    }

    if (skipCorrectionRef.current) {
      skipCorrectionRef.current = false;
      return;
    }

    if (video.currentTime > maxAllowedTimeRef.current + SEEK_TOLERANCE_SECONDS) {
      skipCorrectionRef.current = true;
      video.currentTime = maxAllowedTimeRef.current;
    }
  };

  return (
    <div className="contents">
      <div className="order-1 mx-auto w-full max-w-[520px] overflow-hidden rounded-[1.75rem] border border-white/12 bg-white/6 shadow-cooltura">
        {hasTutorialVideo ? (
          embeddedVideo ? (
            <div className="relative h-0 pb-[56.25%]">
              <iframe
                id={iframeId}
                title="Tutorial de encuesta"
                src={embeddedVideo.embedUrl}
                className="absolute inset-0 h-full w-full bg-[#8a928f]"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          ) : (
            <video
              ref={videoRef}
              src={tutorialVideoUrl ?? undefined}
              controls
              controlsList="nodownload noplaybackrate"
              preload="metadata"
              className="aspect-video w-full bg-[#8a928f] object-cover"
              onEnded={markCompleted}
              onTimeUpdate={handleTimeUpdate}
              onSeeking={handleSeeking}
              onError={() => setHasPlaybackError(true)}
            >
              Tu navegador no soporta reproducción de video HTML5.
            </video>
          )
        ) : (
          <div className="flex aspect-video items-center justify-center bg-[#8a928f] px-6 text-center">
            <div>
              <p className="font-coolturaDisplay text-xl uppercase tracking-[0.08em] text-cooltura-dark">
                Tutorial no disponible
              </p>
              <p className="mt-3 text-sm leading-6 text-cooltura-dark/80">
                El tutorial no está disponible en este momento. Puedes continuar con la encuesta.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="order-3 flex min-h-[72px] w-full flex-col items-center justify-center px-4 pt-1 text-center lg:col-span-2 lg:pt-2">
        {statusCopy.message ? (
          <p className="text-sm font-bold leading-6 text-cooltura-lime sm:text-base">
            {statusCopy.message}
          </p>
        ) : null}

        {statusCopy.detail ? (
          <p className="mt-2 max-w-[520px] text-xs leading-6 text-cooltura-light/62 sm:text-sm">
            {statusCopy.detail}
          </p>
        ) : null}

        {statusCopy.showProceedButton ? (
          <button
            type="button"
            onClick={onProceed}
            disabled={statusCopy.proceedDisabled || isStarting}
            className="cooltura-pill-button mt-2 min-w-[280px]"
          >
            {isStarting ? 'Comenzando...' : 'Comenzar encuesta'}
          </button>
        ) : null}
      </div>
    </div>
  );
}

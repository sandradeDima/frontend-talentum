'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

type TutorialVideoGateProps = {
  tutorialVideoUrl: string | null;
  storageKey: string;
  onProceed: () => void;
  isStarting: boolean;
};

const SEEK_TOLERANCE_SECONDS = 1;

export function TutorialVideoGate({
  tutorialVideoUrl,
  storageKey,
  onProceed,
  isStarting
}: TutorialVideoGateProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const maxAllowedTimeRef = useRef(0);
  const skipCorrectionRef = useRef(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [hasPlaybackError, setHasPlaybackError] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const storedValue = window.localStorage.getItem(storageKey);
    if (storedValue === 'completed') {
      setIsUnlocked(true);
    }
  }, [storageKey]);

  const hasTutorialVideo = tutorialVideoUrl?.trim().length ? !hasPlaybackError : false;

  const statusCopy = useMemo(() => {
    if (!tutorialVideoUrl?.trim().length || hasPlaybackError) {
      return {
        message: 'Tutorial no disponible',
        detail:
          'No hay un video tutorial configurado o el archivo no pudo reproducirse. Puedes continuar directamente con la encuesta.',
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
  }, [hasPlaybackError, isUnlocked, tutorialVideoUrl]);

  const markCompleted = () => {
    setIsUnlocked(true);

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(storageKey, 'completed');
    }
  };

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

'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

type AdminModalProps = {
  children: ReactNode;
  onClose: () => void;
  size?: 'sm' | 'lg';
  dismissible?: boolean;
};

const sizeClassNameMap: Record<NonNullable<AdminModalProps['size']>, string> = {
  sm: 'admin-modal-shell-sm',
  lg: 'admin-modal-shell-lg'
};

export function AdminModal({
  children,
  onClose,
  size = 'sm',
  dismissible = true
}: AdminModalProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = 'hidden';

    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && dismissible) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [dismissible, isMounted, onClose]);

  if (!isMounted) {
    return null;
  }

  return createPortal(
    <div
      className="admin-modal-overlay"
      onMouseDown={(event) => {
        if (dismissible && event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className={`admin-modal-shell ${sizeClassNameMap[size]}`}
      >
        <button
          type="button"
          onClick={onClose}
          disabled={!dismissible}
          className="admin-modal-close"
          aria-label="Cerrar modal"
        >
          Cerrar
        </button>
        <div className="admin-modal-body">{children}</div>
      </div>
    </div>,
    document.body
  );
}

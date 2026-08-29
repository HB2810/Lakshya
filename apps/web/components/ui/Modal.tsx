import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = 'lg',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const previousOverflow = document.body.style.overflow;
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className={`w-full max-h-[calc(100dvh-1.5rem)] bg-white rounded-xl border border-workspace-border shadow-modal overflow-hidden animate-in zoom-in-95 duration-200 ${maxWidthClasses[maxWidth]}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="px-4 py-4 sm:px-6 border-b border-workspace-border flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
            {subtitle && <p className="text-xs text-text-muted mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="flex min-h-11 min-w-11 items-center justify-center text-text-muted hover:text-text-primary hover:bg-workspace-subtle rounded-xl transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 sm:p-6 max-h-[calc(100dvh-11rem)] overflow-y-auto overscroll-contain">{children}</div>
        {footer && <div className="px-4 py-4 sm:px-6 border-t border-workspace-border bg-workspace-subtle flex flex-wrap justify-end gap-3">{footer}</div>}
      </div>
    </div>
  );
};

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export const Drawer: React.FC<DrawerProps> = ({ isOpen, onClose, title, subtitle, children }) => {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs">
      <div
        className="w-full max-w-md bg-white border-l border-workspace-border shadow-2xl h-[100dvh] flex flex-col animate-in slide-in-from-right duration-300"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="px-4 pb-4 pt-[calc(1rem+env(safe-area-inset-top))] sm:px-6 sm:pt-4 border-b border-workspace-border flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
            {subtitle && <p className="text-xs text-text-muted mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="flex min-h-11 min-w-11 items-center justify-center text-text-muted hover:text-text-primary hover:bg-workspace-subtle rounded-xl transition-colors"
            aria-label="Close drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:p-6 flex-1 overflow-y-auto overscroll-contain">{children}</div>
      </div>
    </div>
  );
};

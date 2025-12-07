import { createContext, useContext, useState, useCallback, ReactNode, useRef, useEffect } from 'react';
import { getLogger } from '../utils/logger';

const logger = getLogger('contexts.ToastContext');

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (message: string, type?: ToastType) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const MAX_TOASTS = 5;
const TOAST_DURATION = 5000; // 5 seconds

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const removeToast = useCallback((id: string) => {
    if (!isMountedRef.current) {
      return;
    }
    
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
    logger.debug('Toast removed', { id });
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    if (!isMountedRef.current) {
      return;
    }

    const id = `toast-${Date.now()}-${Math.random()}`;
    const newToast: Toast = { id, message, type };

    setToasts((prev) => {
      const updated = [...prev, newToast];
      // Limit to MAX_TOASTS
      if (updated.length > MAX_TOASTS) {
        return updated.slice(-MAX_TOASTS);
      }
      return updated;
    });

    logger.info('Toast shown', { id, type, message });

    // Auto-dismiss after duration
    setTimeout(() => {
      removeToast(id);
    }, TOAST_DURATION);
  }, [removeToast]);

  const value = {
    toasts,
    showToast,
    removeToast,
  };

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

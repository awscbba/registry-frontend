import { createContext, useContext, useState, ReactNode, useRef, useEffect } from 'react';
import { ToastContainer } from '../components/ToastContainer';
import { getLogger } from '../utils/logger';

const logger = getLogger('contexts.ToastContext');

/**
 * Type definitions for toast notifications
 */
export type ToastType = 'success' | 'error' | 'info' | 'warning';

/**
 * Toast notification interface
 */
export interface Toast {
  /** Unique identifier for the toast */
  id: string;
  /** Message to display in the toast */
  message: string;
  /** Type of toast (determines styling and icon) */
  type: ToastType;
}

/**
 * Toast context type definition
 */
interface ToastContextType {
  /** Array of currently displayed toasts */
  toasts: Toast[];
  /** Function to show a new toast notification */
  showToast: (message: string, type?: ToastType) => void;
  /** Function to manually remove a toast by ID */
  removeToast: (id: string) => void;
}

/**
 * Toast context
 * @private
 */
const ToastContext = createContext<ToastContextType | undefined>(undefined);

/**
 * ToastProvider component that manages toast notification state
 * Provides toast functionality to all child components
 * 
 * Enterprise features:
 * - Memory leak prevention (cleanup timers on unmount)
 * - Toast limit (max 5 toasts)
 * - Structured logging
 * - Auto-dismissal after 5 seconds
 * 
 * @param {Object} props - Component props
 * @param {ReactNode} props.children - Child components
 * @returns {JSX.Element} Provider component
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  
  // Store timer IDs for cleanup
  const timerRefs = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  
  // Track if component is mounted
  const isMountedRef = useRef(true);
  
  // Maximum number of toasts to display
  const MAX_TOASTS = 5;

  /**
   * Show a toast notification
   * @param message - The message to display
   * @param type - The type of toast (success, error, info, warning)
   */
  const showToast = (message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    const toast: Toast = { id, message, type };
    
    logger.debug('Toast shown', {
      toastId: id,
      type,
      message: message.substring(0, 50), // Log first 50 chars
      timestamp: new Date().toISOString()
    });
    
    setToasts((prev) => {
      // Limit number of toasts
      const newToasts = [...prev, toast];
      if (newToasts.length > MAX_TOASTS) {
        const removedToast = newToasts.shift();
        if (removedToast) {
          // Clear timer for removed toast
          const timer = timerRefs.current.get(removedToast.id);
          if (timer) {
            clearTimeout(timer);
            timerRefs.current.delete(removedToast.id);
          }
          logger.debug('Toast removed (limit exceeded)', {
            toastId: removedToast.id,
            timestamp: new Date().toISOString()
          });
        }
      }
      return newToasts.slice(-MAX_TOASTS);
    });

    // Auto-remove after 5 seconds
    const timerId = setTimeout(() => {
      if (isMountedRef.current) {
        removeToast(id);
        logger.debug('Toast auto-dismissed', {
          toastId: id,
          timestamp: new Date().toISOString()
        });
      }
      timerRefs.current.delete(id);
    }, 5000);
    
    // Store timer for cleanup
    timerRefs.current.set(id, timerId);
  };

  /**
   * Remove a toast notification by ID
   * @param id - The ID of the toast to remove
   */
  const removeToast = (id: string) => {
    if (!isMountedRef.current) {
      return;
    }
    
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
    
    // Clear timer if exists
    const timer = timerRefs.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timerRefs.current.delete(id);
    }
    
    logger.debug('Toast manually dismissed', {
      toastId: id,
      timestamp: new Date().toISOString()
    });
  };
  
  // Cleanup all timers on unmount
  useEffect(() => {
    logger.debug('ToastContext initialized', {
      timestamp: new Date().toISOString()
    });
    
    return () => {
      isMountedRef.current = false;
      
      // Clear all pending timers
      timerRefs.current.forEach((timerId) => clearTimeout(timerId));
      timerRefs.current.clear();
      
      logger.debug('ToastContext unmounting, cleared all timers', {
        timestamp: new Date().toISOString()
      });
    };
  }, []);

  const value = {
    toasts,
    showToast,
    removeToast,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

/**
 * Custom hook to access toast functionality
 * Must be used within a ToastProvider
 * @throws Error if used outside ToastProvider
 */
export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

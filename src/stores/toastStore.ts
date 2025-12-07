import { atom } from 'nanostores';
import { getLogger } from '../utils/logger';

const logger = getLogger('stores.toastStore');

/**
 * Toast notification type
 */
export type ToastType = 'success' | 'error' | 'info' | 'warning';

/**
 * Toast notification interface
 */
export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
  timestamp: number;
}

/**
 * Toast Store - Nanostores-based toast notification management
 * 
 * Replaces ToastContext to avoid React Context hydration timing issues with Astro.
 * 
 * Features:
 * - Global toast state accessible from any component
 * - No provider wrapper needed
 * - SSR-safe
 * - Automatic toast cleanup
 * - Toast limit to prevent memory leaks
 */

// Maximum number of toasts to display at once
const MAX_TOASTS = 5;

// Default toast duration (milliseconds)
const DEFAULT_DURATION = 5000;

// Atom for toast list
export const $toasts = atom<Toast[]>([]);

// Map to track toast timeouts for cleanup
const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

/**
 * Generate unique toast ID
 */
function generateToastId(): string {
  return `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Add a new toast notification
 */
export function showToast(
  message: string,
  type: ToastType = 'info',
  duration: number = DEFAULT_DURATION
): string {
  const id = generateToastId();
  const timestamp = Date.now();
  
  logger.info('Toast created', {
    id,
    type,
    message: message.substring(0, 50),
    duration
  });

  const newToast: Toast = {
    id,
    message,
    type,
    duration,
    timestamp
  };

  // Add toast to list
  const currentToasts = $toasts.get();
  
  // Enforce max toasts limit
  if (currentToasts.length >= MAX_TOASTS) {
    // Remove oldest toast
    const oldestToast = currentToasts[0];
    removeToast(oldestToast.id);
    
    logger.warn('Max toasts reached, removing oldest', {
      removedId: oldestToast.id,
      maxToasts: MAX_TOASTS
    });
  }

  $toasts.set([...currentToasts, newToast]);

  // Auto-remove toast after duration
  if (duration > 0) {
    const timeoutId = setTimeout(() => {
      removeToast(id);
    }, duration);
    
    toastTimeouts.set(id, timeoutId);
  }

  return id;
}

/**
 * Remove a toast by ID
 */
export function removeToast(id: string): void {
  logger.info('Toast removed', { id });

  // Clear timeout if exists
  const timeoutId = toastTimeouts.get(id);
  if (timeoutId) {
    clearTimeout(timeoutId);
    toastTimeouts.delete(id);
  }

  // Remove from list
  const currentToasts = $toasts.get();
  $toasts.set(currentToasts.filter(toast => toast.id !== id));
}

/**
 * Clear all toasts
 */
export function clearAllToasts(): void {
  logger.info('Clearing all toasts');

  // Clear all timeouts
  toastTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
  toastTimeouts.clear();

  // Clear toast list
  $toasts.set([]);
}

/**
 * Convenience methods for different toast types
 */
export function showSuccessToast(message: string, duration?: number): string {
  return showToast(message, 'success', duration);
}

export function showErrorToast(message: string, duration?: number): string {
  return showToast(message, 'error', duration);
}

export function showInfoToast(message: string, duration?: number): string {
  return showToast(message, 'info', duration);
}

export function showWarningToast(message: string, duration?: number): string {
  return showToast(message, 'warning', duration);
}

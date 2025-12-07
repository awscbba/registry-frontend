import { useStore } from '@nanostores/react';
import { 
  $toasts, 
  showToast, 
  removeToast, 
  clearAllToasts,
  showSuccessToast,
  showErrorToast,
  showInfoToast,
  showWarningToast,
  type ToastType 
} from '../stores/toastStore';

/**
 * React hook to use toast store in components
 * 
 * This is a thin wrapper around Nanostores that provides a React-friendly API
 * similar to the old useToast hook from ToastContext.
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { showToast, toasts } = useToastStore();
 *   
 *   const handleClick = () => {
 *     showToast('Operation successful!', 'success');
 *   };
 *   
 *   return <button onClick={handleClick}>Do Something</button>;
 * }
 * ```
 */
export function useToastStore() {
  const toasts = useStore($toasts);

  return {
    toasts,
    showToast,
    removeToast,
    clearAllToasts,
    showSuccessToast,
    showErrorToast,
    showInfoToast,
    showWarningToast
  };
}

// Re-export types for convenience
export type { ToastType };

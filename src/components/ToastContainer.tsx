import { memo } from 'react';
import type { Toast } from '../contexts/ToastContext';

/**
 * Props for ToastContainer component
 */
interface ToastContainerProps {
  /** Array of toast notifications to display */
  toasts: Toast[];
  /** Callback function to remove a toast by ID */
  onRemove: (id: string) => void;
}

/**
 * ToastContainer component displays toast notifications
 * 
 * Features:
 * - Displays multiple toasts stacked vertically
 * - Slide-in animations for new toasts
 * - Color-coded by type (success, error, warning, info)
 * - Manual dismissal via close button
 * - ARIA live region for screen reader announcements
 * - Keyboard accessible close buttons
 * 
 * Performance:
 * - Wrapped with React.memo to prevent unnecessary re-renders
 * - Only re-renders when toasts array content changes
 * - Custom comparison function for optimal performance
 * 
 * @param {ToastContainerProps} props - Component props
 * @returns {JSX.Element | null} Toast container or null if no toasts
 */
const ToastContainerComponent = ({ toasts, onRemove }: ToastContainerProps) => {
  if (toasts.length === 0) {
    return null;
  }

  return (
    <div
      className="toast-container"
      aria-live="polite"
      aria-atomic="true"
      style={{
        position: 'fixed',
        top: '1rem',
        right: '1rem',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        maxWidth: '400px',
      }}
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast toast-${toast.type}`}
          role="alert"
          style={{
            padding: '1rem',
            borderRadius: '0.5rem',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            minWidth: '300px',
            animation: 'slideIn 0.3s ease-out',
            backgroundColor: getBackgroundColor(toast.type),
            color: getTextColor(toast.type),
            border: `1px solid ${getBorderColor(toast.type)}`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
            <span style={{ fontSize: '1.25rem' }}>{getIcon(toast.type)}</span>
            <span className="toast-message" style={{ flex: 1, wordBreak: 'break-word' }}>
              {toast.message}
            </span>
          </div>
          <button
            className="toast-close"
            onClick={() => onRemove(toast.id)}
            aria-label="Cerrar notificación"
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              padding: '0',
              lineHeight: '1',
              color: 'inherit',
              opacity: 0.7,
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.7')}
          >
            ×
          </button>
        </div>
      ))}
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @keyframes slideOut {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(100%);
            opacity: 0;
          }
        }

        .toast-close:focus-visible {
          outline: 2px solid currentColor;
          outline-offset: 2px;
          border-radius: 4px;
          opacity: 1 !important;
        }
      `}</style>
    </div>
  );
}

/**
 * Get background color based on toast type
 */
function getBackgroundColor(type: Toast['type']): string {
  switch (type) {
    case 'success':
      return '#d1fae5'; // Light green
    case 'error':
      return '#fee2e2'; // Light red
    case 'warning':
      return '#fef3c7'; // Light yellow
    case 'info':
      return '#dbeafe'; // Light blue
    default:
      return '#f3f4f6'; // Light gray
  }
}

/**
 * Get text color based on toast type
 */
function getTextColor(type: Toast['type']): string {
  switch (type) {
    case 'success':
      return '#065f46'; // Dark green
    case 'error':
      return '#991b1b'; // Dark red
    case 'warning':
      return '#92400e'; // Dark yellow
    case 'info':
      return '#1e40af'; // Dark blue
    default:
      return '#1f2937'; // Dark gray
  }
}

/**
 * Get border color based on toast type
 */
function getBorderColor(type: Toast['type']): string {
  switch (type) {
    case 'success':
      return '#10b981'; // Green
    case 'error':
      return '#ef4444'; // Red
    case 'warning':
      return '#f59e0b'; // Yellow
    case 'info':
      return '#3b82f6'; // Blue
    default:
      return '#9ca3af'; // Gray
  }
}

/**
 * Get icon based on toast type
 */
function getIcon(type: Toast['type']): string {
  switch (type) {
    case 'success':
      return '✓';
    case 'error':
      return '✕';
    case 'warning':
      return '⚠';
    case 'info':
      return 'ℹ';
    default:
      return '•';
  }
}

/**
 * Memoized ToastContainer to optimize performance
 * Custom comparison ensures re-render only when toasts content changes
 */
export const ToastContainer = memo(ToastContainerComponent, (prevProps, nextProps) => {
  // Re-render if toast count changes
  if (prevProps.toasts.length !== nextProps.toasts.length) {
    return false;
  }
  
  // Re-render if any toast content changes
  for (let i = 0; i < prevProps.toasts.length; i++) {
    if (
      prevProps.toasts[i].id !== nextProps.toasts[i].id ||
      prevProps.toasts[i].message !== nextProps.toasts[i].message ||
      prevProps.toasts[i].type !== nextProps.toasts[i].type
    ) {
      return false;
    }
  }
  
  // Don't re-render if toasts are the same
  return true;
});

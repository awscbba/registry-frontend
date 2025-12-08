import { memo } from 'react';
import { useToastStore } from '../hooks/useToastStore';

const ToastContainer = memo(() => {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        maxWidth: '400px',
      }}
      role="region"
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="alert"
          aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
          aria-atomic="true"
          style={{
            padding: '16px 20px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px',
            minWidth: '300px',
            animation: 'slideIn 0.3s ease-out',
            backgroundColor:
              toast.type === 'success'
                ? '#10b981'
                : toast.type === 'error'
                ? '#ef4444'
                : toast.type === 'warning'
                ? '#d35400'  // Darker orange for WCAG 2.1 AA compliance (5.74:1 contrast)
                : '#3b82f6',
            color: 'white',
          }}
        >
          <span 
            style={{ flex: 1, fontSize: '14px', lineHeight: '1.5' }}
            aria-describedby={`toast-${toast.id}-type`}
          >
            {toast.message}
          </span>
          <span 
            id={`toast-${toast.id}-type`} 
            className="sr-only"
          >
            {toast.type === 'success' ? 'Éxito' : 
             toast.type === 'error' ? 'Error' : 
             toast.type === 'warning' ? 'Advertencia' : 'Información'}
          </span>
          <button
            onClick={() => removeToast(toast.id)}
            aria-label={`Cerrar notificación: ${toast.message}`}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              fontSize: '20px',
              padding: '0',
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: 0.8,
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '1';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '0.8';
            }}
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
        
        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }
      `}</style>
    </div>
  );
});

ToastContainer.displayName = 'ToastContainer';

export default ToastContainer;

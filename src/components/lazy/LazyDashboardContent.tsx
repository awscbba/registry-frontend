import { lazy, Suspense } from 'react';

// Lazy load the DashboardContent component
const DashboardContent = lazy(() => import('../DashboardContent'));

// Loading fallback component
function DashboardContentLoader() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        padding: '2rem',
      }}
      role="status"
      aria-live="polite"
      aria-label="Cargando contenido del panel"
    >
      <div
        style={{
          width: '48px',
          height: '48px',
          border: '4px solid #e2e8f0',
          borderTop: '4px solid #667eea',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }}
      />
      <p
        style={{
          marginTop: '1rem',
          color: '#4a5568',
          fontSize: '1rem',
        }}
      >
        Cargando contenido...
      </p>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// Wrapper component with Suspense
export default function LazyDashboardContent() {
  return (
    <Suspense fallback={<DashboardContentLoader />}>
      <DashboardContent />
    </Suspense>
  );
}

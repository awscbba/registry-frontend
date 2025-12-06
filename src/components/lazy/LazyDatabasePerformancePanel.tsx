import { lazy, Suspense } from 'react';

// Lazy load the DatabasePerformancePanel component
const DatabasePerformancePanel = lazy(() => import('../performance/DatabasePerformancePanel'));

// Loading fallback component
function DatabasePerformancePanelLoader() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '300px',
        padding: '2rem',
      }}
      role="status"
      aria-live="polite"
      aria-label="Cargando panel de base de datos"
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
        Cargando panel de base de datos...
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
export default function LazyDatabasePerformancePanel() {
  return (
    <Suspense fallback={<DatabasePerformancePanelLoader />}>
      <DatabasePerformancePanel />
    </Suspense>
  );
}

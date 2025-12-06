import { lazy, Suspense } from 'react';

// Lazy load the PerformanceDashboard component
const PerformanceDashboard = lazy(() => import('../performance/PerformanceDashboard'));

// Loading fallback component
function PerformanceDashboardLoader() {
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
      aria-label="Cargando panel de rendimiento"
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
        Cargando panel de rendimiento...
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
export default function LazyPerformanceDashboard() {
  return (
    <Suspense fallback={<PerformanceDashboardLoader />}>
      <PerformanceDashboard />
    </Suspense>
  );
}

import { lazy, Suspense } from 'react';

// Lazy load the ConnectionPoolMonitor component
const ConnectionPoolMonitor = lazy(() => import('../performance/ConnectionPoolMonitor'));

// Loading fallback component
function ConnectionPoolMonitorLoader() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '300px',
        padding: '2rem',
        background: 'white',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      }}
      role="status"
      aria-live="polite"
      aria-label="Cargando monitor de pool de conexiones"
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
        Cargando monitor de conexiones...
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
export default function LazyConnectionPoolMonitor(props: any) {
  return (
    <Suspense fallback={<ConnectionPoolMonitorLoader />}>
      <ConnectionPoolMonitor {...props} />
    </Suspense>
  );
}

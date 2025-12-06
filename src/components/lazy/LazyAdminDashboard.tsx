import { lazy, Suspense } from 'react';

// Lazy load the EnhancedAdminDashboard component
const EnhancedAdminDashboard = lazy(() => import('../enhanced/EnhancedAdminDashboard'));

// Loading fallback component
function AdminDashboardLoader() {
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
      aria-label="Cargando panel de administración"
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
        Cargando panel de administración...
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
export default function LazyAdminDashboard() {
  return (
    <Suspense fallback={<AdminDashboardLoader />}>
      <EnhancedAdminDashboard />
    </Suspense>
  );
}

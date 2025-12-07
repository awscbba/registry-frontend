import type { ReactNode } from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import { AuthProvider } from '../contexts/AuthContext';
import { ToastProvider } from '../contexts/ToastContext';
import ToastContainer from './ToastContainer';

interface AppProvidersProps {
  children: ReactNode;
}

/**
 * AppProviders wraps the entire application with all necessary providers.
 * This ensures all React components share the same context instances.
 * 
 * Provider nesting order (outer to inner):
 * 1. ErrorBoundary - catches all errors
 * 2. ToastProvider - provides toast notifications
 * 3. AuthProvider - provides authentication state
 */
export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          {children}
          <ToastContainer />
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}

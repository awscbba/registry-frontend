/**
 * Shared loading state component for consistent loading UI patterns
 */

import LoadingSpinner from './LoadingSpinner';

interface LoadingStateProps {
  isLoading: boolean;
  error?: string | null;
  children: React.ReactNode;
  loadingMessage?: string;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  onRetry?: () => void;
  isEmpty?: boolean;
}

export default function LoadingState({
  isLoading,
  error,
  children,
  loadingMessage = 'Cargando...',
  emptyMessage = 'No hay datos disponibles',
  emptyIcon,
  onRetry,
  isEmpty = false
}: LoadingStateProps) {
  
  if (isLoading) {
    return <LoadingSpinner message={loadingMessage} color="aws" />;
  }

  if (error) {
    return (
      <div className="error-state">
        <div className="error-icon">
          <svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3>Error al cargar datos</h3>
        <p>{error}</p>
        {onRetry && (
          <button onClick={onRetry} className="btn-retry">
            Reintentar
          </button>
        )}
        
        <style jsx>{`
          .error-state {
            text-align: center;
            padding: 4rem 0;
            color: #232F3E;
          }

          .error-icon {
            color: #FF9900;
            margin-bottom: 1rem;
          }

          .error-state h3 {
            margin-bottom: 0.5rem;
            color: #232F3E;
          }

          .error-state p {
            color: #666;
            margin-bottom: 1.5rem;
          }

          .btn-retry {
            background: #FF9900;
            color: white;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 0.5rem;
            cursor: pointer;
            font-weight: 600;
            transition: background-color 0.2s ease;
          }

          .btn-retry:hover {
            background: #E88B00;
          }
        `}</style>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="empty-state">
        <div className="empty-icon">
          {emptyIcon || (
            <svg width="64" height="64" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          )}
        </div>
        <h3>Sin datos</h3>
        <p>{emptyMessage}</p>
        
        <style jsx>{`
          .empty-state {
            text-align: center;
            padding: 4rem 0;
            color: #666;
          }

          .empty-icon {
            color: #FF9900;
            margin-bottom: 1rem;
          }

          .empty-state h3 {
            color: #232F3E;
            margin-bottom: 0.5rem;
          }
        `}</style>
      </div>
    );
  }

  return <>{children}</>;
}

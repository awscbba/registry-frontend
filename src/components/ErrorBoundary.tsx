import { Component, ReactNode } from 'react';
import { getLogger, getErrorObject } from '../utils/logger';

const logger = getLogger('components.ErrorBoundary');

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    const correlationId = `error-${Date.now()}`;
    const errorObject = getErrorObject(error);
    
    // Structured error logging with full context
    logger.error('Error caught by boundary', {
      correlationId,
      error: error.message,
      errorType: error.constructor.name,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString()
    }, errorObject);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div style={{ padding: '2rem', textAlign: 'center' }} role="alert">
          <h2>Algo salió mal</h2>
          <p>Por favor, recarga la página o contacta al soporte.</p>
          <button onClick={() => window.location.reload()}>
            Recargar Página
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

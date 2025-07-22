/**
 * Shared loading spinner component for consistent loading states
 */

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  message?: string;
  color?: 'primary' | 'secondary' | 'aws';
  className?: string;
}

export default function LoadingSpinner({ 
  size = 'medium', 
  message = 'Cargando...', 
  color = 'aws',
  className = '' 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    small: 'w-6 h-6',
    medium: 'w-10 h-10', 
    large: 'w-16 h-16'
  };

  const colorClasses = {
    primary: 'border-blue-500',
    secondary: 'border-gray-500',
    aws: 'border-orange-500'
  };

  return (
    <div className={`loading-container ${className}`}>
      <div className={`loading-spinner ${sizeClasses[size]}`}>
        <div className={`spinner-ring ${colorClasses[color]}`}></div>
      </div>
      {message && <p className="loading-message">{message}</p>}
      
      <style jsx>{`
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2rem 0;
        }

        .loading-spinner {
          position: relative;
          display: inline-block;
        }

        .spinner-ring {
          width: 100%;
          height: 100%;
          border: 3px solid transparent;
          border-top: 3px solid;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .spinner-ring.border-blue-500 {
          border-top-color: #3b82f6;
        }

        .spinner-ring.border-gray-500 {
          border-top-color: #6b7280;
        }

        .spinner-ring.border-orange-500 {
          border-top-color: #FF9900;
        }

        .loading-message {
          margin-top: 1rem;
          color: #666;
          font-size: 0.875rem;
          text-align: center;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* Size variations */
        .w-6 { width: 1.5rem; }
        .h-6 { height: 1.5rem; }
        .w-10 { width: 2.5rem; }
        .h-10 { height: 2.5rem; }
        .w-16 { width: 4rem; }
        .h-16 { height: 4rem; }
      `}</style>
    </div>
  );
}

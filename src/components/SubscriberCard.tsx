import { memo } from 'react';

interface SubscriberAddress {
  city?: string;
  country?: string;
}

interface SubscriberWithDetails {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: SubscriberAddress;
  subscriptionStatus: string;
  subscriptionDate: string;
  subscriptionId: string;
}

interface SubscriberCardProps {
  subscriber: SubscriberWithDetails;
  onApprove: (subscriber: SubscriberWithDetails) => void;
  onReject: (subscriber: SubscriberWithDetails) => void;
  onRemove: (subscriber: SubscriberWithDetails) => void;
  isApproving: boolean;
  isRejecting: boolean;
  isRemoving: boolean;
}

/**
 * SubscriberCard component displays a single subscriber in the project subscribers list
 * Memoized to prevent unnecessary re-renders when other subscribers change
 */
const SubscriberCard = memo(function SubscriberCard({
  subscriber,
  onApprove,
  onReject,
  onRemove,
  isApproving,
  isRejecting,
  isRemoving
}: SubscriberCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10b981'; // Green
      case 'pending': return '#f59e0b'; // Yellow
      case 'cancelled': return '#ef4444'; // Red
      default: return '#6b7280'; // Gray
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Activo';
      case 'pending': return 'Pendiente';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="subscriber-card">
      <div className="subscriber-header">
        <div className="subscriber-info">
          <h4 className="subscriber-name">
            {subscriber.firstName} {subscriber.lastName}
          </h4>
          <p className="subscriber-email">{subscriber.email}</p>
        </div>
        <div 
          className="subscription-status"
          style={{ backgroundColor: getStatusColor(subscriber.subscriptionStatus) }}
        >
          {getStatusText(subscriber.subscriptionStatus)}
        </div>
      </div>

      <div className="subscriber-details">
        {subscriber.phone && (
          <div className="detail-item">
            <span className="detail-label">Teléfono:</span>
            <span className="detail-value">{subscriber.phone}</span>
          </div>
        )}
        <div className="detail-item">
          <span className="detail-label">Fecha de suscripción:</span>
          <span className="detail-value">{formatDate(subscriber.subscriptionDate)}</span>
        </div>
        {subscriber.address && (
          <div className="detail-item">
            <span className="detail-label">Ciudad:</span>
            <span className="detail-value">
              {subscriber.address.city}, {subscriber.address.country}
            </span>
          </div>
        )}
      </div>

      <div className="subscriber-actions">
        {subscriber.subscriptionStatus === 'pending' && (
          <>
            <button
              onClick={() => onApprove(subscriber)}
              disabled={isApproving}
              className="approve-btn"
            >
              {isApproving ? (
                <>
                  <div className="spinner"></div>
                  <span>Aprobando...</span>
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 6L9 17l-5-5"/>
                  </svg>
                  <span>Aprobar</span>
                </>
              )}
            </button>
            <button
              onClick={() => onReject(subscriber)}
              disabled={isRejecting}
              className="reject-btn"
            >
              {isRejecting ? (
                <>
                  <div className="spinner"></div>
                  <span>Rechazando...</span>
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                  <span>Rechazar</span>
                </>
              )}
            </button>
          </>
        )}
        
        {subscriber.subscriptionStatus === 'active' && (
          <button
            onClick={() => onRemove(subscriber)}
            disabled={isRemoving}
            className="remove-subscriber-btn"
          >
            {isRemoving ? (
              <>
                <div className="spinner"></div>
                <span>Removiendo...</span>
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
                <span>Remover Suscriptor</span>
              </>
            )}
          </button>
        )}
      </div>

      <style jsx>{`
        .subscriber-card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 20px;
          transition: all 0.2s;
        }

        .subscriber-card:hover {
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          border-color: #d1d5db;
        }

        .subscriber-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
          gap: 12px;
        }

        .subscriber-info {
          flex: 1;
        }

        .subscriber-name {
          margin: 0 0 4px 0;
          font-size: 1.125rem;
          font-weight: 600;
          color: #1f2937;
        }

        .subscriber-email {
          margin: 0;
          font-size: 0.875rem;
          color: #6b7280;
        }

        .subscription-status {
          padding: 6px 12px;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 600;
          color: white;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .subscriber-details {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 16px;
          padding: 12px;
          background: #f9fafb;
          border-radius: 6px;
        }

        .detail-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
        }

        .detail-label {
          font-size: 0.875rem;
          font-weight: 500;
          color: #6b7280;
        }

        .detail-value {
          font-size: 0.875rem;
          color: #1f2937;
          text-align: right;
        }

        .subscriber-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .approve-btn,
        .reject-btn,
        .remove-subscriber-btn {
          flex: 1;
          min-width: 120px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 8px 16px;
          border: none;
          border-radius: 6px;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .approve-btn {
          background: #10b981;
          color: white;
        }

        .approve-btn:hover:not(:disabled) {
          background: #059669;
        }

        .reject-btn {
          background: #ef4444;
          color: white;
        }

        .reject-btn:hover:not(:disabled) {
          background: #dc2626;
        }

        .remove-subscriber-btn {
          background: #f59e0b;
          color: white;
        }

        .remove-subscriber-btn:hover:not(:disabled) {
          background: #d97706;
        }

        .approve-btn:disabled,
        .reject-btn:disabled,
        .remove-subscriber-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .spinner {
          width: 14px;
          height: 14px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison: only re-render if subscriber data or loading states change
  return (
    prevProps.subscriber.id === nextProps.subscriber.id &&
    prevProps.subscriber.firstName === nextProps.subscriber.firstName &&
    prevProps.subscriber.lastName === nextProps.subscriber.lastName &&
    prevProps.subscriber.email === nextProps.subscriber.email &&
    prevProps.subscriber.phone === nextProps.subscriber.phone &&
    prevProps.subscriber.subscriptionStatus === nextProps.subscriber.subscriptionStatus &&
    prevProps.subscriber.subscriptionDate === nextProps.subscriber.subscriptionDate &&
    prevProps.isApproving === nextProps.isApproving &&
    prevProps.isRejecting === nextProps.isRejecting &&
    prevProps.isRemoving === nextProps.isRemoving &&
    prevProps.onApprove === nextProps.onApprove &&
    prevProps.onReject === nextProps.onReject &&
    prevProps.onRemove === nextProps.onRemove
  );
});

export default SubscriberCard;

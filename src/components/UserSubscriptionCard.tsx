import { memo } from 'react';
import type { UserSubscription } from '../services/authService';

interface UserSubscriptionCardProps {
  subscription: UserSubscription;
}

/**
 * UserSubscriptionCard component displays a single subscription in user dashboard
 * Memoized to prevent unnecessary re-renders when other subscriptions change
 */
const UserSubscriptionCard = memo(function UserSubscriptionCard({ 
  subscription 
}: UserSubscriptionCardProps) {
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Pendiente', class: 'status-pending' },
      active: { label: 'Activo', class: 'status-active' },
      cancelled: { label: 'Cancelado', class: 'status-cancelled' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || 
                  { label: status, class: 'status-unknown' };
    
    return (
      <span className={`status-badge ${config.class}`}>
        {config.label}
      </span>
    );
  };

  const isProjectDeleted = !subscription.projectName || 
                           subscription.projectName.includes('[DELETED]') ||
                           subscription.projectName.includes('[ELIMINADO]');

  return (
    <div className="subscription-card">
      <div className="subscription-info">
        <h4>
          {subscription.projectName || 'Proyecto no disponible'}
          {isProjectDeleted && (
            <span className="project-warning" title="Este proyecto ya no existe">
              ⚠️
            </span>
          )}
        </h4>
        <p className="subscription-meta">
          Estado: {getStatusBadge(subscription.status)}
          <span className="subscription-date">
            Suscrito: {new Date(subscription.subscribedAt).toLocaleDateString()}
          </span>
        </p>
        {subscription.notes && (
          <p className="subscription-notes">
            <strong>Notas:</strong> {subscription.notes}
          </p>
        )}
        {isProjectDeleted && (
          <div className="project-deleted-notice">
            <span className="notice-icon">ℹ️</span>
            <span>Este proyecto ha sido eliminado. Tu suscripción será removida automáticamente.</span>
          </div>
        )}
      </div>

      <style jsx>{`
        .subscription-card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 16px;
          transition: all 0.2s;
        }

        .subscription-card:hover {
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          border-color: #d1d5db;
        }

        .subscription-info h4 {
          margin: 0 0 8px 0;
          color: #1f2937;
          font-size: 1rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .project-warning {
          font-size: 1.2rem;
          cursor: help;
        }

        .subscription-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          align-items: center;
          margin-bottom: 8px;
          font-size: 0.875rem;
          color: #6b7280;
        }

        .subscription-date {
          color: #9ca3af;
        }

        .subscription-notes {
          margin: 8px 0 0 0;
          padding: 8px;
          background: #f9fafb;
          border-radius: 4px;
          font-size: 0.875rem;
          color: #4b5563;
        }

        .subscription-notes strong {
          color: #1f2937;
        }

        .project-deleted-notice {
          margin-top: 12px;
          padding: 8px 12px;
          background: #fef3c7;
          border: 1px solid #fbbf24;
          border-radius: 6px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.875rem;
          color: #92400e;
        }

        .notice-icon {
          font-size: 1.2rem;
        }

        .status-badge {
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .status-pending {
          background: #fef3c7;
          color: #92400e;
        }

        .status-active {
          background: #d1fae5;
          color: #065f46;
        }

        .status-cancelled {
          background: #fee2e2;
          color: #991b1b;
        }

        .status-unknown {
          background: #f3f4f6;
          color: #4b5563;
        }
      `}</style>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison: only re-render if subscription data changes
  return (
    prevProps.subscription.id === nextProps.subscription.id &&
    prevProps.subscription.status === nextProps.subscription.status &&
    prevProps.subscription.projectName === nextProps.subscription.projectName &&
    prevProps.subscription.subscribedAt === nextProps.subscription.subscribedAt &&
    prevProps.subscription.notes === nextProps.subscription.notes
  );
});

export default UserSubscriptionCard;

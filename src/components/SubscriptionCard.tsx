import { memo } from 'react';
import type { UserSubscription } from '../services/authService';

interface SubscriptionCardProps {
  subscription: UserSubscription;
}

/**
 * SubscriptionCard component displays a single subscription
 * Memoized to prevent unnecessary re-renders when other subscriptions change
 */
const SubscriptionCard = memo(function SubscriptionCard({ 
  subscription 
}: SubscriptionCardProps) {
  const getStatusBadge = (status: string) => {
    const badges = {
      active: { label: 'Activo', color: '#10b981', bg: '#d1fae5' },
      pending: { label: 'Pendiente', color: '#f59e0b', bg: '#fef3c7' },
      cancelled: { label: 'Cancelado', color: '#ef4444', bg: '#fee2e2' },
    };
    const badge = badges[status as keyof typeof badges] || badges.pending;
    return (
      <span
        style={{
          padding: '4px 12px',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: '500',
          color: badge.color,
          backgroundColor: badge.bg,
        }}
      >
        {badge.label}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="subscription-card">
      <div className="card-header">
        <h3>{subscription.projectName}</h3>
        {getStatusBadge(subscription.status)}
      </div>
      <div className="card-body">
        <div className="info-row">
          <span className="label">Fecha de suscripción:</span>
          <span className="value">{formatDate(subscription.subscribedAt)}</span>
        </div>
        {subscription.notes && (
          <div className="info-row">
            <span className="label">Notas:</span>
            <span className="value">{subscription.notes}</span>
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
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          border-color: #d1d5db;
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          gap: 12px;
        }

        .card-header h3 {
          margin: 0;
          font-size: 1.125rem;
          color: #1f2937;
          font-weight: 600;
        }

        .card-body {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .info-row {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .info-row .label {
          font-size: 0.875rem;
          color: #6b7280;
          font-weight: 500;
        }

        .info-row .value {
          font-size: 0.875rem;
          color: #1f2937;
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

export default SubscriptionCard;

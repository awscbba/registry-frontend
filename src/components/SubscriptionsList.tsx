import { useState, useEffect } from 'react';
import { authService, type UserSubscription } from '../services/authService';

export default function SubscriptionsList() {
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'pending' | 'cancelled'>('all');

  useEffect(() => {
    loadSubscriptions();
  }, []);

  const loadSubscriptions = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await authService.getUserSubscriptions();
      setSubscriptions(data);
    } catch {
      setError('Error al cargar las suscripciones');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredSubscriptions = subscriptions.filter(sub => {
    if (filter === 'all') {
      return true;
    }
    return sub.status === filter;
  });

  const getStatusBadge = (status: string) => {
    const badges = {
      active: { label: 'Activo', color: '#10b981', bg: '#d1fae5' },
      pending: { label: 'Pendiente', color: '#d35400', bg: '#fef3c7' },
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
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando suscripciones...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <span className="error-icon">⚠️</span>
        <p>{error}</p>
        <button onClick={loadSubscriptions} className="retry-button">
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="subscriptions-list">
      <div className="header">
        <h2>Mis Suscripciones</h2>
        <div className="filter-buttons">
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            Todas ({subscriptions.length})
          </button>
          <button
            className={`filter-btn ${filter === 'active' ? 'active' : ''}`}
            onClick={() => setFilter('active')}
          >
            Activas ({subscriptions.filter(s => s.status === 'active').length})
          </button>
          <button
            className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
            onClick={() => setFilter('pending')}
          >
            Pendientes ({subscriptions.filter(s => s.status === 'pending').length})
          </button>
          <button
            className={`filter-btn ${filter === 'cancelled' ? 'active' : ''}`}
            onClick={() => setFilter('cancelled')}
          >
            Canceladas ({subscriptions.filter(s => s.status === 'cancelled').length})
          </button>
        </div>
      </div>

      {filteredSubscriptions.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">📋</span>
          <h3>No hay suscripciones</h3>
          <p>
            {filter === 'all'
              ? 'Aún no te has suscrito a ningún proyecto.'
              : `No tienes suscripciones ${filter === 'active' ? 'activas' : filter === 'pending' ? 'pendientes' : 'canceladas'}.`}
          </p>
        </div>
      ) : (
        <div className="subscriptions-grid">
          {filteredSubscriptions.map((subscription) => (
            <div key={subscription.id} className="subscription-card">
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
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .subscriptions-list {
          background: white;
          border-radius: 8px;
          padding: 24px;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 16px;
        }

        .header h2 {
          margin: 0;
          color: #1f2937;
          font-size: 1.5rem;
        }

        .filter-buttons {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .filter-btn {
          padding: 8px 16px;
          background: white;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          color: #6b7280;
          transition: all 0.2s;
        }

        .filter-btn:hover {
          background: #f9fafb;
          border-color: #9ca3af;
        }

        .filter-btn.active {
          background: #3b82f6;
          border-color: #3b82f6;
          color: white;
        }

        .loading-container,
        .error-container {
          text-align: center;
          padding: 60px 20px;
          color: #6b7280;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #e5e7eb;
          border-top: 4px solid #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 16px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .error-container {
          color: #ef4444;
        }

        .error-icon {
          font-size: 48px;
          display: block;
          margin-bottom: 16px;
        }

        .retry-button {
          margin-top: 16px;
          padding: 10px 24px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
          transition: background 0.2s;
        }

        .retry-button:hover {
          background: #2563eb;
        }

        .empty-state {
          text-align: center;
          padding: 60px 20px;
          color: #6b7280;
        }

        .empty-icon {
          font-size: 64px;
          display: block;
          margin-bottom: 16px;
          opacity: 0.5;
        }

        .empty-state h3 {
          color: #374151;
          margin: 0 0 8px 0;
          font-size: 1.25rem;
        }

        .empty-state p {
          margin: 0;
          font-size: 0.95rem;
        }

        .subscriptions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
        }

        .subscription-card {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          overflow: hidden;
          transition: box-shadow 0.2s;
        }

        .subscription-card:hover {
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .card-header {
          padding: 16px;
          background: #f9fafb;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
        }

        .card-header h3 {
          margin: 0;
          color: #1f2937;
          font-size: 1.1rem;
          font-weight: 600;
          flex: 1;
        }

        .card-body {
          padding: 16px;
        }

        .info-row {
          display: flex;
          flex-direction: column;
          gap: 4px;
          margin-bottom: 12px;
        }

        .info-row:last-child {
          margin-bottom: 0;
        }

        .label {
          font-size: 12px;
          font-weight: 500;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .value {
          color: #1f2937;
          font-size: 14px;
        }

        @media (max-width: 768px) {
          .subscriptions-list {
            padding: 16px;
          }

          .header {
            flex-direction: column;
            align-items: flex-start;
          }

          .filter-buttons {
            width: 100%;
          }

          .filter-btn {
            flex: 1;
            min-width: 0;
            padding: 8px 12px;
            font-size: 12px;
          }

          .subscriptions-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

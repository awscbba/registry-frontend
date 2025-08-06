import { useState, useEffect } from 'react';
import { userAuthService, type UserSubscription } from '../services/userAuthService';

interface UserDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  currentProjectId?: string;
  onSubscribeToProject?: (projectId: string, notes?: string) => Promise<any>;
}

export default function UserDashboard({ 
  isOpen,
  onClose, 
  currentProjectId,
  onSubscribeToProject 
}: UserDashboardProps) {
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subscriptionNotes, setSubscriptionNotes] = useState('');
  const [isSubscribing, setIsSubscribing] = useState(false);

  const user = userAuthService.getCurrentUser();
  const currentSubscription = subscriptions.find(sub => sub.projectId === currentProjectId);

  useEffect(() => {
    if (isOpen) {
      loadUserSubscriptions();
    }
  }, [isOpen]);

  const loadUserSubscriptions = async () => {
    try {
      setIsLoading(true);
      const userSubs = await userAuthService.getUserSubscriptions();
      setSubscriptions(userSubs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load subscriptions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubscribeToCurrentProject = async () => {
    if (!currentProjectId || !onSubscribeToProject) return;

    try {
      setIsSubscribing(true);
      await onSubscribeToProject(currentProjectId, subscriptionNotes || undefined);
      // Reload subscriptions to show the new one
      await loadUserSubscriptions();
      setSubscriptionNotes('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Subscription failed');
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleLogout = () => {
    userAuthService.logout();
    onClose();
  };

  if (!isOpen) return null;

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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content user-dashboard" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="header-info">
            <h2>Mi Panel de Usuario</h2>
            <p className="user-info">
              Bienvenido, <strong>{user?.firstName} {user?.lastName}</strong>
            </p>
          </div>
          <button 
            className="modal-close-button" 
            onClick={onClose}
            aria-label="Cerrar panel"
          >
            ×
          </button>
        </div>

        <div className="modal-body">
          {/* Current Project Subscription Status */}
          {currentProjectId && (
            <div className="current-project-section">
              <h3>Proyecto Actual</h3>
              {currentSubscription ? (
                <div className="subscription-card current">
                  <div className="subscription-info">
                    <h4>{currentSubscription.projectName}</h4>
                    <p className="subscription-meta">
                      Estado: {getStatusBadge(currentSubscription.status)}
                      <span className="subscription-date">
                        Suscrito: {new Date(currentSubscription.subscribedAt).toLocaleDateString()}
                      </span>
                    </p>
                    {currentSubscription.notes && (
                      <p className="subscription-notes">
                        <strong>Notas:</strong> {currentSubscription.notes}
                      </p>
                    )}
                  </div>
                  <div className="subscription-status">
                    {currentSubscription.status === 'pending' && (
                      <div className="status-message pending">
                        <span className="status-icon">⏳</span>
                        <span>Tu suscripción está pendiente de aprobación</span>
                      </div>
                    )}
                    {currentSubscription.status === 'active' && (
                      <div className="status-message active">
                        <span className="status-icon">✅</span>
                        <span>¡Estás suscrito a este proyecto!</span>
                      </div>
                    )}
                    {currentSubscription.status === 'cancelled' && (
                      <div className="status-message cancelled">
                        <span className="status-icon">❌</span>
                        <span>Tu suscripción fue cancelada</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="no-subscription">
                  <p>No estás suscrito a este proyecto.</p>
                  <div className="subscribe-section">
                    <textarea
                      value={subscriptionNotes}
                      onChange={(e) => setSubscriptionNotes(e.target.value)}
                      placeholder="Notas adicionales (opcional)"
                      rows={3}
                      disabled={isSubscribing}
                    />
                    <button
                      onClick={handleSubscribeToCurrentProject}
                      className="button-primary"
                      disabled={isSubscribing}
                    >
                      {isSubscribing ? 'Suscribiendo...' : 'Suscribirse a este Proyecto'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* All Subscriptions */}
          <div className="all-subscriptions-section">
            <h3>Todas mis Suscripciones</h3>
            
            {isLoading ? (
              <div className="loading-state">
                <div className="loading-spinner"></div>
                <p>Cargando suscripciones...</p>
              </div>
            ) : error ? (
              <div className="error-state">
                <div className="error-icon">⚠️</div>
                <p>{error}</p>
                <button onClick={loadUserSubscriptions} className="button-secondary">
                  Reintentar
                </button>
              </div>
            ) : subscriptions.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📋</div>
                <p>No tienes suscripciones activas.</p>
                <p className="empty-subtitle">Explora los proyectos disponibles y suscríbete a los que te interesen.</p>
              </div>
            ) : (
              <div className="subscriptions-list">
                {subscriptions.map((subscription) => (
                  <div key={subscription.id} className="subscription-card">
                    <div className="subscription-info">
                      <h4>{subscription.projectName}</h4>
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
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="dashboard-actions">
            <button onClick={handleLogout} className="button-secondary">
              Cerrar Sesión
            </button>
            <button onClick={onClose} className="button-primary">
              Continuar Navegando
            </button>
          </div>
        </div>

        <style jsx>{`
          .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            padding: 20px;
          }

          .modal-content {
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            max-width: 700px;
            width: 100%;
            max-height: 90vh;
            overflow-y: auto;
          }

          .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            padding: 24px 24px 0 24px;
            border-bottom: 1px solid #e5e7eb;
            margin-bottom: 24px;
          }

          .header-info h2 {
            margin: 0 0 8px 0;
            color: #1f2937;
            font-size: 1.5rem;
            font-weight: 600;
          }

          .user-info {
            margin: 0;
            color: #6b7280;
            font-size: 14px;
          }

          .modal-close-button {
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: #6b7280;
            padding: 4px;
            line-height: 1;
          }

          .modal-close-button:hover {
            color: #374151;
          }

          .modal-body {
            padding: 0 24px 24px 24px;
            display: flex;
            flex-direction: column;
            gap: 32px;
          }

          .current-project-section h3,
          .all-subscriptions-section h3 {
            margin: 0 0 16px 0;
            color: #1f2937;
            font-size: 1.25rem;
            font-weight: 600;
          }

          .subscription-card {
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 20px;
            background: #f9fafb;
          }

          .subscription-card.current {
            border-color: #3b82f6;
            background: #eff6ff;
          }

          .subscription-info h4 {
            margin: 0 0 12px 0;
            color: #1f2937;
            font-size: 1.1rem;
            font-weight: 600;
          }

          .subscription-meta {
            margin: 0 0 12px 0;
            display: flex;
            align-items: center;
            gap: 16px;
            flex-wrap: wrap;
          }

          .subscription-date {
            color: #6b7280;
            font-size: 14px;
          }

          .subscription-notes {
            margin: 0;
            color: #374151;
            font-size: 14px;
            line-height: 1.5;
          }

          .status-badge {
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          .status-badge.status-pending {
            background: #fef3c7;
            color: #92400e;
          }

          .status-badge.status-active {
            background: #d1fae5;
            color: #065f46;
          }

          .status-badge.status-cancelled {
            background: #fee2e2;
            color: #991b1b;
          }

          .status-message {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-top: 12px;
            padding: 12px;
            border-radius: 6px;
            font-size: 14px;
          }

          .status-message.pending {
            background: #fffbeb;
            color: #92400e;
          }

          .status-message.active {
            background: #ecfdf5;
            color: #065f46;
          }

          .status-message.cancelled {
            background: #fef2f2;
            color: #991b1b;
          }

          .no-subscription {
            text-align: center;
            padding: 32px 20px;
            color: #6b7280;
          }

          .subscribe-section {
            margin-top: 20px;
            display: flex;
            flex-direction: column;
            gap: 12px;
            max-width: 400px;
            margin-left: auto;
            margin-right: auto;
          }

          .subscribe-section textarea {
            padding: 12px;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            resize: vertical;
            font-family: inherit;
          }

          .subscriptions-list {
            display: flex;
            flex-direction: column;
            gap: 16px;
          }

          .loading-state,
          .error-state,
          .empty-state {
            text-align: center;
            padding: 40px 20px;
            color: #6b7280;
          }

          .loading-spinner {
            width: 32px;
            height: 32px;
            border: 3px solid #e5e7eb;
            border-top: 3px solid #3b82f6;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 16px;
          }

          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          .error-icon,
          .empty-icon {
            font-size: 48px;
            margin-bottom: 16px;
          }

          .empty-subtitle {
            font-size: 14px;
            margin-top: 8px;
          }

          .dashboard-actions {
            display: flex;
            gap: 12px;
            justify-content: flex-end;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
          }

          .button-secondary {
            padding: 12px 24px;
            border: 1px solid #d1d5db;
            background: white;
            color: #374151;
            border-radius: 8px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
          }

          .button-secondary:hover:not(:disabled) {
            background: #f9fafb;
            border-color: #9ca3af;
          }

          .button-primary {
            padding: 12px 24px;
            background: #3b82f6;
            color: white;
            border: none;
            border-radius: 8px;
            font-weight: 500;
            cursor: pointer;
            transition: background-color 0.2s;
          }

          .button-primary:hover:not(:disabled) {
            background: #2563eb;
          }

          .button-primary:disabled,
          .button-secondary:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }

          @media (max-width: 640px) {
            .modal-content {
              margin: 20px;
              max-width: none;
            }

            .dashboard-actions {
              flex-direction: column;
            }

            .button-secondary,
            .button-primary {
              width: 100%;
            }

            .subscription-meta {
              flex-direction: column;
              align-items: flex-start;
              gap: 8px;
            }
          }
        `}</style>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { projectApi, ApiError } from '../services/projectApi';
import { httpClient, getApiUrl } from '../services/httpClient';
import type { Project } from '../types/project';
import type { Person } from '../types/person';

interface ProjectSubscribersListProps {
  project: Project;
}

interface SubscriberWithDetails extends Person {
  subscriptionStatus: string;
  subscriptionDate: string;
  subscriptionId: string;
}

export default function ProjectSubscribersList({ project }: ProjectSubscribersListProps) {
  const [subscribers, setSubscribers] = useState<SubscriberWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removingSubscriber, setRemovingSubscriber] = useState<string | null>(null);
  const [approvingSubscriber, setApprovingSubscriber] = useState<string | null>(null);
  const [rejectingSubscriber, setRejectingSubscriber] = useState<string | null>(null);

  const loadSubscribers = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Get all subscribers for this project
      const projectSubscribers = await projectApi.getProjectSubscribers(project.id);
      
      // Map subscribers to the format we need
      const subscribersWithDetails: SubscriberWithDetails[] = projectSubscribers.map(subscriber => ({
        id: subscriber.personId, // Use personId as the person ID
        firstName: subscriber.personFirstName || 'Unknown',
        lastName: subscriber.personLastName || 'User', 
        email: subscriber.personEmail || 'unknown@example.com',
        phone: '', // Not available in subscriber data
        dateOfBirth: '',
        address: undefined,
        isActive: subscriber.isActive || false,
        createdAt: subscriber.createdAt || subscriber.subscriptionDate,
        updatedAt: subscriber.updatedAt || '',
        subscriptionStatus: subscriber.status,
        subscriptionDate: subscriber.subscriptionDate || subscriber.createdAt,
        subscriptionId: subscriber.id // Use the subscription ID from the API
      }));
      
      setSubscribers(subscribersWithDetails);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(`Error al cargar suscriptores: ${err.message}`);
      } else {
        setError('Error desconocido al cargar suscriptores');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSubscribers();
  }, [project.id]);

  const handleApproveSubscriber = async (subscriber: SubscriberWithDetails) => {
    setApprovingSubscriber(subscriber.id);
    
    try {
      // Update subscription status to active
      await httpClient.request(getApiUrl(`/v2/subscriptions/${subscriber.subscriptionId}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'active', isActive: true })
      });

      // Refresh the subscribers list
      await loadSubscribers();
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al aprobar suscriptor');
    } finally {
      setApprovingSubscriber(null);
    }
  };

  const handleRejectSubscriber = async (subscriber: SubscriberWithDetails) => {
    if (!window.confirm(`¿Estás seguro de que quieres rechazar la suscripción de ${subscriber.firstName} ${subscriber.lastName}?`)) {
      return;
    }

    setRejectingSubscriber(subscriber.id);
    
    try {
      // Update subscription status to cancelled
      await httpClient.request(getApiUrl(`/v2/subscriptions/${subscriber.subscriptionId}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled', isActive: false })
      });

      // Refresh the subscribers list
      await loadSubscribers();
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al rechazar suscriptor');
    } finally {
      setRejectingSubscriber(null);
    }
  };

  const handleRemoveSubscriber = async (subscriber: SubscriberWithDetails) => {
    if (!window.confirm(`¿Estás seguro de que quieres remover a ${subscriber.firstName} ${subscriber.lastName} de este proyecto?`)) {
      return;
    }

    setRemovingSubscriber(subscriber.id);
    
    try {
      // Get all subscriptions to find the correct one
      const allSubscriptions = await httpClient.getJson(getApiUrl('/v2/subscriptions'));
      const subscription = (allSubscriptions.data as any[]).find(sub => 
        sub.personId === subscriber.id && sub.projectId === project.id
      );

      if (!subscription) {
        throw new Error('Subscription not found');
      }

      // Delete the subscription
      await httpClient.request(getApiUrl(`/v2/subscriptions/${subscription.id}`), { 
        method: 'DELETE' 
      });

      // Refresh the subscribers list
      await loadSubscribers();
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al remover suscriptor');
    } finally {
      setRemovingSubscriber(null);
    }
  };

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

  if (isLoading) {
    return (
      <div className="subscribers-list">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Cargando suscriptores...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="subscribers-list">
        <div className="error-state">
          <p className="error-message">{error}</p>
        </div>
      </div>
    );
  }

  if (subscribers.length === 0) {
    return (
      <div className="subscribers-list">
        <div className="empty-state">
          <div className="empty-icon">👥</div>
          <h3>No hay suscriptores</h3>
          <p>Este proyecto aún no tiene suscriptores.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="subscribers-list">
      <div className="subscribers-header">
        <h3>Suscriptores del Proyecto</h3>
        <p className="subscribers-count">
          {subscribers.length} {subscribers.length === 1 ? 'suscriptor' : 'suscriptores'}
        </p>
      </div>

      <div className="subscribers-grid">
        {subscribers.map((subscriber) => (
          <div key={subscriber.id} className="subscriber-card">
            <div className="subscriber-header">
              <div className="subscriber-info">
                <h4 className="subscriber-name">
                  {subscriber.firstName} {subscriber.lastName}
                </h4>
                <p className="subscriber-email">{subscriber.email}</p>
              </div>
              <div className="subscriber-actions">
                <div 
                  className="subscription-status"
                  style={{ backgroundColor: getStatusColor(subscriber.subscriptionStatus) }}
                >
                  {getStatusText(subscriber.subscriptionStatus)}
                </div>
                
                {/* Show approve/reject buttons for pending subscriptions */}
                {subscriber.subscriptionStatus === 'pending' && (
                  <div className="pending-actions">
                    <button
                      onClick={() => handleApproveSubscriber(subscriber)}
                      disabled={approvingSubscriber === subscriber.id}
                      className="approve-btn"
                      title="Aprobar suscripción"
                    >
                      {approvingSubscriber === subscriber.id ? (
                        <div className="spinner"></div>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M20 6L9 17l-5-5"/>
                        </svg>
                      )}
                    </button>
                    <button
                      onClick={() => handleRejectSubscriber(subscriber)}
                      disabled={rejectingSubscriber === subscriber.id}
                      className="reject-btn"
                      title="Rechazar suscripción"
                    >
                      {rejectingSubscriber === subscriber.id ? (
                        <div className="spinner"></div>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18 6L6 18M6 6l12 12"/>
                        </svg>
                      )}
                    </button>
                  </div>
                )}
                
                {/* Show remove button for active subscriptions */}
                {subscriber.subscriptionStatus === 'active' && (
                  <button
                    onClick={() => handleRemoveSubscriber(subscriber)}
                    disabled={removingSubscriber === subscriber.id}
                    className="remove-subscriber-btn"
                    title="Remover suscriptor"
                  >
                    {removingSubscriber === subscriber.id ? (
                      <div className="spinner"></div>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 6L6 18M6 6l12 12"/>
                      </svg>
                    )}
                  </button>
                )}
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
          </div>
        ))}
      </div>

      <style jsx>{`
        .subscribers-list {
          width: 100%;
        }

        .subscribers-header {
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 2px solid #e5e7eb;
        }

        .subscribers-header h3 {
          margin: 0 0 0.5rem 0;
          color: #374151;
          font-size: 1.5rem;
          font-weight: 600;
        }

        .subscribers-count {
          margin: 0;
          color: #6b7280;
          font-size: 1rem;
        }

        .loading-state, .error-state, .empty-state {
          text-align: center;
          padding: 3rem 1rem;
          color: #6b7280;
        }

        .loading-spinner {
          width: 32px;
          height: 32px;
          border: 3px solid #f3f4f6;
          border-top: 3px solid #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 1rem;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .error-message {
          color: #dc2626;
          margin: 0;
          font-size: 1.1rem;
        }

        .empty-state .empty-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
        }

        .empty-state h3 {
          color: #374151;
          margin-bottom: 0.5rem;
          font-size: 1.25rem;
        }

        .empty-state p {
          color: #6b7280;
          font-size: 1rem;
        }

        .subscribers-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 1.5rem;
        }

        .subscriber-card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
          transition: all 0.3s ease;
        }

        .subscriber-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 15px rgba(0, 0, 0, 0.1);
        }

        .subscriber-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1rem;
        }

        .subscriber-info {
          flex: 1;
        }

        .subscriber-actions {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .pending-actions {
          display: flex;
          gap: 0.5rem;
        }

        .approve-btn {
          background: #dcfce7;
          border: 1px solid #bbf7d0;
          border-radius: 6px;
          padding: 0.5rem;
          cursor: pointer;
          color: #16a34a;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 32px;
          height: 32px;
        }

        .approve-btn:hover:not(:disabled) {
          background: #bbf7d0;
          border-color: #86efac;
          transform: scale(1.05);
        }

        .approve-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .reject-btn {
          background: #fee2e2;
          border: 1px solid #fecaca;
          border-radius: 6px;
          padding: 0.5rem;
          cursor: pointer;
          color: #dc2626;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 32px;
          height: 32px;
        }

        .reject-btn:hover:not(:disabled) {
          background: #fecaca;
          border-color: #f87171;
          transform: scale(1.05);
        }

        .reject-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .remove-subscriber-btn {
          background: #fee2e2;
          border: 1px solid #fecaca;
          border-radius: 6px;
          padding: 0.5rem;
          cursor: pointer;
          color: #dc2626;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 32px;
          height: 32px;
        }

        .remove-subscriber-btn:hover:not(:disabled) {
          background: #fecaca;
          border-color: #f87171;
          transform: scale(1.05);
        }

        .remove-subscriber-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .spinner {
          width: 14px;
          height: 14px;
          border: 2px solid #fecaca;
          border-top: 2px solid #dc2626;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .subscriber-name {
          margin: 0 0 0.25rem 0;
          color: #374151;
          font-size: 1.1rem;
          font-weight: 600;
        }

        .subscriber-email {
          margin: 0;
          color: #6b7280;
          font-size: 0.9rem;
        }

        .subscription-status {
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          color: white;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .subscriber-details {
          border-top: 1px solid #f3f4f6;
          padding-top: 1rem;
        }

        .detail-item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.5rem;
        }

        .detail-item:last-child {
          margin-bottom: 0;
        }

        .detail-label {
          font-weight: 500;
          color: #6b7280;
          font-size: 0.875rem;
        }

        .detail-value {
          color: #374151;
          font-size: 0.875rem;
          text-align: right;
        }

        @media (max-width: 768px) {
          .subscribers-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
          }

          .subscriber-card {
            padding: 1rem;
          }

          .subscriber-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.75rem;
          }

          .subscriber-actions {
            align-self: stretch;
            justify-content: space-between;
          }

          .detail-item {
            flex-direction: column;
            gap: 0.25rem;
          }

          .detail-value {
            text-align: left;
          }
        }
      `}</style>
    </div>
  );
}
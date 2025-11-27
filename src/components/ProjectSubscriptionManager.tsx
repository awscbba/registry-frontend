import React, { useState, useEffect } from 'react';
import { projectApi, ApiError } from '../services/projectApi';
import type { Project, Subscription } from '../types/project';
import { getComponentLogger } from '../utils/logger';

const logger = getComponentLogger('ProjectSubscriptionManager');

interface ProjectSubscriptionManagerProps {
  personId?: string;
  isEditing: boolean;
  onSubscriptionsChange?: (projectIds: string[]) => void;
}

export default function ProjectSubscriptionManager({ 
  personId, 
  isEditing, 
  onSubscriptionsChange 
}: ProjectSubscriptionManagerProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Debug log to track component mounting and personId value
  logger.info('ProjectSubscriptionManager mounted', { 
    personId, 
    personIdType: typeof personId,
    isEditing,
    hasPersonId: !!personId 
  });
  
  // Component initialization debug
  logger.debug('ProjectSubscriptionManager initialized', {
    personId,
    personIdType: typeof personId,
    isEditing,
    hasPersonId: !!personId
  });

  // Load projects and subscriptions
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Load all projects and filter for pending/active/ongoing (projects available for admin assignment)
        const allProjects = await projectApi.getAllProjects();
        const filteredProjects = allProjects.filter(project => 
          project.status === 'pending' || 
          project.status === 'active' ||
          project.status === 'ongoing'
        );
        setProjects(filteredProjects);
        
        // Load person's subscriptions if personId is provided
        if (personId) {
          logger.debug('Loading subscriptions for person', { personId });
          
          const personSubscriptions = await projectApi.getPersonSubscriptions(personId);
          
          logger.debug('Found subscriptions for person', { 
            personId, 
            subscriptionCount: personSubscriptions.length,
            subscriptions: personSubscriptions,
            rawData: personSubscriptions
          });
          setSubscriptions(personSubscriptions);
          
          // Set initially selected project IDs (active and pending subscriptions)
          const activeSubscriptions = personSubscriptions.filter(sub => sub.status === 'active' || sub.status === 'pending');
          logger.debug('Active subscriptions filtered', {
            personId,
            activeSubscriptions,
            subscriptionStructure: activeSubscriptions[0] || null,
            allFieldsInFirstSub: activeSubscriptions[0] ? Object.keys(activeSubscriptions[0]) : []
          });
          
          const currentSubscriptionProjectIds = activeSubscriptions.map(sub => {
            logger.debug('Mapping project ID from subscription', {
              subscription: sub,
              projectId: sub.projectId,
              allFields: Object.keys(sub)
            });
            // Field mapping transforms project_id to projectId (camelCase)
            return sub.projectId;
          });
          
          logger.debug('Setting selected project IDs', { 
            personId,
            allSubscriptions: personSubscriptions,
            filteredSubscriptions: personSubscriptions.filter(sub => sub.status === 'active' || sub.status === 'pending'),
            selectedProjectIds: currentSubscriptionProjectIds,
            selectedProjectIdsDetailed: currentSubscriptionProjectIds.map(id => ({ projectId: id })),
            totalSubscriptions: personSubscriptions.length
          });
          setSelectedProjectIds(currentSubscriptionProjectIds);
          
          // Notify parent component
          if (onSubscriptionsChange) {
            onSubscriptionsChange(currentSubscriptionProjectIds);
          }
        } else {
          logger.warn('No personId provided for subscription loading');
        }
      } catch (err) {
        if (err instanceof ApiError) {
          setError(`Error al cargar datos: ${err.message}`);
        } else {
          setError('Error desconocido al cargar datos');
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [personId, onSubscriptionsChange]);

  // Handle checkbox changes - now saves immediately
  const handleProjectToggle = async (projectId: string, isChecked: boolean) => {
    if (!personId) {
      setError('No se puede actualizar suscripciones sin un ID de persona');
      return;
    }

    try {
      if (isChecked) {
        // Subscribe to project
        logger.info('Subscribing person to project', { personId, projectId });
        await projectApi.subscribePersonToProject(projectId, personId, { status: 'active' });
        
        // Update local state
        const newSelectedProjectIds = [...selectedProjectIds, projectId];
        setSelectedProjectIds(newSelectedProjectIds);
        
        // Reload subscriptions to get the latest data
        const personSubscriptions = await projectApi.getPersonSubscriptions(personId);
        setSubscriptions(personSubscriptions);
        
        // Notify parent component
        if (onSubscriptionsChange) {
          onSubscriptionsChange(newSelectedProjectIds);
        }
      } else {
        // Unsubscribe from project
        const subscription = subscriptions.find(sub => sub.projectId === projectId);
        if (subscription) {
          logger.info('Unsubscribing person from project', { personId, projectId, subscriptionId: subscription.id });
          await projectApi.updateProjectSubscription(projectId, subscription.id, { status: 'cancelled' });
          
          // Update local state
          const newSelectedProjectIds = selectedProjectIds.filter(id => id !== projectId);
          setSelectedProjectIds(newSelectedProjectIds);
          
          // Reload subscriptions to get the latest data
          const personSubscriptions = await projectApi.getPersonSubscriptions(personId);
          setSubscriptions(personSubscriptions);
          
          // Notify parent component
          if (onSubscriptionsChange) {
            onSubscriptionsChange(newSelectedProjectIds);
          }
        }
      }
    } catch (err) {
      logger.error('Error toggling subscription', { error: err, personId, projectId });
      setError(err instanceof ApiError ? err.message : 'Error al actualizar suscripción');
      
      // Reload data to ensure UI is in sync
      try {
        const personSubscriptions = await projectApi.getPersonSubscriptions(personId);
        setSubscriptions(personSubscriptions);
        const activeSubscriptions = personSubscriptions.filter(sub => sub.status === 'active' || sub.status === 'pending');
        const currentSubscriptionProjectIds = activeSubscriptions.map(sub => sub.projectId);
        setSelectedProjectIds(currentSubscriptionProjectIds);
      } catch (reloadErr) {
        logger.error('Error reloading subscriptions after failed toggle', { error: reloadErr });
      }
    }
  };

  // Get subscription status for a project
  const getSubscriptionStatus = (projectId: string) => {
    const subscription = subscriptions.find(sub => sub.projectId === projectId);
    return subscription?.status || null;
  };

  if (isLoading) {
    return (
      <div className="subscription-manager">
        <h3>Suscripciones a Proyectos</h3>
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Cargando proyectos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="subscription-manager">
        <h3>Suscripciones a Proyectos</h3>
        <div className="error-state">
          <p className="error-message">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="subscription-manager">
      <div className="header-section">
        <h3>Suscripciones a Proyectos</h3>
        <p className="projects-count">
          Mostrando {projects.length} proyectos disponibles para asignación
        </p>
      </div>
      
      {projects.length === 0 ? (
        <div className="empty-state">
          <p>No hay proyectos activos disponibles</p>
        </div>
      ) : (
        <div className="projects-list">
          {projects.map((project) => {
            const subscriptionStatus = getSubscriptionStatus(project.id);
            const isSelected = selectedProjectIds.includes(project.id);
            
            return (
              <div key={project.id} className="project-item">
                <div className="project-checkbox">
                  {isEditing ? (
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => handleProjectToggle(project.id, e.target.checked)}
                        className="project-checkbox-input"
                      />
                      <span className="checkbox-custom"></span>
                      <div className="project-info">
                        <span className="project-name">{project.name}</span>
                        <span className="project-description">{project.description}</span>
                      </div>
                    </label>
                  ) : (
                    <div className="project-info readonly">
                      <span className="project-name">{project.name}</span>
                      <span className="project-description">{project.description}</span>
                      {subscriptionStatus && (
                        <span className={`status-badge status-${subscriptionStatus}`}>
                          {subscriptionStatus === 'active' ? 'Activo' : 
                           subscriptionStatus === 'pending' ? 'Pendiente' : 
                           subscriptionStatus === 'cancelled' ? 'Cancelado' : 'Desconocido'}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style jsx>{`
        .subscription-manager {
          margin-top: 2rem;
          padding: 1.5rem;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          background: #f9fafb;
        }

        .header-section {
          margin-bottom: 1rem;
        }

        .subscription-manager h3 {
          margin: 0 0 0.5rem 0;
          color: #374151;
          font-size: 1.1rem;
          font-weight: 600;
        }

        .projects-count {
          margin: 0;
          color: #6b7280;
          font-size: 0.875rem;
        }

        .loading-state, .error-state, .empty-state {
          text-align: center;
          padding: 2rem;
          color: #6b7280;
        }

        .loading-spinner {
          width: 24px;
          height: 24px;
          border: 2px solid #f3f4f6;
          border-top: 2px solid #3b82f6;
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
        }

        .projects-list {
          display: grid;
          gap: 0.75rem;
          max-height: 400px;
          overflow-y: auto;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          padding: 1rem;
          background: white;
        }

        .projects-list::-webkit-scrollbar {
          width: 8px;
        }

        .projects-list::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 4px;
        }

        .projects-list::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }

        .projects-list::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }

        .project-item {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          padding: 1rem;
          transition: all 0.2s ease;
        }

        .project-item:hover {
          border-color: #3b82f6;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }

        .checkbox-label {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          cursor: pointer;
          margin: 0;
        }

        .project-checkbox-input {
          display: none;
        }

        .checkbox-custom {
          width: 20px;
          height: 20px;
          border: 2px solid #d1d5db;
          border-radius: 4px;
          background: white;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .project-checkbox-input:checked + .checkbox-custom {
          background: #3b82f6;
          border-color: #3b82f6;
        }

        .project-checkbox-input:checked + .checkbox-custom::after {
          content: '✓';
          color: white;
          font-size: 14px;
          font-weight: bold;
        }

        .project-info {
          flex: 1;
        }

        .project-info.readonly {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .project-name {
          display: block;
          font-weight: 600;
          color: #374151;
          margin-bottom: 0.25rem;
        }

        .project-description {
          display: block;
          font-size: 0.875rem;
          color: #6b7280;
          line-height: 1.4;
        }

        .status-badge {
          display: inline-block;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 500;
          margin-top: 0.5rem;
        }

        .status-active {
          background-color: #dcfce7;
          color: #166534;
        }

        .status-pending {
          background-color: #fef3c7;
          color: #92400e;
        }

        .status-cancelled {
          background-color: #f3f4f6;
          color: #6b7280;
        }

        .status-cancelled {
          background-color: #fef2f2;
          color: #dc2626;
        }
      `}</style>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { projectApi, ApiError } from '../services/projectApi';
import type { Project, Subscription } from '../types/project';

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

  // Load projects and subscriptions
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Load all projects
        const allProjects = await projectApi.getAllProjects();
        setProjects(allProjects);
        
        // Load person's subscriptions if personId is provided
        if (personId) {
          const personSubscriptions = await projectApi.getPersonSubscriptions(personId);
          setSubscriptions(personSubscriptions);
          
          // Set initially selected project IDs (only active subscriptions)
          const activeSubscriptionProjectIds = personSubscriptions
            .filter(sub => sub.status === 'active')
            .map(sub => sub.projectId);
          setSelectedProjectIds(activeSubscriptionProjectIds);
          
          // Notify parent component
          if (onSubscriptionsChange) {
            onSubscriptionsChange(activeSubscriptionProjectIds);
          }
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

  // Handle checkbox changes
  const handleProjectToggle = (projectId: string, isChecked: boolean) => {
    const newSelectedProjectIds = isChecked
      ? [...selectedProjectIds, projectId]
      : selectedProjectIds.filter(id => id !== projectId);
    
    setSelectedProjectIds(newSelectedProjectIds);
    
    // Notify parent component
    if (onSubscriptionsChange) {
      onSubscriptionsChange(newSelectedProjectIds);
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
      <h3>Suscripciones a Proyectos</h3>
      
      {projects.length === 0 ? (
        <div className="empty-state">
          <p>No hay proyectos disponibles</p>
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
                           subscriptionStatus === 'pending' ? 'Pendiente' : 'Inactivo'}
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

        .subscription-manager h3 {
          margin: 0 0 1rem 0;
          color: #374151;
          font-size: 1.1rem;
          font-weight: 600;
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

        .status-inactive {
          background-color: #f3f4f6;
          color: #6b7280;
        }
      `}</style>
    </div>
  );
}

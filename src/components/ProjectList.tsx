import type { Project } from '../types/project';

interface ProjectListProps {
  projects: Project[];
  onEdit: (project: Project) => void;
  onDelete: (id: string) => void;
  onViewSubscribers: (project: Project) => void;
  onUpdateStatus?: (project: Project, newStatus: string) => void;
  isLoading?: boolean;
}

export default function ProjectList({ projects, onEdit, onDelete, onViewSubscribers, onUpdateStatus, isLoading = false }: ProjectListProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#fbbf24'; // Yellow
      case 'active': return '#10b981'; // Green
      case 'ongoing': return '#3b82f6'; // Blue
      case 'completed': return '#6b7280'; // Gray
      case 'cancelled': return '#ef4444'; // Red
      default: return '#6c757d';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'active': return 'Activo';
      case 'ongoing': return 'En Curso';
      case 'completed': return 'Completado';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  const getAvailableTransitions = (currentStatus: string) => {
    switch (currentStatus) {
      case 'pending':
        return [
          { status: 'active', label: 'Activar', color: '#10b981' },
          { status: 'cancelled', label: 'Cancelar', color: '#ef4444' }
        ];
      case 'active':
        return [
          { status: 'ongoing', label: 'Iniciar', color: '#3b82f6' },
          { status: 'completed', label: 'Completar', color: '#6b7280' },
          { status: 'cancelled', label: 'Cancelar', color: '#ef4444' }
        ];
      case 'ongoing':
        return [
          { status: 'active', label: 'Reactivar', color: '#10b981' },
          { status: 'completed', label: 'Completar', color: '#6b7280' },
          { status: 'cancelled', label: 'Cancelar', color: '#ef4444' }
        ];
      case 'completed':
        return [
          { status: 'active', label: 'Reactivar', color: '#10b981' }
        ];
      case 'cancelled':
        return [
          { status: 'active', label: 'Reactivar', color: '#10b981' }
        ];
      default:
        return [];
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) {
      return 'No definida';
    }
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  if (isLoading) {
    return (
      <div className="project-list">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Cargando proyectos...</p>
        </div>

        <style jsx>{`
          .loading-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 60px 20px;
          }

          .loading-spinner {
            width: 40px;
            height: 40px;
            border: 4px solid var(--border-color);
            border-top: 4px solid var(--secondary-color);
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 20px;
          }

          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="project-list">
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <h3>No hay proyectos</h3>
          <p>Aún no se han creado proyectos. Crea el primer proyecto para comenzar.</p>
        </div>

        <style jsx>{`
          .empty-state {
            text-align: center;
            padding: 60px 20px;
          }

          .empty-icon {
            font-size: 4rem;
            margin-bottom: 20px;
          }

          .empty-state h3 {
            color: var(--text-color);
            margin-bottom: 10px;
          }

          .empty-state p {
            color: var(--text-color);
            opacity: 0.7;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="project-list">
      <div className="projects-grid">
        {projects.map((project) => (
          <div key={project.id} className="project-card">
            <div className="project-header">
              <h3 className="project-title">{project.name}</h3>
              <div className="project-status" style={{ backgroundColor: getStatusColor(project.status) }}>
                {getStatusText(project.status)}
              </div>
            </div>

            <div className="project-description">
              <p>{project.description}</p>
            </div>

            <div className="project-details">
              <div className="detail-item">
                <span className="detail-label">Participantes máx:</span>
                <span className="detail-value">{project.maxParticipants || 'Sin límite'}</span>
              </div>
              {/* Show subscription counts and available slots */}
              {typeof project.subscriptionCount === 'number' && (
                <div className="detail-item">
                  <span className="detail-label">Suscripciones activas:</span>
                  <span className="detail-value">{project.subscriptionCount}</span>
                </div>
              )}
              {project.maxParticipants && typeof project.availableSlots === 'number' && (
                <div className="detail-item">
                  <span className="detail-label">Cupos disponibles:</span>
                  <span className="detail-value" style={{ 
                    color: project.availableSlots === 0 ? '#dc2626' : 
                           project.availableSlots <= 5 ? '#f59e0b' : '#10b981' 
                  }}>
                    {project.availableSlots}
                  </span>
                </div>
              )}
              {/* Show historical count if different from current */}
              {typeof project.totalSubscriptionsEverCreated === 'number' && 
               project.totalSubscriptionsEverCreated > (project.subscriptionCount || 0) && (
                <div className="detail-item">
                  <span className="detail-label">Total histórico:</span>
                  <span className="detail-value" style={{ color: '#6b7280', fontSize: '0.9em' }}>
                    {project.totalSubscriptionsEverCreated}
                  </span>
                </div>
              )}
              <div className="detail-item">
                <span className="detail-label">Fecha inicio:</span>
                <span className="detail-value">{formatDate(project.startDate)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Fecha fin:</span>
                <span className="detail-value">{formatDate(project.endDate)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Creado por:</span>
                <span className="detail-value">{project.createdBy}</span>
              </div>
            </div>

            <div className="project-actions">
              {/* Status transition buttons */}
              {onUpdateStatus && getAvailableTransitions(project.status).length > 0 && (
                <div className="status-transitions">
                  <span className="transitions-label">Estado:</span>
                  {getAvailableTransitions(project.status).map((transition) => (
                    <button
                      key={transition.status}
                      onClick={() => onUpdateStatus(project, transition.status)}
                      className="btn btn-status"
                      style={{ backgroundColor: transition.color }}
                      title={`Cambiar estado a ${transition.label.toLowerCase()}`}
                    >
                      {transition.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Regular action buttons */}
              <div className="regular-actions">
                <button
                  onClick={() => onViewSubscribers(project)}
                  className="btn btn-secondary"
                  title="Ver suscriptores"
                >
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                  Suscriptores
                </button>
                <button
                  onClick={() => onEdit(project)}
                  className="btn btn-primary"
                  title="Editar proyecto"
                >
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Editar
                </button>
                <button
                  onClick={() => onDelete(project.id)}
                  className="btn btn-danger"
                  title="Eliminar proyecto"
                >
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .project-list {
          width: 100%;
        }

        .projects-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
          gap: 30px;
        }

        .project-card {
          background: white;
          border-radius: 12px;
          padding: 25px;
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          display: flex;
          flex-direction: column;
          height: 100%;
        }

        .project-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 12px 35px rgba(0, 0, 0, 0.15);
        }

        .project-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 15px;
        }

        .project-title {
          font-size: 1.3rem;
          font-weight: 600;
          color: var(--primary-color);
          margin: 0;
          flex: 1;
          margin-right: 15px;
        }

        .project-status {
          padding: 4px 12px;
          border-radius: 20px;
          color: white;
          font-size: 0.8rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .project-description {
          margin-bottom: 20px;
          flex-grow: 1;
        }

        .project-description p {
          color: var(--text-color);
          line-height: 1.6;
          margin: 0;
        }

        .project-details {
          margin-bottom: 20px;
          padding: 15px;
          background-color: var(--light-color);
          border-radius: 8px;
        }

        .detail-item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
        }

        .detail-item:last-child {
          margin-bottom: 0;
        }

        .detail-label {
          font-weight: 600;
          color: var(--text-color);
          font-size: 0.9rem;
        }

        .detail-value {
          color: var(--text-color);
          font-size: 0.9rem;
        }

        .project-actions {
          display: flex;
          flex-direction: column;
          gap: 15px;
          margin-top: auto;
          padding-top: 20px;
          border-top: 1px solid var(--border-color);
        }

        .status-transitions {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .transitions-label {
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--text-color);
          margin-right: 5px;
        }

        .regular-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.3s ease;
          text-decoration: none;
          flex: 1;
          justify-content: center;
          min-width: 100px;
        }

        .btn-primary {
          background-color: var(--secondary-color);
          color: var(--primary-color);
        }

        .btn-primary:hover {
          background-color: #e68a00;
          transform: translateY(-1px);
        }

        .btn-secondary {
          background-color: var(--accent-color);
          color: white;
        }

        .btn-secondary:hover {
          background-color: #357abd;
          transform: translateY(-1px);
        }

        .btn-danger {
          background-color: var(--error-color);
          color: white;
        }

        .btn-danger:hover {
          background-color: #c82333;
          transform: translateY(-1px);
        }

        .btn-status {
          color: white;
          font-size: 0.8rem;
          padding: 4px 12px;
          border-radius: 4px;
          font-weight: 500;
        }

        .btn-status:hover {
          opacity: 0.9;
          transform: translateY(-1px);
        }

        @media (max-width: 768px) {
          .projects-grid {
            grid-template-columns: 1fr;
            gap: 20px;
          }

          .project-card {
            padding: 20px;
          }

          .project-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
          }

          .project-title {
            margin-right: 0;
          }

          .project-actions {
            flex-direction: column;
          }

          .btn {
            flex: none;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}

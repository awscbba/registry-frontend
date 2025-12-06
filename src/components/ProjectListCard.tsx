import { memo } from 'react';
import type { Project } from '../types/project';

interface StatusTransition {
  status: string;
  label: string;
  color: string;
}

interface ProjectListCardProps {
  project: Project;
  onEdit: (project: Project) => void;
  onDelete: (id: string) => void;
  onViewSubscribers: (project: Project) => void;
  onUpdateStatus?: (project: Project, newStatus: string) => void;
}

/**
 * ProjectListCard component displays a single project in the admin project list
 * Memoized to prevent unnecessary re-renders when other projects change
 */
const ProjectListCard = memo(function ProjectListCard({
  project,
  onEdit,
  onDelete,
  onViewSubscribers,
  onUpdateStatus
}: ProjectListCardProps) {
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

  const getAvailableTransitions = (currentStatus: string): StatusTransition[] => {
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

  return (
    <div className="project-card">
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

      <style jsx>{`
        .project-card {
          background: white;
          border-radius: 12px;
          padding: 25px;
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
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
          gap: 15px;
        }

        .project-title {
          margin: 0;
          font-size: 1.4rem;
          font-weight: 700;
          color: #1f2937;
          flex: 1;
        }

        .project-status {
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 600;
          color: white;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          white-space: nowrap;
        }

        .project-description {
          margin-bottom: 20px;
          padding: 15px;
          background: #f9fafb;
          border-radius: 8px;
        }

        .project-description p {
          margin: 0;
          color: #4b5563;
          line-height: 1.6;
        }

        .project-details {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 12px;
          margin-bottom: 20px;
          padding: 15px;
          background: #f3f4f6;
          border-radius: 8px;
        }

        .detail-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .detail-label {
          font-size: 0.8rem;
          font-weight: 600;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .detail-value {
          font-size: 0.95rem;
          color: #1f2937;
          font-weight: 500;
        }

        .project-actions {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .status-transitions {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          align-items: center;
          padding: 12px;
          background: #fef3c7;
          border-radius: 8px;
          border: 1px solid #fbbf24;
        }

        .transitions-label {
          font-size: 0.85rem;
          font-weight: 600;
          color: #92400e;
          margin-right: 8px;
        }

        .regular-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .btn {
          flex: 1;
          min-width: 120px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 10px 16px;
          border: none;
          border-radius: 8px;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn svg {
          flex-shrink: 0;
        }

        .btn-status {
          flex: 0 0 auto;
          min-width: auto;
          padding: 6px 12px;
          font-size: 0.8rem;
          color: white;
        }

        .btn-status:hover {
          opacity: 0.9;
          transform: scale(1.05);
        }

        .btn-primary {
          background: #3b82f6;
          color: white;
        }

        .btn-primary:hover {
          background: #2563eb;
        }

        .btn-secondary {
          background: #6b7280;
          color: white;
        }

        .btn-secondary:hover {
          background: #4b5563;
        }

        .btn-danger {
          background: #ef4444;
          color: white;
        }

        .btn-danger:hover {
          background: #dc2626;
        }

        @media (max-width: 768px) {
          .project-details {
            grid-template-columns: 1fr;
          }

          .regular-actions {
            flex-direction: column;
          }

          .btn {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison: only re-render if project data or callbacks change
  return (
    prevProps.project.id === nextProps.project.id &&
    prevProps.project.name === nextProps.project.name &&
    prevProps.project.description === nextProps.project.description &&
    prevProps.project.status === nextProps.project.status &&
    prevProps.project.maxParticipants === nextProps.project.maxParticipants &&
    prevProps.project.subscriptionCount === nextProps.project.subscriptionCount &&
    prevProps.project.availableSlots === nextProps.project.availableSlots &&
    prevProps.project.totalSubscriptionsEverCreated === nextProps.project.totalSubscriptionsEverCreated &&
    prevProps.project.startDate === nextProps.project.startDate &&
    prevProps.project.endDate === nextProps.project.endDate &&
    prevProps.project.createdBy === nextProps.project.createdBy &&
    prevProps.onEdit === nextProps.onEdit &&
    prevProps.onDelete === nextProps.onDelete &&
    prevProps.onViewSubscribers === nextProps.onViewSubscribers &&
    prevProps.onUpdateStatus === nextProps.onUpdateStatus
  );
});

export default ProjectListCard;

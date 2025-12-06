import { memo } from 'react';
import type { Project } from '../types/project';
import { BUTTON_CLASSES } from '../types/ui';
import { formatProjectDate } from '../utils/projectUtils';

type ViewMode = 'cards' | 'list' | 'icons';

interface ProjectCardProps {
  project: Project;
  viewMode: ViewMode;
  onSubscribeClick: (project: Project) => void;
  isOngoing?: boolean;
}

function ProjectCard({ 
  project, 
  viewMode, 
  onSubscribeClick,
  isOngoing = false 
}: ProjectCardProps) {
  const statusLabel = isOngoing 
    ? 'En Curso' 
    : project.status === 'pending' 
      ? 'Próximo' 
      : 'Activo';

  const statusClass = isOngoing ? 'ongoing' : project.status;

  // Card View
  if (viewMode === 'cards') {
    return (
      <article className={`project-item cards ${isOngoing ? 'ongoing' : ''}`} aria-label={`Proyecto: ${project.name}`}>
        <div className="project-header">
          <h3>{project.name}</h3>
          <span className={`project-status ${statusClass}`} aria-label={`Estado: ${statusLabel}`}>
            {statusLabel}
          </span>
        </div>
        
        <div className="project-content">
          <p className="project-description">{project.description}</p>
          
          <div className="project-details">
            {project.maxParticipants && (
              <div className="detail-item">
                <span className="detail-label">Participantes máximos:</span>
                <span className="detail-value">{project.maxParticipants}</span>
              </div>
            )}
            
            {project.startDate && (
              <div className="detail-item">
                <span className="detail-label">Fecha de inicio:</span>
                <span className="detail-value">{formatProjectDate(project.startDate)}</span>
              </div>
            )}
            
            {project.endDate && (
              <div className="detail-item">
                <span className="detail-label">Fecha de fin:</span>
                <span className="detail-value">{formatProjectDate(project.endDate)}</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="project-actions">
          {isOngoing ? (
            <button 
              disabled
              className="btn-unavailable"
              aria-label={`${project.name} no está disponible para suscripción`}
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
              No Disponible
            </button>
          ) : (
            <button 
              onClick={() => onSubscribeClick(project)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  onSubscribeClick(project);
                }
              }}
              className={BUTTON_CLASSES.SUBSCRIBE}
              aria-label={`Suscribirse al proyecto ${project.name}`}
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Suscribirse al Proyecto
            </button>
          )}
        </div>
      </article>
    );
  }

  // List View
  if (viewMode === 'list') {
    return (
      <article className={`project-item list ${isOngoing ? 'ongoing' : ''}`} aria-label={`Proyecto: ${project.name}`}>
        <div className="list-content">
          <div className="list-main">
            <h3>{project.name}</h3>
            <p className="project-description">{project.description}</p>
            <div className="list-details">
              <span className={`project-status ${statusClass}`} aria-label={`Estado: ${statusLabel}`}>
                {statusLabel}
              </span>
              {project.startDate && (
                <span className="date-info">Inicio: {formatProjectDate(project.startDate)}</span>
              )}
              {project.maxParticipants && (
                <span className="participants-info">Max: {project.maxParticipants}</span>
              )}
            </div>
          </div>
          {isOngoing ? (
            <button disabled className="btn-unavailable-list" aria-label={`${project.name} no está disponible para suscripción`}>
              No Disponible
            </button>
          ) : (
            <button 
              onClick={() => onSubscribeClick(project)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  onSubscribeClick(project);
                }
              }}
              className="btn-subscribe-list"
              aria-label={`Suscribirse al proyecto ${project.name}`}
            >
              Suscribirse
            </button>
          )}
        </div>
      </article>
    );
  }

  // Icon View
  return (
    <article className={`project-item icons ${isOngoing ? 'ongoing' : ''}`} aria-label={`Proyecto: ${project.name}`}>
      <div className="icon-content">
        <div className={`project-icon ${isOngoing ? 'ongoing' : ''}`} aria-hidden="true">
          <svg width="40" height="40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <h4>{project.name}</h4>
        <span className={`project-status ${statusClass}`} aria-label={`Estado: ${statusLabel}`}>
          {statusLabel}
        </span>
        {isOngoing ? (
          <button disabled className="btn-unavailable-icon" aria-label={`${project.name} no está disponible para suscripción`}>
            No Disponible
          </button>
        ) : (
          <button 
            onClick={() => onSubscribeClick(project)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                onSubscribeClick(project);
              }
            }}
            className="btn-subscribe-icon"
            aria-label={`Suscribirse al proyecto ${project.name}`}
          >
            Suscribirse
          </button>
        )}
      </div>
    </article>
  );
}

// Custom comparison function to optimize re-renders
// Only re-render if project data, viewMode, or isOngoing status changes
function arePropsEqual(prevProps: ProjectCardProps, nextProps: ProjectCardProps): boolean {
  return (
    prevProps.project.id === nextProps.project.id &&
    prevProps.project.name === nextProps.project.name &&
    prevProps.project.description === nextProps.project.description &&
    prevProps.project.status === nextProps.project.status &&
    prevProps.project.startDate === nextProps.project.startDate &&
    prevProps.project.endDate === nextProps.project.endDate &&
    prevProps.project.maxParticipants === nextProps.project.maxParticipants &&
    prevProps.viewMode === nextProps.viewMode &&
    prevProps.isOngoing === nextProps.isOngoing
    // Note: onSubscribeClick is intentionally not compared as it's a callback
    // and comparing functions would defeat the purpose of memoization
  );
}

// Export memoized component with custom comparison
export default memo(ProjectCard, arePropsEqual);

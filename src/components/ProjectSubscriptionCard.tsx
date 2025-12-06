import { memo } from 'react';
import type { Project } from '../types/project';

interface ProjectSubscriptionCardProps {
  project: Project;
  isEditing: boolean;
  isSelected: boolean;
  subscriptionStatus: string | null;
  onToggle: (projectId: string, checked: boolean) => void;
}

/**
 * ProjectSubscriptionCard component displays a single project in the subscription manager
 * Memoized to prevent unnecessary re-renders when other projects change
 */
const ProjectSubscriptionCard = memo(function ProjectSubscriptionCard({
  project,
  isEditing,
  isSelected,
  subscriptionStatus,
  onToggle
}: ProjectSubscriptionCardProps) {
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Activo';
      case 'pending': return 'Pendiente';
      case 'cancelled': return 'Cancelado';
      default: return 'Desconocido';
    }
  };

  return (
    <div className="project-item">
      <div className="project-checkbox">
        {isEditing ? (
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => onToggle(project.id, e.target.checked)}
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
                {getStatusLabel(subscriptionStatus)}
              </span>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        .project-item {
          padding: 0.75rem;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          background: white;
          transition: all 0.2s;
        }

        .project-item:hover {
          border-color: #d1d5db;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }

        .project-checkbox {
          width: 100%;
        }

        .checkbox-label {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          cursor: pointer;
          width: 100%;
        }

        .project-checkbox-input {
          position: absolute;
          opacity: 0;
          cursor: pointer;
        }

        .checkbox-custom {
          flex-shrink: 0;
          width: 20px;
          height: 20px;
          border: 2px solid #d1d5db;
          border-radius: 4px;
          background: white;
          transition: all 0.2s;
          position: relative;
          margin-top: 2px;
        }

        .project-checkbox-input:checked + .checkbox-custom {
          background: #3b82f6;
          border-color: #3b82f6;
        }

        .project-checkbox-input:checked + .checkbox-custom::after {
          content: '';
          position: absolute;
          left: 6px;
          top: 2px;
          width: 5px;
          height: 10px;
          border: solid white;
          border-width: 0 2px 2px 0;
          transform: rotate(45deg);
        }

        .project-checkbox-input:focus + .checkbox-custom {
          outline: 2px solid #3b82f6;
          outline-offset: 2px;
        }

        .project-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .project-info.readonly {
          padding: 0.25rem 0;
        }

        .project-name {
          font-weight: 600;
          color: #1f2937;
          font-size: 0.95rem;
        }

        .project-description {
          font-size: 0.85rem;
          color: #6b7280;
          line-height: 1.4;
        }

        .status-badge {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-top: 0.5rem;
          width: fit-content;
        }

        .status-active {
          background: #d1fae5;
          color: #065f46;
        }

        .status-pending {
          background: #fef3c7;
          color: #92400e;
        }

        .status-cancelled {
          background: #fee2e2;
          color: #991b1b;
        }
      `}</style>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison: only re-render if relevant props change
  return (
    prevProps.project.id === nextProps.project.id &&
    prevProps.project.name === nextProps.project.name &&
    prevProps.project.description === nextProps.project.description &&
    prevProps.isEditing === nextProps.isEditing &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.subscriptionStatus === nextProps.subscriptionStatus &&
    prevProps.onToggle === nextProps.onToggle
  );
});

export default ProjectSubscriptionCard;

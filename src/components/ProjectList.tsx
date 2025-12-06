import type { Project } from '../types/project';
import ProjectListCard from './ProjectListCard';

interface ProjectListProps {
  projects: Project[];
  onEdit: (project: Project) => void;
  onDelete: (id: string) => void;
  onViewSubscribers: (project: Project) => void;
  onUpdateStatus?: (project: Project, newStatus: string) => void;
  isLoading?: boolean;
}

export default function ProjectList({ projects, onEdit, onDelete, onViewSubscribers, onUpdateStatus, isLoading = false }: ProjectListProps) {

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
          <ProjectListCard
            key={project.id}
            project={project}
            onEdit={onEdit}
            onDelete={onDelete}
            onViewSubscribers={onViewSubscribers}
            onUpdateStatus={onUpdateStatus}
          />
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

import { useState, useEffect } from 'react';
import { projectApi, ApiError } from '../services/projectApi';
import type { Project } from '../types/project';
import { BUTTON_CLASSES } from '../types/ui';

export default function ProjectShowcase() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadActiveProjects();
  }, []);

  const loadActiveProjects = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const allProjects = await projectApi.getAllProjects();
      // Filter only active and enabled projects for public display
      const activeProjects = allProjects.filter(project => 
        project.status === 'active' && project.isEnabled !== false
      );
      setProjects(activeProjects);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(`Error al cargar proyectos: ${err.message}`);
      } else {
        setError('Error desconocido al cargar proyectos');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubscribeClick = (projectId: string) => {
    // Navigate to project-specific subscription form - use correct CloudFront path
    window.location.href = `/subscribe/${projectId}/index.html`;
  };

  const handleAdminClick = () => {
    // Navigate to admin dashboard - use correct CloudFront path
    window.location.href = '/admin/index.html';
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No definida';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="project-showcase">
        <div className="container">
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Cargando proyectos activos...</p>
          </div>
        </div>

        <style jsx>{`
          .project-showcase {
            min-height: 100vh;
            background: white;
            padding: 2rem 0;
          }

          .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 1rem;
          }

          .loading-state {
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 4rem 0;
            color: #232F3E;
          }

          .loading-spinner {
            width: 40px;
            height: 40px;
            border: 4px solid #f3f4f6;
            border-top: 4px solid #FF9900;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 1rem;
          }

          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div className="project-showcase">
        <div className="container">
          <div className="error-state">
            <div className="error-icon">
              <svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3>Error al cargar proyectos</h3>
            <p>{error}</p>
            <button onClick={loadActiveProjects} className={BUTTON_CLASSES.RETRY}>
              Reintentar
            </button>
          </div>
        </div>

        <style jsx>{`
          .project-showcase {
            min-height: 100vh;
            background: white;
            padding: 2rem 0;
          }

          .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 1rem;
          }

          .error-state {
            text-align: center;
            padding: 4rem 0;
            color: #232F3E;
          }

          .error-icon {
            color: #FF9900;
            margin-bottom: 1rem;
          }

          .btn-retry {
            background: #FF9900;
            color: white;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 0.5rem;
            cursor: pointer;
            margin-top: 1rem;
            font-weight: 600;
            transition: background-color 0.2s ease;
          }

          .btn-retry:hover {
            background: #E88B00;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="project-showcase">
      <div className="container">
        {/* Header with Admin Button */}
        <div className="header-section">
          <div className="header-content">
            <div className="header-text">
              <h1>Proyectos Activos</h1>
              <p>Descubre y únete a los proyectos de la comunidad AWS User Group Cochabamba</p>
            </div>
            <button onClick={handleAdminClick} className={BUTTON_CLASSES.ADMIN}>
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Administración
            </button>
          </div>
        </div>

        {/* Projects Grid */}
        {projects.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <svg width="64" height="64" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3>No hay proyectos activos</h3>
            <p>Actualmente no hay proyectos disponibles para registro.</p>
          </div>
        ) : (
          <div className="projects-grid">
            {projects.map((project) => (
              <div key={project.id} className="project-card">
                <div className="project-header">
                  <h3>{project.name}</h3>
                  <span className="project-status active">Activo</span>
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
                        <span className="detail-value">{formatDate(project.startDate)}</span>
                      </div>
                    )}
                    
                    {project.endDate && (
                      <div className="detail-item">
                        <span className="detail-label">Fecha de fin:</span>
                        <span className="detail-value">{formatDate(project.endDate)}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="project-actions">
                  <button 
                    onClick={() => handleSubscribeClick(project.id)}
                    className={BUTTON_CLASSES.SUBSCRIBE}
                  >
                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Suscribirse al Proyecto
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .project-showcase {
          min-height: 100vh;
          background: white;
          padding: 2rem 0;
        }

        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1rem;
        }

        .header-section {
          margin-bottom: 4rem;
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 2rem;
        }

        .header-text {
          flex: 1;
        }

        .header-text h1 {
          font-size: 3rem;
          font-weight: 700;
          margin-bottom: 1rem;
          color: #232F3E;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .header-text p {
          font-size: 1.25rem;
          color: #666;
          max-width: 600px;
        }

        .btn-admin {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: #232F3E;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 0.5rem;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s ease;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .btn-admin:hover {
          background: #1a252f;
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
        }

        .projects-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 2rem;
          margin-bottom: 2rem;
        }

        .project-card {
          background: white;
          border: 2px solid #FF9900;
          border-radius: 1rem;
          padding: 2rem;
          box-shadow: 0 4px 12px rgba(255, 153, 0, 0.1);
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .project-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #FF9900 0%, #232F3E 100%);
        }

        .project-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 25px rgba(255, 153, 0, 0.2);
          border-color: #232F3E;
        }

        .project-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1.5rem;
        }

        .project-header h3 {
          font-size: 1.5rem;
          font-weight: 700;
          color: #232F3E;
          margin: 0;
          flex: 1;
        }

        .project-status {
          padding: 0.25rem 0.75rem;
          border-radius: 1rem;
          font-size: 0.875rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .project-status.active {
          background: #FF9900;
          color: white;
        }

        .project-content {
          margin-bottom: 2rem;
        }

        .project-description {
          color: #666;
          line-height: 1.6;
          margin-bottom: 1.5rem;
        }

        .project-details {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .detail-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem 0;
          border-bottom: 1px solid #f0f0f0;
        }

        .detail-label {
          font-weight: 600;
          color: #232F3E;
        }

        .detail-value {
          color: #666;
        }

        .project-actions {
          display: flex;
          justify-content: center;
        }

        .btn-subscribe {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: #FF9900;
          color: white;
          border: none;
          padding: 1rem 2rem;
          border-radius: 0.5rem;
          cursor: pointer;
          font-weight: 600;
          font-size: 1rem;
          transition: all 0.2s ease;
          width: 100%;
          justify-content: center;
        }

        .btn-subscribe:hover {
          background: #E88B00;
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(255, 153, 0, 0.3);
        }

        .btn-subscribe:active {
          transform: translateY(0);
        }

        .empty-state {
          text-align: center;
          padding: 4rem 0;
          color: #666;
        }

        .empty-icon {
          color: #FF9900;
          margin-bottom: 1rem;
        }

        .empty-state h3 {
          color: #232F3E;
          margin-bottom: 0.5rem;
        }

        @media (max-width: 768px) {
          .header-content {
            flex-direction: column;
            text-align: center;
          }

          .header-text h1 {
            font-size: 2rem;
          }

          .projects-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

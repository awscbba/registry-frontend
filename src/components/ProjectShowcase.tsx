import { useState, useEffect } from 'react';
import { projectApi, ApiError } from '../services/projectApi';
import { authService } from '../services/authStub';
import type { Project } from '../types/project';
import { BUTTON_CLASSES } from '../types/ui';
import LoginForm from './LoginForm';

export default function ProjectShowcase() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLoginForm, setShowLoginForm] = useState(false);

  useEffect(() => {
    // Check if user is already authenticated
    setIsAuthenticated(authService.isAuthenticated());
    // Always load projects first, authentication is optional for viewing
    loadActiveProjects();
  }, []);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    setShowLoginForm(false);
    loadActiveProjects();
  };

  const handleLoginClick = () => {
    setShowLoginForm(true);
  };

  const loadActiveProjects = async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log('ProjectShowcase: Calling projectApi.getPublicProjects()...');
      const allProjects = await projectApi.getPublicProjects();
      console.log('ProjectShowcase: Raw API response:', allProjects);
      console.log('ProjectShowcase: Projects array length:', allProjects?.length);
      console.log('ProjectShowcase: Projects array:', JSON.stringify(allProjects, null, 2));
      
      // Filter only active projects for public display (simplified)
      const activeProjects = allProjects.filter(project => {
        console.log(`ProjectShowcase: Checking project ${project.name}: status=${project.status}, isEnabled=${project.isEnabled}`);
        return project.status === 'active';
      });
      console.log('ProjectShowcase: Filtered active projects:', activeProjects);
      console.log('ProjectShowcase: Active projects count:', activeProjects.length);
      
      setProjects(activeProjects);
      console.log('ProjectShowcase: Projects state updated successfully');
    } catch (err) {
      if (err instanceof ApiError) {
        // For now, don't require authentication for viewing projects
        // Just log the error and show a generic message
        console.warn('ProjectShowcase: API Error details:', err.status, err.message);
        setError(`Error al cargar proyectos: ${err.message}`);
      } else {
        console.error('ProjectShowcase: Unknown error:', err);
        setError('Error desconocido al cargar proyectos');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to convert project name to URL-friendly slug
  const nameToSlug = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .trim();
  };

  // Mapping function to get consistent slugs for known projects
  const getProjectSlug = (project: Project): string => {
    const name = project.name.toLowerCase();
    
    // Map known projects to their expected slugs
    if (name.includes('aws workshop')) {
      return 'aws-workshop-2025';
    } else if (name.includes('serverless bootcamp')) {
      return 'serverless-bootcamp';
    } else if (name.includes('testproy') || name.includes('test')) {
      return 'cloud-fundamentals'; // Map test project to cloud-fundamentals
    }
    
    // Fallback to generated slug
    return nameToSlug(project.name);
  };

  const handleSubscribeClick = (project: Project) => {
    const slug = getProjectSlug(project);
    console.log('Navigating to subscription page:', {
      projectName: project.name,
      projectId: project.id,
      generatedSlug: slug,
      targetUrl: `/subscribe/${slug}/`
    });
    // Navigate to project-specific subscription form - use Astro dynamic route
    // Add trailing slash to ensure proper static site routing
    window.location.href = `/subscribe/${slug}/`;
  };

  const handleAdminClick = () => {
    // Navigate to admin dashboard - use Astro route
    // Add trailing slash to ensure proper static site routing
    window.location.href = '/admin/';
  };

  const handleLogout = async () => {
    await authService.logout();
    setIsAuthenticated(false);
    setProjects([]);
    setError(null);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No definida';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Show login form if user clicked login button or there's an auth error
  if (showLoginForm || (!isAuthenticated && error?.includes('401'))) {
    return <LoginForm onLoginSuccess={handleLoginSuccess} />;
  }

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
        {/* Header with conditional Admin and Login/Logout Buttons */}
        <div className="header-section">
          <div className="header-content">
            <div className="header-text">
              <h1>Proyectos Activos</h1>
              <p>Descubre y únete a los proyectos de la comunidad AWS User Group Cochabamba</p>
              {isAuthenticated && authService.getCurrentUser() && (
                <p className="user-info">
                  Bienvenido, {authService.getCurrentUser()?.firstName} {authService.getCurrentUser()?.lastName}
                </p>
              )}
            </div>
            <div className="header-actions">
              {isAuthenticated ? (
                <>
                  <button onClick={handleAdminClick} className={BUTTON_CLASSES.ADMIN}>
                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Administración
                  </button>
                  <button onClick={handleLogout} className="btn-logout">
                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Cerrar Sesión
                  </button>
                </>
              ) : (
                <button onClick={handleLoginClick} className="btn-login">
                  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  Iniciar Sesión
                </button>
              )}
            </div>
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
                    onClick={() => handleSubscribeClick(project)}
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

        .user-info {
          font-size: 1rem !important;
          color: #FF9900 !important;
          font-weight: 600;
          margin-top: 0.5rem;
        }

        .header-actions {
          display: flex;
          gap: 1rem;
          align-items: center;
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

        .btn-logout {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: #dc2626;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 0.5rem;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s ease;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .btn-logout:hover {
          background: #b91c1c;
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(220, 38, 38, 0.3);
        }

        .btn-login {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: #FF9900;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 0.5rem;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s ease;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .btn-login:hover {
          background: #E88B00;
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(255, 153, 0, 0.3);
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

          .header-actions {
            flex-direction: column;
            width: 100%;
          }

          .header-actions button {
            width: 100%;
            justify-content: center;
          }

          .projects-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

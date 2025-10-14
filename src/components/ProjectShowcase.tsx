import { useState, useEffect } from 'react';
import { projectApi, ApiError } from '../services/projectApi';
import { authService } from '../services/authService';
import type { Project } from '../types/project';
import { BUTTON_CLASSES } from '../types/ui';
import { debugToken } from '../utils/tokenDebug';
import LoginForm from './LoginForm';

type ViewMode = 'cards' | 'list' | 'icons';

export default function ProjectShowcase() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [ongoingProjects, setOngoingProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [currentPage, setCurrentPage] = useState(1);
  const [ongoingCurrentPage, setOngoingCurrentPage] = useState(1);
  const projectsPerPage = 6;

  useEffect(() => {
    // Check if user is already authenticated
    const isAuth = authService.isAuthenticated();
    setIsAuthenticated(isAuth);
    
    // Load projects - this should work for both authenticated and non-authenticated users
    // If there's an auth error, it will be handled gracefully in the error handler
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
      const allProjects = await projectApi.getPublicProjects();
      
      // Filter projects: pending and active are available for subscription
      const availableProjects = allProjects.filter(project => {
        return project.status === 'pending' || project.status === 'active';
      });
      
      // Filter ongoing projects: display separately as unavailable for subscription
      const ongoingProjectsList = allProjects.filter(project => {
        return project.status === 'ongoing';
      });
      
      setProjects(availableProjects);
      setOngoingProjects(ongoingProjectsList);
    } catch (err) {
      if (err instanceof ApiError) {
        // Handle authentication errors gracefully
        if (err.status === 401) {
          // Authentication error - user session expired or invalid
          setIsAuthenticated(false);
          setError(null); // Don't show error message for auth issues
          // Clear any stored auth data
          authService.logout();
        } else {
          // Other API errors
          setError(`Error al cargar proyectos: ${err.message}`);
        }
      } else {
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
      .replace(/^-+|-+$/g, '') // Remove leading and trailing dashes
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
    }
    
    // Use natural slug generation for all projects
    return nameToSlug(project.name);
  };

  const handleSubscribeClick = (project: Project) => {
    const slug = getProjectSlug(project);

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
    try {
      await authService.logout();
      setIsAuthenticated(false);
      setProjects([]);
      setError(null);
      
      // Redirect to clean main page to avoid showing error messages
      window.location.href = '/';
    } catch {
      // Still redirect even if logout fails to ensure clean state
      window.location.href = '/';
    }
  };

  // Pagination logic for available projects
  const indexOfLastProject = currentPage * projectsPerPage;
  const indexOfFirstProject = indexOfLastProject - projectsPerPage;
  const currentProjects = projects.slice(indexOfFirstProject, indexOfLastProject);
  const totalPages = Math.ceil(projects.length / projectsPerPage);

  // Pagination logic for ongoing projects
  const indexOfLastOngoing = ongoingCurrentPage * projectsPerPage;
  const indexOfFirstOngoing = indexOfLastOngoing - projectsPerPage;
  const currentOngoingProjects = ongoingProjects.slice(indexOfFirstOngoing, indexOfLastOngoing);
  const totalOngoingPages = Math.ceil(ongoingProjects.length / projectsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOngoingPageChange = (page: number) => {
    setOngoingCurrentPage(page);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) {
      return 'No definida';
    }
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
                  {/* Only show admin button for admin users */}
                  {authService.isAdmin() && (
                    <button onClick={handleAdminClick} className={BUTTON_CLASSES.ADMIN}>
                      <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Administración
                    </button>
                  )}
                  <button onClick={() => debugToken()} className="btn-secondary" style={{marginRight: '10px'}}>
                    🔍 Debug Token
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

        {/* Projects Section */}
        {projects.length === 0 && ongoingProjects.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <svg width="64" height="64" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3>No hay proyectos disponibles</h3>
            <p>Actualmente no hay proyectos disponibles para registro.</p>
          </div>
        ) : (
          <>
            {/* Available Projects Section */}
            {projects.length > 0 && (
              <div className="projects-section">
                <div className="projects-header">
                  <div className="header-title">
                    <h2>Proyectos Disponibles para Suscripción ({projects.length})</h2>
                    <p>Selecciona un proyecto para ver más detalles y suscribirte</p>
                  </div>
                  
                  {/* View Mode Controls */}
                  <div className="view-controls">
                    <button
                      onClick={() => setViewMode('cards')}
                      className={`view-btn ${viewMode === 'cards' ? 'active' : ''}`}
                      title="Vista de tarjetas"
                    >
                      <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                      title="Vista de lista"
                    >
                      <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setViewMode('icons')}
                      className={`view-btn ${viewMode === 'icons' ? 'active' : ''}`}
                      title="Vista de iconos"
                    >
                      <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                {/* Projects Display */}
                <div className={`projects-display ${viewMode}`}>
                  {currentProjects.map((project) => (
                    <div key={project.id} className={`project-item ${viewMode}`}>
                      {viewMode === 'cards' && (
                        <>
                          <div className="project-header">
                            <h3>{project.name}</h3>
                            <span className={`project-status ${project.status}`}>
                              {project.status === 'pending' ? 'Próximo' : 'Activo'}
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
                        </>
                      )}

                      {viewMode === 'list' && (
                        <div className="list-content">
                          <div className="list-main">
                            <h3>{project.name}</h3>
                            <p className="project-description">{project.description}</p>
                            <div className="list-details">
                              <span className={`project-status ${project.status}`}>
                                {project.status === 'pending' ? 'Próximo' : 'Activo'}
                              </span>
                              {project.startDate && (
                                <span className="date-info">Inicio: {formatDate(project.startDate)}</span>
                              )}
                              {project.maxParticipants && (
                                <span className="participants-info">Max: {project.maxParticipants}</span>
                              )}
                            </div>
                          </div>
                          <button 
                            onClick={() => handleSubscribeClick(project)}
                            className="btn-subscribe-list"
                          >
                            Suscribirse
                          </button>
                        </div>
                      )}

                      {viewMode === 'icons' && (
                        <div className="icon-content">
                          <div className="project-icon">
                            <svg width="40" height="40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                          </div>
                          <h4>{project.name}</h4>
                          <span className={`project-status ${project.status}`}>
                            {project.status === 'pending' ? 'Próximo' : 'Activo'}
                          </span>
                          <button 
                            onClick={() => handleSubscribeClick(project)}
                            className="btn-subscribe-icon"
                          >
                            Suscribirse
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Pagination for Available Projects */}
                {totalPages > 1 && (
                  <div className="pagination">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="pagination-btn"
                    >
                      <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      Anterior
                    </button>
                    
                    <div className="pagination-numbers">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`pagination-number ${currentPage === page ? 'active' : ''}`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>
                    
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="pagination-btn"
                    >
                      Siguiente
                      <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Ongoing Projects Section */}
            {ongoingProjects.length > 0 && (
              <div className="projects-section ongoing-section">
                <div className="projects-header">
                  <div className="header-title">
                    <h2>Proyectos en Curso ({ongoingProjects.length})</h2>
                    <p>Estos proyectos están actualmente en desarrollo y no aceptan nuevas suscripciones</p>
                  </div>
                </div>
                
                <div className={`projects-display ${viewMode} ongoing`}>
                  {currentOngoingProjects.map((project) => (
                    <div key={project.id} className={`project-item ${viewMode} ongoing`}>
                      {viewMode === 'cards' && (
                        <>
                          <div className="project-header">
                            <h3>{project.name}</h3>
                            <span className="project-status ongoing">En Curso</span>
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
                              disabled
                              className="btn-unavailable"
                            >
                              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L5.636 5.636" />
                              </svg>
                              No Disponible
                            </button>
                          </div>
                        </>
                      )}

                      {viewMode === 'list' && (
                        <div className="list-content">
                          <div className="list-main">
                            <h3>{project.name}</h3>
                            <p className="project-description">{project.description}</p>
                            <div className="list-details">
                              <span className="project-status ongoing">En Curso</span>
                              {project.startDate && (
                                <span className="date-info">Inicio: {formatDate(project.startDate)}</span>
                              )}
                              {project.maxParticipants && (
                                <span className="participants-info">Max: {project.maxParticipants}</span>
                              )}
                            </div>
                          </div>
                          <button disabled className="btn-unavailable-list">
                            No Disponible
                          </button>
                        </div>
                      )}

                      {viewMode === 'icons' && (
                        <div className="icon-content">
                          <div className="project-icon ongoing">
                            <svg width="40" height="40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                          </div>
                          <h4>{project.name}</h4>
                          <span className="project-status ongoing">En Curso</span>
                          <button disabled className="btn-unavailable-icon">
                            No Disponible
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Pagination for Ongoing Projects */}
                {totalOngoingPages > 1 && (
                  <div className="pagination">
                    <button
                      onClick={() => handleOngoingPageChange(ongoingCurrentPage - 1)}
                      disabled={ongoingCurrentPage === 1}
                      className="pagination-btn"
                    >
                      <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      Anterior
                    </button>
                    
                    <div className="pagination-numbers">
                      {Array.from({ length: totalOngoingPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => handleOngoingPageChange(page)}
                          className={`pagination-number ${ongoingCurrentPage === page ? 'active' : ''}`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>
                    
                    <button
                      onClick={() => handleOngoingPageChange(ongoingCurrentPage + 1)}
                      disabled={ongoingCurrentPage === totalOngoingPages}
                      className="pagination-btn"
                    >
                      Siguiente
                      <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
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

        .projects-section {
          margin-bottom: 2rem;
        }

        .projects-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .header-title h2 {
          font-size: 2rem;
          font-weight: 600;
          color: #232F3E;
          margin-bottom: 0.5rem;
        }

        .header-title p {
          color: #666;
          font-size: 1.1rem;
        }

        .view-controls {
          display: flex;
          gap: 0.5rem;
          background: #f3f4f6;
          padding: 0.25rem;
          border-radius: 0.5rem;
        }

        .view-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0.5rem;
          border: none;
          background: transparent;
          border-radius: 0.25rem;
          cursor: pointer;
          color: #6b7280;
          transition: all 0.2s ease;
        }

        .view-btn:hover {
          color: #374151;
          background: #e5e7eb;
        }

        .view-btn.active {
          background: #FF9900;
          color: white;
        }

        /* Projects Display Layouts */
        .projects-display.cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 2rem;
        }

        .projects-display.list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .projects-display.icons {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.5rem;
        }

        /* Card View Styles */
        .project-item.cards {
          background: white;
          border: 2px solid #FF9900;
          border-radius: 1rem;
          padding: 2rem;
          box-shadow: 0 4px 12px rgba(255, 153, 0, 0.1);
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        /* List View Styles */
        .project-item.list {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          padding: 1.5rem;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
          transition: all 0.2s ease;
        }

        .project-item.list:hover {
          border-color: #FF9900;
          box-shadow: 0 4px 8px rgba(255, 153, 0, 0.1);
        }

        .list-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 2rem;
        }

        .list-main {
          flex: 1;
        }

        .list-main h3 {
          font-size: 1.25rem;
          font-weight: 600;
          color: #232F3E;
          margin-bottom: 0.5rem;
        }

        .list-main .project-description {
          color: #666;
          margin-bottom: 0.75rem;
          line-height: 1.4;
        }

        .list-details {
          display: flex;
          gap: 1rem;
          align-items: center;
          flex-wrap: wrap;
        }

        .date-info, .participants-info {
          font-size: 0.875rem;
          color: #6b7280;
          background: #f3f4f6;
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
        }

        .btn-subscribe-list, .btn-unavailable-list {
          padding: 0.75rem 1.5rem;
          border-radius: 0.5rem;
          font-weight: 600;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        }

        .btn-subscribe-list {
          background: #FF9900;
          color: white;
        }

        .btn-subscribe-list:hover {
          background: #E88B00;
        }

        .btn-unavailable-list {
          background: #6b7280;
          color: white;
          cursor: not-allowed;
          opacity: 0.7;
        }

        /* Icon View Styles */
        .project-item.icons {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 0.75rem;
          padding: 1.5rem;
          text-align: center;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
          transition: all 0.2s ease;
        }

        .project-item.icons:hover {
          border-color: #FF9900;
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(255, 153, 0, 0.1);
        }

        .icon-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.75rem;
        }

        .project-icon {
          width: 60px;
          height: 60px;
          background: #FF9900;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .project-icon.ongoing {
          background: #6b7280;
        }

        .icon-content h4 {
          font-size: 1rem;
          font-weight: 600;
          color: #232F3E;
          margin: 0;
          line-height: 1.3;
        }

        .btn-subscribe-icon, .btn-unavailable-icon {
          padding: 0.5rem 1rem;
          border-radius: 0.375rem;
          font-size: 0.875rem;
          font-weight: 600;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
          width: 100%;
        }

        .btn-subscribe-icon {
          background: #FF9900;
          color: white;
        }

        .btn-subscribe-icon:hover {
          background: #E88B00;
        }

        .btn-unavailable-icon {
          background: #6b7280;
          color: white;
          cursor: not-allowed;
          opacity: 0.7;
        }

        .project-item.cards::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #FF9900 0%, #232F3E 100%);
        }

        .project-item.cards:hover {
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

        .project-status.pending {
          background: #3b82f6;
          color: white;
        }

        .project-status.ongoing {
          background: #6b7280;
          color: white;
        }

        .ongoing-section {
          margin-top: 4rem;
        }

        .projects-display.ongoing .project-item {
          opacity: 0.8;
        }

        .project-item.cards.ongoing {
          border-color: #d1d5db;
        }

        .project-item.cards.ongoing:hover {
          border-color: #6b7280;
          transform: none;
        }

        /* Pagination Styles */
        .pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 1rem;
          margin-top: 3rem;
          padding: 2rem 0;
        }

        .pagination-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          border: 1px solid #d1d5db;
          background: white;
          color: #374151;
          border-radius: 0.5rem;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s ease;
        }

        .pagination-btn:hover:not(:disabled) {
          border-color: #FF9900;
          color: #FF9900;
        }

        .pagination-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .pagination-numbers {
          display: flex;
          gap: 0.25rem;
        }

        .pagination-number {
          width: 40px;
          height: 40px;
          border: 1px solid #d1d5db;
          background: white;
          color: #374151;
          border-radius: 0.375rem;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .pagination-number:hover {
          border-color: #FF9900;
          color: #FF9900;
        }

        .pagination-number.active {
          background: #FF9900;
          border-color: #FF9900;
          color: white;
        }

        .btn-unavailable {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: #6b7280;
          color: white;
          border: none;
          padding: 1rem 2rem;
          border-radius: 0.5rem;
          cursor: not-allowed;
          font-weight: 600;
          font-size: 1rem;
          width: 100%;
          justify-content: center;
          opacity: 0.7;
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

          .projects-header {
            flex-direction: column;
            align-items: stretch;
            text-align: center;
          }

          .header-title h2 {
            font-size: 1.5rem;
          }

          .view-controls {
            justify-content: center;
          }

          .projects-display.cards {
            grid-template-columns: 1fr;
            gap: 1.5rem;
          }

          .projects-display.icons {
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          }

          .list-content {
            flex-direction: column;
            align-items: stretch;
            gap: 1rem;
          }

          .list-details {
            justify-content: center;
          }

          .pagination {
            flex-wrap: wrap;
            gap: 0.5rem;
          }

          .pagination-numbers {
            order: -1;
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}

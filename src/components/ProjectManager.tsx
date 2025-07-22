import { useState, useEffect } from 'react';
import ProjectList from './ProjectList';
import ProjectForm from './ProjectForm';
import AdminDashboard from './AdminDashboard';
import { projectApi, ApiError } from '../services/projectApi';
import type { Project, ProjectCreate, ProjectUpdate } from '../types/project';

type View = 'dashboard' | 'projects' | 'create' | 'edit';

export default function ProjectManager() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (currentView === 'projects') {
      loadProjects();
    }
  }, [currentView]);

  const loadProjects = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await projectApi.getAllProjects();
      setProjects(data);
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

  const handleCreateProject = async (projectData: ProjectCreate) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const newProject = await projectApi.createProject(projectData);
      setProjects(prev => [...prev, newProject]);
      setCurrentView('projects');
      setSuccess('Proyecto creado exitosamente');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(`Error al crear proyecto: ${err.message}`);
      } else {
        setError('Error desconocido al crear proyecto');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProject = async (projectData: ProjectUpdate) => {
    if (!selectedProject) return;
    
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const updatedProject = await projectApi.updateProject(selectedProject.id, projectData);
      setProjects(prev => prev.map(p => p.id === selectedProject.id ? updatedProject : p));
      setCurrentView('projects');
      setSelectedProject(null);
      setSuccess('Proyecto actualizado exitosamente');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(`Error al actualizar proyecto: ${err.message}`);
      } else {
        setError('Error desconocido al actualizar proyecto');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este proyecto? Esta acción no se puede deshacer.')) return;
    
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await projectApi.deleteProject(id);
      setProjects(prev => prev.filter(p => p.id !== id));
      setSuccess('Proyecto eliminado exitosamente');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(`Error al eliminar proyecto: ${err.message}`);
      } else {
        setError('Error desconocido al eliminar proyecto');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditProject = (project: Project) => {
    setSelectedProject(project);
    setCurrentView('edit');
  };

  const handleViewSubscribers = async (project: Project) => {
    try {
      const subscribers = await projectApi.getProjectSubscribers(project.id);
      const subscriberNames = subscribers.map(sub => `${sub.firstName} ${sub.lastName}`).join('\n');
      const message = subscriberNames.length > 0 
        ? `Suscriptores de "${project.name}":\n\n${subscriberNames}`
        : `El proyecto "${project.name}" no tiene suscriptores aún.`;
      
      // For now, show in alert. In future, could open a modal or navigate to dedicated page
      alert(message);
    } catch (error) {
      alert(`Error al cargar suscriptores: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };

  const handleCancel = () => {
    setCurrentView('projects');
    setSelectedProject(null);
    setError(null);
  };

  return (
    <div className="project-manager">
      <div className="container">
        {/* Navigation */}
        <div className="admin-nav">
          <button
            onClick={() => setCurrentView('dashboard')}
            className={`nav-btn ${currentView === 'dashboard' ? 'active' : ''}`}
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Dashboard
          </button>
          <button
            onClick={() => setCurrentView('projects')}
            className={`nav-btn ${currentView === 'projects' ? 'active' : ''}`}
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Proyectos
          </button>
        </div>

        {/* Alert Messages */}
        {error && (
          <div className="alert alert-error">
            <div className="alert-content">
              <svg className="alert-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)} className="alert-close">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            <div className="alert-content">
              <svg className="alert-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{success}</span>
            </div>
            <button onClick={() => setSuccess(null)} className="alert-close">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Main Content */}
        {currentView === 'dashboard' && <AdminDashboard />}

        {currentView === 'projects' && (
          <div className="projects-view">
            <div className="view-header">
              <div className="view-title">
                <h2>Gestión de Proyectos</h2>
                <span className="project-count">{projects.length} proyecto{projects.length !== 1 ? 's' : ''}</span>
              </div>
              <button
                onClick={() => setCurrentView('create')}
                className="btn btn-primary"
                disabled={isLoading}
              >
                <svg className="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Crear Nuevo Proyecto
              </button>
            </div>
            
            <ProjectList
              projects={projects}
              onEdit={handleEditProject}
              onDelete={handleDeleteProject}
              onViewSubscribers={handleViewSubscribers}
              isLoading={isLoading}
            />
          </div>
        )}

        {currentView === 'create' && (
          <div className="form-view">
            <div className="view-header">
              <h2>Crear Nuevo Proyecto</h2>
            </div>
            <ProjectForm
              onSubmit={handleCreateProject}
              onCancel={handleCancel}
              isLoading={isLoading}
            />
          </div>
        )}

        {currentView === 'edit' && selectedProject && (
          <div className="form-view">
            <div className="view-header">
              <h2>Editar Proyecto</h2>
            </div>
            <ProjectForm
              project={selectedProject}
              onSubmit={handleUpdateProject}
              onCancel={handleCancel}
              isLoading={isLoading}
            />
          </div>
        )}
      </div>

      <style jsx>{`
        .project-manager {
          min-height: 100vh;
          padding: 20px 0;
        }

        .admin-nav {
          display: flex;
          gap: 10px;
          margin-bottom: 30px;
          padding: 20px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        }

        .nav-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          border: none;
          border-radius: 8px;
          background: transparent;
          color: var(--text-color);
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .nav-btn:hover {
          background-color: var(--light-color);
          color: var(--primary-color);
        }

        .nav-btn.active {
          background-color: var(--secondary-color);
          color: var(--primary-color);
        }

        .alert {
          padding: 16px 20px;
          border-radius: 8px;
          margin-bottom: 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .alert-error {
          background-color: #fef2f2;
          border: 1px solid #fecaca;
          color: var(--error-color);
        }

        .alert-success {
          background-color: #f0fdf4;
          border: 1px solid #bbf7d0;
          color: var(--success-color);
        }

        .alert-content {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .alert-icon {
          width: 20px;
          height: 20px;
          flex-shrink: 0;
        }

        .alert-close {
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          transition: background-color 0.2s;
        }

        .alert-close:hover {
          background-color: rgba(0, 0, 0, 0.1);
        }

        .alert-close svg {
          width: 16px;
          height: 16px;
        }

        .view-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid var(--border-color);
        }

        .view-title {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .view-title h2 {
          font-size: 1.8rem;
          color: var(--primary-color);
          margin: 0;
        }

        .project-count {
          background-color: var(--accent-color);
          color: white;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.9rem;
          font-weight: 600;
        }

        .btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background-color: var(--secondary-color);
          color: var(--primary-color);
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.3s ease;
          text-decoration: none;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .btn:hover:not(:disabled) {
          background-color: #e68a00;
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .btn-icon {
          width: 20px;
          height: 20px;
        }

        .projects-view,
        .form-view {
          background: white;
          border-radius: 12px;
          padding: 30px;
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
        }

        @media (max-width: 768px) {
          .admin-nav {
            flex-direction: column;
            gap: 5px;
          }

          .nav-btn {
            justify-content: center;
          }

          .view-header {
            flex-direction: column;
            gap: 20px;
            align-items: flex-start;
          }

          .view-title {
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
          }

          .btn {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}

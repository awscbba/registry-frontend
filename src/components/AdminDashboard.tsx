import { useState, useEffect } from 'react';
import { projectApi, ApiError } from '../services/projectApi';
import { authService } from '../services/authStub';
import PersonList from './PersonList';
import ProjectCreateForm from './ProjectCreateForm';
import type { AdminDashboard as AdminDashboardType, ProjectCreate } from '../types/project';
import type { Person } from '../types/person';
import { BUTTON_CLASSES } from '../types/ui';

type AdminView = 'dashboard' | 'people' | 'create-project';

export default function AdminDashboard() {
  const [dashboard, setDashboard] = useState<AdminDashboardType | null>(null);
  const [currentView, setCurrentView] = useState<AdminView>('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // People management state
  const [people, setPeople] = useState<Person[]>([]);
  const [isPeopleLoading, setIsPeopleLoading] = useState(false);

  useEffect(() => {
    // Check authentication first
    if (!authService.isAuthenticated()) {
      setError('Acceso denegado. Por favor, inicia sesión.');
      setIsLoading(false);
      return;
    }
    
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Try to load dashboard data, but handle gracefully if endpoint doesn't exist
      const data = await projectApi.getAdminDashboard();
      setDashboard(data);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        // Dashboard endpoint doesn't exist, create a basic dashboard
        console.warn('Admin dashboard endpoint not found, using basic dashboard');
        setDashboard({
          totalProjects: 0,
          totalPeople: 0,
          totalSubscriptions: 0,
          recentActivity: []
        });
      } else if (err instanceof ApiError) {
        setError(`Error al cargar dashboard: ${err.message}`);
      } else {
        setError('Error desconocido al cargar dashboard');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProject = async (projectData: ProjectCreate) => {
    setIsSubmitting(true);
    setError(null);
    try {
      await projectApi.createProject(projectData);
      setSuccessMessage('Proyecto creado exitosamente');
      setCurrentView('dashboard');
      // Reload dashboard to show the new project
      await loadDashboard();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(`Error al crear proyecto: ${err.message}`);
      } else {
        setError('Error desconocido al crear proyecto');
      }
      throw err; // Re-throw to let form handle it
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelCreate = () => {
    setCurrentView('dashboard');
    setError(null);
  };

  const clearMessages = () => {
    setError(null);
    setSuccessMessage(null);
  };

  // People management functions
  const loadPeople = async () => {
    setIsPeopleLoading(true);
    setError(null);
    try {
      const peopleData = await projectApi.getAllPeople();
      setPeople(peopleData);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(`Error al cargar personas: ${err.message}`);
      } else {
        setError('Error desconocido al cargar personas');
      }
    } finally {
      setIsPeopleLoading(false);
    }
  };

  const handleEditPerson = (person: Person) => {
    // For now, just show an alert - you can implement edit functionality later
    alert(`Editar persona: ${person.firstName} ${person.lastName}`);
  };

  const handleDeletePerson = async (id: string) => {
    if (!confirm('¿Está seguro de que desea eliminar esta persona?')) {
      return;
    }

    try {
      await projectApi.deletePerson(id);
      setSuccessMessage('Persona eliminada exitosamente');
      await loadPeople(); // Reload the list
      await loadDashboard(); // Update dashboard counts
    } catch (err) {
      if (err instanceof ApiError) {
        setError(`Error al eliminar persona: ${err.message}`);
      } else {
        setError('Error desconocido al eliminar persona');
      }
    }
  };

  const handleViewPeople = () => {
    setCurrentView('people');
    loadPeople(); // Load people when switching to people view
  };

  if (isLoading) {
    return (
      <div className="admin-dashboard">
        <div className="container">
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Cargando dashboard...</p>
          </div>
        </div>

        <style jsx>{`
          .admin-dashboard {
            min-height: 400px;
          }

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

  if (error) {
    const isAuthError = error.includes('Acceso denegado');
    
    return (
      <div className="admin-dashboard">
        <div className="container">
          <div className="error-state">
            <div className="error-icon">⚠️</div>
            <h3>{isAuthError ? 'Acceso Denegado' : 'Error al cargar dashboard'}</h3>
            <p>{error}</p>
            {isAuthError ? (
              <button onClick={() => window.location.href = '/'} className="btn btn-primary">
                Volver al Inicio
              </button>
            ) : (
              <button onClick={loadDashboard} className="btn btn-primary">
                Reintentar
              </button>
            )}
          </div>
        </div>

        <style jsx>{`
          .error-state {
            text-align: center;
            padding: 60px 20px;
          }

          .error-icon {
            font-size: 3rem;
            margin-bottom: 20px;
          }

          .error-state h3 {
            color: var(--error-color);
            margin-bottom: 10px;
          }

          .error-state p {
            color: var(--text-color);
            margin-bottom: 30px;
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
            cursor: pointer;
            transition: all 0.3s ease;
            text-decoration: none;
          }

          .btn:hover {
            background-color: #e68a00;
            transform: translateY(-2px);
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="container">
        {/* Success/Error Messages */}
        {successMessage && (
          <div className="alert alert-success">
            <span>{successMessage}</span>
            <button onClick={clearMessages} className="alert-close">×</button>
          </div>
        )}
        {error && (
          <div className="alert alert-error">
            <span>{error}</span>
            <button onClick={clearMessages} className="alert-close">×</button>
          </div>
        )}

        {currentView === 'people' ? (
          // People List View
          <div className="people-view">
            <div className="view-header">
              <button 
                onClick={() => setCurrentView('dashboard')}
                className="back-button"
              >
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Volver al Dashboard
              </button>
              <h2>Lista de Personas Registradas</h2>
              <p>Total: {dashboard?.totalPeople || 0} personas</p>
            </div>
            <PersonList 
              people={people}
              onEdit={handleEditPerson}
              onDelete={handleDeletePerson}
              isLoading={isPeopleLoading}
            />
          </div>
        ) : currentView === 'create-project' ? (
          // Create Project View
          <div className="create-project-view">
            <div className="view-header">
              <button 
                onClick={handleCancelCreate}
                className="back-button"
              >
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Volver al Dashboard
              </button>
            </div>
            <ProjectCreateForm 
              onSubmit={handleCreateProject}
              onCancel={handleCancelCreate}
              isSubmitting={isSubmitting}
            />
          </div>
        ) : (
          // Dashboard View
          <>
            {/* Dashboard Header */}
            <div className="dashboard-header">
              <h1>Panel de Administración</h1>
              <p>Resumen general del sistema de registro</p>
              <div className="header-actions">
                <button onClick={loadDashboard} className="refresh-btn" title="Actualizar datos">
                  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
                <button 
                  onClick={() => setCurrentView('create-project')} 
                  className={BUTTON_CLASSES.CREATE}
                  title="Crear nuevo proyecto"
                >
                  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Crear Proyecto
                </button>
              </div>
            </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div 
            className="stat-card people clickable" 
            onClick={handleViewPeople}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                handleViewPeople();
              }
            }}
          >
            <div className="stat-icon">
              <svg width="32" height="32" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <div className="stat-content">
              <h3>Personas Registradas</h3>
              <div className="stat-number">{dashboard?.totalPeople || 0}</div>
              <p>Total de usuarios en el sistema</p>
              <div className="click-hint">
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                Ver lista
              </div>
            </div>
          </div>

          <div className="stat-card projects">
            <div className="stat-icon">
              <svg width="32" height="32" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div className="stat-content">
              <h3>Proyectos Activos</h3>
              <div className="stat-number">{dashboard?.totalProjects || 0}</div>
              <p>Proyectos disponibles para registro</p>
            </div>
          </div>

          <div className="stat-card subscriptions">
            <div className="stat-icon">
              <svg width="32" height="32" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="stat-content">
              <h3>Suscripciones Activas</h3>
              <div className="stat-number">{dashboard?.totalSubscriptions || 0}</div>
              <p>Personas suscritas a proyectos</p>
            </div>
          </div>
        </div>

        {/* Last Updated */}
        <div className="dashboard-footer">
          <p>
            <strong>Última actualización:</strong>{' '}
            {dashboard?.timestamp ? new Date(dashboard.timestamp).toLocaleString('es-ES') : 'N/A'}
          </p>
        </div>
          </>
        )}
      </div>

      <style jsx>{`
        .admin-dashboard {
          padding: 40px 0;
        }

        .dashboard-header {
          text-align: center;
          margin-bottom: 50px;
          position: relative;
        }

        .dashboard-header h1 {
          font-size: 2.5rem;
          color: var(--primary-color);
          margin-bottom: 10px;
        }

        .dashboard-header p {
          font-size: 1.2rem;
          color: var(--text-color);
          opacity: 0.8;
        }

        .header-actions {
          position: absolute;
          top: 0;
          right: 0;
          display: flex;
          gap: 1rem;
          align-items: center;
        }

        .refresh-btn {
          background: none;
          border: 2px solid var(--border-color);
          border-radius: 8px;
          padding: 8px;
          cursor: pointer;
          color: var(--text-color);
          transition: all 0.3s ease;
        }

        .refresh-btn:hover {
          border-color: var(--secondary-color);
          color: var(--secondary-color);
          transform: rotate(180deg);
        }

        .btn-create {
          background: linear-gradient(135deg, #FF9900 0%, #E88B00 100%);
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
        }

        .btn-create:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(255, 153, 0, 0.3);
        }

        .alert {
          padding: 1rem 1.5rem;
          border-radius: 8px;
          margin-bottom: 1.5rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-weight: 500;
        }

        .alert-success {
          background: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        }

        .alert-error {
          background: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        }

        .alert-close {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: inherit;
          opacity: 0.7;
          padding: 0;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .alert-close:hover {
          opacity: 1;
        }

        .view-header {
          margin-bottom: 2rem;
        }

        .back-button {
          background: none;
          border: 2px solid var(--border-color);
          border-radius: 8px;
          padding: 0.5rem 1rem;
          cursor: pointer;
          color: var(--text-color);
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 500;
          margin-bottom: 1rem;
        }

        .back-button:hover {
          border-color: var(--secondary-color);
          color: var(--secondary-color);
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 30px;
          margin-bottom: 40px;
        }

        .stat-card {
          background: white;
          border-radius: 12px;
          padding: 30px;
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
          display: flex;
          align-items: center;
          gap: 20px;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .stat-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 12px 35px rgba(0, 0, 0, 0.15);
        }

        .stat-icon {
          width: 60px;
          height: 60px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .stat-card.people .stat-icon {
          background-color: #e3f2fd;
          color: #1976d2;
        }

        .stat-card.projects .stat-icon {
          background-color: #fff8e1;
          color: #f57c00;
        }

        .stat-card.subscriptions .stat-icon {
          background-color: #e8f5e9;
          color: #388e3c;
        }

        .stat-content h3 {
          font-size: 1.1rem;
          color: var(--text-color);
          margin-bottom: 8px;
          font-weight: 600;
        }

        .stat-number {
          font-size: 2.5rem;
          font-weight: 700;
          color: var(--primary-color);
          margin-bottom: 5px;
        }

        .stat-content p {
          font-size: 0.9rem;
          color: var(--text-color);
          opacity: 0.7;
          margin: 0;
        }

        .dashboard-footer {
          text-align: center;
          padding: 20px;
          background: rgba(255, 255, 255, 0.5);
          border-radius: 8px;
          border: 1px solid var(--border-color);
        }

        .dashboard-footer p {
          margin: 0;
          color: var(--text-color);
          font-size: 0.9rem;
        }

        @media (max-width: 768px) {
          .dashboard-header {
            margin-bottom: 30px;
          }

          .dashboard-header h1 {
            font-size: 2rem;
          }

          .header-actions {
            position: static;
            justify-content: center;
            margin-top: 1.5rem;
            flex-direction: column;
            gap: 0.75rem;
          }

          .refresh-btn,
          .btn-create {
            width: 100%;
            justify-content: center;
          }

          .stats-grid {
            grid-template-columns: 1fr;
            gap: 20px;
          }

          .stat-card {
            padding: 20px;
          }

          .stat-number {
            font-size: 2rem;
          }
        }
        
        /* People View Styles */
        .people-view {
          background: white;
          border-radius: 12px;
          padding: 2rem;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .view-header {
          margin-bottom: 2rem;
          padding-bottom: 1rem;
          border-bottom: 2px solid #f3f4f6;
        }

        .back-button {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: #6b7280;
          color: white;
          border: none;
          padding: 0.75rem 1rem;
          border-radius: 0.5rem;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.3s ease;
          margin-bottom: 1rem;
        }

        .back-button:hover {
          background: #4b5563;
          transform: translateY(-1px);
        }

        .view-header h2 {
          font-size: 1.75rem;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 0.5rem;
        }

        .view-header p {
          color: #6b7280;
          font-size: 1rem;
        }

        /* Clickable card styles */
        .stat-card.clickable {
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .stat-card.clickable:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
        }

        .stat-card.clickable:hover .click-hint {
          opacity: 1;
          transform: translateX(0);
        }

        .click-hint {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.875rem;
          color: #6b7280;
          margin-top: 0.5rem;
          opacity: 0.7;
          transform: translateX(-10px);
          transition: all 0.3s ease;
        }

        .stat-card.people.clickable {
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          color: white;
        }

        .stat-card.people.clickable .stat-content h3,
        .stat-card.people.clickable .stat-content p,
        .stat-card.people.clickable .click-hint {
          color: white;
        }

        .stat-card.people.clickable .stat-icon {
          color: rgba(255, 255, 255, 0.9);
        }
      `}</style>
    </div>
  );
}

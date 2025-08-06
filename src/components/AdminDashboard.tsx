import { useState, useEffect } from 'react';
import { projectApi, ApiError } from '../services/projectApi';
import { authService } from '../services/authStub';
import PersonList from './PersonList';
import PersonForm from './PersonForm';
import ProjectList from './ProjectList';
import ProjectForm from './ProjectForm';
import SessionMonitor from './SessionMonitor';
import type { AdminDashboard as AdminDashboardType, ProjectCreate, Project, ProjectSubscriber } from '../types/project';
import type { Person } from '../types/person';
import { BUTTON_CLASSES } from '../types/ui';

type AdminView = 'dashboard' | 'people' | 'projects' | 'create-project' | 'edit-project' | 'project-subscribers' | 'edit-person' | 'create-person';

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
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  
  // Projects management state
  const [projects, setProjects] = useState<Project[]>([]);
  const [isProjectsLoading, setIsProjectsLoading] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [currentProjectSubscribers, setCurrentProjectSubscribers] = useState<ProjectSubscriber[]>([]);
  const [isSubscribersLoading, setIsSubscribersLoading] = useState(false);

  useEffect(() => {
    // Check authentication first
    if (!authService.isAuthenticated()) {
      setError('Acceso denegado. Por favor, inicia sesión.');
      setIsLoading(false);
      return;
    }
    
    console.log('AdminDashboard: Authentication successful, loading dashboard');
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Load dashboard data and people count in parallel
      console.log('AdminDashboard: Loading dashboard and people data...');
      const [dashboardData, peopleData] = await Promise.all([
        projectApi.getAdminDashboard(),
        projectApi.getAllPeople()
      ]);
      
      console.log('AdminDashboard: Dashboard data received:', dashboardData);
      console.log('AdminDashboard: People count:', peopleData.length);
      
      // Combine dashboard data with people count
      const completeData = {
        ...dashboardData,
        totalPeople: peopleData.length,
        timestamp: dashboardData.timestamp || new Date().toISOString()
      };
      
      setDashboard(completeData);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        // Dashboard endpoint doesn't exist, create a basic dashboard
        setDashboard({
          totalProjects: 0,
          totalPeople: 0,
          totalSubscriptions: 0,
          recentActivity: []
        });
      } else if (err instanceof ApiError) {
        setError(`Error al cargar dashboard: ${err.message}`);
      } else {
        console.error('AdminDashboard: Unknown error:', err);
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

  const loadProjects = async () => {
    setIsProjectsLoading(true);
    setError(null);
    try {
      const projectsData = await projectApi.getAllProjects();
      setProjects(projectsData);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(`Error al cargar proyectos: ${err.message}`);
      } else {
        setError('Error desconocido al cargar proyectos');
      }
    } finally {
      setIsProjectsLoading(false);
    }
  };

  const handleEditPerson = (person: Person) => {
    setEditingPerson(person);
    setCurrentView('edit-person');
  };

  const handleSavePerson = async (updatedPersonData: any, subscriptionData?: { projectIds: string[] }) => {
    setIsSubmitting(true);
    setError(null);
    try {
      if (!editingPerson?.id) {
        throw new Error('No se puede actualizar: ID de persona no encontrado');
      }

      await projectApi.updatePerson(editingPerson.id, updatedPersonData);
      
      // Update subscriptions if provided
      if (subscriptionData?.projectIds) {
        await projectApi.updatePersonSubscriptions(editingPerson.id, subscriptionData.projectIds);
      }
      
      // Create the complete updated person object
      const updatedPerson = { ...editingPerson, ...updatedPersonData };
      
      // Update local state and show success
      setPeople(prevPeople => 
        prevPeople.map(person => 
          person.id === editingPerson.id ? updatedPerson : person
        )
      );
      
      setSuccessMessage(`Persona ${updatedPersonData.firstName} ${updatedPersonData.lastName} actualizada exitosamente`);
      setEditingPerson(null);
      setCurrentView('people');
      await loadDashboard(); // Refresh dashboard data
    } catch (err) {
      if (err instanceof ApiError) {
        setError(`Error al actualizar persona: ${err.message}`);
      } else {
        setError('Error desconocido al actualizar persona');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingPerson(null);
    setCurrentView('people');
    setError(null);
  };

  const handleCreatePerson = async (personData: any, subscriptionData?: { projectIds: string[] }) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const createdPerson = await projectApi.createPerson(personData);
      
      // Handle initial subscriptions if provided
      if (subscriptionData?.projectIds && subscriptionData.projectIds.length > 0) {
        await projectApi.updatePersonSubscriptions(createdPerson.id, subscriptionData.projectIds);
      }
      
      // Add to local state
      setPeople(prevPeople => [...prevPeople, createdPerson]);
      
      setSuccessMessage(`Persona ${personData.firstName} ${personData.lastName} creada exitosamente`);
      setCurrentView('people');
      await loadDashboard(); // Refresh dashboard data
    } catch (err) {
      if (err instanceof ApiError) {
        setError(`Error al crear persona: ${err.message}`);
      } else {
        setError('Error desconocido al crear persona');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelCreatePerson = () => {
    setCurrentView('people');
    setError(null);
  };

  const handleDeletePerson = async (id: string) => {
    if (!confirm('¿Está seguro de que desea eliminar esta persona?')) {
      return;
    }

    try {
      await projectApi.deletePerson(id);
      setSuccessMessage('Persona eliminada exitosamente');
      
      // Remove from local state
      setPeople(prevPeople => prevPeople.filter(person => person.id !== id));
      
      await loadDashboard(); // Update dashboard counts
    } catch (err) {
      if (err instanceof ApiError) {
        setError(`Error al eliminar persona: ${err.message}`);
      } else {
        setError('Error desconocido al eliminar persona');
      }
    }
  };

  // Project management handlers
  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setCurrentView('edit-project');
    setError(null);
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm('¿Está seguro de que desea eliminar este proyecto?')) {
      return;
    }

    try {
      await projectApi.deleteProject(id);
      setSuccessMessage('Proyecto eliminado exitosamente');
      
      // Remove from local state
      setProjects(prevProjects => prevProjects.filter(project => project.id !== id));
      
      await loadDashboard(); // Update dashboard counts
    } catch (err) {
      if (err instanceof ApiError) {
        setError(`Error al eliminar proyecto: ${err.message}`);
      } else {
        setError('Error desconocido al eliminar proyecto');
      }
    }
  };

  const handleViewSubscribers = async (project: Project) => {
    setEditingProject(project); // Store the project for context
    setCurrentView('project-subscribers');
    setError(null);
    
    // Load subscribers for this project
    setIsSubscribersLoading(true);
    try {
      const subscribers = await projectApi.getProjectSubscribers(project.id);
      setCurrentProjectSubscribers(subscribers);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(`Error al cargar suscriptores: ${err.message}`);
      } else {
        setError('Error desconocido al cargar suscriptores');
      }
      setCurrentProjectSubscribers([]);
    } finally {
      setIsSubscribersLoading(false);
    }
  };

  const handleAcceptSubscriber = async (subscriber: ProjectSubscriber) => {
    if (!editingProject) return;
    
    try {
      await projectApi.updateProjectSubscription(
        editingProject.id, 
        subscriber.id, 
        { status: 'active' }
      );
      
      setSuccessMessage(`Suscriptor ${subscriber.person.firstName} ${subscriber.person.lastName} aceptado exitosamente`);
      
      // Reload subscribers list
      await handleViewSubscribers(editingProject);
      
      // Reload dashboard to update counts
      await loadDashboard();
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 500) {
          setError(`⚠️ ERROR CONOCIDO DEL SERVIDOR

El sistema tiene un problema interno al actualizar suscripciones.

📋 INFORMACIÓN DEL SUSCRIPTOR:
• Nombre: ${subscriber.person.firstName} ${subscriber.person.lastName}
• Email: ${subscriber.person.email}
• Estado: Pendiente (pero puede participar)

🔧 SOLUCIÓN TEMPORAL:
1. El suscriptor YA ESTÁ REGISTRADO en el sistema
2. Puedes contactarlo directamente para confirmar su participación
3. Su suscripción es válida aunque aparezca como "pendiente"

👨‍💻 ESTADO TÉCNICO:
El equipo está trabajando en corregir este error del backend.
La funcionalidad será restaurada en la próxima actualización.`);
        } else {
          setError(`Error al aceptar suscriptor: ${err.message}`);
        }
      } else {
        setError('Error desconocido al aceptar suscriptor');
      }
    }
  };

  const handleDeclineSubscriber = async (subscriber: ProjectSubscriber) => {
    if (!editingProject) return;
    
    if (!confirm(`¿Está seguro de que desea rechazar la suscripción de ${subscriber.person.firstName} ${subscriber.person.lastName}?`)) {
      return;
    }
    
    try {
      await projectApi.updateProjectSubscription(
        editingProject.id, 
        subscriber.id, 
        { status: 'cancelled' }
      );
      
      setSuccessMessage(`Suscriptor ${subscriber.person.firstName} ${subscriber.person.lastName} rechazado`);
      
      // Reload subscribers list (declined users will be filtered out)
      await handleViewSubscribers(editingProject);
      
      // Reload dashboard to update counts
      await loadDashboard();
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 500) {
          setError(`⚠️ ERROR CONOCIDO DEL SERVIDOR

El sistema tiene un problema interno al actualizar suscripciones.

📋 INFORMACIÓN DEL SUSCRIPTOR:
• Nombre: ${subscriber.person.firstName} ${subscriber.person.lastName}
• Email: ${subscriber.person.email}
• Estado: Pendiente

🔧 SOLUCIÓN TEMPORAL:
1. La suscripción NO puede ser rechazada automáticamente
2. Puedes contactar al suscriptor para informarle manualmente
3. O esperar a que el error del backend sea corregido

👨‍💻 ESTADO TÉCNICO:
El equipo está trabajando en corregir este error del backend.
La funcionalidad será restaurada en la próxima actualización.`);
        } else {
          setError(`Error al rechazar suscriptor: ${err.message}`);
        }
      } else {
        setError('Error desconocido al rechazar suscriptor');
      }
    }
  };

  const handleDeactivateSubscriber = async (subscriber: ProjectSubscriber) => {
    if (!editingProject) return;
    
    if (!confirm(`¿Está seguro de que desea desactivar a ${subscriber.person.firstName} ${subscriber.person.lastName}? Esta persona dejará de estar activa en el proyecto.`)) {
      return;
    }
    
    try {
      await projectApi.updateProjectSubscription(
        editingProject.id, 
        subscriber.id, 
        { status: 'cancelled' }
      );
      
      setSuccessMessage(`${subscriber.person.firstName} ${subscriber.person.lastName} ha sido desactivado del proyecto`);
      
      // Reload subscribers list (deactivated users will be filtered out)
      await handleViewSubscribers(editingProject);
      
      // Reload dashboard to update counts
      await loadDashboard();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(`Error al desactivar suscriptor: ${err.message}`);
      } else {
        setError('Error desconocido al desactivar suscriptor');
      }
    }
  };

  const handleUpdateProjectStatus = async (project: Project, newStatus: string) => {
    const statusMessages = {
      'pending': 'pendiente',
      'active': 'activo',
      'ongoing': 'en curso',
      'completed': 'completado',
      'cancelled': 'cancelado'
    };

    const currentStatusText = statusMessages[project.status as keyof typeof statusMessages] || project.status;
    const newStatusText = statusMessages[newStatus as keyof typeof statusMessages] || newStatus;

    if (!confirm(`¿Está seguro de que desea cambiar el estado del proyecto "${project.name}" de "${currentStatusText}" a "${newStatusText}"?`)) {
      return;
    }

    // Optimistic update - immediately update the UI
    setProjects(prevProjects => 
      prevProjects.map(p => 
        p.id === project.id ? { ...p, status: newStatus } : p
      )
    );

    try {
      await projectApi.updateProject(project.id, { status: newStatus });
      
      setSuccessMessage(`Estado del proyecto "${project.name}" actualizado a "${newStatusText}"`);
      
      // Reload both dashboard and projects list to ensure consistency
      await Promise.all([
        loadDashboard(),
        loadProjects()
      ]);
      
      // If we're viewing this project's subscribers, update the editing project too
      if (editingProject && editingProject.id === project.id) {
        setEditingProject({ ...editingProject, status: newStatus });
      }
    } catch (err) {
      // Revert optimistic update on error
      setProjects(prevProjects => 
        prevProjects.map(p => 
          p.id === project.id ? { ...p, status: project.status } : p
        )
      );
      
      if (err instanceof ApiError) {
        setError(`Error al actualizar estado del proyecto: ${err.message}`);
      } else {
        setError('Error desconocido al actualizar estado del proyecto');
      }
    }
  };

  const handleSaveProject = async (projectData: any) => {
    if (!editingProject) return;
    
    setIsSubmitting(true);
    setError(null);
    try {
      await projectApi.updateProject(editingProject.id, projectData);
      setSuccessMessage('Proyecto actualizado exitosamente');
      setCurrentView('projects');
      setEditingProject(null);
      
      // Reload projects list and dashboard
      await loadProjects();
      await loadDashboard();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(`Error al actualizar proyecto: ${err.message}`);
      } else {
        setError('Error desconocido al actualizar proyecto');
      }
      throw err; // Re-throw to let form handle it
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelEditProject = () => {
    setCurrentView('projects');
    setEditingProject(null);
    setError(null);
  };

  const handleViewPeople = () => {
    setCurrentView('people');
    loadPeople(); // Load people when switching to people view
  };

  const handleViewProjects = () => {
    setCurrentView('projects');
    loadProjects(); // Load projects when switching to projects view
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

  if (error && error.includes('Error al cargar dashboard')) {
    const isAuthError = error.includes('Acceso denegado');
    
    return (
      <div className="admin-dashboard">
        <div className="container">
          <div className="error-state">
            <div className="error-icon">⚠️</div>
            <h3>{isAuthError ? 'Acceso Denegado' : 'Error al cargar dashboard'}</h3>
            <p>{error}</p>
            {isAuthError ? (
              <div>
                <button onClick={() => window.location.href = '/'} className="btn btn-primary">
                  Volver al Inicio
                </button>
                <button 
                  onClick={() => {
                    (authService as any).simulateAuth();
                    setError(null);
                    setIsLoading(true);
                    loadDashboard();
                  }} 
                  className="btn btn-secondary"
                  style={{marginLeft: '10px'}}
                >
                  Test Login (Debug)
                </button>
              </div>
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
      {/* Session Monitor for automatic logout */}
      <SessionMonitor 
        warningThreshold={300} // 5 minutes warning
        onSessionExpired={() => {
          setError('Your session has expired. Please login again.');
          // The SessionMonitor will handle the redirect
        }}
        onWarning={(timeRemaining) => {
          console.log(`Session warning: ${timeRemaining} seconds remaining`);
        }}
      />
      
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

        {currentView === 'edit-person' && editingPerson ? (
          // Edit Person View
          <div className="edit-person-view">
            <PersonForm
              person={editingPerson}
              onSubmit={handleSavePerson}
              onCancel={handleCancelEdit}
              isLoading={isSubmitting}
            />
          </div>
        ) : currentView === 'create-person' ? (
          // Create Person View
          <div className="create-person-view">
            <div className="view-header">
              <button 
                onClick={() => setCurrentView('people')}
                className="back-button"
              >
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Volver a la Lista
              </button>
              <h2>Crear Nueva Persona</h2>
            </div>
            <PersonForm
              onSubmit={handleCreatePerson}
              onCancel={handleCancelCreatePerson}
              isLoading={isSubmitting}
            />
          </div>
        ) : currentView === 'people' ? (
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
              <div className="header-content">
                <div className="header-info">
                  <h2>Lista de Personas Registradas</h2>
                  <p>Total: {dashboard?.totalPeople || 0} personas</p>
                </div>
                <button 
                  onClick={() => setCurrentView('create-person')}
                  className={BUTTON_CLASSES.CREATE}
                  title="Crear nueva persona"
                >
                  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Agregar Persona
                </button>
              </div>
            </div>
            <PersonList 
              people={people}
              onEdit={handleEditPerson}
              onDelete={handleDeletePerson}
              isLoading={isPeopleLoading}
            />
          </div>
        ) : currentView === 'projects' ? (
          // Projects List View
          <div className="projects-view">
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
              <div className="header-content">
                <div className="header-info">
                  <h2>Lista de Proyectos</h2>
                  <p>Total: {dashboard?.totalProjects || 0} proyectos</p>
                </div>
                <button 
                  onClick={() => setCurrentView('create-project')}
                  className={BUTTON_CLASSES.CREATE}
                >
                  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Crear Proyecto
                </button>
              </div>
            </div>
            <ProjectList 
              projects={projects}
              onEdit={handleEditProject}
              onDelete={handleDeleteProject}
              onViewSubscribers={handleViewSubscribers}
              onUpdateStatus={handleUpdateProjectStatus}
              isLoading={isProjectsLoading}
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
            <ProjectForm 
              onSubmit={handleCreateProject}
              onCancel={handleCancelCreate}
              isLoading={isSubmitting}
            />
          </div>
        ) : currentView === 'edit-project' && editingProject ? (
          // Edit Project View
          <div className="edit-project-view">
            <div className="view-header">
              <button 
                onClick={handleCancelEditProject}
                className="back-button"
              >
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Volver a Proyectos
              </button>
              <div className="header-content">
                <h2>Editar Proyecto</h2>
                <p>Modificar información del proyecto: {editingProject.name}</p>
              </div>
            </div>
            <ProjectForm 
              project={editingProject}
              onSubmit={handleSaveProject}
              onCancel={handleCancelEditProject}
              isLoading={isSubmitting}
            />
          </div>
        ) : currentView === 'project-subscribers' && editingProject ? (
          // Project Subscribers View
          <div className="project-subscribers-view">
            {/* Warning banner for known subscription update issue */}
            {currentProjectSubscribers.some(s => s.status === 'pending') && (
              <div className="warning-banner">
                <div className="warning-icon">⚠️</div>
                <div className="warning-content">
                  <strong>Problema Conocido:</strong> El sistema tiene un error interno al actualizar el estado de suscripciones.
                  <br />
                  <small>Los suscriptores pendientes YA ESTÁN REGISTRADOS y pueden participar. Contacta directamente para confirmar.</small>
                </div>
              </div>
            )}
            
            <div className="view-header">
              <button 
                onClick={() => setCurrentView('projects')}
                className="back-button"
              >
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Volver a Proyectos
              </button>
              <div className="header-content">
                <div className="header-info">
                  <h2>Suscriptores del Proyecto</h2>
                  <p>Proyecto: {editingProject.name}</p>
                  <p>Total suscriptores: {currentProjectSubscribers.filter(s => s.status !== 'cancelled').length}</p>
                  <div className="subscriber-stats">
                    <span className="stat-item">
                      ✅ Activos: {currentProjectSubscribers.filter(s => s.status === 'active').length}
                    </span>
                    <span className="stat-item">
                      ⏳ Pendientes: {currentProjectSubscribers.filter(s => s.status === 'pending').length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {isSubscribersLoading ? (
              <div className="loading-state">
                <div className="loading-spinner"></div>
                <p>Cargando suscriptores...</p>
              </div>
            ) : currentProjectSubscribers.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">
                  <svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <h3>No hay suscriptores</h3>
                <p>Este proyecto aún no tiene personas registradas.</p>
              </div>
            ) : (
              <div className="subscribers-list">
                {currentProjectSubscribers
                  .filter(subscriber => subscriber.status !== 'cancelled') // Hide cancelled subscribers
                  .map((subscriber) => (
                  <div key={subscriber.id} className="subscriber-card">
                    <div className="subscriber-info">
                      <h4>{subscriber.person.firstName} {subscriber.person.lastName}</h4>
                      <p>{subscriber.person.email}</p>
                      {subscriber.person.phone && <p>📞 {subscriber.person.phone}</p>}
                      <span className={`status-badge status-${subscriber.status}`}>
                        {subscriber.status === 'active' ? 'Activo' : 
                         subscriber.status === 'pending' ? 'Pendiente' : 
                         subscriber.status === 'cancelled' ? 'Cancelado' : 'Desconocido'}
                      </span>
                    </div>
                    <div className="subscriber-meta">
                      <span className="subscription-date">
                        Registrado: {new Date(subscriber.subscribedAt).toLocaleDateString()}
                      </span>
                      {subscriber.notes && (
                        <p className="subscriber-notes">Notas: {subscriber.notes}</p>
                      )}
                      
                      {/* Action buttons based on status */}
                      <div className="subscriber-actions">
                        {subscriber.status === 'pending' && (
                          <>
                            <button 
                              onClick={() => handleAcceptSubscriber(subscriber)}
                              className="action-button accept-button"
                              title="Aceptar suscripción"
                            >
                              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Aceptar
                            </button>
                            <button 
                              onClick={() => handleDeclineSubscriber(subscriber)}
                              className="action-button decline-button"
                              title="Rechazar suscripción"
                            >
                              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              Rechazar
                            </button>
                          </>
                        )}
                        {subscriber.status === 'active' && (
                          <>
                            <span className="status-text">✅ Aprobado</span>
                            <button 
                              onClick={() => handleDeactivateSubscriber(subscriber)}
                              className="action-button deactivate-button"
                              title="Desactivar usuario del proyecto"
                            >
                              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18 12M6 12l12.728 6.364" />
                              </svg>
                              Desactivar
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
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

          <div 
            className="stat-card projects clickable"
            onClick={handleViewProjects}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                handleViewProjects();
              }
            }}
          >
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

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 1rem;
        }

        .header-info {
          flex: 1;
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

        /* Warning Banner Styles */
        .warning-banner {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          background: #fff3cd;
          border: 1px solid #ffeaa7;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 20px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .warning-icon {
          font-size: 24px;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .warning-content {
          flex: 1;
          color: #856404;
          line-height: 1.5;
        }

        .warning-content strong {
          font-weight: 600;
          display: block;
          margin-bottom: 4px;
        }

        .warning-content small {
          font-size: 13px;
          opacity: 0.9;
        }

        /* Project Subscribers View Styles */
        .project-subscribers-view {
          background: white;
          border-radius: 12px;
          padding: 2rem;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .subscribers-list {
          display: grid;
          gap: 1rem;
          margin-top: 2rem;
        }

        .subscriber-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          background: #f9fafb;
          transition: all 0.2s ease;
        }

        .subscriber-card:hover {
          border-color: #3b82f6;
          background: #eff6ff;
        }

        .subscriber-info h4 {
          margin: 0 0 0.5rem 0;
          color: #1f2937;
          font-weight: 600;
        }

        .subscriber-info p {
          margin: 0.25rem 0;
          color: #6b7280;
          font-size: 0.9rem;
        }

        .subscriber-meta {
          text-align: right;
        }

        .subscription-date {
          font-size: 0.8rem;
          color: #9ca3af;
        }

        .subscriber-notes {
          font-size: 0.8rem;
          color: #6b7280;
          margin-top: 0.5rem;
        }

        .status-badge {
          display: inline-block;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 500;
          margin-top: 0.5rem;
        }

        .status-active {
          background-color: #dcfce7;
          color: #166534;
        }

        .status-pending {
          background-color: #fef3c7;
          color: #92400e;
        }

        .status-cancelled {
          background-color: #f3f4f6;
          color: #6b7280;
        }

        .status-cancelled {
          background-color: #fef2f2;
          color: #dc2626;
        }

        .subscriber-actions {
          display: flex;
          gap: 0.5rem;
          margin-top: 1rem;
          align-items: center;
        }

        .action-button {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.5rem 0.75rem;
          border: none;
          border-radius: 6px;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .accept-button {
          background-color: #10b981;
          color: white;
        }

        .accept-button:hover {
          background-color: #059669;
        }

        .decline-button {
          background-color: #ef4444;
          color: white;
        }

        .decline-button:hover {
          background-color: #dc2626;
        }

        .deactivate-button {
          background-color: #f59e0b;
          color: white;
        }

        .deactivate-button:hover {
          background-color: #d97706;
        }

        .status-text {
          font-size: 0.875rem;
          font-weight: 500;
          color: #10b981;
          margin-right: 0.5rem;
        }

        .subscriber-stats {
          display: flex;
          gap: 1rem;
          margin-top: 0.5rem;
        }

        .stat-item {
          font-size: 0.875rem;
          color: #6b7280;
          font-weight: 500;
        }

        .empty-state {
          text-align: center;
          padding: 4rem 2rem;
          color: #6b7280;
        }

        .empty-icon {
          margin-bottom: 1rem;
          color: #d1d5db;
        }

        .empty-state h3 {
          margin: 1rem 0 0.5rem 0;
          color: #374151;
        }

        .loading-state {
          text-align: center;
          padding: 4rem 2rem;
          color: #6b7280;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #f3f4f6;
          border-top: 4px solid #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 1rem;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

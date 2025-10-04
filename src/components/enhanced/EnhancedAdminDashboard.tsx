import { useState, useEffect } from 'react';
import { authService } from '../../services/authService';
import { httpClient, getApiUrl } from '../../services/httpClient';
import { projectApi } from '../../services/projectApi';
import { getErrorMessage, getErrorObject } from '../../utils/logger';
import type { PersonUpdate, Person, PersonCreate } from '../../types/person';
import type { Project, ProjectCreate, ProjectUpdate } from '../../types/project';
import PersonForm from '../PersonForm';
import PersonList from '../PersonList';
import ProjectList from '../ProjectList';
import ProjectForm from '../ProjectForm';
import ProjectSubscribersList from '../ProjectSubscribersList';
import PerformanceDashboard from '../performance/PerformanceDashboard';
import CacheManagementPanel from '../performance/CacheManagementPanel';
import SystemHealthOverview from '../performance/SystemHealthOverview';
import DatabasePerformancePanel from '../performance/DatabasePerformancePanel';
import QueryOptimizationPanel from '../performance/QueryOptimizationPanel';
import ConnectionPoolMonitor from '../performance/ConnectionPoolMonitor';
import DatabaseCharts from '../performance/DatabaseCharts';
import performanceService from '../../services/performanceService';
import type { HealthStatus } from '../../types/performance';
import { adminLogger } from '../../utils/logger';

interface AdminStats {
  totalUsers: number;
  totalProjects: number;
  totalSubscriptions: number;
  activeUsers: number;
}

interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isAdmin: boolean;
  isActive: boolean;
  createdAt: string;
  phone?: string;
  dateOfBirth?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
  updatedAt?: string;
}

type AdminView = 'dashboard' | 'users' | 'projects' | 'performance' | 'cache' | 'database' | 'query-optimization' | 'connection-pools' | 'system-health' | 'edit-user' | 'view-user' | 'create-user' | 'create-project' | 'edit-project' | 'view-project-subscribers';

export default function EnhancedAdminDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [people, setPeople] = useState<Person[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentView, setCurrentView] = useState<AdminView>('dashboard');
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [systemHealth, setSystemHealth] = useState<HealthStatus | null>(null);

  // Fetch system health for quick overview
  const fetchSystemHealth = async () => {
    try {
      const health = await performanceService.getHealthStatus();
      setSystemHealth(health);
    } catch (error) {
      // Show error state instead of hiding it
      setSystemHealth({
        status: 'error',
        score: 0,
        issues: [`Failed to fetch system health: ${error instanceof Error ? error.message : 'Unknown error'}`],
        uptime: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  useEffect(() => {
    // Check admin access first
    if (!authService.isAuthenticated()) {
      setError('Authentication required');
      setIsLoading(false);
      return;
    }

    fetchAdminData();
    fetchSystemHealth();

    // Refresh system health every 30 seconds
    const healthInterval = setInterval(fetchSystemHealth, 30000);
    return () => clearInterval(healthInterval);
  }, []);

  const fetchAdminData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch admin statistics - enterprise services should work correctly
      const statsResponse = await httpClient.getJson(getApiUrl('/v2/admin/stats')) as {
        success?: boolean;
        data?: { overview?: Record<string, number> };
        overview?: Record<string, number>;
      };
      
      const statsData = statsResponse.success ? 
        (statsResponse.data || {}) : 
        (statsResponse.data || {});
        
      setStats({
        totalUsers: statsData.totalUsers || 0,
        totalProjects: statsData.totalProjects || 0,
        totalSubscriptions: statsData.totalSubscriptions || 0,
        activeUsers: statsData.activeUsers || 0,
      });

      // Note: Users are now managed through the people list for consistency

      // Fetch projects list
      const projectsList = await projectApi.getAllProjects();
      adminLogger.info('Fetched projects for admin dashboard', { 
        count: projectsList.length,
        event_type: 'data_fetch'
      });
      setProjects(projectsList);

      // Fetch people list for PersonList component
      const peopleList = await projectApi.getAllPeople();
      adminLogger.info('Fetched people for admin dashboard', { 
        count: peopleList.length,
        event_type: 'data_fetch'
      });
      setPeople(peopleList);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load admin data');
      // Admin dashboard error logged
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserEdit = (user: AdminUser) => {
    setSelectedUser(user);
    setCurrentView('edit-user');
  };



  const handleUserUpdate = async (updates: PersonUpdate, subscriptionData?: { projectIds: string[] }) => {
    if (!selectedUser) {
      return;
    }

    try {
      // Update user data
      await httpClient.putJson(getApiUrl(`/v2/admin/users/${selectedUser.id}`), updates);

      // Handle subscription changes if provided
      if (subscriptionData) {
        // Get current subscriptions for the user
        const currentSubscriptions = await httpClient.getJson(getApiUrl(`/v2/subscriptions`));
        const userSubscriptions = (currentSubscriptions.data as any[]).filter((sub: any) => sub.personId === selectedUser.id);
        
        // Find subscriptions to delete (currently subscribed but not in new selection)
        const currentProjectIds = userSubscriptions.map((sub: any) => sub.projectId);
        const subscriptionsToDelete = userSubscriptions.filter((sub: any) => 
          !subscriptionData.projectIds.includes(sub.projectId)
        );
        
        // Find subscriptions to create (in new selection but not currently subscribed)
        const subscriptionsToCreate = subscriptionData.projectIds.filter(projectId => 
          !currentProjectIds.includes(projectId)
        );

        // Delete unselected subscriptions
        for (const subscription of subscriptionsToDelete) {
          await httpClient.request(getApiUrl(`/v2/subscriptions/${subscription.id}`), { method: 'DELETE' });
        }

        // Create new subscriptions
        for (const projectId of subscriptionsToCreate) {
          await httpClient.postJson(getApiUrl('/v2/subscriptions'), {
            personId: selectedUser.id,
            projectId: projectId,
            status: 'active'
          });
        }
      }

      // Refresh users list
      await fetchAdminData();
      setCurrentView('users');
      setSelectedUser(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user');
    }
  };

  // Project Management Handlers
  const handleProjectEdit = (project: Project) => {
    setSelectedProject(project);
    setCurrentView('edit-project');
  };

  const handleProjectCreate = () => {
    setSelectedProject(null);
    setCurrentView('create-project');
  };

  const handleProjectDelete = async (projectId: string) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este proyecto? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      adminLogger.logUserAction('delete_project', { project_id: projectId });
      await projectApi.deleteProject(projectId);
      adminLogger.info('Project deleted successfully', { 
        project_id: projectId,
        event_type: 'project_deleted'
      });
      await fetchAdminData(); // Refresh projects list
    } catch (err) {
      adminLogger.error('Error deleting project', { project_id: projectId, error: getErrorMessage(err) }, getErrorObject(err));
      setError(getErrorMessage(err) || 'Failed to delete project');
    }
  };

  const handleProjectSubmit = async (projectData: ProjectCreate | ProjectUpdate) => {
    try {
      if (selectedProject) {
        // Update existing project
        await projectApi.updateProject(selectedProject.id, projectData as ProjectUpdate);
      } else {
        // Create new project
        await projectApi.createProject(projectData as ProjectCreate);
      }
      
      await fetchAdminData(); // Refresh projects list
      setCurrentView('projects');
      setSelectedProject(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save project');
    }
  };

  const handleProjectCancel = () => {
    setCurrentView('projects');
    setSelectedProject(null);
  };

  const handleViewProjectSubscribers = (project: Project) => {
    setSelectedProject(project);
    setCurrentView('view-project-subscribers');
  };

  const handleProjectStatusUpdate = async (project: Project, newStatus: "pending" | "active" | "cancelled" | "ongoing" | "completed") => {
    try {
      await projectApi.updateProject(project.id, { status: newStatus });
      await fetchAdminData(); // Refresh projects list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update project status');
    }
  };

  // Person Management Handlers - Enterprise Implementation
  const handlePersonEdit = (person: Person) => {
    // Enterprise validation
    if (!person?.id) {
      adminLogger.error('Invalid person edit attempt', { error: 'Person ID is required' });
      setError('Invalid person data: ID is required');
      return;
    }

    // Proper business logic for Person to AdminUser conversion
    // Note: This conversion indicates a potential architectural issue
    // In enterprise systems, we should have a unified User entity
    try {
      const adminUser: AdminUser = {
        id: person.id,
        email: person.email,
        firstName: person.firstName,
        lastName: person.lastName,
        // Business rule: Default admin status based on email domain or role lookup
        isAdmin: person.email?.endsWith('@admin.domain.com') || false,
        // Business rule: Active status should come from user management service
        isActive: true, // TODO: Implement proper user status lookup
        createdAt: person.createdAt,
        phone: person.phone,
        dateOfBirth: person.dateOfBirth,
        address: person.address ? {
          street: person.address.street,
          city: person.address.city,
          state: person.address.state,
          country: person.address.country,
          postalCode: person.address.postalCode || ''
        } : undefined,
        updatedAt: person.updatedAt
      };

      adminLogger.info('Person edit initiated', { 
        personId: person.id, 
        email: person.email,
        event_type: 'person_edit_start'
      });

      setSelectedUser(adminUser);
      setCurrentView('edit-user');
    } catch (error) {
      adminLogger.error('Person edit conversion failed', { 
        personId: person.id, 
        error: getErrorMessage(error) 
      }, getErrorObject(error));
      setError('Failed to prepare person data for editing');
    }
  };

  const handlePersonDelete = async (personId: string) => {
    // Enterprise validation and confirmation
    if (!personId?.trim()) {
      adminLogger.error('Invalid delete attempt', { error: 'Person ID is required' });
      setError('Invalid person ID provided');
      return;
    }

    // Business rule: Require explicit confirmation for destructive operations
    const confirmMessage = 'Are you sure you want to delete this person? This action cannot be undone and will remove all associated data.';
    if (!window.confirm(confirmMessage)) {
      adminLogger.info('Person delete cancelled by user', { personId });
      return;
    }

    try {
      // Enterprise audit logging before action
      adminLogger.logUserAction('delete_person_attempt', { 
        person_id: personId,
        timestamp: new Date().toISOString(),
        user_agent: navigator.userAgent
      });

      await projectApi.deletePerson(personId);

      // Success audit logging
      adminLogger.info('Person deleted successfully', { 
        person_id: personId,
        event_type: 'person_deleted',
        timestamp: new Date().toISOString()
      });

      await fetchAdminData(); // Refresh people list
      
      // User feedback
      setError(null); // Clear any previous errors
      
    } catch (err) {
      // Enterprise error handling with context
      const errorContext = {
        person_id: personId,
        operation: 'delete_person',
        timestamp: new Date().toISOString(),
        error: getErrorMessage(err)
      };

      adminLogger.error('Person deletion failed', errorContext, getErrorObject(err));
      
      // User-friendly error message based on error type
      const errorMessage = getErrorMessage(err);
      
      if (errorMessage.includes('404')) {
        setError('Person not found. They may have already been deleted.');
      } else if (errorMessage.includes('403')) {
        setError('You do not have permission to delete this person.');
      } else if (errorMessage.includes('active subscriptions') || errorMessage.includes('active project subscriptions')) {
        setError('El usuario tiene registros activos, deben borrarse antes de remover.');
      } else {
        setError('Failed to delete person. Please try again or contact support.');
      }
    }
  };

  const handleUserCreate = async (userData: PersonCreate | PersonUpdate, subscriptionData?: { projectIds: string[] }) => {
    try {
      // For create, we expect PersonCreate data
      const createData = userData as PersonCreate;
      adminLogger.logUserAction('create_user', { email: createData.email });
      const newPerson = await projectApi.createPerson(createData);
      
      // Handle initial subscriptions if provided
      if (subscriptionData && subscriptionData.projectIds.length > 0) {
        for (const projectId of subscriptionData.projectIds) {
          await httpClient.postJson(getApiUrl('/v2/subscriptions'), {
            personId: newPerson.id, // Use the actual person ID returned from creation
            projectId: projectId,
            status: 'active'
          });
        }
      }
      
      adminLogger.info('User created successfully', { 
        email: createData.email,
        event_type: 'user_created'
      });
      await fetchAdminData(); // Refresh people list
      setCurrentView('users');
    } catch (err) {
      adminLogger.error('Error creating user', { error: getErrorMessage(err) }, getErrorObject(err));
      setError(getErrorMessage(err) || 'Failed to create user');
    }
  };



  const renderNavigation = () => (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex space-x-8">
              <button
                onClick={() => setCurrentView('dashboard')}
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  currentView === 'dashboard'
                    ? 'border-blue-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Dashboard
              </button>
              
              <button
                onClick={() => setCurrentView('users')}
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  ['users', 'create-user', 'edit-user', 'view-user'].includes(currentView)
                    ? 'border-blue-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Users
              </button>

              <button
                onClick={() => setCurrentView('projects')}
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  ['projects', 'create-project', 'edit-project', 'view-project', 'view-project-subscribers'].includes(currentView)
                    ? 'border-blue-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Projects
              </button>

              {/* Quick Actions */}
              <div className="flex items-center space-x-4 ml-8">
                <button
                  onClick={() => setCurrentView('create-user')}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-150"
                >
                  <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Agregar usuario
                </button>
                
                <span className="text-gray-300">|</span>
                
                <button
                  onClick={() => setCurrentView('create-project')}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-150"
                >
                  <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  Agregar Proyecto
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );

  const renderDashboardOverview = () => (
    <div className="space-y-6">
      {/* Header with refresh button */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Dashboard Overview</h2>
        <button
          onClick={() => {
            fetchSystemHealth();
          }}
          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Refresh Health
        </button>
      </div>
      
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Users</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.totalUsers}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Projects</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.totalProjects}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-100 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Subscriptions</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.totalSubscriptions}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-100 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Active Users</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.activeUsers}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* System Health Overview */}
      {systemHealth && (
        <SystemHealthOverview healthStatus={systemHealth} compactView={true} />
      )}

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => setCurrentView('performance')}
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              View Performance Dashboard
            </button>
            <button
              onClick={() => setCurrentView('database')}
              className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Database Performance
            </button>
            <button
              onClick={() => setCurrentView('cache')}
              className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Manage Cache
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (currentView) {
      case 'performance':
        return <PerformanceDashboard showAdvancedMetrics={true} />;
      
      case 'cache':
        return <CacheManagementPanel showControls={true} allowCacheClear={true} showDetailedStats={true} />;
      
      case 'database':
        return (
          <div className="space-y-6">
            <DatabasePerformancePanel showDetailedMetrics={true} />
            <DatabaseCharts timeRange="24h" metrics={['queryTime', 'poolUtilization', 'throughput', 'connections']} />
          </div>
        );
      
      case 'query-optimization':
        return <QueryOptimizationPanel showRecommendations={true} allowOptimizationApplication={true} />;
      
      case 'connection-pools':
        return <ConnectionPoolMonitor showAllPools={true} alertThreshold={0.8} />;
      
      case 'system-health':
        return systemHealth ? <SystemHealthOverview healthStatus={systemHealth} /> : null;
      
      case 'projects':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Project Management</h2>
              <button
                onClick={handleProjectCreate}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Create Project
              </button>
            </div>
            <ProjectList
              projects={projects}
              onEdit={handleProjectEdit}
              onDelete={handleProjectDelete}
              onViewSubscribers={handleViewProjectSubscribers}
              onUpdateStatus={handleProjectStatusUpdate}
              isLoading={isLoading}
            />
          </div>
        );
      
      case 'create-project':
      case 'edit-project':
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleProjectCancel}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <h2 className="text-2xl font-bold text-gray-900">
                {selectedProject ? 'Edit Project' : 'Create New Project'}
              </h2>
            </div>
            <ProjectForm
              project={selectedProject ?? undefined}
              onSubmit={handleProjectSubmit}
              onCancel={handleProjectCancel}
              isLoading={isLoading}
            />
          </div>
        );
      
      case 'view-project-subscribers':
        return selectedProject ? (
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setCurrentView('projects')}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <h2 className="text-2xl font-bold text-gray-900">
                Subscribers: {selectedProject.name}
              </h2>
            </div>
            <div className="bg-white shadow rounded-lg p-6">
              <p className="text-gray-600 mb-4">{selectedProject.description}</p>
              <ProjectSubscribersList project={selectedProject} />
            </div>
          </div>
        ) : null;
      
      case 'users':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
              <button
                onClick={() => setCurrentView('create-user')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Create New User
              </button>
            </div>
            <PersonList
              people={people}
              onEdit={handlePersonEdit}
              onDelete={handlePersonDelete}
              isLoading={isLoading}
            />
          </div>
        );
      
      case 'view-user':
        return selectedUser ? (
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  User Details: {selectedUser.firstName} {selectedUser.lastName}
                </h3>
                <button
                  onClick={() => setCurrentView('users')}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">First Name</label>
                    <div className="mt-1 p-3 bg-gray-50 border border-gray-300 rounded-md">
                      {selectedUser.firstName}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Last Name</label>
                    <div className="mt-1 p-3 bg-gray-50 border border-gray-300 rounded-md">
                      {selectedUser.lastName}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <div className="mt-1 p-3 bg-gray-50 border border-gray-300 rounded-md">
                      {selectedUser.email}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <div className="mt-1 p-3 bg-gray-50 border border-gray-300 rounded-md">
                      {selectedUser.phone || 'Not provided'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                    <div className="mt-1 p-3 bg-gray-50 border border-gray-300 rounded-md">
                      {selectedUser.dateOfBirth || 'Not provided'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <div className="mt-1 p-3 bg-gray-50 border border-gray-300 rounded-md">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        selectedUser.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {selectedUser.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Role</label>
                    <div className="mt-1 p-3 bg-gray-50 border border-gray-300 rounded-md">
                      {selectedUser.isAdmin ? 'Admin' : 'User'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Created At</label>
                    <div className="mt-1 p-3 bg-gray-50 border border-gray-300 rounded-md">
                      {new Date(selectedUser.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
                
                {selectedUser.address && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                    <div className="p-3 bg-gray-50 border border-gray-300 rounded-md">
                      <div className="space-y-1">
                        <div><strong>Street:</strong> {selectedUser.address.street || 'Not provided'}</div>
                        <div><strong>City:</strong> {selectedUser.address.city || 'Not provided'}</div>
                        <div><strong>State:</strong> {selectedUser.address.state || 'Not provided'}</div>
                        <div><strong>Country:</strong> {selectedUser.address.country || 'Not provided'}</div>
                        <div><strong>Postal Code:</strong> {selectedUser.address.postalCode || 'Not provided'}</div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => handleUserEdit(selectedUser)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Edit User
                  </button>
                  <button
                    onClick={() => setCurrentView('users')}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Back to Users
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null;
      
      case 'edit-user':
        return selectedUser ? (
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Edit User: {selectedUser.firstName} {selectedUser.lastName}
                </h3>
                <button
                  onClick={() => setCurrentView('users')}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <PersonForm
                person={{
                  id: selectedUser.id,
                  firstName: selectedUser.firstName,
                  lastName: selectedUser.lastName,
                  email: selectedUser.email,
                  phone: selectedUser.phone || '',
                  dateOfBirth: selectedUser.dateOfBirth || '',
                  address: selectedUser.address || {
                    street: '',
                    city: '',
                    state: '',
                    country: '',
                    postalCode: ''
                  },
                  createdAt: selectedUser.createdAt,
                  updatedAt: selectedUser.updatedAt || selectedUser.createdAt
                }}
                onSubmit={handleUserUpdate}
                onCancel={() => setCurrentView('users')}
                isLoading={false}
              />
            </div>
          </div>
        ) : null;
      
      case 'create-user':
        return (
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Create New User
                </h3>
                <button
                  onClick={() => setCurrentView('users')}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <PersonForm
                onSubmit={handleUserCreate}
                onCancel={() => setCurrentView('users')}
                isLoading={false}
              />
            </div>
          </div>
        );
      
      default:
        return renderDashboardOverview();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.href = '/login'}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {renderNavigation()}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
// Force build trigger - Sat Oct  4 15:41:12 -04 2025

import { useState, useEffect, useCallback } from 'react';
import { httpClient, getApiUrl } from '../../services/httpClient';
import { projectApi } from '../../services/projectApi';
import { getErrorObject } from '../../utils/logger';
import type { Person } from '../../types/person';
import PersonList from '../PersonList';
import PerformanceDashboard from '../performance/PerformanceDashboard';
import CacheManagementPanel from '../performance/CacheManagementPanel';
import SystemHealthOverview from '../performance/SystemHealthOverview';
import DatabasePerformancePanel from '../performance/DatabasePerformancePanel';
import DatabaseCharts from '../performance/DatabaseCharts';
import performanceService from '../../services/performanceService';
import type { HealthStatus } from '../../types/performance';
import { adminLogger } from '../../utils/logger';
// Clean Architecture imports
import { MenuNavigationUseCase, StatsMenuToggleUseCase } from '../../domain/usecases/MenuNavigationUseCase';
import { MenuRepositoryImpl } from '../../infrastructure/repositories/MenuRepositoryImpl';
import { StatsMenuDropdown } from '../../presentation/components/StatsMenuDropdown';
import type { MenuItemType, StatsSubMenuType } from '../../domain/entities/AdminDashboard';

// Keep all existing interfaces and types
interface AdminStats {
  totalUsers: number;
  totalProjects: number;
  totalSubscriptions: number;
  activeUsers: number;
}


type AdminView = 'dashboard' | 'users' | 'projects' | 'performance' | 'cache' | 'database' | 
  'create-user' | 'edit-user' | 'view-user' | 'create-project' | 'edit-project' | 'view-project' | 
  'view-project-subscribers' | 'query-optimization' | 'connection-pools' | 'system-health';

export default function CleanAdminDashboard() {
  // Clean Architecture setup
  const [menuRepo] = useState(() => new MenuRepositoryImpl());
  const [menuNavigationUseCase] = useState(() => new MenuNavigationUseCase(menuRepo));
  const [statsToggleUseCase] = useState(() => new StatsMenuToggleUseCase());
  
  // UI State
  const [currentView, setCurrentView] = useState<AdminView>('dashboard');
  const [isStatsMenuOpen, setIsStatsMenuOpen] = useState(false);
  
  // Keep all existing state and logic from original dashboard
  const [people, setPeople] = useState<Person[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [systemHealth, setSystemHealth] = useState<HealthStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Clean Architecture menu handlers
  const handleMenuNavigation = useCallback((type: MenuItemType) => {
    menuNavigationUseCase.navigateToMenuItem(type);
    setCurrentView(type);
    setIsStatsMenuOpen(false);
  }, [menuNavigationUseCase]);

  const handleStatsToggle = useCallback(() => {
    setIsStatsMenuOpen(statsToggleUseCase.execute(isStatsMenuOpen));
  }, [isStatsMenuOpen, statsToggleUseCase]);

  const handleStatsItemSelect = useCallback((type: StatsSubMenuType) => {
    setCurrentView(type);
    setIsStatsMenuOpen(false);
  }, []);

  // Keep all existing useEffect and handler functions from original dashboard
  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        setIsLoading(true);
        await Promise.all([
          fetchPeople(),
          fetchStats(),
          fetchSystemHealth()
        ]);
      } catch (error) {
        adminLogger.error('Failed to initialize admin dashboard', getErrorObject(error));
      } finally {
        setIsLoading(false);
      }
    };

    initializeDashboard();
  }, []);

  // Keep all existing fetch functions (fetchPeople, fetchProjects, etc.)
  const fetchPeople = async () => {
    try {
      const response = await httpClient.get(`${getApiUrl()}/v2/people`);
      if (response.success && response.data) {
        setPeople(response.data);
      }
    } catch (error) {
      adminLogger.error('Failed to fetch people', getErrorObject(error));
    }
  };

  const fetchStats = async () => {
    try {
      const response = await projectApi.getAdminDashboard();
      if (response.success && response.data) {
        setStats({
          totalUsers: response.data.totalUsers || 0,
          totalProjects: response.data.totalProjects || 0,
          totalSubscriptions: response.data.totalSubscriptions || 0,
          activeUsers: response.data.activeUsers || 0
        });
      }
    } catch (error) {
      adminLogger.error('Failed to fetch admin stats', getErrorObject(error));
    }
  };

  const fetchSystemHealth = async () => {
    try {
      const health = await performanceService.getSystemHealth();
      setSystemHealth(health);
    } catch (error) {
      adminLogger.error('Failed to fetch system health', getErrorObject(error));
    }
  };

  // Keep all existing handler functions (handlePersonEdit, handlePersonDelete, etc.)
  const handlePersonEdit = (_person: Person) => {
    // For CleanAdminDashboard, we just navigate to edit view
    // The actual editing logic would be handled by the edit component
    setCurrentView('edit-user');
  };

  const handlePersonDelete = async (personId: string) => {
    try {
      const response = await httpClient.delete(`${getApiUrl()}/v2/people/${personId}`);
      if (response.success) {
        await fetchPeople();
      }
    } catch (error) {
      adminLogger.error('Failed to delete person', getErrorObject(error));
    }
  };

  // Improved navigation with Clean Architecture and UX design
  const renderNavigation = () => {
    const statsItems = menuRepo.getStatsSubMenuItems();

    return (
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex space-x-8">
              {/* Dashboard */}
              <button
                onClick={() => handleMenuNavigation('dashboard')}
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200 ${
                  currentView === 'dashboard'
                    ? 'border-blue-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Dashboard
              </button>

              {/* Users */}
              <button
                onClick={() => handleMenuNavigation('users')}
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200 ${
                  ['users', 'create-user', 'edit-user', 'view-user'].includes(currentView)
                    ? 'border-blue-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Users
              </button>

              {/* Projects */}
              <button
                onClick={() => handleMenuNavigation('projects')}
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200 ${
                  ['projects', 'create-project', 'edit-project', 'view-project', 'view-project-subscribers'].includes(currentView)
                    ? 'border-blue-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Projects
              </button>

              {/* Stats with Dropdown */}
              <div className="relative">
                <button
                  onClick={handleStatsToggle}
                  onMouseEnter={() => setIsStatsMenuOpen(true)}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-all duration-200 ${
                    ['performance', 'cache', 'database', 'query-optimization', 'connection-pools', 'system-health'].includes(currentView)
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Stats
                  <svg 
                    className={`ml-1 h-4 w-4 transition-transform duration-200 ${isStatsMenuOpen ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                <div onMouseLeave={() => setIsStatsMenuOpen(false)}>
                  <StatsMenuDropdown
                    isOpen={isStatsMenuOpen}
                    statsItems={statsItems}
                    onItemSelect={handleStatsItemSelect}
                    onClose={() => setIsStatsMenuOpen(false)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>
    );
  };

  // Keep all existing renderContent logic from original dashboard
  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <div className="space-y-6">
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
                {/* Add other stat cards */}
              </div>
            )}

            {systemHealth && (
              <SystemHealthOverview healthStatus={systemHealth} compactView={true} />
            )}
          </div>
        );

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

      // Keep all other existing cases from original dashboard
      default:
        return renderContent();
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

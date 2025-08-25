import { useState, useEffect } from 'react';
import { authService } from '../../services/authService';
import { httpClient, getApiUrl } from '../../services/httpClient';
import type { PersonUpdate } from '../../types/person';
import PersonForm from '../PersonForm';
import PerformanceDashboard from '../performance/PerformanceDashboard';
import CacheManagementPanel from '../performance/CacheManagementPanel';
import SystemHealthOverview from '../performance/SystemHealthOverview';
import DatabasePerformancePanel from '../performance/DatabasePerformancePanel';
import QueryOptimizationPanel from '../performance/QueryOptimizationPanel';
import ConnectionPoolMonitor from '../performance/ConnectionPoolMonitor';
import DatabaseCharts from '../performance/DatabaseCharts';
import performanceService, { PerformanceService } from '../../services/performanceService';
import type { HealthStatus } from '../../types/performance';

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

type AdminView = 'dashboard' | 'users' | 'projects' | 'performance' | 'cache' | 'database' | 'query-optimization' | 'connection-pools' | 'system-health' | 'edit-user' | 'view-user';

export default function EnhancedAdminDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [currentView, setCurrentView] = useState<AdminView>('dashboard');
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [systemHealth, setSystemHealth] = useState<HealthStatus | null>(null);

  // Fetch system health for quick overview
  const fetchSystemHealth = async () => {
    try {
      const health = await performanceService.getHealthStatus();
      setSystemHealth(health);
    } catch (err) {
      console.error('Failed to fetch system health:', err);
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

      // Fetch admin statistics
      const statsResponse = await httpClient.getJson(getApiUrl('/admin/stats')) as any;
      // Handle v2 response format: {success: true, data: {overview: {...}}}
      const statsOverview = statsResponse.success ? 
        (statsResponse.data?.overview || {}) : 
        (statsResponse.overview || statsResponse.data?.overview || {});
      setStats({
        totalUsers: statsOverview.total_users || 0,
        totalProjects: statsOverview.total_projects || 0,
        totalSubscriptions: statsOverview.total_subscriptions || 0,
        activeUsers: statsOverview.active_users || 0,
      });

      // Fetch users list
      const usersResponse = await httpClient.getJson(getApiUrl('/v2/admin/users')) as any;
      // Handle both v2 response format and direct response format
      const usersList = usersResponse.success ? 
        (usersResponse.data?.users || usersResponse.data || []) : 
        (usersResponse.users || usersResponse.data || usersResponse || []);
      setUsers(Array.isArray(usersList) ? usersList : []);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load admin data');
      console.error('Admin dashboard error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserEdit = (user: AdminUser) => {
    setSelectedUser(user);
    setCurrentView('edit-user');
  };

  const handleUserView = (user: AdminUser) => {
    setSelectedUser(user);
    setCurrentView('view-user');
  };

  const handleUserUpdate = async (updates: PersonUpdate) => {
    if (!selectedUser) {
      return;
    }

    try {
      await httpClient.putJson(getApiUrl(`/v2/admin/users/${selectedUser.id}`), updates);

      // Refresh users list
      await fetchAdminData();
      setCurrentView('users');
      setSelectedUser(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user');
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
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2v0" />
                </svg>
                Dashboard
              </button>
              
              <button
                onClick={() => setCurrentView('performance')}
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  currentView === 'performance'
                    ? 'border-blue-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Performance
                {systemHealth && systemHealth.status !== 'healthy' && (
                  <span className="ml-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    !
                  </span>
                )}
              </button>

              <button
                onClick={() => setCurrentView('cache')}
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  currentView === 'cache'
                    ? 'border-blue-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                </svg>
                Cache
              </button>

              <button
                onClick={() => setCurrentView('database')}
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  currentView === 'database'
                    ? 'border-blue-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Database
              </button>

              <button
                onClick={() => setCurrentView('users')}
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  currentView === 'users'
                    ? 'border-blue-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
                Users
              </button>

              <button
                onClick={() => setCurrentView('projects')}
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  currentView === 'projects'
                    ? 'border-blue-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                Projects
              </button>
            </div>
          </div>

          {/* System Health Indicator */}
          <div className="flex items-center">
            {systemHealth && (
              <div className="flex items-center space-x-2 mr-4">
                <div className={`w-3 h-3 rounded-full ${
                  systemHealth.status === 'healthy' ? 'bg-green-500' :
                  systemHealth.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                }`}></div>
                <span className="text-sm text-gray-600">
                  System {PerformanceService.getHealthStatusBadge(systemHealth.status).text}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );

  const renderDashboardOverview = () => (
    <div className="space-y-6">
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
      
      case 'users':
        return (
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">User Management</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {user.firstName} {user.lastName}
                            </div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {user.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.isAdmin ? 'Admin' : 'User'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleUserView(user)}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleUserEdit(user)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
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
                  isActive: selectedUser.isActive,
                  createdAt: selectedUser.createdAt,
                  updatedAt: selectedUser.updatedAt || ''
                }}
                onSubmit={handleUserUpdate}
                onCancel={() => setCurrentView('users')}
                isLoading={false}
              />
            </div>
          </div>
        ) : null;
      
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

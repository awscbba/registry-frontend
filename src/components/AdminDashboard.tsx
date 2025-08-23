import { useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { projectApi } from '../services/projectApi';
import { httpClient, getApiUrl } from '../services/httpClient';
import type { PersonUpdate } from '../types/person';
import PersonForm from './PersonForm';

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
  // Additional fields for full person data
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

export default function AdminDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [currentView, setCurrentView] = useState<'dashboard' | 'users' | 'projects' | 'edit-user' | 'view-user'>('dashboard');
  
  // Person editing state
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  useEffect(() => {
    // Check admin access first
    if (!authService.isAuthenticated()) {
      setError('Authentication required');
      setIsLoading(false);
      return;
    }

    // Refresh user data from backend to ensure we have latest admin status
    const checkAdminAccess = async () => {
      try {
        // Refresh user data to get latest admin status
        await authService.refreshUserData();
        
        if (!authService.isAdmin()) {
          setError('Admin access required. You do not have sufficient privileges.');
          setIsLoading(false);
          return;
        }

        loadAdminData();
      } catch {
        setError('Failed to verify admin access. Please try logging in again.');
        setIsLoading(false);
      }
    };

    checkAdminAccess();
  }, []);

  const loadAdminData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load dashboard stats
      const data = await httpClient.getJson(getApiUrl('/v2/admin/dashboard'));
      
      if (data.success && data.data) {
        setStats({
          totalUsers: data.data.totalUsers || 0,  // Fix: Use correct field name
          totalProjects: data.data.totalProjects || 0,
          totalSubscriptions: data.data.totalSubscriptions || 0,
          activeUsers: data.data.activeUsers || 0  // Fix: Use correct field name
        });
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load admin data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const data = await httpClient.getJson(getApiUrl('/v2/admin/people'));
      if (data.success && data.data) {
        setUsers(data.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    }
  };

  const handleLogout = () => {
    authService.logout();
    window.location.href = '/login';
  };

  const handleEditUser = async (user: AdminUser) => {
    try {
      setIsLoading(true);
      setSelectedUser(user);
      setCurrentView('edit-user');
      
      // Fetch complete person data for editing
      const fullPersonData = await projectApi.getPerson(user.id);
      setSelectedUser({
        ...user,
        phone: fullPersonData.phone || '',
        dateOfBirth: fullPersonData.dateOfBirth || '',
        address: fullPersonData.address || {
          street: '',
          city: '',
          state: '',
          country: '',
          postalCode: ''
        },
        updatedAt: fullPersonData.updatedAt || user.createdAt
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load user details');
      // Still show the edit form with basic data if full data fetch fails
      setSelectedUser(user);
      setCurrentView('edit-user');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewUser = (user: AdminUser) => {
    setSelectedUser(user);
    setCurrentView('view-user');
  };

  const handleSaveUser = async (userData: PersonUpdate) => {
    if (!selectedUser) {
      return;
    }
    
    try {
      setIsLoading(true);
      await projectApi.updatePerson(selectedUser.id, userData);
      
      // Refresh users list
      await loadUsers();
      
      // Go back to users view
      setCurrentView('users');
      setSelectedUser(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setCurrentView('users');
    setSelectedUser(null);
  };

  if (isLoading) {
    return (
      <div className="admin-dashboard loading">
        <div className="loading-spinner"></div>
        <p>Loading admin dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-dashboard error">
        <div className="error-container">
          <h2>Access Denied</h2>
          <p>{error}</p>
          <div className="error-actions">
            <button onClick={() => window.location.href = '/login'} className="btn-primary">
              Go to Login
            </button>
            <button onClick={() => window.location.href = '/'} className="btn-secondary">
              Go to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <div className="admin-header-content">
          <h1>Admin Dashboard</h1>
          <div className="admin-user-info">
            <span>Welcome, {authService.getCurrentUser()?.firstName}</span>
            <button onClick={handleLogout} className="btn-logout">Logout</button>
          </div>
        </div>
      </header>

      <nav className="admin-nav">
        <button 
          className={currentView === 'dashboard' ? 'active' : ''}
          onClick={() => setCurrentView('dashboard')}
        >
          Dashboard
        </button>
        <button 
          className={currentView === 'users' ? 'active' : ''}
          onClick={() => {
            setCurrentView('users');
            if (users.length === 0) {
              loadUsers();
            }
          }}
        >
          Users
        </button>
        <button 
          className={currentView === 'projects' ? 'active' : ''}
          onClick={() => setCurrentView('projects')}
        >
          Projects
        </button>
      </nav>

      <main className="admin-content">
        {currentView === 'dashboard' && (
          <div className="dashboard-stats">
            <h2>System Statistics</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <h3>Total Users</h3>
                <div className="stat-number">{stats?.totalUsers || 0}</div>
              </div>
              <div className="stat-card">
                <h3>Active Users</h3>
                <div className="stat-number">{stats?.activeUsers || 0}</div>
              </div>
              <div className="stat-card">
                <h3>Total Projects</h3>
                <div className="stat-number">{stats?.totalProjects || 0}</div>
              </div>
              <div className="stat-card">
                <h3>Total Subscriptions</h3>
                <div className="stat-number">{stats?.totalSubscriptions || 0}</div>
              </div>
            </div>
          </div>
        )}

        {currentView === 'users' && (
          <div className="users-management">
            <h2>User Management</h2>
            <div className="users-list">
              {users.map(user => (
                <div key={user.id} className="user-card">
                  <div className="user-info">
                    <h4>{user.firstName} {user.lastName}</h4>
                    <p>{user.email}</p>
                    <div className="user-badges">
                      {user.isAdmin && <span className="badge admin">Admin</span>}
                      {user.isActive ? 
                        <span className="badge active">Active</span> : 
                        <span className="badge inactive">Inactive</span>
                      }
                    </div>
                  </div>
                  <div className="user-actions">
                    <button 
                      className="btn-small"
                      onClick={() => handleEditUser(user)}
                    >
                      Edit
                    </button>
                    <button 
                      className="btn-small"
                      onClick={() => handleViewUser(user)}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentView === 'edit-user' && selectedUser && (
          <div className="user-edit">
            <div className="section-header">
              <h2>Edit User: {selectedUser.firstName} {selectedUser.lastName}</h2>
              <button 
                className="btn-secondary"
                onClick={handleCancelEdit}
              >
                ← Back to Users
              </button>
            </div>
            <PersonForm
              person={{
                id: selectedUser.id,
                firstName: selectedUser.firstName,
                lastName: selectedUser.lastName,
                email: selectedUser.email,
                isAdmin: selectedUser.isAdmin,
                isActive: selectedUser.isActive,
                createdAt: selectedUser.createdAt,
                updatedAt: selectedUser.updatedAt || selectedUser.createdAt,
                phone: selectedUser.phone || '',
                dateOfBirth: selectedUser.dateOfBirth || '',
                address: selectedUser.address || {
                  street: '',
                  city: '',
                  state: '',
                  country: '',
                  postalCode: ''
                }
              }}
              onSubmit={handleSaveUser}
              onCancel={handleCancelEdit}
              isLoading={isLoading}
            />
          </div>
        )}

        {currentView === 'view-user' && selectedUser && (
          <div className="user-view">
            <div className="section-header">
              <h2>User Details: {selectedUser.firstName} {selectedUser.lastName}</h2>
              <div className="header-actions">
                <button 
                  className="btn-primary"
                  onClick={() => handleEditUser(selectedUser)}
                >
                  Edit User
                </button>
                <button 
                  className="btn-secondary"
                  onClick={handleCancelEdit}
                >
                  ← Back to Users
                </button>
              </div>
            </div>
            <div className="user-details-card">
              <div className="detail-section">
                <h3>Basic Information</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Name:</label>
                    <span>{selectedUser.firstName} {selectedUser.lastName}</span>
                  </div>
                  <div className="detail-item">
                    <label>Email:</label>
                    <span>{selectedUser.email}</span>
                  </div>
                  <div className="detail-item">
                    <label>Status:</label>
                    <span className={`status ${selectedUser.isActive ? 'active' : 'inactive'}`}>
                      {selectedUser.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="detail-item">
                    <label>Role:</label>
                    <span className={`role ${selectedUser.isAdmin ? 'admin' : 'user'}`}>
                      {selectedUser.isAdmin ? 'Administrator' : 'User'}
                    </span>
                  </div>
                  <div className="detail-item">
                    <label>Created:</label>
                    <span>{new Date(selectedUser.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentView === 'projects' && (
          <div className="projects-management">
            <h2>Project Management</h2>
            <p>Project management interface coming soon...</p>
          </div>
        )}
      </main>

      <style jsx>{`
        .admin-dashboard {
          min-height: 100vh;
          background: #f5f5f5;
        }

        .admin-header {
          background: #2c3e50;
          color: white;
          padding: 1rem 2rem;
        }

        .admin-header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          max-width: 1200px;
          margin: 0 auto;
        }

        .admin-user-info {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .btn-logout {
          background: #e74c3c;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          cursor: pointer;
        }

        .admin-nav {
          background: #34495e;
          padding: 0 2rem;
          display: flex;
          gap: 0;
        }

        .admin-nav button {
          background: none;
          border: none;
          color: #bdc3c7;
          padding: 1rem 1.5rem;
          cursor: pointer;
          border-bottom: 3px solid transparent;
        }

        .admin-nav button:hover {
          background: #2c3e50;
          color: white;
        }

        .admin-nav button.active {
          color: white;
          border-bottom-color: #3498db;
        }

        .admin-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-top: 1rem;
        }

        .stat-card {
          background: white;
          padding: 1.5rem;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          text-align: center;
        }

        .stat-number {
          font-size: 2rem;
          font-weight: bold;
          color: #3498db;
          margin-top: 0.5rem;
        }

        .users-list {
          display: grid;
          gap: 1rem;
          margin-top: 1rem;
        }

        .user-card {
          background: white;
          padding: 1rem;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .user-badges {
          display: flex;
          gap: 0.5rem;
          margin-top: 0.5rem;
        }

        .badge {
          padding: 0.25rem 0.5rem;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: bold;
        }

        .badge.admin {
          background: #e74c3c;
          color: white;
        }

        .badge.active {
          background: #27ae60;
          color: white;
        }

        .badge.inactive {
          background: #95a5a6;
          color: white;
        }

        .user-actions {
          display: flex;
          gap: 0.5rem;
        }

        .btn-small {
          padding: 0.5rem 1rem;
          border: 1px solid #ddd;
          background: white;
          border-radius: 4px;
          cursor: pointer;
        }

        .loading, .error {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          text-align: center;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #3498db;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 1rem;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .error-container {
          background: white;
          padding: 2rem;
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          max-width: 500px;
        }

        .error-actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
          margin-top: 1rem;
        }

        .btn-primary {
          background: #3498db;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 4px;
          cursor: pointer;
        }

        .btn-secondary {
          background: #95a5a6;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 4px;
          cursor: pointer;
        }

        /* Edit and View User Styles */
        .user-edit, .user-view {
          padding: 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          padding-bottom: 1rem;
          border-bottom: 2px solid #e0e0e0;
        }

        .header-actions {
          display: flex;
          gap: 1rem;
        }

        .user-details-card {
          background: white;
          border-radius: 8px;
          padding: 2rem;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .detail-section h3 {
          color: #2c3e50;
          margin-bottom: 1.5rem;
          font-size: 1.2rem;
        }

        .detail-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
        }

        .detail-item {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .detail-item label {
          font-weight: 600;
          color: #555;
          font-size: 0.9rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .detail-item span {
          font-size: 1rem;
          color: #333;
        }

        .status.active {
          color: #27ae60;
          font-weight: 600;
        }

        .status.inactive {
          color: #e74c3c;
          font-weight: 600;
        }

        .role.admin {
          color: #8e44ad;
          font-weight: 600;
        }

        .role.user {
          color: #34495e;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
}

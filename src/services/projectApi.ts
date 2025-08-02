import type { 
  Project, 
  ProjectCreate, 
  ProjectUpdate, 
  Subscription, 
  SubscriptionCreate, 
  ProjectSubscriber,
  AdminDashboard 
} from '../types/project';
import type { Person } from '../types/person';
import { ApiError, handleApiResponse } from '../types/api';
import { addAuthHeaders } from './authStub';

const API_BASE_URL = import.meta.env.PUBLIC_API_URL || 'https://2t9blvt2c1.execute-api.us-east-1.amazonaws.com/prod';

export { ApiError };

export const projectApi = {
  // Project Management
  async getAllProjects(): Promise<Project[]> {
    const response = await fetch(`${API_BASE_URL}/v2/projects`);
    const data = await handleApiResponse(response);
    
    // Handle v2 API response format: {success: true, data: [...], version: "v2"}
    if (data && data.data && Array.isArray(data.data)) {
      return data.data; // v2 format
    } else if (Array.isArray(data)) {
      return data; // Legacy array format (backward compatibility)
    } else if (data && data.projects && Array.isArray(data.projects)) {
      return data.projects; // Legacy object format (backward compatibility)
    } else {
      console.error('Unexpected API response format:', data);
      return []; // Fallback to empty array
    }
  },

  async getProject(id: string): Promise<Project> {
    const response = await fetch(`${API_BASE_URL}/projects/${id}`);
    return handleApiResponse(response);
  },

  async createProject(project: ProjectCreate): Promise<Project> {
    const response = await fetch(`${API_BASE_URL}/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(project),
    });
    return handleApiResponse(response);
  },

  async updateProject(id: string, project: ProjectUpdate): Promise<Project> {
    const response = await fetch(`${API_BASE_URL}/projects/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(project),
    });
    return handleApiResponse(response);
  },

  async deleteProject(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/projects/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new ApiError(response.status, 'Error al eliminar proyecto');
    }
  },

  // Subscription Management
  async getProjectSubscribers(projectId: string): Promise<ProjectSubscriber[]> {
    const response = await fetch(`${API_BASE_URL}/projects/${projectId}/subscribers`);
    return handleApiResponse(response);
  },

  async subscribePersonToProject(projectId: string, personId: string, data: { subscribedBy?: string; notes?: string } = {}): Promise<Subscription> {
    const response = await fetch(`${API_BASE_URL}/projects/${projectId}/subscribe/${personId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return handleApiResponse(response);
  },

  async unsubscribePersonFromProject(projectId: string, personId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/projects/${projectId}/unsubscribe/${personId}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new ApiError(response.status, 'Error al desuscribir persona');
    }
  },

  async getAllSubscriptions(): Promise<Subscription[]> {
    const response = await fetch(`${API_BASE_URL}/v2/subscriptions`);
    const data = await handleApiResponse(response);
    
    // Handle v2 API response format: {success: true, data: [...], version: "v2"}
    if (data && data.data && Array.isArray(data.data)) {
      return data.data; // v2 format
    } else if (Array.isArray(data)) {
      return data; // Legacy format (backward compatibility)
    } else {
      console.error('Unexpected subscriptions API response format:', data);
      return []; // Fallback to empty array
    }
  },

  async createSubscription(subscription: SubscriptionCreate): Promise<Subscription> {
    const response = await fetch(`${API_BASE_URL}/v2/public/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subscription),
    });
    const data = await handleApiResponse(response);
    
    // Handle v2 API response format
    if (data && data.subscription) {
      return data.subscription; // v2 format
    } else {
      return data; // Legacy format (backward compatibility)
    }
  },

  async deleteSubscription(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/subscriptions/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new ApiError(response.status, 'Error al eliminar suscripción');
    }
  },

  // Admin Dashboard
  async getAdminDashboard(): Promise<AdminDashboard> {
    console.log('projectApi: Fetching admin dashboard from:', `${API_BASE_URL}/v2/admin/dashboard`);
    const headers = addAuthHeaders();
    console.log('projectApi: Request headers:', headers);
    
    const response = await fetch(`${API_BASE_URL}/v2/admin/dashboard`, {
      headers: headers
    });
    
    console.log('projectApi: Response status:', response.status);
    console.log('projectApi: Response ok:', response.ok);
    
    const data = await handleApiResponse(response);
    console.log('projectApi: Raw response data:', data);
    
    // Handle v2 API response format: {success: true, data: {...}, version: "v2"}
    if (data && data.data) {
      console.log('projectApi: Using v2 format, returning data.data:', data.data);
      return data.data; // v2 format
    } else {
      console.log('projectApi: Using legacy format, returning data:', data);
      return data; // Legacy format (backward compatibility)
    }
  },

  // People Management
  async getAllPeople(): Promise<Person[]> {
    const response = await fetch(`${API_BASE_URL}/v2/admin/people`, {
      headers: addAuthHeaders()
    });
    const data = await handleApiResponse(response);
    
    // Handle v2 API response format: {success: true, data: [...], version: "v2"}
    if (data && data.data && Array.isArray(data.data)) {
      return data.data; // v2 format
    } else if (Array.isArray(data)) {
      return data; // Legacy format (backward compatibility)
    } else {
      console.error('Unexpected people API response format:', data);
      return []; // Fallback to empty array
    }
  },

  async getPerson(id: string): Promise<Person> {
    const response = await fetch(`${API_BASE_URL}/people/${id}`);
    return handleApiResponse(response);
  },

  async deletePerson(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/people/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new ApiError(response.status, 'Error al eliminar persona');
    }
  },
};

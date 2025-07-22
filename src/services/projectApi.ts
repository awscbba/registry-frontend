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

const API_BASE_URL = import.meta.env.PUBLIC_API_URL || 'https://2t9blvt2c1.execute-api.us-east-1.amazonaws.com/prod';

export { ApiError };

export const projectApi = {
  // Project Management
  async getAllProjects(): Promise<Project[]> {
    const response = await fetch(`${API_BASE_URL}/projects`);
    return handleApiResponse(response);
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
    const response = await fetch(`${API_BASE_URL}/subscriptions`);
    return handleApiResponse(response);
  },

  async createSubscription(subscription: SubscriptionCreate): Promise<Subscription> {
    const response = await fetch(`${API_BASE_URL}/subscriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subscription),
    });
    return handleApiResponse(response);
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
    const response = await fetch(`${API_BASE_URL}/admin/dashboard`);
    return handleApiResponse(response);
  },

  // People Management
  async getAllPeople(): Promise<Person[]> {
    const response = await fetch(`${API_BASE_URL}/people`);
    return handleApiResponse(response);
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

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
import { API_CONFIG, getApiUrl } from '../config/api';

export { ApiError };

export const projectApi = {
  // Project Management
  async getAllProjects(): Promise<Project[]> {
    const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.PROJECTS), {
      headers: addAuthHeaders()
    });
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
    // Individual project endpoint may not be available in v2, get from list
    const projects = await this.getAllProjects();
    const project = projects.find(p => p.id === id);
    if (!project) {
      throw new ApiError(404, 'Project not found');
    }
    return project;
  },

  async createProject(project: ProjectCreate): Promise<Project> {
    // Project creation may not be available in the current API version
    throw new ApiError(501, 'La creación de proyectos no está disponible en la versión actual de la API.');
  },

  async updateProject(id: string, project: ProjectUpdate): Promise<Project> {
    // Project update may not be available in the current API version
    throw new ApiError(501, 'La actualización de proyectos no está disponible en la versión actual de la API.');
  },

  async deleteProject(id: string): Promise<void> {
    // Project deletion may not be available in the current API version
    throw new ApiError(501, 'La eliminación de proyectos no está disponible en la versión actual de la API.');
  },

  // Subscription Management (v2)
  async getProjectSubscribers(projectId: string): Promise<ProjectSubscriber[]> {
    try {
      const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.PROJECT_SUBSCRIBERS(projectId)), {
        headers: addAuthHeaders()
      });
      
      // If endpoint doesn't exist (404), throw 501 to indicate not implemented
      if (response.status === 404) {
        throw new ApiError(501, 'La gestión de suscriptores de proyecto no está disponible en la versión actual de la API.');
      }
      
      const data = await handleApiResponse(response);

      // Handle v2 API response format
      if (data && data.data && data.data.subscribers) {
        return data.data.subscribers; // v2 format
      } else if (Array.isArray(data)) {
        return data; // Fallback
      } else {
        console.error('Unexpected project subscribers API response format:', data);
        return [];
      }
    } catch (error) {
      // Re-throw ApiErrors as-is, wrap others
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(501, 'La gestión de suscriptores de proyecto no está disponible en la versión actual de la API.');
    }
  },

  async subscribePersonToProject(projectId: string, personId: string, data: { subscribedBy?: string; notes?: string; status?: string } = {}): Promise<Subscription> {
    const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.PROJECT_SUBSCRIBE(projectId)), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...addAuthHeaders()
      },
      body: JSON.stringify({
        personId,
        status: data.status || 'active',
        subscribedBy: data.subscribedBy,
        notes: data.notes || ''
      }),
    });
    const result = await handleApiResponse(response);

    // Handle v2 API response format
    if (result && result.data) {
      return result.data; // v2 format
    } else {
      return result; // Fallback
    }
  },

  async updateProjectSubscription(projectId: string, subscriptionId: string, data: { status?: string; notes?: string }): Promise<Subscription> {
    const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.PROJECT_SUBSCRIPTION_UPDATE(projectId, subscriptionId)), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...addAuthHeaders()
      },
      body: JSON.stringify(data),
    });
    const result = await handleApiResponse(response);

    // Handle v2 API response format
    if (result && result.data) {
      return result.data; // v2 format
    } else {
      return result; // Fallback
    }
  },

  async unsubscribePersonFromProject(projectId: string, subscriptionId: string): Promise<void> {
    const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.PROJECT_UNSUBSCRIBE(projectId, subscriptionId)), {
      method: 'DELETE',
      headers: addAuthHeaders()
    });
    
    if (!response.ok) {
      throw new ApiError(response.status, 'Error al desuscribir persona del proyecto');
    }
  },

  async getAllSubscriptions(): Promise<Subscription[]> {
    const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.SUBSCRIPTIONS), {
      headers: addAuthHeaders()
    });
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
    const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.PUBLIC_SUBSCRIBE), {
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
    // Subscription deletion may not be available in the current API version
    throw new ApiError(501, 'La eliminación de suscripciones no está disponible en la versión actual de la API.');
  },

  // Admin Dashboard
  async getAdminDashboard(): Promise<AdminDashboard> {
    const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.ADMIN_DASHBOARD), {
      headers: addAuthHeaders()
    });

    const data = await handleApiResponse(response);

    // Handle v2 API response format: {success: true, data: {...}, version: "v2"}
    if (data && data.data) {
      return data.data; // v2 format
    } else {
      return data; // Legacy format (backward compatibility)
    }
  },

  // People Management
  async getAllPeople(): Promise<Person[]> {
    const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.ADMIN_PEOPLE), {
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
    const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.PERSON_BY_ID(id)), {
      headers: addAuthHeaders()
    });
    const data = await handleApiResponse(response);

    // Handle v2 API response format
    if (data && data.data) {
      return data.data; // v2 format
    } else {
      return data; // Legacy format (backward compatibility)
    }
  },

  async createPerson(person: any): Promise<Person> {
    // Person creation is not available in the current API version
    throw new ApiError(501, 'La creación de personas no está disponible en la versión actual de la API.');
  },

  async updatePerson(id: string, person: Partial<Person>): Promise<Person> {
    // Validate that ID is provided
    if (!id || id === 'undefined') {
      throw new ApiError(400, 'Person ID is required for update');
    }

    const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.PERSON_BY_ID(id)), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...addAuthHeaders()
      },
      body: JSON.stringify(person),
    });
    const data = await handleApiResponse(response);

    // Handle v2 API response format
    if (data && data.data) {
      return data.data; // v2 format
    } else {
      return data; // Legacy format (backward compatibility)
    }
  },

  async deletePerson(id: string): Promise<void> {
    const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.PERSON_BY_ID(id)), {
      method: 'DELETE',
      headers: addAuthHeaders()
    });
    if (!response.ok) {
      throw new ApiError(response.status, 'Error al eliminar persona');
    }
  },
};

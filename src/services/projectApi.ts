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
import { API_CONFIG, getApiUrl } from '../config/api';
import { getApiLogger } from '../utils/logger';
import { ApiError, handleApiResponse } from '../types/api';
import { transformSubscriptions, transformSubscription } from '../utils/fieldMapping';
import { addAuthHeaders, addRequiredAuthHeaders } from './authService';
import { httpClient } from './httpClient';

export { ApiError };

const logger = getApiLogger('projectApi');

export const projectApi = {
  // Project Management (Admin only)
  async getAllProjects(): Promise<Project[]> {
    const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.PROJECTS), {
      headers: addRequiredAuthHeaders()
    });
    const data = await handleApiResponse(response);

    // Debug: Check actual field names from backend
    console.log('🔍 PROJECTS API RESPONSE:', {
      totalCount: data?.data?.length || (Array.isArray(data) ? data.length : 0),
      sampleProject: data?.data?.[0] || data?.[0] || null,
      projectFields: data?.data?.[0] ? Object.keys(data.data[0]) : (data?.[0] ? Object.keys(data[0]) : [])
    });

    // Handle v2 API response format: {success: true, data: [...], version: "v2"}
    if (data && data.data && Array.isArray(data.data)) {
      return data.data; // v2 format
    } else if (Array.isArray(data)) {
      return data; // Legacy array format (backward compatibility)
    } else if (data && data.projects && Array.isArray(data.projects)) {
      return data.projects; // Legacy object format (backward compatibility)
    } else {
      logger.error('Unexpected API response format', { data_type: typeof data, data });
      return []; // Fallback to empty array
    }
  },

  // Public project access (no authentication required)
  async getPublicProjects(): Promise<Project[]> {
    logger.logApiRequest('GET', API_CONFIG.ENDPOINTS.PROJECTS);
    const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.PROJECTS), {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    logger.logApiResponse('GET', API_CONFIG.ENDPOINTS.PROJECTS, response.status);

    const data = await handleApiResponse(response);
    logger.debug('Raw response data received', { data_type: typeof data, has_data: !!data });

    // Handle v2 API response format: {success: true, data: [...], version: "v2"}
    if (data && data.data && Array.isArray(data.data)) {
      logger.debug('Using v2 API response format', { count: data.data.length });
      return data.data; // v2 format
    } else if (Array.isArray(data)) {
      logger.debug('Using legacy array format', { count: data.length });
      return data; // Legacy array format (backward compatibility)
    } else if (data && data.projects && Array.isArray(data.projects)) {
      logger.debug('Using legacy object format', { count: data.projects.length });
      return data.projects; // Legacy object format (backward compatibility)
    } else {
      logger.error('Unexpected public projects API response format', { data_type: typeof data, data });
      return []; // Fallback to empty array
    }
  },

  async getProject(id: string): Promise<Project> {
    const response = await fetch(getApiUrl(`/v2/projects/${id}`), {
      method: 'GET',
      headers: addAuthHeaders()
    });

    const data = await handleApiResponse(response);

    // Handle v2 response format
    if (data && data.success && data.data) {
      return data.data;
    } else if (data && typeof data === 'object' && data.id) {
      return data; // Legacy format fallback
    } else {
      throw new ApiError(404, 'Project not found');
    }
  },

  async createProject(project: ProjectCreate): Promise<Project> {
    const response = await fetch(getApiUrl('/v2/projects'), {
      method: 'POST',
      headers: {
        ...addRequiredAuthHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(project)
    });

    const data = await handleApiResponse(response);

    // Handle v2 response format
    if (data && data.success && data.data) {
      return data.data;
    } else if (data && typeof data === 'object' && data.id) {
      return data; // Legacy format fallback
    } else {
      throw new ApiError(500, 'Failed to create project');
    }
  },

  async updateProject(id: string, project: ProjectUpdate): Promise<Project> {
    const response = await fetch(getApiUrl(`/v2/projects/${id}`), {
      method: 'PUT',
      headers: {
        ...addRequiredAuthHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(project)
    });

    const data = await handleApiResponse(response);

    // Handle v2 response format
    if (data && data.success && data.data) {
      return data.data;
    } else if (data && typeof data === 'object' && data.id) {
      return data; // Legacy format fallback
    } else {
      throw new ApiError(500, 'Failed to update project');
    }
  },

  async deleteProject(id: string): Promise<void> {
    const response = await fetch(getApiUrl(`/v2/projects/${id}`), {
      method: 'DELETE',
      headers: addRequiredAuthHeaders()
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new ApiError(response.status, `Failed to delete project: ${errorText}`);
    }

    // For DELETE operations, we might get an empty response or a success message
    try {
      const data = await handleApiResponse(response);
      // Handle v2 response format - should return success confirmation
      if (data && data.success !== false) {
        return; // Successfully deleted
      }
    } catch {
      // If there's no JSON response, that's often OK for DELETE operations
      return;
    }
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

      // Handle v2 API response format - backend returns subscriptions, we need to map to subscribers
      if (data && data.data && Array.isArray(data.data)) {
        // Map subscription data to subscriber format
        return data.data.map((subscription: any) => ({
          id: subscription.id,
          personId: subscription.person_id || subscription.personId,
          projectId: subscription.project_id || subscription.projectId,
          status: subscription.status,
          notes: subscription.notes || '',
          subscribedAt: subscription.created_at || subscription.subscribedAt,
          subscribedBy: subscription.subscribed_by || subscription.subscribedBy,
          person: {
            id: subscription.person_id || subscription.personId,
            firstName: subscription.person_name ? subscription.person_name.split(' ')[0] : 'Unknown',
            lastName: subscription.person_name ? subscription.person_name.split(' ').slice(1).join(' ') : '',
            email: subscription.person_email || subscription.personEmail || 'unknown@example.com'
          }
        }));
      } else if (Array.isArray(data)) {
        return data; // Fallback
      } else {
        logger.error('Unexpected project subscribers API response format', { data_type: typeof data, data });
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
    // For project subscription endpoint, we need to provide person info
    // First get the person details to include in the subscription
    let personData;
    try {
      const person = await this.getPerson(personId);
      personData = {
        email: person.email,
        name: `${person.firstName || ''} ${person.lastName || ''}`.trim() || person.email
      };
    } catch {
      // If we can't get person details, use minimal data
      personData = {
        email: `person-${personId}@example.com`,
        name: `Person ${personId}`
      };
    }

    const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.PROJECT_SUBSCRIBE(projectId)), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...addAuthHeaders()
      },
      body: JSON.stringify({
        person: personData,
        status: data.status || 'active',
        notes: data.notes || ''
      }),
    });
    const result = await handleApiResponse(response);

    let subscriptionData: any;
    
    // Handle v2 API response format
    if (result && result.data) {
      subscriptionData = result.data; // v2 format
    } else {
      subscriptionData = result; // Fallback
    }

    // Transform snake_case fields to camelCase
    return transformSubscription(subscriptionData);
  },

  async updateProjectSubscription(projectId: string, subscriptionId: string, data: { status?: string; notes?: string }): Promise<Subscription> {
    const url = getApiUrl(API_CONFIG.ENDPOINTS.PROJECT_SUBSCRIPTION_UPDATE(projectId, subscriptionId));
    logger.logApiRequest('PUT', url, { 
      projectId: projectId, 
      subscriptionId: subscriptionId,
      updateData: data
    });

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...addRequiredAuthHeaders()
      },
      body: JSON.stringify(data),
    });

    logger.logApiResponse('PUT', url, response.status);

    if (!response.ok) {
      // Get error details before handleApiResponse processes it
      const errorText = await response.text();
      logger.error('Update project subscription error response', { error_text: errorText });
      try {
        const errorJson = JSON.parse(errorText);
        logger.error('Update project subscription error JSON', { error_json: errorJson });
      } catch {
        logger.error('Update project subscription error (not JSON)', { error_text: errorText });
      }
    }

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

    let subscriptions: any[] = [];
    
    // Handle v2 API response format: {success: true, data: [...], version: "v2"}
    if (data && data.data && Array.isArray(data.data)) {
      subscriptions = data.data; // v2 format
    } else if (Array.isArray(data)) {
      subscriptions = data; // Legacy format (backward compatibility)
    } else {
      logger.error('Unexpected subscriptions API response format', { data_type: typeof data, data });
      return []; // Fallback to empty array
    }

    // Transform snake_case fields to camelCase
    return transformSubscriptions(subscriptions);
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

    let subscriptionData: any;
    
    // Handle v2 API response format
    if (data && data.subscription) {
      subscriptionData = data.subscription; // v2 format
    } else {
      subscriptionData = data; // Legacy format (backward compatibility)
    }

    // Transform snake_case fields to camelCase
    return transformSubscription(subscriptionData);
  },

  async deleteSubscription(id: string): Promise<void> {
    const response = await fetch(getApiUrl(`/v2/subscriptions/${id}`), {
      method: 'DELETE',
      headers: addAuthHeaders()
    });

    if (!response.ok) {
      throw new ApiError(response.status, 'Error al eliminar suscripción');
    }

    // Handle v2 response format - should return success confirmation
    const data = await handleApiResponse(response);
    if (data && !data.success) {
      throw new ApiError(500, 'Failed to delete subscription');
    }
  },

  // Admin Dashboard
  async getAdminDashboard(): Promise<AdminDashboard> {
    try {
      const data = await httpClient.getJson(getApiUrl(API_CONFIG.ENDPOINTS.ADMIN_DASHBOARD));

      // Handle v2 API response format: {success: true, data: {...}, version: "v2"}
      if (data && data.data) {
        return data.data; // v2 format
      } else {
        return data; // Legacy format (backward compatibility)
      }
    } catch (error) {
      logger.error('Error fetching admin dashboard', { error: error.message }, error);
      throw error;
    }
  },

  // People Management
  async getAllPeople(): Promise<Person[]> {
    try {
      // Try the admin users endpoint first (this is what was working before)
      const response = await fetch(getApiUrl('/v2/admin/users'), {
        headers: addRequiredAuthHeaders()
      });
      const data = await handleApiResponse(response);

      // Debug: Check actual field names from backend
      console.log('🔍 PEOPLE API RESPONSE:', {
        totalCount: data?.data?.length || (Array.isArray(data) ? data.length : 0),
        samplePerson: data?.data?.[0] || data?.[0] || null,
        personFields: data?.data?.[0] ? Object.keys(data.data[0]) : (data?.[0] ? Object.keys(data[0]) : [])
      });

      // Handle v2 API response format: {success: true, data: [...], version: "v2"}
      if (data && data.success && data.data) {
        // Check if it's users array or nested users
        const users = data.data.users || data.data;
        if (Array.isArray(users)) {
          return users; // v2 format
        }
      } else if (data && data.data && Array.isArray(data.data)) {
        return data.data; // v2 format
      } else if (Array.isArray(data)) {
        return data; // Legacy format (backward compatibility)
      }
      
      // If admin users doesn't work, try the people endpoint
      const peopleResponse = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.ADMIN_PEOPLE), {
        headers: addAuthHeaders()
      });
      const peopleData = await handleApiResponse(peopleResponse);
      
      // Debug: Check people endpoint response too
      console.log('🔍 PEOPLE ENDPOINT RESPONSE:', {
        totalCount: peopleData?.data?.length || (Array.isArray(peopleData) ? peopleData.length : 0),
        samplePerson: peopleData?.data?.[0] || peopleData?.[0] || null,
        personFields: peopleData?.data?.[0] ? Object.keys(peopleData.data[0]) : (peopleData?.[0] ? Object.keys(peopleData[0]) : [])
      });
      
      if (peopleData && peopleData.data && Array.isArray(peopleData.data)) {
        return peopleData.data;
      } else if (Array.isArray(peopleData)) {
        return peopleData;
      }
      
      return []; // Fallback to empty array
    } catch (error) {
      logger.error('Error fetching people', { error: error.message }, error);
      return []; // Return empty array on error
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

  async createPerson(person: Partial<Person>): Promise<Person> {
    const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.PEOPLE), {
      method: 'POST',
      headers: {
        ...addAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(person),
    });

    const data = await handleApiResponse(response);
    return data.data; // v2 responses have data wrapped in a data field
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
    try {
      // Try deleting via admin users endpoint first
      const response = await fetch(getApiUrl(`/v2/admin/users/${id}`), {
        method: 'DELETE',
        headers: addRequiredAuthHeaders()
      });
      
      if (!response.ok) {
        // If admin users endpoint doesn't work, try the people endpoint
        const peopleResponse = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.PERSON_BY_ID(id)), {
          method: 'DELETE',
          headers: addRequiredAuthHeaders()
        });
        
        if (!peopleResponse.ok) {
          const errorText = await peopleResponse.text();
          throw new ApiError(peopleResponse.status, `Error al eliminar persona: ${errorText}`);
        }
      }
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, `Error al eliminar persona: ${error}`);
    }
  },

  // Person Subscription Management
  async getPersonSubscriptions(personId: string): Promise<Subscription[]> {
    // Since there's no direct endpoint, we'll get all subscriptions and filter
    logger.debug('Fetching all subscriptions to filter for person', { personId });
    console.log('🔍 SUBSCRIPTION DEBUG: Fetching all subscriptions for personId:', personId);
    
    const allSubscriptions = await this.getAllSubscriptions();
    logger.debug('Retrieved all subscriptions from API', { 
      totalCount: allSubscriptions.length,
      sampleStructure: allSubscriptions[0] || null
    });
    console.log('🔍 SUBSCRIPTION DEBUG: All subscriptions from API:', {
      totalCount: allSubscriptions.length,
      sampleSubscriptions: allSubscriptions.slice(0, 3), // First 3 for structure analysis
      allSubscriptions: allSubscriptions
    });
    
    // Filter subscriptions for the specific person (now using camelCase after transformation)
    const filtered = allSubscriptions.filter(sub => 
      sub.personId === personId
    );
    
    logger.debug('Filtered subscriptions for person', { 
      personId,
      filteredCount: filtered.length,
      totalCount: allSubscriptions.length,
      filteredSubscriptions: filtered
    });
    console.log('🔍 SUBSCRIPTION DEBUG: Filtering results:', {
      personId,
      filteredCount: filtered.length,
      totalCount: allSubscriptions.length,
      filteredSubscriptions: filtered,
      filteringLogic: 'Checking personId field (transformed from person_id)'
    });
    
    return filtered;
  },

  async updatePersonSubscriptions(personId: string, projectIds: string[]): Promise<void> {
    // Get current subscriptions for the person
    const currentSubscriptions = await this.getPersonSubscriptions(personId);
    const currentProjectIds = currentSubscriptions.map(sub => sub.projectId);

    // Find projects to subscribe to (new ones)
    const toSubscribe = projectIds.filter(projectId => !currentProjectIds.includes(projectId));

    // Find projects to unsubscribe from (removed ones)
    const toUnsubscribe = currentSubscriptions.filter(sub => !projectIds.includes(sub.projectId));

    // Subscribe to new projects
    for (const projectId of toSubscribe) {
      try {
        await this.subscribePersonToProject(projectId, personId, {
          status: 'active',
          subscribedBy: 'admin',
          notes: 'Subscribed via admin panel'
        });
      } catch (error) {
        logger.error('Failed to subscribe person to project', { 
          personId: personId, 
          projectId: projectId, 
          error: error.message 
        }, error);
        // Continue with other subscriptions even if one fails
      }
    }

    // Unsubscribe from removed projects
    for (const subscription of toUnsubscribe) {
      try {
        await this.unsubscribePersonFromProject(subscription.projectId, subscription.id);
      } catch (error) {
        logger.error('Failed to unsubscribe person from project', { 
          personId: personId, 
          projectId: subscription.projectId, 
          error: error.message 
        }, error);
        // Continue with other unsubscriptions even if one fails
      }
    }
  },
};

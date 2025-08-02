import type { Person, PersonCreate, PersonUpdate } from '../types/person';
import { ApiError, handleApiResponse } from '../types/api';
import { addAuthHeaders } from './authStub';

const API_BASE_URL = import.meta.env.PUBLIC_API_URL || 'https://2t9blvt2c1.execute-api.us-east-1.amazonaws.com/prod';

export { ApiError };

export const peopleApi = {
  async getAllPeople(): Promise<Person[]> {
    const response = await fetch(`${API_BASE_URL}/v2/admin/people`, {
      headers: addAuthHeaders()
    });
    const data = await handleApiResponse(response);
    
    // Handle v2 API response format: {success: true, data: [...], version: "v2"}
    if (data && data.data && Array.isArray(data.data)) {
      return data.data; // v2 format
    } else if (Array.isArray(data)) {
      return data; // Old format (backward compatibility)
    } else if (data && data.people && Array.isArray(data.people)) {
      return data.people; // Legacy format
    } else {
      console.error('Unexpected API response format:', data);
      return []; // Fallback to empty array
    }
  },

  async getPerson(id: string): Promise<Person> {
    const response = await fetch(`${API_BASE_URL}/people/${id}`, {
      headers: addAuthHeaders()
    });
    return handleApiResponse(response);
  },

  async createPerson(person: PersonCreate): Promise<Person> {
    const response = await fetch(`${API_BASE_URL}/people`, {
      method: 'POST',
      headers: addAuthHeaders({
        'Content-Type': 'application/json',
      }),
      body: JSON.stringify(person),
    });
    
    // Handle both 200 and 201 status codes
    if (!response.ok) {
      let errorMessage: string;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || response.statusText;
      } catch {
        errorMessage = response.statusText;
      }
      throw new ApiError(response.status, errorMessage);
    }
    
    const data = await response.json();
    
    // If API returns a generic message instead of person data, handle gracefully
    if (data && !data.id && data.message) {
      console.warn('API returned message instead of person data:', data.message);
      // For now, return a placeholder - this needs proper API fix
      throw new ApiError(500, 'API did not return created person data');
    }
    
    return data;
  },

  async updatePerson(id: string, person: PersonUpdate): Promise<Person> {
    const response = await fetch(`${API_BASE_URL}/people/${id}`, {
      method: 'PUT',
      headers: addAuthHeaders({
        'Content-Type': 'application/json',
      }),
      body: JSON.stringify(person),
    });
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

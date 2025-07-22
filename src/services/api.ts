import type { Person, PersonCreate, PersonUpdate } from '../types/person';
import { ApiError, handleApiResponse } from '../types/api';

const API_BASE_URL = import.meta.env.PUBLIC_API_URL || 'https://2t9blvt2c1.execute-api.us-east-1.amazonaws.com/prod';

export { ApiError };

export const peopleApi = {
  async getAllPeople(): Promise<Person[]> {
    const response = await fetch(`${API_BASE_URL}/people`);
    return handleApiResponse(response);
  },

  async getPerson(id: string): Promise<Person> {
    const response = await fetch(`${API_BASE_URL}/people/${id}`);
    return handleApiResponse(response);
  },

  async createPerson(person: PersonCreate): Promise<Person> {
    const response = await fetch(`${API_BASE_URL}/people`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(person),
    });
    return handleApiResponse(response);
  },

  async updatePerson(id: string, person: PersonUpdate): Promise<Person> {
    const response = await fetch(`${API_BASE_URL}/people/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
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

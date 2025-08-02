// Re-export from projectApi to maintain backward compatibility
// This file is deprecated - use projectApi directly instead
import { projectApi, ApiError } from './projectApi';

export { ApiError };

// Re-export people-related functions from projectApi for backward compatibility
export const peopleApi = {
  getAllPeople: projectApi.getAllPeople.bind(projectApi),
  getPerson: projectApi.getPerson.bind(projectApi),
  createPerson: projectApi.createPerson.bind(projectApi),
  updatePerson: projectApi.updatePerson.bind(projectApi),
  deletePerson: projectApi.deletePerson.bind(projectApi),
};

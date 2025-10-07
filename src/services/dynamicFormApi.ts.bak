import type {
  ProjectSubmission,
  ProjectSubmissionCreate,
  ImageUploadRequest,
  ImageUploadResponse,
} from '../types/dynamicForm';
import { getApiUrl } from '../config/api';
import { getApiLogger } from '../utils/logger';
import { ApiError, handleApiResponse } from '../types/api';
import { httpClient } from './httpClient';

export { ApiError };

const logger = getApiLogger('dynamicFormApi');

export const dynamicFormApi = {
  // Form Submissions
  async submitFormResponse(submission: ProjectSubmissionCreate): Promise<ProjectSubmission> {
    logger.debug('Submitting form response', { projectId: submission.projectId });
    
    const response = await httpClient.post(
      getApiUrl('/v2/form-submissions'),
      submission
    );
    
    const data = await handleApiResponse(response);
    
    // Handle v2 API response format
    if (data && data.data) {
      return data.data;
    }
    
    return data;
  },

  async getProjectSubmissions(projectId: string): Promise<ProjectSubmission[]> {
    logger.debug('Fetching project submissions', { projectId });
    
    const response = await httpClient.get(
      getApiUrl(`/v2/form-submissions/project/${projectId}`)
    );
    
    const data = await handleApiResponse(response);
    
    // Handle v2 API response format
    if (data && data.data && Array.isArray(data.data)) {
      return data.data;
    } else if (Array.isArray(data)) {
      return data;
    }
    
    return [];
  },

  async getPersonProjectSubmission(personId: string, projectId: string): Promise<ProjectSubmission | null> {
    logger.debug('Fetching person project submission', { personId, projectId });
    
    try {
      const response = await httpClient.get(
        getApiUrl(`/v2/form-submissions/person/${personId}/project/${projectId}`)
      );
      
      const data = await handleApiResponse(response);
      
      // Handle v2 API response format
      if (data && data.data) {
        return data.data;
      }
      
      return data;
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        return null; // No submission found
      }
      throw error;
    }
  },

  // Image Upload
  async getImageUploadUrl(request: ImageUploadRequest): Promise<ImageUploadResponse> {
    logger.debug('Requesting image upload URL', { filename: request.filename });
    
    const response = await httpClient.post(
      getApiUrl('/v2/images/upload-url'),
      request
    );
    
    const data = await handleApiResponse(response);
    
    // Handle v2 API response format
    if (data && data.data) {
      return data.data;
    }
    
    return data;
  },

  // eslint-disable-next-line no-undef
  async uploadImageToS3(uploadUrl: string, file: Blob): Promise<void> {
    logger.debug('Uploading image to S3', { size: file.size });
    
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
    });
    
    if (!response.ok) {
      throw new ApiError(
        `Failed to upload image: ${response.statusText}`,
        response.status,
        'UPLOAD_FAILED'
      );
    }
  },
};

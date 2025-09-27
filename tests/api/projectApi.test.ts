/**
 * Critical Frontend API Tests
 * 
 * These tests would have caught the production issues:
 * 1. Dead code in API methods
 * 2. Undefined person IDs
 * 3. Non-existent endpoints
 */

import { projectApi } from '../../src/services/projectApi';
import { API_CONFIG } from '../../src/config/api';

// Mock fetch globally
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

describe('ProjectAPI Critical Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('API Endpoint Existence', () => {
    it('should not reference non-existent endpoints', async () => {
      // This test would have caught the dead code issue
      const mockResponse = {
        ok: false,
        status: 404,
        json: async () => ({ detail: 'Not Found' })
      };
      
      mockFetch.mockResolvedValue(mockResponse as any);

      // Test the subscription methods that were dead code
      try {
        await projectApi.getProjectSubscribers('test-project');
        // If we get here without a 501 error, the endpoint exists
        expect(true).toBe(false); // Should not reach here with current implementation
      } catch (error: any) {
        // Should throw 501 error indicating method not implemented
        expect(error.status).toBe(501);
        expect(error.message).toContain('no está disponible');
      }
    });

    it('should use v2 endpoints consistently', () => {
      // Verify all endpoints use v2 format
      const endpoints = API_CONFIG.ENDPOINTS;
      
      const v2Endpoints = [
        endpoints.PROJECTS,
        endpoints.ADMIN_PROJECTS,
        endpoints.ADMIN_PEOPLE,
        endpoints.PEOPLE_CHECK_EMAIL,
        endpoints.SUBSCRIPTIONS,
        endpoints.ADMIN_SUBSCRIPTIONS,
        endpoints.ADMIN_DASHBOARD,
      ];

      v2Endpoints.forEach(endpoint => {
        expect(endpoint).toMatch(/^\/v2\//);
      });
    });

    it('should have working subscription management endpoints', () => {
      // Test the new v2 subscription endpoints
      const projectId = 'test-project';
      const subscriptionId = 'test-subscription';

      expect(API_CONFIG.ENDPOINTS.PROJECT_SUBSCRIBERS(projectId))
        .toBe(`/v2/projects/${projectId}/subscribers`);
      
      expect(API_CONFIG.ENDPOINTS.PROJECT_SUBSCRIBE(projectId))
        .toBe(`/v2/projects/${projectId}/subscribers`);
      
      expect(API_CONFIG.ENDPOINTS.PROJECT_UNSUBSCRIBE(projectId, subscriptionId))
        .toBe(`/v2/projects/${projectId}/subscribers/${subscriptionId}`);
    });
  });

  describe('Person Update Workflow', () => {
    it('should handle person updates with proper ID handling', async () => {
      // This test would have caught the undefined person ID issue
      const mockPerson = {
        id: 'test-person-id',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com'
      };

      const mockResponse = {
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: mockPerson,
          version: 'v2'
        })
      };

      mockFetch.mockResolvedValue(mockResponse as any);

      const result = await projectApi.updatePerson('test-person-id', {
        firstName: 'Jane'
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/v2/people/test-person-id'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ firstName: 'Jane' })
        })
      );

      expect(result).toEqual(mockPerson);
    });

    it('should not call updatePerson with undefined ID', async () => {
      // This would have caught the production bug
      try {
        await projectApi.updatePerson(undefined as any, { firstName: 'Jane' });
        expect(true).toBe(false); // Should not reach here
      } catch {
        // Should fail gracefully, not make API call with undefined
        expect(mockFetch).not.toHaveBeenCalled();
      }
    });
  });

  describe('Response Format Handling', () => {
    it('should handle v2 response format correctly', async () => {
      const mockV2Response = {
        success: true,
        data: [{ id: '1', name: 'Test Project' }],
        version: 'v2'
      };

      const mockResponse = {
        ok: true,
        status: 200,
        json: async () => mockV2Response
      };

      mockFetch.mockResolvedValue(mockResponse as any);

      const result = await projectApi.getAllProjects();

      expect(result).toEqual(mockV2Response.data);
    });

    it('should handle legacy response format as fallback', async () => {
      const mockLegacyResponse = [{ id: '1', name: 'Test Project' }];

      const mockResponse = {
        ok: true,
        status: 200,
        json: async () => mockLegacyResponse
      };

      mockFetch.mockResolvedValue(mockResponse as any);

      const result = await projectApi.getAllProjects();

      expect(result).toEqual(mockLegacyResponse);
    });

    it('should handle unexpected response formats gracefully', async () => {
      const mockUnexpectedResponse = { unexpected: 'format' };

      const mockResponse = {
        ok: true,
        status: 200,
        json: async () => mockUnexpectedResponse
      };

      mockFetch.mockResolvedValue(mockResponse as any);

      const result = await projectApi.getAllProjects();

      // Should fallback to empty array for unexpected format
      expect(result).toEqual([]);
    });
  });

  describe('Project CRUD Operations', () => {
    it('should get a single project by ID', async () => {
      const mockProject = {
        id: 'test-project-id',
        name: 'Test Project',
        description: 'A test project',
        maxParticipants: 50,
        status: 'active'
      };

      const mockResponse = {
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: mockProject,
          version: 'v2'
        })
      };

      mockFetch.mockResolvedValue(mockResponse as any);

      const result = await projectApi.getProject('test-project-id');

      expect(result).toEqual(mockProject);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/v2/projects/test-project-id'),
        expect.objectContaining({
          method: 'GET'
        })
      );
    });

    it('should create a new project', async () => {
      const newProject = {
        name: 'New Project',
        description: 'A new test project',
        maxParticipants: 25
      };

      const createdProject = {
        id: 'new-project-id',
        ...newProject,
        status: 'active',
        createdAt: '2025-01-01T00:00:00Z'
      };

      const mockResponse = {
        ok: true,
        status: 201,
        json: async () => ({
          success: true,
          data: createdProject,
          version: 'v2'
        })
      };

      mockFetch.mockResolvedValue(mockResponse as any);

      const result = await projectApi.createProject(newProject);

      expect(result).toEqual(createdProject);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/v2/projects'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(newProject)
        })
      );
    });

    it('should update an existing project', async () => {
      const updateData = {
        name: 'Updated Project Name',
        description: 'Updated description'
      };

      const updatedProject = {
        id: 'test-project-id',
        name: 'Updated Project Name',
        description: 'Updated description',
        maxParticipants: 50,
        status: 'active'
      };

      const mockResponse = {
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: updatedProject,
          version: 'v2'
        })
      };

      mockFetch.mockResolvedValue(mockResponse as any);

      const result = await projectApi.updateProject('test-project-id', updateData);

      expect(result).toEqual(updatedProject);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/v2/projects/test-project-id'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(updateData)
        })
      );
    });

    it('should delete a project', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: { deleted: true, project_id: 'test-project-id' },
          version: 'v2'
        })
      };

      mockFetch.mockResolvedValue(mockResponse as any);

      await projectApi.deleteProject('test-project-id');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/v2/projects/test-project-id'),
        expect.objectContaining({
          method: 'DELETE'
        })
      );
    });

    it('should handle project not found errors', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
        json: async () => ({ detail: 'Project not found' })
      };

      mockFetch.mockResolvedValue(mockResponse as any);

      try {
        await projectApi.getProject('non-existent-id');
        expect(true).toBe(false); // Should not reach here
      } catch (error: any) {
        expect(error.status).toBe(404);
      }
    });

    it('should handle legacy response format for backward compatibility', async () => {
      const mockProject = {
        id: 'test-project-id',
        name: 'Test Project',
        description: 'A test project'
      };

      // Mock legacy format response (no v2 wrapper)
      const mockResponse = {
        ok: true,
        status: 200,
        json: async () => mockProject
      };

      mockFetch.mockResolvedValue(mockResponse as any);

      const result = await projectApi.getProject('test-project-id');

      expect(result).toEqual(mockProject);
    });

    it('should test complete project CRUD workflow', async () => {
      // Step 1: Create project
      const createData = {
        name: 'CRUD Test Project',
        description: 'Testing complete CRUD workflow'
      };

      const createdProject = {
        id: 'crud-test-id',
        ...createData,
        status: 'active'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ success: true, data: createdProject, version: 'v2' })
      } as any);

      const created = await projectApi.createProject(createData);
      expect(created.name).toBe('CRUD Test Project');

      // Step 2: Read project
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: createdProject, version: 'v2' })
      } as any);

      const read = await projectApi.getProject('crud-test-id');
      expect(read.id).toBe('crud-test-id');

      // Step 3: Update project
      const updateData = { name: 'Updated CRUD Test Project' };
      const updatedProject = { ...createdProject, name: 'Updated CRUD Test Project' };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: updatedProject, version: 'v2' })
      } as any);

      const updated = await projectApi.updateProject('crud-test-id', updateData);
      expect(updated.name).toBe('Updated CRUD Test Project');

      // Step 4: Delete project
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: { deleted: true }, version: 'v2' })
      } as any);

      await projectApi.deleteProject('crud-test-id');

      // Verify all operations were called
      expect(mockFetch).toHaveBeenCalledTimes(4);
    });
  });

  describe('Subscription Management CRUD', () => {
    it('should implement complete subscription management workflow', async () => {
      const projectId = 'test-project';
      const subscriptionId = 'test-subscription';
      
      // Mock successful responses
      const mockResponse = {
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: { subscribers: [] },
          version: 'v2'
        })
      };

      mockFetch.mockResolvedValue(mockResponse as any);

      // Test GET subscribers
      const subscribers = await projectApi.getProjectSubscribers(projectId);
      expect(subscribers).toEqual([]);

      // Test POST subscribe
      await projectApi.subscribePersonToProject(projectId, 'person-id', {
        notes: 'Test subscription'
      });

      // Test PUT update
      await projectApi.updateProjectSubscription(projectId, subscriptionId, {
        status: 'inactive'
      });

      // Test DELETE unsubscribe
      await projectApi.unsubscribePersonFromProject(projectId, subscriptionId);

      // Verify all calls were made
      expect(mockFetch).toHaveBeenCalledTimes(5);
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      const mockErrorResponse = {
        ok: false,
        status: 500,
        json: async () => ({ detail: 'Internal Server Error' })
      };

      mockFetch.mockResolvedValue(mockErrorResponse as any);

      try {
        await projectApi.getAllProjects();
        expect(true).toBe(false); // Should not reach here
      } catch (error: any) {
        expect(error.status).toBe(500);
      }
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      try {
        await projectApi.getAllProjects();
        expect(true).toBe(false); // Should not reach here
      } catch (error: any) {
        expect(error.message).toBe('Network error');
      }
    });
  });
});
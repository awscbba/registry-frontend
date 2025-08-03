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
      } catch (error) {
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
      expect(mockFetch).toHaveBeenCalledTimes(4);
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
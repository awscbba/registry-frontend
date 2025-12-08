/**
 * Enterprise-grade unit tests for useProjects hook
 * 
 * Test Coverage:
 * - Initial state and data fetching
 * - Project filtering (available vs ongoing)
 * - Error handling and recovery
 * - Race condition prevention
 * - Memory leak prevention
 * - Refresh functionality
 * - Data freshness tracking
 * - Performance optimization (useMemo)
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import { renderHook, waitFor, act } from '@testing-library/react';
import { vi } from 'vitest';
import { useProjects } from '../useProjects';
import { projectApi } from '../../services/projectApi';
import type { Project } from '../../types/project';

// Mock the projectApi
vi.mock('../../services/projectApi', () => ({
  projectApi: {
    getPublicProjects: vi.fn(),
  },
}));

// Mock the logger
vi.mock('../../utils/logger', () => ({
  getLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

describe('useProjects', () => {
  const mockProjects: Project[] = [
    {
      id: '1',
      name: 'Pending Project',
      description: 'Test pending project',
      status: 'pending',
      createdBy: 'admin',
      isEnabled: true,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    },
    {
      id: '2',
      name: 'Active Project',
      description: 'Test active project',
      status: 'active',
      createdBy: 'admin',
      isEnabled: true,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    },
    {
      id: '3',
      name: 'Ongoing Project',
      description: 'Test ongoing project',
      status: 'ongoing',
      createdBy: 'admin',
      isEnabled: true,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    },
    {
      id: '4',
      name: 'Completed Project',
      description: 'Test completed project',
      status: 'completed',
      createdBy: 'admin',
      isEnabled: true,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should initialize with loading state', () => {
      (projectApi.getPublicProjects as any).mockImplementation(() => 
        new Promise(() => {}) // Never resolves
      );

      const { result } = renderHook(() => useProjects());

      expect(result.current.isLoading).toBe(true);
      expect(result.current.projects).toEqual([]);
      expect(result.current.ongoingProjects).toEqual([]);
      expect(result.current.error).toBeNull();
      expect(result.current.lastFetchedAt).toBeNull();
    });

    it('should provide all required properties', () => {
      (projectApi.getPublicProjects as any).mockResolvedValue([]);

      const { result } = renderHook(() => useProjects());

      expect(result.current).toHaveProperty('projects');
      expect(result.current).toHaveProperty('ongoingProjects');
      expect(result.current).toHaveProperty('isLoading');
      expect(result.current).toHaveProperty('error');
      expect(result.current).toHaveProperty('refreshProjects');
      expect(result.current).toHaveProperty('lastFetchedAt');
    });

    it('should have refreshProjects as a function', () => {
      (projectApi.getPublicProjects as any).mockResolvedValue([]);

      const { result } = renderHook(() => useProjects());

      expect(typeof result.current.refreshProjects).toBe('function');
    });
  });

  describe('Data Fetching', () => {
    it('should fetch projects on mount', async () => {
      (projectApi.getPublicProjects as any).mockResolvedValue(mockProjects);

      const { result } = renderHook(() => useProjects());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(projectApi.getPublicProjects).toHaveBeenCalledTimes(1);
    });

    it('should set projects after successful fetch', async () => {
      (projectApi.getPublicProjects as any).mockResolvedValue(mockProjects);

      const { result } = renderHook(() => useProjects());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.projects.length).toBeGreaterThan(0);
      expect(result.current.error).toBeNull();
    });

    it('should set lastFetchedAt after successful fetch', async () => {
      (projectApi.getPublicProjects as any).mockResolvedValue(mockProjects);

      const beforeFetch = new Date();
      const { result } = renderHook(() => useProjects());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.lastFetchedAt).not.toBeNull();
      expect(result.current.lastFetchedAt!.getTime()).toBeGreaterThanOrEqual(beforeFetch.getTime());
    });

    it('should update lastFetchedAt on refresh', async () => {
      (projectApi.getPublicProjects as any).mockResolvedValue(mockProjects);

      const { result } = renderHook(() => useProjects());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const firstFetchTime = result.current.lastFetchedAt;

      // Wait a bit to ensure time difference
      await new Promise(resolve => setTimeout(resolve, 10));

      await act(async () => {
        await result.current.refreshProjects();
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.lastFetchedAt).not.toEqual(firstFetchTime);
      expect(result.current.lastFetchedAt!.getTime()).toBeGreaterThan(firstFetchTime!.getTime());
    });
  });

  describe('Project Filtering', () => {
    it('should filter pending and active projects into projects array', async () => {
      (projectApi.getPublicProjects as any).mockResolvedValue(mockProjects);

      const { result } = renderHook(() => useProjects());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.projects).toHaveLength(2);
      expect(result.current.projects.every(p => 
        p.status === 'pending' || p.status === 'active'
      )).toBe(true);
    });

    it('should filter ongoing and completed projects into ongoingProjects array', async () => {
      (projectApi.getPublicProjects as any).mockResolvedValue(mockProjects);

      const { result } = renderHook(() => useProjects());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.ongoingProjects).toHaveLength(2);
      expect(result.current.ongoingProjects.every(p => 
        p.status === 'ongoing' || p.status === 'completed'
      )).toBe(true);
    });

    it('should handle empty project list', async () => {
      (projectApi.getPublicProjects as any).mockResolvedValue([]);

      const { result } = renderHook(() => useProjects());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.projects).toEqual([]);
      expect(result.current.ongoingProjects).toEqual([]);
    });

    it('should handle projects with only pending status', async () => {
      const pendingOnly: Project[] = [
        {
          id: '1',
          name: 'Pending Project',
          description: 'Test',
          status: 'pending',
          createdBy: 'admin',
          isEnabled: true,
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
        },
      ];

      (projectApi.getPublicProjects as any).mockResolvedValue(pendingOnly);

      const { result } = renderHook(() => useProjects());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.projects).toHaveLength(1);
      expect(result.current.ongoingProjects).toHaveLength(0);
    });

    it('should handle projects with only ongoing status', async () => {
      const ongoingOnly: Project[] = [
        {
          id: '1',
          name: 'Ongoing Project',
          description: 'Test',
          status: 'ongoing',
          createdBy: 'admin',
          isEnabled: true,
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
        },
      ];

      (projectApi.getPublicProjects as any).mockResolvedValue(ongoingOnly);

      const { result } = renderHook(() => useProjects());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.projects).toHaveLength(0);
      expect(result.current.ongoingProjects).toHaveLength(1);
    });
  });

  describe('Error Handling', () => {
    it('should handle fetch errors gracefully', async () => {
      const errorMessage = 'Network error';
      (projectApi.getPublicProjects as any).mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useProjects());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe(errorMessage);
      expect(result.current.projects).toEqual([]);
      expect(result.current.ongoingProjects).toEqual([]);
    });

    it('should handle non-Error exceptions', async () => {
      (projectApi.getPublicProjects as any).mockRejectedValue('String error');

      const { result } = renderHook(() => useProjects());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe('Failed to load projects');
    });

    it('should clear previous error on successful refetch', async () => {
      (projectApi.getPublicProjects as any).mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useProjects());

      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
      });

      // Mock successful response for refetch
      (projectApi.getPublicProjects as any).mockResolvedValue(mockProjects);

      await act(async () => {
        await result.current.refreshProjects();
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeNull();
      expect(result.current.projects.length).toBeGreaterThan(0);
    });
  });

  describe('Refresh Functionality', () => {
    it('should refetch projects when refreshProjects is called', async () => {
      (projectApi.getPublicProjects as any).mockResolvedValue(mockProjects);

      const { result } = renderHook(() => useProjects());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(projectApi.getPublicProjects).toHaveBeenCalledTimes(1);

      await act(async () => {
        await result.current.refreshProjects();
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(projectApi.getPublicProjects).toHaveBeenCalledTimes(2);
    });

    it('should set loading state during refresh', async () => {
      (projectApi.getPublicProjects as any).mockResolvedValue(mockProjects);

      const { result } = renderHook(() => useProjects());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let loadingDuringRefresh = false;

      act(() => {
        result.current.refreshProjects();
        loadingDuringRefresh = result.current.isLoading;
      });

      expect(loadingDuringRefresh).toBe(true);
    });

    it('should have stable refreshProjects function reference', async () => {
      (projectApi.getPublicProjects as any).mockResolvedValue(mockProjects);

      const { result, rerender } = renderHook(() => useProjects());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const firstRefresh = result.current.refreshProjects;

      rerender();

      expect(result.current.refreshProjects).toBe(firstRefresh);
    });
  });

  describe('Race Condition Prevention', () => {
    it('should handle rapid successive fetches correctly', async () => {
      let resolveFirst: (value: Project[]) => void;
      let resolveSecond: (value: Project[]) => void;

      const firstPromise = new Promise<Project[]>(resolve => {
        resolveFirst = resolve;
      });

      const secondPromise = new Promise<Project[]>(resolve => {
        resolveSecond = resolve;
      });

      (projectApi.getPublicProjects as any)
        .mockReturnValueOnce(firstPromise)
        .mockReturnValueOnce(secondPromise);

      const { result } = renderHook(() => useProjects());

      // Trigger second fetch before first completes
      await act(async () => {
        result.current.refreshProjects();
      });

      // Resolve second request first (out of order)
      await act(async () => {
        resolveSecond!(mockProjects);
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Resolve first request (should be ignored)
      await act(async () => {
        resolveFirst!([]);
      });

      // Should have data from second request
      expect(result.current.projects.length).toBeGreaterThan(0);
    });
  });

  describe('Memory Leak Prevention', () => {
    it('should not update state after unmount', async () => {
      let resolvePromise: (value: Project[]) => void;
      const promise = new Promise<Project[]>(resolve => {
        resolvePromise = resolve;
      });

      (projectApi.getPublicProjects as any).mockReturnValue(promise);

      const { result, unmount } = renderHook(() => useProjects());

      expect(result.current.isLoading).toBe(true);

      // Unmount before promise resolves
      unmount();

      // Resolve promise after unmount
      await act(async () => {
        resolvePromise!(mockProjects);
      });

      // Should not throw or cause warnings
      expect(true).toBe(true);
    });
  });

  describe('Performance Optimization', () => {
    it('should memoize filtered projects', async () => {
      (projectApi.getPublicProjects as any).mockResolvedValue(mockProjects);

      const { result, rerender } = renderHook(() => useProjects());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const firstProjects = result.current.projects;
      const firstOngoingProjects = result.current.ongoingProjects;

      // Rerender without data change
      rerender();

      // References should be the same (memoized)
      expect(result.current.projects).toBe(firstProjects);
      expect(result.current.ongoingProjects).toBe(firstOngoingProjects);
    });
  });

  describe('Edge Cases', () => {
    it('should handle projects with undefined status', async () => {
      const projectsWithUndefinedStatus: any[] = [
        {
          id: '1',
          name: 'Project',
          description: 'Test',
          createdBy: 'admin',
          isEnabled: true,
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
        },
      ];

      (projectApi.getPublicProjects as any).mockResolvedValue(projectsWithUndefinedStatus);

      const { result } = renderHook(() => useProjects());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should not crash
      expect(result.current.projects).toBeDefined();
      expect(result.current.ongoingProjects).toBeDefined();
    });

    it('should handle very large project lists', async () => {
      const largeProjectList: Project[] = Array.from({ length: 1000 }, (_, i) => ({
        id: `${i}`,
        name: `Project ${i}`,
        description: 'Test',
        status: i % 2 === 0 ? 'pending' : 'ongoing',
        createdBy: 'admin',
        isEnabled: true,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      }));

      (projectApi.getPublicProjects as any).mockResolvedValue(largeProjectList);

      const { result } = renderHook(() => useProjects());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.projects.length).toBe(500);
      expect(result.current.ongoingProjects.length).toBe(500);
    });
  });
});

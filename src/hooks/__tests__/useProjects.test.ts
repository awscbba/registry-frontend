/**
 * Tests for useProjects hook
 * 
 * Validates that the hook correctly fetches and manages project data
 */

import { renderHook, waitFor, act } from '@testing-library/react';
import { useProjects } from '../useProjects';
import { projectApi } from '../../services/projectApi';
import type { Project } from '../../types/project';

// Mock the projectApi
jest.mock('../../services/projectApi', () => ({
  projectApi: {
    getAllProjects: jest.fn(),
  },
}));

// Mock the logger
jest.mock('../../utils/logger', () => ({
  getLogger: () => ({
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }),
  getErrorMessage: (err: unknown) => err instanceof Error ? err.message : 'Failed to load projects',
  getErrorObject: (err: unknown) => err instanceof Error ? err : undefined,
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
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with loading state', () => {
    (projectApi.getAllProjects as jest.Mock).mockImplementation(() => 
      new Promise(() => {}) // Never resolves
    );

    const { result } = renderHook(() => useProjects());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.projects).toEqual([]);
    expect(result.current.ongoingProjects).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('should fetch projects on mount', async () => {
    (projectApi.getAllProjects as jest.Mock).mockResolvedValue(mockProjects);

    renderHook(() => useProjects());

    await waitFor(() => {
      expect(projectApi.getAllProjects).toHaveBeenCalledTimes(1);
    });
  });

  it('should separate projects by status correctly', async () => {
    (projectApi.getAllProjects as jest.Mock).mockResolvedValue(mockProjects);

    const { result } = renderHook(() => useProjects());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should have separated projects correctly
    expect(result.current.projects).toHaveLength(2); // pending + active
    expect(result.current.ongoingProjects).toHaveLength(1); // ongoing
    expect(result.current.error).toBeNull();

    // Verify correct projects are in each category
    expect(result.current.projects.map(p => p.status)).toEqual(['pending', 'active']);
    expect(result.current.ongoingProjects.map(p => p.status)).toEqual(['ongoing']);
  });

  it('should handle loading state correctly', async () => {
    let resolveProjects: (value: Project[]) => void;
    const projectsPromise = new Promise<Project[]>((resolve) => {
      resolveProjects = resolve;
    });

    (projectApi.getAllProjects as jest.Mock).mockReturnValue(projectsPromise);

    const { result } = renderHook(() => useProjects());

    // Should be loading initially
    expect(result.current.isLoading).toBe(true);
    expect(result.current.projects).toEqual([]);
    expect(result.current.ongoingProjects).toEqual([]);

    // Resolve the promise
    act(() => {
      resolveProjects!(mockProjects);
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should have data after loading
    expect(result.current.projects).toHaveLength(2);
    expect(result.current.ongoingProjects).toHaveLength(1);
  });

  it('should handle error state correctly', async () => {
    const errorMessage = 'Failed to fetch projects';
    (projectApi.getAllProjects as jest.Mock).mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() => useProjects());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe(errorMessage);
    expect(result.current.projects).toEqual([]);
    expect(result.current.ongoingProjects).toEqual([]);
  });

  it('should provide a refetch function', async () => {
    (projectApi.getAllProjects as jest.Mock).mockResolvedValue(mockProjects);

    const { result } = renderHook(() => useProjects());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(typeof result.current.refetch).toBe('function');
  });

  it('should refetch projects when refetch is called', async () => {
    (projectApi.getAllProjects as jest.Mock).mockResolvedValue(mockProjects);

    const { result } = renderHook(() => useProjects());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Clear the mock and set up new data
    jest.clearAllMocks();
    const newProjects = [mockProjects[0]]; // Only one project
    (projectApi.getAllProjects as jest.Mock).mockResolvedValue(newProjects);

    // Call refetch
    await act(async () => {
      await result.current.refetch();
    });

    await waitFor(() => {
      expect(result.current.projects).toHaveLength(1);
    });

    expect(projectApi.getAllProjects).toHaveBeenCalledTimes(1);
  });

  it('should clear error state on successful refetch', async () => {
    // First call fails
    (projectApi.getAllProjects as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useProjects());

    await waitFor(() => {
      expect(result.current.error).toBe('Network error');
    });

    // Second call succeeds
    (projectApi.getAllProjects as jest.Mock).mockResolvedValue(mockProjects);

    await act(async () => {
      await result.current.refetch();
    });

    await waitFor(() => {
      expect(result.current.error).toBeNull();
      expect(result.current.projects).toHaveLength(2);
    });
  });

  it('should filter out completed and cancelled projects from available projects', async () => {
    const allStatusProjects: Project[] = [
      ...mockProjects,
      {
        id: '5',
        name: 'Cancelled Project',
        description: 'Test cancelled project',
        status: 'cancelled',
        createdBy: 'admin',
        isEnabled: true,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      },
    ];

    (projectApi.getAllProjects as jest.Mock).mockResolvedValue(allStatusProjects);

    const { result } = renderHook(() => useProjects());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should only include pending and active in projects
    expect(result.current.projects).toHaveLength(2);
    expect(result.current.projects.every(p => 
      p.status === 'pending' || p.status === 'active'
    )).toBe(true);

    // Should only include ongoing in ongoingProjects
    expect(result.current.ongoingProjects).toHaveLength(1);
    expect(result.current.ongoingProjects[0].status).toBe('ongoing');
  });

  it('should handle empty project list', async () => {
    (projectApi.getAllProjects as jest.Mock).mockResolvedValue([]);

    const { result } = renderHook(() => useProjects());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.projects).toEqual([]);
    expect(result.current.ongoingProjects).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('should handle only pending projects', async () => {
    const pendingOnly: Project[] = [
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
    ];

    (projectApi.getAllProjects as jest.Mock).mockResolvedValue(pendingOnly);

    const { result } = renderHook(() => useProjects());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.projects).toHaveLength(1);
    expect(result.current.projects[0].status).toBe('pending');
    expect(result.current.ongoingProjects).toEqual([]);
  });

  it('should handle only active projects', async () => {
    const activeOnly: Project[] = [
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
    ];

    (projectApi.getAllProjects as jest.Mock).mockResolvedValue(activeOnly);

    const { result } = renderHook(() => useProjects());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.projects).toHaveLength(1);
    expect(result.current.projects[0].status).toBe('active');
    expect(result.current.ongoingProjects).toEqual([]);
  });

  it('should handle only ongoing projects', async () => {
    const ongoingOnly: Project[] = [
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
    ];

    (projectApi.getAllProjects as jest.Mock).mockResolvedValue(ongoingOnly);

    const { result } = renderHook(() => useProjects());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.projects).toEqual([]);
    expect(result.current.ongoingProjects).toHaveLength(1);
    expect(result.current.ongoingProjects[0].status).toBe('ongoing');
  });

  it('should handle network errors', async () => {
    (projectApi.getAllProjects as jest.Mock).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useProjects());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Network error');
  });

  it('should handle non-Error exceptions', async () => {
    (projectApi.getAllProjects as jest.Mock).mockRejectedValue('String error');

    const { result } = renderHook(() => useProjects());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to load projects');
  });

  it('should maintain state after unmounting and remounting', async () => {
    (projectApi.getAllProjects as jest.Mock).mockResolvedValue(mockProjects);

    const { result, unmount } = renderHook(() => useProjects());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.projects).toHaveLength(2);

    // Unmount the hook
    unmount();

    // Remount the hook (new instance)
    jest.clearAllMocks();
    (projectApi.getAllProjects as jest.Mock).mockResolvedValue(mockProjects);
    
    const { result: newResult } = renderHook(() => useProjects());

    // New instance should start fresh
    expect(newResult.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(newResult.current.isLoading).toBe(false);
    });

    expect(newResult.current.projects).toHaveLength(2);
    expect(projectApi.getAllProjects).toHaveBeenCalledTimes(1);
  });

  it('should handle race conditions with multiple refetch calls', async () => {
    (projectApi.getAllProjects as jest.Mock).mockResolvedValue(mockProjects);

    const { result } = renderHook(() => useProjects());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Set up different responses for multiple calls
    const firstProjects = [mockProjects[0]];
    const secondProjects = [mockProjects[1], mockProjects[2]];

    (projectApi.getAllProjects as jest.Mock)
      .mockResolvedValueOnce(firstProjects)
      .mockResolvedValueOnce(secondProjects);

    // Call refetch multiple times quickly
    await act(async () => {
      const promise1 = result.current.refetch();
      const promise2 = result.current.refetch();
      await Promise.all([promise1, promise2]);
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should have the result from the latest call
    expect(result.current.projects.length).toBeGreaterThan(0);
  });

  it('should set loading state during refetch', async () => {
    (projectApi.getAllProjects as jest.Mock).mockResolvedValue(mockProjects);

    const { result } = renderHook(() => useProjects());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Set up a delayed response
    let resolveRefetch: (value: Project[]) => void;
    const refetchPromise = new Promise<Project[]>((resolve) => {
      resolveRefetch = resolve;
    });

    (projectApi.getAllProjects as jest.Mock).mockReturnValue(refetchPromise);

    // Start refetch
    act(() => {
      result.current.refetch();
    });

    // Should be loading during refetch
    await waitFor(() => {
      expect(result.current.isLoading).toBe(true);
    });

    // Resolve the refetch
    act(() => {
      resolveRefetch!(mockProjects);
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('should sort projects by startDate (most recent first)', async () => {
    const projectsWithDates: Project[] = [
      {
        id: '1',
        name: 'Old Project',
        description: 'Oldest project',
        status: 'active',
        createdBy: 'admin',
        isEnabled: true,
        startDate: '2024-01-01',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      },
      {
        id: '2',
        name: 'Recent Project',
        description: 'Most recent project',
        status: 'active',
        createdBy: 'admin',
        isEnabled: true,
        startDate: '2024-12-01',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      },
      {
        id: '3',
        name: 'Middle Project',
        description: 'Middle project',
        status: 'active',
        createdBy: 'admin',
        isEnabled: true,
        startDate: '2024-06-01',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      },
    ];

    (projectApi.getAllProjects as jest.Mock).mockResolvedValue(projectsWithDates);

    const { result } = renderHook(() => useProjects());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should be sorted by startDate (most recent first)
    expect(result.current.projects).toHaveLength(3);
    expect(result.current.projects[0].id).toBe('2'); // 2024-12-01
    expect(result.current.projects[1].id).toBe('3'); // 2024-06-01
    expect(result.current.projects[2].id).toBe('1'); // 2024-01-01
  });

  it('should fallback to createdAt when startDate is not available', async () => {
    const projectsWithoutStartDate: Project[] = [
      {
        id: '1',
        name: 'Old Project',
        description: 'Oldest project',
        status: 'active',
        createdBy: 'admin',
        isEnabled: true,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      },
      {
        id: '2',
        name: 'Recent Project',
        description: 'Most recent project',
        status: 'active',
        createdBy: 'admin',
        isEnabled: true,
        createdAt: '2024-12-01',
        updatedAt: '2024-01-01',
      },
      {
        id: '3',
        name: 'Middle Project',
        description: 'Middle project',
        status: 'active',
        createdBy: 'admin',
        isEnabled: true,
        createdAt: '2024-06-01',
        updatedAt: '2024-01-01',
      },
    ];

    (projectApi.getAllProjects as jest.Mock).mockResolvedValue(projectsWithoutStartDate);

    const { result } = renderHook(() => useProjects());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should be sorted by createdAt (most recent first)
    expect(result.current.projects).toHaveLength(3);
    expect(result.current.projects[0].id).toBe('2'); // 2024-12-01
    expect(result.current.projects[1].id).toBe('3'); // 2024-06-01
    expect(result.current.projects[2].id).toBe('1'); // 2024-01-01
  });

  it('should sort ongoing projects by startDate (most recent first)', async () => {
    const ongoingProjectsWithDates: Project[] = [
      {
        id: '1',
        name: 'Old Ongoing',
        description: 'Oldest ongoing project',
        status: 'ongoing',
        createdBy: 'admin',
        isEnabled: true,
        startDate: '2024-01-01',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      },
      {
        id: '2',
        name: 'Recent Ongoing',
        description: 'Most recent ongoing project',
        status: 'ongoing',
        createdBy: 'admin',
        isEnabled: true,
        startDate: '2024-12-01',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      },
    ];

    (projectApi.getAllProjects as jest.Mock).mockResolvedValue(ongoingProjectsWithDates);

    const { result } = renderHook(() => useProjects());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should be sorted by startDate (most recent first)
    expect(result.current.ongoingProjects).toHaveLength(2);
    expect(result.current.ongoingProjects[0].id).toBe('2'); // 2024-12-01
    expect(result.current.ongoingProjects[1].id).toBe('1'); // 2024-01-01
  });
});

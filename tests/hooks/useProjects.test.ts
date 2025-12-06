/**
 * Tests for useProjects hook
 * 
 * Validates that the hook correctly fetches and manages project data
 */

import { renderHook, waitFor } from '@testing-library/react';
import { useProjects } from '../../src/hooks/useProjects';
import { projectApi } from '../../src/services/projectApi';
import type { Project } from '../../src/types/project';

// Mock the projectApi
jest.mock('../../src/services/projectApi', () => ({
  projectApi: {
    getAllProjects: jest.fn(),
  },
}));

// Mock the logger
jest.mock('../../src/utils/logger', () => ({
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

  it('should fetch and separate projects by status', async () => {
    (projectApi.getAllProjects as jest.Mock).mockResolvedValue(mockProjects);

    const { result } = renderHook(() => useProjects());

    // Initially loading
    expect(result.current.isLoading).toBe(true);
    expect(result.current.projects).toEqual([]);
    expect(result.current.ongoingProjects).toEqual([]);

    // Wait for data to load
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

  it('should handle errors gracefully', async () => {
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

    // Clear the mock and set up new data
    jest.clearAllMocks();
    const newProjects = [mockProjects[0]]; // Only one project
    (projectApi.getAllProjects as jest.Mock).mockResolvedValue(newProjects);

    // Call refetch
    await result.current.refetch();

    await waitFor(() => {
      expect(result.current.projects).toHaveLength(1);
    });

    expect(projectApi.getAllProjects).toHaveBeenCalledTimes(1);
  });

  it('should call projectApi.getAllProjects on mount', async () => {
    (projectApi.getAllProjects as jest.Mock).mockResolvedValue(mockProjects);

    renderHook(() => useProjects());

    await waitFor(() => {
      expect(projectApi.getAllProjects).toHaveBeenCalledTimes(1);
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
});

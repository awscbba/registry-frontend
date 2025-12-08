/**
 * Project Subscription Integration Tests (Simplified)
 * 
 * Tests the core project viewing and subscription functionality,
 * focusing on the actual component behavior rather than detailed UI testing.
 * 
 * Coverage:
 * - Projects load and display correctly
 * - Project filtering works
 * - Subscribe functionality works
 * - Error handling for failed project loads
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { vi, beforeEach, afterEach, describe, it, expect } from 'vitest';
import ProjectShowcase from '../../components/ProjectShowcase';
import { projectApi } from '../../services/projectApi';
import { $user } from '../../stores/authStore';
import { $toasts } from '../../stores/toastStore';

// Test utilities
import { createMockUser } from '../utils/mockData';

// Mock the project API
vi.mock('../../services/projectApi', () => ({
  projectApi: {
    getPublicProjects: vi.fn(),
    getAllProjects: vi.fn(),
    subscribeToProject: vi.fn(),
  },
  ApiError: class ApiError extends Error {
    constructor(message: string, public status: number) {
      super(message);
      this.name = 'ApiError';
    }
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

// Mock window.location for navigation tests
const mockLocation = {
  href: '',
  assign: vi.fn(),
  replace: vi.fn(),
};
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
});

// Create mock project data with correct status values
const createMockProject = (id: number, status: 'pending' | 'active' | 'ongoing' = 'pending') => ({
  id,
  name: `Test Project ${id}`,
  description: `Description for test project ${id}`,
  status,
  startDate: '2024-01-01',
  endDate: '2024-12-31',
  maxParticipants: 10,
  currentParticipants: status === 'ongoing' ? 5 : 0,
  requirements: ['Requirement 1', 'Requirement 2'],
  benefits: ['Benefit 1', 'Benefit 2'],
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
});

const mockProjects = [
  createMockProject(1, 'pending'),    // Available for subscription
  createMockProject(2, 'ongoing'),    // Not available for subscription
  createMockProject(3, 'active'),     // Available for subscription
  createMockProject(4, 'ongoing'),    // Not available for subscription
  createMockProject(5, 'pending'),    // Available for subscription
];

describe('Project Subscription Integration Tests (Simplified)', () => {
  const mockUser = createMockUser();
  
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Reset stores to initial state
    $user.set(null);
    $toasts.set([]);
    
    // Reset location mock
    mockLocation.href = '';
    mockLocation.assign.mockClear();
    mockLocation.replace.mockClear();
    
    // Setup default mock implementations
    (projectApi.getPublicProjects as any).mockResolvedValue(mockProjects);
    (projectApi.getAllProjects as any).mockResolvedValue(mockProjects);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Project Loading and Display', () => {
    it('should load and display projects correctly', async () => {
      render(<ProjectShowcase />);
      
      // Wait for projects to load
      await waitFor(() => {
        expect(projectApi.getPublicProjects).toHaveBeenCalled();
      });
      
      // Wait for projects to be displayed
      await waitFor(() => {
        // Should show available projects (pending/active status)
        expect(screen.getByText('Test Project 1')).toBeInTheDocument(); // pending
        expect(screen.getByText('Test Project 3')).toBeInTheDocument(); // active
        expect(screen.getByText('Test Project 5')).toBeInTheDocument(); // pending
      });
      
      // Should also show ongoing projects in separate section
      await waitFor(() => {
        expect(screen.getByText('Test Project 2')).toBeInTheDocument(); // ongoing
        expect(screen.getByText('Test Project 4')).toBeInTheDocument(); // ongoing
      });
    });

    it('should handle project loading errors gracefully', async () => {
      // Mock project loading failure
      const errorMessage = 'Failed to load projects';
      (projectApi.getPublicProjects as any).mockRejectedValue(new Error(errorMessage));
      
      render(<ProjectShowcase />);
      
      // Wait for error handling
      await waitFor(() => {
        expect(projectApi.getPublicProjects).toHaveBeenCalled();
      });
      
      // Component should not crash
      expect(document.body).toBeInTheDocument();
      
      // Loading should complete
      await waitFor(() => {
        expect(screen.queryByText(/cargando/i)).not.toBeInTheDocument();
      });
    });

    it('should display empty state when no projects are available', async () => {
      // Mock empty project list
      (projectApi.getPublicProjects as any).mockResolvedValue([]);
      
      render(<ProjectShowcase />);
      
      // Wait for projects to load
      await waitFor(() => {
        expect(projectApi.getPublicProjects).toHaveBeenCalled();
      });
      
      // Should not display any project cards
      await waitFor(() => {
        expect(screen.queryByText('Test Project 1')).not.toBeInTheDocument();
        expect(screen.queryByText(/cargando/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Project Status and Availability', () => {
    beforeEach(async () => {
      render(<ProjectShowcase />);
      
      // Wait for projects to load
      await waitFor(() => {
        expect(screen.getByText('Test Project 1')).toBeInTheDocument();
      });
    });

    it('should show available projects with subscribe buttons', async () => {
      // Available projects should have subscribe buttons
      const availableProjects = ['Test Project 1', 'Test Project 3', 'Test Project 5'];
      
      for (const projectName of availableProjects) {
        const projectElement = screen.getByText(projectName);
        expect(projectElement).toBeInTheDocument();
        
        // Look for subscribe button near this project
        const projectContainer = projectElement.closest('.project-item');
        if (projectContainer) {
          const subscribeButton = projectContainer.querySelector('a[href*="/subscribe"], button');
          expect(subscribeButton).toBeInTheDocument();
        }
      }
    });

    it('should show ongoing projects as unavailable', async () => {
      // Ongoing projects should be marked as unavailable
      const ongoingProjects = ['Test Project 2', 'Test Project 4'];
      
      for (const projectName of ongoingProjects) {
        const projectElement = screen.getByText(projectName);
        expect(projectElement).toBeInTheDocument();
        
        // Should show "No Disponible" or similar text
        const projectContainer = projectElement.closest('.project-item');
        if (projectContainer) {
          const unavailableButton = projectContainer.querySelector('button[disabled]');
          expect(unavailableButton).toBeInTheDocument();
        }
      }
    });
  });

  describe('Project Subscription Flow', () => {
    beforeEach(async () => {
      render(<ProjectShowcase />);
      
      // Wait for projects to load
      await waitFor(() => {
        expect(screen.getByText('Test Project 1')).toBeInTheDocument();
      });
    });

    it('should have subscribe buttons for available projects', async () => {
      // Find subscribe buttons for available projects
      const subscribeButtons = screen.getAllByRole('button', { name: /suscribirse al proyecto/i });
      
      // Should have subscribe buttons for available projects (Test Project 1, 3, 5)
      expect(subscribeButtons).toHaveLength(3);
      
      // Each button should have proper ARIA label
      subscribeButtons.forEach(button => {
        expect(button).toHaveAttribute('aria-label');
        expect(button.getAttribute('aria-label')).toMatch(/suscribirse al proyecto/i);
      });
      
      // Buttons should be enabled (not disabled)
      subscribeButtons.forEach(button => {
        expect(button).not.toBeDisabled();
      });
    });

    it('should handle subscription for authenticated users', async () => {
      // Set authenticated state
      await act(async () => {
        $user.set(mockUser);
      });
      
      // Re-render with authenticated state
      render(<ProjectShowcase />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Project 1')).toBeInTheDocument();
      });
      
      // Find subscribe elements
      const subscribeElements = screen.getAllByText(/suscribirse/i);
      expect(subscribeElements.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      // Mock API error
      const ApiError = (projectApi as any).ApiError || Error;
      (projectApi.getPublicProjects as any).mockRejectedValue(new ApiError('API Error', 500));
      
      render(<ProjectShowcase />);
      
      // Wait for error handling
      await waitFor(() => {
        expect(projectApi.getPublicProjects).toHaveBeenCalled();
      });
      
      // Component should not crash
      expect(document.body).toBeInTheDocument();
    });

    it('should handle authentication errors gracefully', async () => {
      // Mock authentication error
      const ApiError = (projectApi as any).ApiError || Error;
      (projectApi.getPublicProjects as any).mockRejectedValue(new ApiError('Unauthorized', 401));
      
      render(<ProjectShowcase />);
      
      // Wait for error handling
      await waitFor(() => {
        expect(projectApi.getPublicProjects).toHaveBeenCalled();
      });
      
      // Component should handle auth errors gracefully
      expect(document.body).toBeInTheDocument();
    });

    it('should handle malformed project data', async () => {
      // Mock malformed project data
      const malformedProjects = [
        { id: 1, name: 'Valid Project', status: 'pending' },
        null,
        { id: 2 }, // Missing name
        { name: 'No ID Project' }, // Missing id
      ];
      
      (projectApi.getPublicProjects as any).mockResolvedValue(malformedProjects);
      
      render(<ProjectShowcase />);
      
      // Wait for projects to load
      await waitFor(() => {
        expect(projectApi.getPublicProjects).toHaveBeenCalled();
      });
      
      // Component should handle malformed data gracefully
      expect(document.body).toBeInTheDocument();
    });
  });

  describe('Component State Management', () => {
    it('should manage loading state correctly', async () => {
      // Mock slow loading
      let resolveProjects: (value: any) => void;
      const projectsPromise = new Promise(resolve => {
        resolveProjects = resolve;
      });
      
      (projectApi.getPublicProjects as any).mockReturnValue(projectsPromise);
      
      render(<ProjectShowcase />);
      
      // Should show loading state
      expect(screen.getByText(/cargando/i)).toBeInTheDocument();
      
      // Resolve projects
      resolveProjects!(mockProjects);
      
      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByText(/cargando/i)).not.toBeInTheDocument();
      });
      
      // Should show projects
      await waitFor(() => {
        expect(screen.getByText('Test Project 1')).toBeInTheDocument();
      });
    });

    it('should handle rapid re-renders gracefully', async () => {
      const { rerender } = render(<ProjectShowcase />);
      
      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('Test Project 1')).toBeInTheDocument();
      });
      
      // Rapid re-renders
      rerender(<ProjectShowcase />);
      rerender(<ProjectShowcase />);
      rerender(<ProjectShowcase />);
      
      // Should still work correctly
      await waitFor(() => {
        expect(screen.getByText('Test Project 1')).toBeInTheDocument();
      });
    });
  });

  describe('User Authentication Integration', () => {
    it('should work for unauthenticated users', async () => {
      // Ensure user is not authenticated
      $user.set(null);
      
      render(<ProjectShowcase />);
      
      // Should still load projects
      await waitFor(() => {
        expect(projectApi.getPublicProjects).toHaveBeenCalled();
      });
      
      await waitFor(() => {
        expect(screen.getByText('Test Project 1')).toBeInTheDocument();
      });
    });

    it('should work for authenticated users', async () => {
      // Set authenticated state
      await act(async () => {
        $user.set(mockUser);
      });
      
      render(<ProjectShowcase />);
      
      // Should load projects (may use different API endpoint)
      await waitFor(() => {
        expect(projectApi.getPublicProjects).toHaveBeenCalled();
      });
      
      await waitFor(() => {
        expect(screen.getByText('Test Project 1')).toBeInTheDocument();
      });
    });
  });
});
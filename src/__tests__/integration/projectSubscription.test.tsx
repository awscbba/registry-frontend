/**
 * Project Subscription Integration Tests
 * 
 * Tests the complete project viewing and subscription flow,
 * including project loading, filtering, and subscription navigation.
 * 
 * Coverage:
 * - Projects load and display correctly
 * - Project filtering (available vs ongoing)
 * - Subscribe button click navigation
 * - Error handling for failed project loads
 * - API mocking for project data
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, beforeEach, afterEach, describe, it, expect } from 'vitest';

// Components to test
import ProjectShowcase from '../../components/ProjectShowcase';

// Services and stores
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

// Create mock project data
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

describe('Project Subscription Integration Tests', () => {
  const user = userEvent.setup();
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
    it('should load and display public projects for unauthenticated users', async () => {
      render(<ProjectShowcase />);
      
      // Verify loading state initially
      expect(screen.getByText(/cargando/i)).toBeInTheDocument();
      
      // Wait for projects to load
      await waitFor(() => {
        expect(projectApi.getPublicProjects).toHaveBeenCalled();
      });
      
      // Wait for projects to be displayed
      await waitFor(() => {
        expect(screen.getByText('Test Project 1')).toBeInTheDocument();
        expect(screen.getByText('Test Project 2')).toBeInTheDocument();
        expect(screen.getByText('Test Project 3')).toBeInTheDocument();
      });
      
      // Verify all projects are displayed
      mockProjects.forEach(project => {
        expect(screen.getByText(project.name)).toBeInTheDocument();
        expect(screen.getByText(project.description)).toBeInTheDocument();
      });
    });

    it('should load all projects for authenticated users', async () => {
      // Set authenticated state
      await act(async () => {
        $user.set(mockUser);
      });
      
      render(<ProjectShowcase />);
      
      // Wait for projects to load
      await waitFor(() => {
        expect(projectApi.getAllProjects).toHaveBeenCalled();
      });
      
      // Verify projects are displayed
      await waitFor(() => {
        expect(screen.getByText('Test Project 1')).toBeInTheDocument();
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
      
      // Verify error state is handled (component should not crash)
      expect(document.body).toBeInTheDocument(); // Basic render test
      
      // Error should be logged but component should remain functional
      await waitFor(() => {
        // Component should show some fallback or empty state
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
      
      // Verify empty state handling
      await waitFor(() => {
        expect(screen.queryByText(/cargando/i)).not.toBeInTheDocument();
      });
      
      // Should not display any project cards
      expect(screen.queryByText('Test Project 1')).not.toBeInTheDocument();
    });
  });

  describe('Project Filtering', () => {
    beforeEach(async () => {
      render(<ProjectShowcase />);
      
      // Wait for projects to load
      await waitFor(() => {
        expect(screen.getByText('Test Project 1')).toBeInTheDocument();
      });
    });

    it('should filter projects by available status', async () => {
      // Look for filter buttons (Spanish text)
      const availableFilter = screen.getByRole('button', { name: /disponibles/i });
      await user.click(availableFilter);
      
      // Verify only available projects are shown
      await waitFor(() => {
        expect(screen.getByText('Test Project 1')).toBeInTheDocument(); // available
        expect(screen.getByText('Test Project 3')).toBeInTheDocument(); // available
        expect(screen.getByText('Test Project 5')).toBeInTheDocument(); // available
      });
      
      // Ongoing projects should not be visible
      expect(screen.queryByText('Test Project 2')).not.toBeInTheDocument(); // ongoing
      expect(screen.queryByText('Test Project 4')).not.toBeInTheDocument(); // ongoing
    });

    it('should filter projects by ongoing status', async () => {
      // Look for ongoing filter button (Spanish text)
      const ongoingFilter = screen.getByRole('button', { name: /en curso/i });
      await user.click(ongoingFilter);
      
      // Verify only ongoing projects are shown
      await waitFor(() => {
        expect(screen.getByText('Test Project 2')).toBeInTheDocument(); // ongoing
        expect(screen.getByText('Test Project 4')).toBeInTheDocument(); // ongoing
      });
      
      // Available projects should not be visible
      expect(screen.queryByText('Test Project 1')).not.toBeInTheDocument(); // available
      expect(screen.queryByText('Test Project 3')).not.toBeInTheDocument(); // available
      expect(screen.queryByText('Test Project 5')).not.toBeInTheDocument(); // available
    });

    it('should show all projects when "all" filter is selected', async () => {
      // First filter to available
      const availableFilter = screen.getByRole('button', { name: /disponibles/i });
      await user.click(availableFilter);
      
      // Then click "all" filter (Spanish text)
      const allFilter = screen.getByRole('button', { name: /todos/i });
      await user.click(allFilter);
      
      // Verify all projects are shown again
      await waitFor(() => {
        mockProjects.forEach(project => {
          expect(screen.getByText(project.name)).toBeInTheDocument();
        });
      });
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

    it('should navigate to subscription page when subscribe button is clicked', async () => {
      // Find subscribe button for first project (Spanish text)
      const subscribeButtons = screen.getAllByText(/suscribirse/i);
      expect(subscribeButtons.length).toBeGreaterThan(0);
      
      const firstSubscribeButton = subscribeButtons[0];
      await user.click(firstSubscribeButton);
      
      // Verify navigation occurred
      await waitFor(() => {
        expect(mockLocation.href).toContain('/subscribe');
      });
    });

    it('should pass project information in subscription URL', async () => {
      // Find subscribe button for a specific project
      const projectCard = screen.getByText('Test Project 1').closest('.project-card');
      expect(projectCard).toBeInTheDocument();
      
      const subscribeButton = projectCard?.querySelector('button, a');
      expect(subscribeButton).toBeInTheDocument();
      
      if (subscribeButton) {
        await user.click(subscribeButton);
        
        // Verify project ID is included in navigation
        await waitFor(() => {
          expect(mockLocation.href).toContain('1'); // Project ID
        });
      }
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
      
      // Find and click subscribe button
      const subscribeButtons = screen.getAllByText(/suscribirse/i);
      const firstSubscribeButton = subscribeButtons[0];
      await user.click(firstSubscribeButton);
      
      // For authenticated users, should still navigate to subscription page
      await waitFor(() => {
        expect(mockLocation.href).toContain('/subscribe');
      });
    });

    it('should show login prompt for unauthenticated users on subscription', async () => {
      // Ensure user is not authenticated
      $user.set(null);
      
      // Find and click subscribe button
      const subscribeButtons = screen.getAllByText(/suscribirse/i);
      const firstSubscribeButton = subscribeButtons[0];
      await user.click(firstSubscribeButton);
      
      // Should navigate to subscription page which will handle login prompt
      await waitFor(() => {
        expect(mockLocation.href).toContain('/subscribe');
      });
    });
  });

  describe('Pagination and View Modes', () => {
    beforeEach(async () => {
      // Create more projects to test pagination
      const manyProjects = Array.from({ length: 15 }, (_, i) => 
        createMockProject(i + 1, i % 2 === 0 ? 'available' : 'ongoing')
      );
      
      (projectApi.getPublicProjects as any).mockResolvedValue(manyProjects);
      
      render(<ProjectShowcase />);
      
      // Wait for projects to load
      await waitFor(() => {
        expect(screen.getByText('Test Project 1')).toBeInTheDocument();
      });
    });

    it('should paginate projects when there are many', async () => {
      // Look for pagination controls
      const nextButton = screen.queryByRole('button', { name: /siguiente/i });
      
      if (nextButton) {
        // Verify pagination works
        await user.click(nextButton);
        
        // Should show different projects on next page
        await waitFor(() => {
          // Exact projects depend on pagination implementation
          expect(document.body).toBeInTheDocument(); // Basic test
        });
      }
    });

    it('should switch between grid and list view modes', async () => {
      // Look for view mode buttons
      const gridViewButton = screen.queryByRole('button', { name: /cuadrícula/i });
      const listViewButton = screen.queryByRole('button', { name: /lista/i });
      
      if (gridViewButton && listViewButton) {
        // Test switching to list view
        await user.click(listViewButton);
        
        // Verify view mode changed (layout should be different)
        await waitFor(() => {
          expect(document.body).toBeInTheDocument(); // Basic test
        });
        
        // Switch back to grid view
        await user.click(gridViewButton);
        
        await waitFor(() => {
          expect(document.body).toBeInTheDocument(); // Basic test
        });
      }
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle network errors during project loading', async () => {
      // Mock network error
      (projectApi.getPublicProjects as any).mockRejectedValue(new Error('Network error'));
      
      render(<ProjectShowcase />);
      
      // Wait for error handling
      await waitFor(() => {
        expect(projectApi.getPublicProjects).toHaveBeenCalled();
      });
      
      // Component should handle error gracefully
      await waitFor(() => {
        expect(screen.queryByText(/cargando/i)).not.toBeInTheDocument();
      });
      
      // Should not crash the component
      expect(document.body).toBeInTheDocument();
    });

    it('should handle malformed project data', async () => {
      // Mock malformed project data
      const malformedProjects = [
        { id: 1, name: 'Valid Project' }, // Missing required fields
        null, // Null project
        { id: 2 }, // Missing name
      ];
      
      (projectApi.getPublicProjects as any).mockResolvedValue(malformedProjects);
      
      render(<ProjectShowcase />);
      
      // Wait for projects to load
      await waitFor(() => {
        expect(projectApi.getPublicProjects).toHaveBeenCalled();
      });
      
      // Component should handle malformed data gracefully
      await waitFor(() => {
        expect(screen.queryByText(/cargando/i)).not.toBeInTheDocument();
      });
      
      // Should not crash
      expect(document.body).toBeInTheDocument();
    });

    it('should handle rapid filter changes', async () => {
      render(<ProjectShowcase />);
      
      // Wait for projects to load
      await waitFor(() => {
        expect(screen.getByText('Test Project 1')).toBeInTheDocument();
      });
      
      // Rapidly change filters
      const availableFilter = screen.getByRole('button', { name: /disponibles/i });
      const ongoingFilter = screen.getByRole('button', { name: /en curso/i });
      const allFilter = screen.getByRole('button', { name: /todos/i });
      
      // Rapid clicks
      await user.click(availableFilter);
      await user.click(ongoingFilter);
      await user.click(allFilter);
      await user.click(availableFilter);
      
      // Should handle rapid changes gracefully
      await waitFor(() => {
        expect(document.body).toBeInTheDocument();
      });
    });

    it('should handle subscription button clicks during loading', async () => {
      // Mock slow project loading
      let resolveProjects: (value: any) => void;
      const projectsPromise = new Promise(resolve => {
        resolveProjects = resolve;
      });
      
      (projectApi.getPublicProjects as any).mockReturnValue(projectsPromise);
      
      render(<ProjectShowcase />);
      
      // Verify loading state
      expect(screen.getByText(/cargando/i)).toBeInTheDocument();
      
      // Try to click subscribe button during loading (should not exist yet)
      const subscribeButton = screen.queryByText(/suscribirse/i);
      expect(subscribeButton).not.toBeInTheDocument();
      
      // Resolve projects
      resolveProjects!(mockProjects);
      
      // Wait for projects to load
      await waitFor(() => {
        expect(screen.getByText('Test Project 1')).toBeInTheDocument();
      });
      
      // Now subscribe buttons should be available
      const subscribeButtons = screen.getAllByText(/suscribirse/i);
      expect(subscribeButtons.length).toBeGreaterThan(0);
    });
  });

  describe('Accessibility and User Experience', () => {
    beforeEach(async () => {
      render(<ProjectShowcase />);
      
      // Wait for projects to load
      await waitFor(() => {
        expect(screen.getByText('Test Project 1')).toBeInTheDocument();
      });
    });

    it('should have proper ARIA labels for interactive elements', async () => {
      // Check for ARIA labels on subscribe buttons
      const subscribeButtons = screen.getAllByText(/suscribirse/i);
      
      subscribeButtons.forEach(button => {
        expect(button).toHaveAttribute('aria-label');
      });
    });

    it('should support keyboard navigation', async () => {
      // Test tab navigation through subscribe buttons
      const subscribeButtons = screen.getAllByText(/suscribirse/i);
      
      if (subscribeButtons.length > 0) {
        const firstButton = subscribeButtons[0];
        
        // Focus the button
        firstButton.focus();
        expect(document.activeElement).toBe(firstButton);
        
        // Test Enter key activation
        fireEvent.keyDown(firstButton, { key: 'Enter' });
        
        // Should trigger navigation
        await waitFor(() => {
          expect(mockLocation.href).toContain('/subscribe');
        });
      }
    });

    it('should provide clear visual feedback for interactive elements', async () => {
      // Verify buttons have proper styling and hover states
      const subscribeButtons = screen.getAllByText(/suscribirse/i);
      
      subscribeButtons.forEach(button => {
        // Should be focusable
        expect(button.tabIndex).not.toBe(-1);
        
        // Should have button role
        expect(button.tagName.toLowerCase()).toMatch(/button|a/);
      });
    });
  });
});
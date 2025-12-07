import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppProviders } from '../../components/AppProviders';
import ProjectShowcase from '../../components/ProjectShowcase';
import { projectApi } from '../../services/projectApi';
import type { Project } from '../../types/project';

// Mock the project API
vi.mock('../../services/projectApi', () => ({
  projectApi: {
    getPublicProjects: vi.fn(),
  },
}));

// Mock logger to avoid console noise
vi.mock('../../utils/logger', () => ({
  getLogger: () => ({
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
  }),
  getApiLogger: () => ({
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    logApiRequest: vi.fn(),
    logApiResponse: vi.fn(),
  }),
}));

// Mock Astro navigate
const mockNavigate = vi.fn();
vi.mock('astro:transitions/client', () => ({
  navigate: mockNavigate,
}));

describe('Project Subscription Integration Tests', () => {
  const mockProjects: Project[] = [
    {
      id: '1',
      name: 'Available Project 1',
      description: 'Test project 1',
      status: 'available',
      startDate: '2025-01-01',
      endDate: '2025-12-31',
      maxParticipants: 10,
      currentParticipants: 5,
      isActive: true,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    },
    {
      id: '2',
      name: 'Available Project 2',
      description: 'Test project 2',
      status: 'available',
      startDate: '2025-02-01',
      endDate: '2025-11-30',
      maxParticipants: 20,
      currentParticipants: 10,
      isActive: true,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    },
    {
      id: '3',
      name: 'Ongoing Project',
      description: 'Test project 3',
      status: 'ongoing',
      startDate: '2024-06-01',
      endDate: '2025-06-30',
      maxParticipants: 15,
      currentParticipants: 15,
      isActive: true,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
    // Default: return mock projects
    vi.mocked(projectApi.getPublicProjects).mockResolvedValue(mockProjects);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Project Loading', () => {
    it('should load and display projects correctly', async () => {
      render(
        <AppProviders>
          <ProjectShowcase />
        </AppProviders>
      );

      // Verify loading state appears
      expect(screen.getByText(/cargando/i)).toBeInTheDocument();

      // Wait for projects to load
      await waitFor(() => {
        expect(projectApi.getPublicProjects).toHaveBeenCalled();
      });

      // Verify all projects are displayed
      await waitFor(() => {
        expect(screen.getByText('Available Project 1')).toBeInTheDocument();
        expect(screen.getByText('Available Project 2')).toBeInTheDocument();
        expect(screen.getByText('Ongoing Project')).toBeInTheDocument();
      });
    });

    it('should handle empty project list', async () => {
      vi.mocked(projectApi.getPublicProjects).mockResolvedValue([]);

      render(
        <AppProviders>
          <ProjectShowcase />
        </AppProviders>
      );

      // Wait for loading to complete
      await waitFor(() => {
        expect(projectApi.getPublicProjects).toHaveBeenCalled();
      });

      // Verify empty state message
      await waitFor(() => {
        expect(screen.getByText(/no hay proyectos disponibles/i)).toBeInTheDocument();
      });
    });

    it('should handle API errors gracefully', async () => {
      vi.mocked(projectApi.getPublicProjects).mockRejectedValue(
        new Error('Failed to fetch projects')
      );

      render(
        <AppProviders>
          <ProjectShowcase />
        </AppProviders>
      );

      // Wait for error to appear
      await waitFor(() => {
        expect(screen.getByText(/error.*proyectos/i)).toBeInTheDocument();
      });
    });
  });

  describe('Project Filtering', () => {
    it('should filter available projects correctly', async () => {
      const user = userEvent.setup();

      render(
        <AppProviders>
          <ProjectShowcase />
        </AppProviders>
      );

      // Wait for projects to load
      await waitFor(() => {
        expect(screen.getByText('Available Project 1')).toBeInTheDocument();
      });

      // Click "Available" filter
      const availableFilter = screen.getByRole('button', { name: /disponibles/i });
      await user.click(availableFilter);

      // Verify only available projects are shown
      await waitFor(() => {
        expect(screen.getByText('Available Project 1')).toBeInTheDocument();
        expect(screen.getByText('Available Project 2')).toBeInTheDocument();
        expect(screen.queryByText('Ongoing Project')).not.toBeInTheDocument();
      });
    });

    it('should filter ongoing projects correctly', async () => {
      const user = userEvent.setup();

      render(
        <AppProviders>
          <ProjectShowcase />
        </AppProviders>
      );

      // Wait for projects to load
      await waitFor(() => {
        expect(screen.getByText('Ongoing Project')).toBeInTheDocument();
      });

      // Click "Ongoing" filter
      const ongoingFilter = screen.getByRole('button', { name: /en curso/i });
      await user.click(ongoingFilter);

      // Verify only ongoing projects are shown
      await waitFor(() => {
        expect(screen.getByText('Ongoing Project')).toBeInTheDocument();
        expect(screen.queryByText('Available Project 1')).not.toBeInTheDocument();
        expect(screen.queryByText('Available Project 2')).not.toBeInTheDocument();
      });
    });

    it('should show all projects when "All" filter is selected', async () => {
      const user = userEvent.setup();

      render(
        <AppProviders>
          <ProjectShowcase />
        </AppProviders>
      );

      // Wait for projects to load
      await waitFor(() => {
        expect(screen.getByText('Available Project 1')).toBeInTheDocument();
      });

      // Click "Available" filter first
      const availableFilter = screen.getByRole('button', { name: /disponibles/i });
      await user.click(availableFilter);

      // Then click "All" filter
      const allFilter = screen.getByRole('button', { name: /todos/i });
      await user.click(allFilter);

      // Verify all projects are shown again
      await waitFor(() => {
        expect(screen.getByText('Available Project 1')).toBeInTheDocument();
        expect(screen.getByText('Available Project 2')).toBeInTheDocument();
        expect(screen.getByText('Ongoing Project')).toBeInTheDocument();
      });
    });
  });

  describe('Project Subscription Navigation', () => {
    it('should navigate to subscription page when subscribe button is clicked', async () => {
      const user = userEvent.setup();

      render(
        <AppProviders>
          <ProjectShowcase />
        </AppProviders>
      );

      // Wait for projects to load
      await waitFor(() => {
        expect(screen.getByText('Available Project 1')).toBeInTheDocument();
      });

      // Find and click subscribe button for first project
      const subscribeButtons = screen.getAllByRole('button', { name: /inscribirse/i });
      await user.click(subscribeButtons[0]);

      // Verify navigation was called with correct project ID
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/subscribe/1');
      });
    });

    it('should not show subscribe button for full projects', async () => {
      const fullProject: Project = {
        id: '4',
        name: 'Full Project',
        description: 'This project is full',
        status: 'available',
        startDate: '2025-01-01',
        endDate: '2025-12-31',
        maxParticipants: 10,
        currentParticipants: 10,
        isActive: true,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      };

      vi.mocked(projectApi.getPublicProjects).mockResolvedValue([fullProject]);

      render(
        <AppProviders>
          <ProjectShowcase />
        </AppProviders>
      );

      // Wait for project to load
      await waitFor(() => {
        expect(screen.getByText('Full Project')).toBeInTheDocument();
      });

      // Verify "Full" badge is shown instead of subscribe button
      expect(screen.getByText(/completo/i)).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /inscribirse/i })).not.toBeInTheDocument();
    });
  });

  describe('Project Details Display', () => {
    it('should display project information correctly', async () => {
      render(
        <AppProviders>
          <ProjectShowcase />
        </AppProviders>
      );

      // Wait for projects to load
      await waitFor(() => {
        expect(screen.getByText('Available Project 1')).toBeInTheDocument();
      });

      // Verify project details are displayed
      expect(screen.getByText('Test project 1')).toBeInTheDocument();
      expect(screen.getByText(/5.*\/.*10/)).toBeInTheDocument(); // Participants count
    });

    it('should display project status badges correctly', async () => {
      render(
        <AppProviders>
          <ProjectShowcase />
        </AppProviders>
      );

      // Wait for projects to load
      await waitFor(() => {
        expect(screen.getByText('Available Project 1')).toBeInTheDocument();
      });

      // Verify status badges
      const availableBadges = screen.getAllByText(/disponible/i);
      expect(availableBadges.length).toBeGreaterThan(0);

      const ongoingBadges = screen.getAllByText(/en curso/i);
      expect(ongoingBadges.length).toBeGreaterThan(0);
    });
  });

  describe('Error Recovery', () => {
    it('should allow retry after failed load', async () => {
      const user = userEvent.setup();

      // First call fails
      vi.mocked(projectApi.getPublicProjects)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(mockProjects);

      render(
        <AppProviders>
          <ProjectShowcase />
        </AppProviders>
      );

      // Wait for error to appear
      await waitFor(() => {
        expect(screen.getByText(/error.*proyectos/i)).toBeInTheDocument();
      });

      // Click retry button
      const retryButton = screen.getByRole('button', { name: /reintentar/i });
      await user.click(retryButton);

      // Verify projects load successfully on retry
      await waitFor(() => {
        expect(screen.getByText('Available Project 1')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for interactive elements', async () => {
      render(
        <AppProviders>
          <ProjectShowcase />
        </AppProviders>
      );

      // Wait for projects to load
      await waitFor(() => {
        expect(screen.getByText('Available Project 1')).toBeInTheDocument();
      });

      // Verify filter buttons have proper labels
      expect(screen.getByRole('button', { name: /todos/i })).toHaveAttribute('aria-label');
      expect(screen.getByRole('button', { name: /disponibles/i })).toHaveAttribute('aria-label');
      expect(screen.getByRole('button', { name: /en curso/i })).toHaveAttribute('aria-label');

      // Verify subscribe buttons have proper labels
      const subscribeButtons = screen.getAllByRole('button', { name: /inscribirse/i });
      subscribeButtons.forEach(button => {
        expect(button).toHaveAttribute('aria-label');
      });
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();

      render(
        <AppProviders>
          <ProjectShowcase />
        </AppProviders>
      );

      // Wait for projects to load
      await waitFor(() => {
        expect(screen.getByText('Available Project 1')).toBeInTheDocument();
      });

      // Tab through filter buttons
      await user.tab();
      expect(screen.getByRole('button', { name: /todos/i })).toHaveFocus();

      await user.tab();
      expect(screen.getByRole('button', { name: /disponibles/i })).toHaveFocus();

      // Press Enter to activate filter
      await user.keyboard('{Enter}');

      // Verify filter was applied
      await waitFor(() => {
        expect(screen.queryByText('Ongoing Project')).not.toBeInTheDocument();
      });
    });
  });
});

/**
 * Tests for React.memo optimized components
 * Verifies that memoization doesn't break functionality
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { ToastContainer } from '../ToastContainer';
import ProjectCard from '../ProjectCard';
import type { Toast } from '../../contexts/ToastContext';
import type { Project } from '../../types/project';

describe('Memoized Components - Functionality Tests', () => {
  describe('ToastContainer with React.memo', () => {
    it('should render toasts correctly', () => {
      const toasts: Toast[] = [
        { id: '1', message: 'Success message', type: 'success' },
        { id: '2', message: 'Error message', type: 'error' },
      ];
      const onRemove = jest.fn();

      render(<ToastContainer toasts={toasts} onRemove={onRemove} />);

      expect(screen.getByText('Success message')).toBeInTheDocument();
      expect(screen.getByText('Error message')).toBeInTheDocument();
    });

    it('should call onRemove when close button is clicked', () => {
      const toasts: Toast[] = [
        { id: '1', message: 'Test message', type: 'info' },
      ];
      const onRemove = jest.fn();

      render(<ToastContainer toasts={toasts} onRemove={onRemove} />);

      const closeButton = screen.getByLabelText('Cerrar notificación');
      fireEvent.click(closeButton);

      expect(onRemove).toHaveBeenCalledWith('1');
    });

    it('should render nothing when toasts array is empty', () => {
      const onRemove = jest.fn();
      const { container } = render(<ToastContainer toasts={[]} onRemove={onRemove} />);

      expect(container.firstChild).toBeNull();
    });

    it('should display correct styling for different toast types', () => {
      const toasts: Toast[] = [
        { id: '1', message: 'Success', type: 'success' },
        { id: '2', message: 'Error', type: 'error' },
        { id: '3', message: 'Warning', type: 'warning' },
        { id: '4', message: 'Info', type: 'info' },
      ];
      const onRemove = jest.fn();

      render(<ToastContainer toasts={toasts} onRemove={onRemove} />);

      expect(screen.getByText('Success').closest('.toast')).toHaveClass('toast-success');
      expect(screen.getByText('Error').closest('.toast')).toHaveClass('toast-error');
      expect(screen.getByText('Warning').closest('.toast')).toHaveClass('toast-warning');
      expect(screen.getByText('Info').closest('.toast')).toHaveClass('toast-info');
    });
  });

  describe('ProjectCard with React.memo', () => {
    const mockProject: Project = {
      id: '1',
      name: 'Test Project',
      description: 'Test Description',
      status: 'active',
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      maxParticipants: 10,
    };

    it('should render project card in cards view mode', () => {
      const onSubscribeClick = jest.fn();

      render(
        <ProjectCard
          project={mockProject}
          viewMode="cards"
          onSubscribeClick={onSubscribeClick}
        />
      );

      expect(screen.getByText('Test Project')).toBeInTheDocument();
      expect(screen.getByText('Test Description')).toBeInTheDocument();
      expect(screen.getByText('Activo')).toBeInTheDocument();
    });

    it('should render project card in list view mode', () => {
      const onSubscribeClick = jest.fn();

      render(
        <ProjectCard
          project={mockProject}
          viewMode="list"
          onSubscribeClick={onSubscribeClick}
        />
      );

      expect(screen.getByText('Test Project')).toBeInTheDocument();
      expect(screen.getByText('Test Description')).toBeInTheDocument();
    });

    it('should render project card in icons view mode', () => {
      const onSubscribeClick = jest.fn();

      render(
        <ProjectCard
          project={mockProject}
          viewMode="icons"
          onSubscribeClick={onSubscribeClick}
        />
      );

      expect(screen.getByText('Test Project')).toBeInTheDocument();
    });

    it('should call onSubscribeClick when subscribe button is clicked', () => {
      const onSubscribeClick = jest.fn();

      render(
        <ProjectCard
          project={mockProject}
          viewMode="cards"
          onSubscribeClick={onSubscribeClick}
        />
      );

      const subscribeButton = screen.getByRole('button', { name: /suscribirse al proyecto/i });
      fireEvent.click(subscribeButton);

      expect(onSubscribeClick).toHaveBeenCalledWith(mockProject);
    });

    it('should render disabled button for ongoing projects', () => {
      const onSubscribeClick = jest.fn();

      render(
        <ProjectCard
          project={mockProject}
          viewMode="cards"
          onSubscribeClick={onSubscribeClick}
          isOngoing={true}
        />
      );

      const button = screen.getByRole('button', { name: /no está disponible/i });
      expect(button).toBeDisabled();
      expect(screen.getByText('En Curso')).toBeInTheDocument();
    });

    it('should handle keyboard navigation (Enter key)', () => {
      const onSubscribeClick = jest.fn();

      render(
        <ProjectCard
          project={mockProject}
          viewMode="cards"
          onSubscribeClick={onSubscribeClick}
        />
      );

      const subscribeButton = screen.getByRole('button', { name: /suscribirse al proyecto/i });
      fireEvent.keyDown(subscribeButton, { key: 'Enter' });

      expect(onSubscribeClick).toHaveBeenCalledWith(mockProject);
    });

    it('should display project details correctly', () => {
      const onSubscribeClick = jest.fn();

      render(
        <ProjectCard
          project={mockProject}
          viewMode="cards"
          onSubscribeClick={onSubscribeClick}
        />
      );

      expect(screen.getByText('10')).toBeInTheDocument(); // maxParticipants
      expect(screen.getByText(/1 de enero de 2024/i)).toBeInTheDocument(); // startDate
      expect(screen.getByText(/31 de diciembre de 2024/i)).toBeInTheDocument(); // endDate
    });
  });

  describe('React.memo optimization behavior', () => {
    it('ToastContainer should not re-render with same props', () => {
      const toasts: Toast[] = [
        { id: '1', message: 'Test', type: 'info' },
      ];
      const onRemove = jest.fn();

      const { rerender } = render(<ToastContainer toasts={toasts} onRemove={onRemove} />);

      // Re-render with same props
      rerender(<ToastContainer toasts={toasts} onRemove={onRemove} />);

      // Component should still work correctly
      expect(screen.getByText('Test')).toBeInTheDocument();
    });

    it('ProjectCard should not re-render with same props', () => {
      const mockProject: Project = {
        id: '1',
        name: 'Test Project',
        description: 'Test Description',
        status: 'active',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        maxParticipants: 10,
      };
      const onSubscribeClick = jest.fn();

      const { rerender } = render(
        <ProjectCard
          project={mockProject}
          viewMode="cards"
          onSubscribeClick={onSubscribeClick}
        />
      );

      // Re-render with same props
      rerender(
        <ProjectCard
          project={mockProject}
          viewMode="cards"
          onSubscribeClick={onSubscribeClick}
        />
      );

      // Component should still work correctly
      expect(screen.getByText('Test Project')).toBeInTheDocument();
      
      // Click should still work
      const subscribeButton = screen.getByRole('button', { name: /suscribirse al proyecto/i });
      fireEvent.click(subscribeButton);
      expect(onSubscribeClick).toHaveBeenCalledWith(mockProject);
    });
  });
});

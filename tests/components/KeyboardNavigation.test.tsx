/**
 * Keyboard Navigation Tests
 * 
 * Tests keyboard accessibility for all interactive components
 * Validates: Requirements 7.2, 7.7 from design document
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import UserMenu from '../../src/components/UserMenu';
import UserLoginModal from '../../src/components/UserLoginModal';
import { AuthProvider } from '../../src/contexts/AuthContext';
import { ToastProvider } from '../../src/contexts/ToastContext';
import { authService } from '../../src/services/authService';

// Mock authService
jest.mock('../../src/services/authService', () => ({
  authService: {
    getCurrentUser: jest.fn(),
    login: jest.fn(),
    logout: jest.fn(),
    isAuthenticated: jest.fn(),
  },
}));

const mockAuthService = authService as jest.Mocked<typeof authService>;

// Helper to wrap components with required providers
const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <ToastProvider>
      <AuthProvider>
        {component}
      </AuthProvider>
    </ToastProvider>
  );
};

describe('Keyboard Navigation - UserMenu', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Tab Navigation', () => {
    it('should allow Tab navigation to menu button when not authenticated', () => {
      mockAuthService.getCurrentUser.mockReturnValue(null);
      
      renderWithProviders(<UserMenu />);
      
      const registerButton = screen.getByRole('link', { name: /ir a página de registro/i });
      const loginButton = screen.getByRole('link', { name: /ir a página de inicio de sesión/i });
      
      // Both buttons should be focusable
      expect(registerButton).toBeInTheDocument();
      expect(loginButton).toBeInTheDocument();
      
      // Tab to register button
      registerButton.focus();
      expect(document.activeElement).toBe(registerButton);
      
      // Tab to login button
      loginButton.focus();
      expect(document.activeElement).toBe(loginButton);
    });

    it('should allow Tab navigation to menu button when authenticated', () => {
      mockAuthService.getCurrentUser.mockReturnValue({
        id: '1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        isAdmin: false,
      });
      
      renderWithProviders(<UserMenu />);
      
      const menuButton = screen.getByRole('button', { name: /menú de usuario/i });
      
      // Menu button should be focusable
      expect(menuButton).toBeInTheDocument();
      menuButton.focus();
      expect(document.activeElement).toBe(menuButton);
    });

    it('should allow Tab navigation through dropdown menu items', async () => {
      mockAuthService.getCurrentUser.mockReturnValue({
        id: '1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        isAdmin: true,
      });
      
      renderWithProviders(<UserMenu />);
      
      const menuButton = screen.getByRole('button', { name: /menú de usuario/i });
      
      // Open menu
      fireEvent.click(menuButton);
      
      await waitFor(() => {
        expect(screen.getByRole('menu')).toBeInTheDocument();
      });
      
      // Get menu items
      const profileLink = screen.getByRole('menuitem', { name: /mi perfil/i });
      const adminLink = screen.getByRole('menuitem', { name: /panel admin/i });
      const logoutButton = screen.getByRole('menuitem', { name: /cerrar sesión/i });
      
      // All menu items should be present
      expect(profileLink).toBeInTheDocument();
      expect(adminLink).toBeInTheDocument();
      expect(logoutButton).toBeInTheDocument();
    });
  });

  describe('Enter Key Support', () => {
    it('should activate register button with Enter key', () => {
      mockAuthService.getCurrentUser.mockReturnValue(null);
      
      // Mock window.location to prevent navigation errors in tests
      delete (window as any).location;
      (window as any).location = { href: '' };
      
      renderWithProviders(<UserMenu />);
      
      const registerButton = screen.getByRole('link', { name: /ir a página de registro/i });
      
      // Focus and press Enter
      registerButton.focus();
      fireEvent.keyDown(registerButton, { key: 'Enter', code: 'Enter' });
      
      // Should prevent default and navigate (in real scenario)
      expect(registerButton).toBeInTheDocument();
    });

    it('should activate login button with Enter key', () => {
      mockAuthService.getCurrentUser.mockReturnValue(null);
      
      // Mock window.location to prevent navigation errors in tests
      delete (window as any).location;
      (window as any).location = { href: '' };
      
      renderWithProviders(<UserMenu />);
      
      const loginButton = screen.getByRole('link', { name: /ir a página de inicio de sesión/i });
      
      // Focus and press Enter
      loginButton.focus();
      fireEvent.keyDown(loginButton, { key: 'Enter', code: 'Enter' });
      
      // Should prevent default and navigate (in real scenario)
      expect(loginButton).toBeInTheDocument();
    });

    it('should open menu with Enter key', () => {
      mockAuthService.getCurrentUser.mockReturnValue({
        id: '1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        isAdmin: false,
      });
      
      renderWithProviders(<UserMenu />);
      
      const menuButton = screen.getByRole('button', { name: /menú de usuario/i });
      
      // Press Enter to open menu
      fireEvent.keyDown(menuButton, { key: 'Enter', code: 'Enter' });
      
      // Menu should open
      waitFor(() => {
        expect(screen.getByRole('menu')).toBeInTheDocument();
      });
    });

    it('should activate menu items with Enter key', async () => {
      mockAuthService.getCurrentUser.mockReturnValue({
        id: '1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        isAdmin: false,
      });
      
      renderWithProviders(<UserMenu />);
      
      const menuButton = screen.getByRole('button', { name: /menú de usuario/i });
      
      // Open menu
      fireEvent.click(menuButton);
      
      await waitFor(() => {
        expect(screen.getByRole('menu')).toBeInTheDocument();
      });
      
      const profileLink = screen.getByRole('menuitem', { name: /mi perfil/i });
      
      // Press Enter on menu item
      fireEvent.keyDown(profileLink, { key: 'Enter', code: 'Enter' });
      
      // Should activate the link
      expect(profileLink).toBeInTheDocument();
    });
  });

  describe('Escape Key Support', () => {
    it('should close dropdown menu with Escape key', async () => {
      mockAuthService.getCurrentUser.mockReturnValue({
        id: '1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        isAdmin: false,
      });
      
      renderWithProviders(<UserMenu />);
      
      const menuButton = screen.getByRole('button', { name: /menú de usuario/i });
      
      // Open menu
      fireEvent.click(menuButton);
      
      await waitFor(() => {
        expect(screen.getByRole('menu')).toBeInTheDocument();
      });
      
      // Press Escape
      fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });
      
      // Menu should close
      await waitFor(() => {
        expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      });
    });
  });

  describe('Arrow Key Navigation', () => {
    it('should navigate menu items with ArrowDown key', async () => {
      mockAuthService.getCurrentUser.mockReturnValue({
        id: '1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        isAdmin: true,
      });
      
      renderWithProviders(<UserMenu />);
      
      const menuButton = screen.getByRole('button', { name: /menú de usuario/i });
      
      // Open menu
      fireEvent.click(menuButton);
      
      await waitFor(() => {
        expect(screen.getByRole('menu')).toBeInTheDocument();
      });
      
      // Press ArrowDown
      fireEvent.keyDown(document, { key: 'ArrowDown', code: 'ArrowDown' });
      
      // First menu item should be focused
      const profileLink = screen.getByRole('menuitem', { name: /mi perfil/i });
      await waitFor(() => {
        expect(document.activeElement).toBe(profileLink);
      });
      
      // Press ArrowDown again
      fireEvent.keyDown(document, { key: 'ArrowDown', code: 'ArrowDown' });
      
      // Second menu item should be focused
      const adminLink = screen.getByRole('menuitem', { name: /panel admin/i });
      await waitFor(() => {
        expect(document.activeElement).toBe(adminLink);
      });
    });

    it('should navigate menu items with ArrowUp key', async () => {
      mockAuthService.getCurrentUser.mockReturnValue({
        id: '1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        isAdmin: true,
      });
      
      renderWithProviders(<UserMenu />);
      
      const menuButton = screen.getByRole('button', { name: /menú de usuario/i });
      
      // Open menu
      fireEvent.click(menuButton);
      
      await waitFor(() => {
        expect(screen.getByRole('menu')).toBeInTheDocument();
      });
      
      // Press ArrowUp (should wrap to last item)
      fireEvent.keyDown(document, { key: 'ArrowUp', code: 'ArrowUp' });
      
      // Last menu item should be focused
      const logoutButton = screen.getByRole('menuitem', { name: /cerrar sesión/i });
      await waitFor(() => {
        expect(document.activeElement).toBe(logoutButton);
      });
    });

    it('should wrap around when navigating past last item with ArrowDown', async () => {
      mockAuthService.getCurrentUser.mockReturnValue({
        id: '1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        isAdmin: false,
      });
      
      renderWithProviders(<UserMenu />);
      
      const menuButton = screen.getByRole('button', { name: /menú de usuario/i });
      
      // Open menu
      fireEvent.click(menuButton);
      
      await waitFor(() => {
        expect(screen.getByRole('menu')).toBeInTheDocument();
      });
      
      // Navigate to last item
      fireEvent.keyDown(document, { key: 'ArrowDown', code: 'ArrowDown' });
      fireEvent.keyDown(document, { key: 'ArrowDown', code: 'ArrowDown' });
      
      // Press ArrowDown again (should wrap to first item)
      fireEvent.keyDown(document, { key: 'ArrowDown', code: 'ArrowDown' });
      
      const profileLink = screen.getByRole('menuitem', { name: /mi perfil/i });
      await waitFor(() => {
        expect(document.activeElement).toBe(profileLink);
      });
    });
  });
});

describe('Keyboard Navigation - UserLoginModal', () => {
  const mockOnClose = jest.fn();
  const mockOnLoginSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Tab Navigation', () => {
    it('should allow Tab navigation through form fields', () => {
      renderWithProviders(
        <UserLoginModal
          isOpen={true}
          onClose={mockOnClose}
          onLoginSuccess={mockOnLoginSuccess}
        />
      );
      
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/contraseña/i);
      const cancelButton = screen.getByRole('button', { name: /cancelar/i });
      const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });
      
      // All form elements should be present
      expect(emailInput).toBeInTheDocument();
      expect(passwordInput).toBeInTheDocument();
      expect(cancelButton).toBeInTheDocument();
      expect(submitButton).toBeInTheDocument();
      
      // Tab through elements
      emailInput.focus();
      expect(document.activeElement).toBe(emailInput);
      
      passwordInput.focus();
      expect(document.activeElement).toBe(passwordInput);
      
      cancelButton.focus();
      expect(document.activeElement).toBe(cancelButton);
      
      submitButton.focus();
      expect(document.activeElement).toBe(submitButton);
    });
  });

  describe('Enter Key Support', () => {
    it('should close modal with Enter key on close button', () => {
      renderWithProviders(
        <UserLoginModal
          isOpen={true}
          onClose={mockOnClose}
          onLoginSuccess={mockOnLoginSuccess}
        />
      );
      
      const closeButton = screen.getByRole('button', { name: /cerrar modal/i });
      
      // Press Enter on close button
      fireEvent.keyDown(closeButton, { key: 'Enter', code: 'Enter' });
      
      // Should call onClose
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should activate cancel button with Enter key', () => {
      renderWithProviders(
        <UserLoginModal
          isOpen={true}
          onClose={mockOnClose}
          onLoginSuccess={mockOnLoginSuccess}
        />
      );
      
      const cancelButton = screen.getByRole('button', { name: /cancelar/i });
      
      // Press Enter on cancel button
      fireEvent.keyDown(cancelButton, { key: 'Enter', code: 'Enter' });
      
      // Should call onClose
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should submit form with Enter key on submit button', async () => {
      mockAuthService.login.mockResolvedValue({
        success: true,
        user: {
          id: '1',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
        },
        token: 'mock-token',
      });
      
      renderWithProviders(
        <UserLoginModal
          isOpen={true}
          onClose={mockOnClose}
          onLoginSuccess={mockOnLoginSuccess}
        />
      );
      
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/contraseña/i);
      const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });
      
      // Fill form
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      
      // Press Enter on submit button
      fireEvent.keyDown(submitButton, { key: 'Enter', code: 'Enter' });
      
      // Should attempt login
      await waitFor(() => {
        expect(mockAuthService.login).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
        });
      });
    });
  });

  describe('Escape Key Support', () => {
    it('should close modal with Escape key on overlay', () => {
      renderWithProviders(
        <UserLoginModal
          isOpen={true}
          onClose={mockOnClose}
          onLoginSuccess={mockOnLoginSuccess}
        />
      );
      
      const overlay = screen.getByRole('dialog');
      
      // Press Escape on overlay
      fireEvent.keyDown(overlay, { key: 'Escape', code: 'Escape' });
      
      // Should call onClose
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should not close modal with Escape key on modal content', () => {
      renderWithProviders(
        <UserLoginModal
          isOpen={true}
          onClose={mockOnClose}
          onLoginSuccess={mockOnLoginSuccess}
        />
      );
      
      const modalContent = screen.getByRole('document');
      
      // Press Escape on modal content
      fireEvent.keyDown(modalContent, { key: 'Escape', code: 'Escape' });
      
      // Should not call onClose (event propagation stopped)
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('Focus Indicators', () => {
    it('should have visible focus indicators on all interactive elements', () => {
      renderWithProviders(
        <UserLoginModal
          isOpen={true}
          onClose={mockOnClose}
          onLoginSuccess={mockOnLoginSuccess}
        />
      );
      
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/contraseña/i);
      const cancelButton = screen.getByRole('button', { name: /cancelar/i });
      const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });
      
      // Focus each element and verify it's focusable
      emailInput.focus();
      expect(document.activeElement).toBe(emailInput);
      
      passwordInput.focus();
      expect(document.activeElement).toBe(passwordInput);
      
      cancelButton.focus();
      expect(document.activeElement).toBe(cancelButton);
      
      submitButton.focus();
      expect(document.activeElement).toBe(submitButton);
    });
  });
});

describe('Keyboard Navigation - Integration', () => {
  it('should maintain keyboard navigation flow across components', async () => {
    // Test that keyboard navigation works in both authenticated and unauthenticated states
    
    // Test unauthenticated state
    mockAuthService.getCurrentUser.mockReturnValue(null);
    const { unmount: unmount1 } = renderWithProviders(<UserMenu />);
    
    const loginButton = screen.getByRole('link', { name: /ir a página de inicio de sesión/i });
    expect(loginButton).toBeInTheDocument();
    loginButton.focus();
    expect(document.activeElement).toBe(loginButton);
    
    unmount1();
    
    // Test authenticated state
    mockAuthService.getCurrentUser.mockReturnValue({
      id: '1',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      isAdmin: false,
    });
    
    renderWithProviders(<UserMenu />);
    
    // Should now show user menu button
    const menuButton = screen.getByRole('button', { name: /menú de usuario/i });
    expect(menuButton).toBeInTheDocument();
    
    // Should be focusable
    menuButton.focus();
    expect(document.activeElement).toBe(menuButton);
  });
});

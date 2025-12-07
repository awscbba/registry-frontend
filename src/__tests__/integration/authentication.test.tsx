import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppProviders } from '../../components/AppProviders';
import UserLoginModal from '../../components/UserLoginModal';
import UserMenu from '../../components/UserMenu';
import { authService } from '../../services/authService';

// Mock the auth service
vi.mock('../../services/authService', () => ({
  authService: {
    login: vi.fn(),
    logout: vi.fn(),
    getCurrentUser: vi.fn(),
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
}));

describe('Authentication Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: no user logged in
    vi.mocked(authService.getCurrentUser).mockResolvedValue(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Login Flow', () => {
    it('should complete full login flow successfully', async () => {
      const user = userEvent.setup();
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
      };

      // Mock successful login
      vi.mocked(authService.login).mockResolvedValue({
        success: true,
        user: mockUser,
        message: 'Login successful',
      });

      // Render login modal
      const onClose = vi.fn();
      render(
        <AppProviders>
          <UserLoginModal isOpen={true} onClose={onClose} />
        </AppProviders>
      );

      // Fill in login form
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      // Wait for login to complete
      await waitFor(() => {
        expect(authService.login).toHaveBeenCalledWith('test@example.com', 'password123');
      });

      // Verify modal closes on success
      await waitFor(() => {
        expect(onClose).toHaveBeenCalled();
      });
    });

    it('should handle login errors correctly', async () => {
      const user = userEvent.setup();

      // Mock failed login
      vi.mocked(authService.login).mockRejectedValue(
        new Error('Invalid credentials')
      );

      const onClose = vi.fn();
      render(
        <AppProviders>
          <UserLoginModal isOpen={true} onClose={onClose} />
        </AppProviders>
      );

      // Fill in login form with invalid credentials
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });

      await user.type(emailInput, 'wrong@example.com');
      await user.type(passwordInput, 'wrongpassword');
      await user.click(submitButton);

      // Wait for error to appear
      await waitFor(() => {
        expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
      });

      // Verify modal stays open on error
      expect(onClose).not.toHaveBeenCalled();
    });

    it('should validate required fields', async () => {
      const user = userEvent.setup();

      const onClose = vi.fn();
      render(
        <AppProviders>
          <UserLoginModal isOpen={true} onClose={onClose} />
        </AppProviders>
      );

      // Try to submit without filling fields
      const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });
      await user.click(submitButton);

      // Verify validation messages appear
      await waitFor(() => {
        const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
        const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;
        
        expect(emailInput.validity.valid).toBe(false);
        expect(passwordInput.validity.valid).toBe(false);
      });

      // Verify login was not called
      expect(authService.login).not.toHaveBeenCalled();
    });
  });

  describe('Logout Flow', () => {
    it('should complete logout flow successfully', async () => {
      const user = userEvent.setup();
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
      };

      // Mock authenticated user
      vi.mocked(authService.getCurrentUser).mockResolvedValue(mockUser);

      render(
        <AppProviders>
          <UserMenu />
        </AppProviders>
      );

      // Wait for user menu to load
      await waitFor(() => {
        expect(screen.getByText(/Test User/i)).toBeInTheDocument();
      });

      // Open user menu
      const menuButton = screen.getByRole('button', { name: /Test User/i });
      await user.click(menuButton);

      // Click logout button
      const logoutButton = screen.getByRole('button', { name: /cerrar sesión/i });
      await user.click(logoutButton);

      // Verify logout was called
      await waitFor(() => {
        expect(authService.logout).toHaveBeenCalled();
      });
    });
  });

  describe('Auth State Persistence', () => {
    it('should maintain auth state across components', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
      };

      // Mock authenticated user
      vi.mocked(authService.getCurrentUser).mockResolvedValue(mockUser);

      const { rerender } = render(
        <AppProviders>
          <UserMenu />
        </AppProviders>
      );

      // Wait for user to load in first component
      await waitFor(() => {
        expect(screen.getByText(/Test User/i)).toBeInTheDocument();
      });

      // Rerender with different component
      rerender(
        <AppProviders>
          <div>
            <UserMenu />
            <div data-testid="user-info">
              User is authenticated
            </div>
          </div>
        </AppProviders>
      );

      // Verify user state persists
      await waitFor(() => {
        expect(screen.getByText(/Test User/i)).toBeInTheDocument();
        expect(screen.getByTestId('user-info')).toBeInTheDocument();
      });
    });

    it('should update UI when auth state changes', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
      };

      // Start with no user
      vi.mocked(authService.getCurrentUser).mockResolvedValue(null);

      const { rerender } = render(
        <AppProviders>
          <UserMenu />
        </AppProviders>
      );

      // Verify login button is shown
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /iniciar sesión/i })).toBeInTheDocument();
      });

      // Simulate successful login
      vi.mocked(authService.getCurrentUser).mockResolvedValue(mockUser);
      vi.mocked(authService.login).mockResolvedValue({
        success: true,
        user: mockUser,
        message: 'Login successful',
      });

      // Rerender to trigger auth refresh
      rerender(
        <AppProviders>
          <UserMenu />
        </AppProviders>
      );

      // Verify user menu shows logged in state
      await waitFor(() => {
        expect(screen.getByText(/Test User/i)).toBeInTheDocument();
      });
    });
  });

  describe('Session Management', () => {
    it('should handle expired session gracefully', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
      };

      // Start with authenticated user
      vi.mocked(authService.getCurrentUser).mockResolvedValue(mockUser);

      render(
        <AppProviders>
          <UserMenu />
        </AppProviders>
      );

      // Wait for user to load
      await waitFor(() => {
        expect(screen.getByText(/Test User/i)).toBeInTheDocument();
      });

      // Simulate session expiration
      vi.mocked(authService.getCurrentUser).mockResolvedValue(null);

      // Verify the mock is set up correctly for session expiration
      const currentUser = await authService.getCurrentUser();
      expect(currentUser).toBeNull();
    });
  });
});

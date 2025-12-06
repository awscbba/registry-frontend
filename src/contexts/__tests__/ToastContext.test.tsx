/**
 * ToastContext Tests
 * 
 * Tests for the ToastContext implementation focusing on:
 * - Toast creation and removal
 * - Auto-dismiss functionality
 * - Multiple toast handling
 * - Hook error handling
 * - Memory leak prevention
 */

import { render, screen, cleanup, waitFor } from '@testing-library/react';
import { renderHook, act } from '@testing-library/react';
import { ToastProvider, useToast } from '../ToastContext';

// Mock the logger
jest.mock('../../utils/logger', () => ({
  getLogger: () => ({
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }),
}));

// Mock ToastContainer component
jest.mock('../../components/ToastContainer', () => ({
  ToastContainer: ({ toasts, onRemove }: any) => (
    <div data-testid="toast-container">
      {toasts.map((toast: any) => (
        <div key={toast.id} data-testid={`toast-${toast.id}`}>
          <span data-testid={`toast-message-${toast.id}`}>{toast.message}</span>
          <span data-testid={`toast-type-${toast.id}`}>{toast.type}</span>
          <button
            data-testid={`toast-remove-${toast.id}`}
            onClick={() => onRemove(toast.id)}
          >
            Remove
          </button>
        </div>
      ))}
    </div>
  ),
}));

describe('ToastContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('useToast hook', () => {
    it('should throw error when used outside ToastProvider', () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useToast());
      }).toThrow('useToast must be used within a ToastProvider');

      consoleError.mockRestore();
    });

    it('should return context value when used inside ToastProvider', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ToastProvider>{children}</ToastProvider>
      );

      const { result } = renderHook(() => useToast(), { wrapper });

      expect(result.current).toHaveProperty('toasts');
      expect(result.current).toHaveProperty('showToast');
      expect(result.current).toHaveProperty('removeToast');
      expect(Array.isArray(result.current.toasts)).toBe(true);
      expect(typeof result.current.showToast).toBe('function');
      expect(typeof result.current.removeToast).toBe('function');
    });
  });

  describe('ToastProvider initial state', () => {
    it('should provide empty toasts array initially', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ToastProvider>{children}</ToastProvider>
      );

      const { result } = renderHook(() => useToast(), { wrapper });

      expect(result.current.toasts).toEqual([]);
    });
  });

  describe('showToast function', () => {
    it('should add toast to array', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ToastProvider>{children}</ToastProvider>
      );

      const { result } = renderHook(() => useToast(), { wrapper });

      act(() => {
        result.current.showToast('Test message', 'success');
      });

      expect(result.current.toasts).toHaveLength(1);
      expect(result.current.toasts[0]).toMatchObject({
        message: 'Test message',
        type: 'success',
      });
      expect(result.current.toasts[0].id).toBeDefined();
    });

    it('should default to info type when type not specified', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ToastProvider>{children}</ToastProvider>
      );

      const { result } = renderHook(() => useToast(), { wrapper });

      act(() => {
        result.current.showToast('Test message');
      });

      expect(result.current.toasts[0].type).toBe('info');
    });

    it('should support all toast types', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ToastProvider>{children}</ToastProvider>
      );

      const { result } = renderHook(() => useToast(), { wrapper });

      const types: Array<'success' | 'error' | 'info' | 'warning'> = [
        'success',
        'error',
        'info',
        'warning',
      ];

      types.forEach((type) => {
        act(() => {
          result.current.showToast(`Test ${type}`, type);
        });
      });

      expect(result.current.toasts).toHaveLength(4);
      types.forEach((type, index) => {
        expect(result.current.toasts[index].type).toBe(type);
      });
    });

    it('should generate unique IDs for each toast', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ToastProvider>{children}</ToastProvider>
      );

      const { result } = renderHook(() => useToast(), { wrapper });

      act(() => {
        result.current.showToast('Toast 1');
        result.current.showToast('Toast 2');
        result.current.showToast('Toast 3');
      });

      const ids = result.current.toasts.map((toast) => toast.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(3);
    });
  });

  describe('removeToast function', () => {
    it('should remove toast from array', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ToastProvider>{children}</ToastProvider>
      );

      const { result } = renderHook(() => useToast(), { wrapper });

      act(() => {
        result.current.showToast('Test message');
      });

      expect(result.current.toasts).toHaveLength(1);
      const toastId = result.current.toasts[0].id;

      act(() => {
        result.current.removeToast(toastId);
      });

      expect(result.current.toasts).toHaveLength(0);
    });

    it('should only remove the specified toast', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ToastProvider>{children}</ToastProvider>
      );

      const { result } = renderHook(() => useToast(), { wrapper });

      act(() => {
        result.current.showToast('Toast 1');
      });

      const toast1Id = result.current.toasts[0].id;

      act(() => {
        result.current.showToast('Toast 2');
      });

      const toast2Id = result.current.toasts[1].id;

      expect(result.current.toasts).toHaveLength(2);

      act(() => {
        result.current.removeToast(toast1Id);
      });

      expect(result.current.toasts).toHaveLength(1);
      expect(result.current.toasts[0].id).toBe(toast2Id);
      expect(result.current.toasts[0].message).toBe('Toast 2');
    });

    it('should handle removing non-existent toast gracefully', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ToastProvider>{children}</ToastProvider>
      );

      const { result } = renderHook(() => useToast(), { wrapper });

      act(() => {
        result.current.showToast('Test message');
      });

      expect(result.current.toasts).toHaveLength(1);

      act(() => {
        result.current.removeToast('non-existent-id');
      });

      expect(result.current.toasts).toHaveLength(1);
    });
  });

  describe('auto-dismiss functionality', () => {
    it('should auto-dismiss toast after 5 seconds', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ToastProvider>{children}</ToastProvider>
      );

      const { result } = renderHook(() => useToast(), { wrapper });

      act(() => {
        result.current.showToast('Test message');
      });

      expect(result.current.toasts).toHaveLength(1);

      // Fast-forward time by 5 seconds
      act(() => {
        jest.advanceTimersByTime(5000);
      });

      expect(result.current.toasts).toHaveLength(0);
    });

    it('should not auto-dismiss before 5 seconds', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ToastProvider>{children}</ToastProvider>
      );

      const { result } = renderHook(() => useToast(), { wrapper });

      act(() => {
        result.current.showToast('Test message');
      });

      expect(result.current.toasts).toHaveLength(1);

      // Fast-forward time by 4.9 seconds
      act(() => {
        jest.advanceTimersByTime(4900);
      });

      expect(result.current.toasts).toHaveLength(1);
    });

    it('should auto-dismiss multiple toasts independently', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ToastProvider>{children}</ToastProvider>
      );

      const { result } = renderHook(() => useToast(), { wrapper });

      act(() => {
        result.current.showToast('Toast 1');
      });

      // Wait 2 seconds
      act(() => {
        jest.advanceTimersByTime(2000);
      });

      act(() => {
        result.current.showToast('Toast 2');
      });

      expect(result.current.toasts).toHaveLength(2);

      // Advance 3 more seconds (total 5 seconds for Toast 1)
      act(() => {
        jest.advanceTimersByTime(3000);
      });

      // Toast 1 should be dismissed, Toast 2 should remain
      expect(result.current.toasts).toHaveLength(1);
      expect(result.current.toasts[0].message).toBe('Toast 2');

      // Advance 2 more seconds (total 5 seconds for Toast 2)
      act(() => {
        jest.advanceTimersByTime(2000);
      });

      // Both toasts should be dismissed
      expect(result.current.toasts).toHaveLength(0);
    });

    it('should cancel auto-dismiss when toast is manually removed', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ToastProvider>{children}</ToastProvider>
      );

      const { result } = renderHook(() => useToast(), { wrapper });

      act(() => {
        result.current.showToast('Test message');
      });

      const toastId = result.current.toasts[0].id;

      // Manually remove before auto-dismiss
      act(() => {
        jest.advanceTimersByTime(2000);
        result.current.removeToast(toastId);
      });

      expect(result.current.toasts).toHaveLength(0);

      // Advance past the original 5 second mark
      act(() => {
        jest.advanceTimersByTime(5000);
      });

      // Should still be empty (no double removal)
      expect(result.current.toasts).toHaveLength(0);
    });
  });

  describe('multiple toasts', () => {
    it('should allow multiple toasts to exist simultaneously', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ToastProvider>{children}</ToastProvider>
      );

      const { result } = renderHook(() => useToast(), { wrapper });

      act(() => {
        result.current.showToast('Toast 1', 'success');
        result.current.showToast('Toast 2', 'error');
        result.current.showToast('Toast 3', 'info');
      });

      expect(result.current.toasts).toHaveLength(3);
      expect(result.current.toasts[0].message).toBe('Toast 1');
      expect(result.current.toasts[1].message).toBe('Toast 2');
      expect(result.current.toasts[2].message).toBe('Toast 3');
    });

    it('should limit toasts to maximum of 5', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ToastProvider>{children}</ToastProvider>
      );

      const { result } = renderHook(() => useToast(), { wrapper });

      act(() => {
        for (let i = 1; i <= 7; i++) {
          result.current.showToast(`Toast ${i}`);
        }
      });

      // Should only have 5 toasts (max limit)
      expect(result.current.toasts).toHaveLength(5);

      // Should have the last 5 toasts (3-7)
      expect(result.current.toasts[0].message).toBe('Toast 3');
      expect(result.current.toasts[4].message).toBe('Toast 7');
    });

    it('should remove oldest toast when limit is exceeded', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ToastProvider>{children}</ToastProvider>
      );

      const { result } = renderHook(() => useToast(), { wrapper });

      act(() => {
        result.current.showToast('Toast 1');
        result.current.showToast('Toast 2');
        result.current.showToast('Toast 3');
        result.current.showToast('Toast 4');
        result.current.showToast('Toast 5');
      });

      expect(result.current.toasts).toHaveLength(5);
      const firstToastMessage = result.current.toasts[0].message;

      act(() => {
        result.current.showToast('Toast 6');
      });

      expect(result.current.toasts).toHaveLength(5);
      // First toast should be removed
      expect(result.current.toasts.find((t) => t.message === firstToastMessage)).toBeUndefined();
      expect(result.current.toasts[4].message).toBe('Toast 6');
    });
  });

  describe('ToastProvider with render', () => {
    it('should render ToastContainer with toasts', () => {
      function TestComponent() {
        const { showToast } = useToast();
        return (
          <button onClick={() => showToast('Test toast', 'success')}>Show Toast</button>
        );
      }

      const { getByText } = render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      const button = getByText('Show Toast');
      act(() => {
        button.click();
      });

      expect(screen.getByTestId('toast-container')).toBeInTheDocument();
    });

    it('should pass toasts to ToastContainer', () => {
      function TestComponent() {
        const { showToast } = useToast();
        return (
          <button onClick={() => showToast('Test message', 'error')}>Show Toast</button>
        );
      }

      const { getByText } = render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      const button = getByText('Show Toast');
      act(() => {
        button.click();
      });

      // Wait for toast to appear
      const toastContainer = screen.getByTestId('toast-container');
      expect(toastContainer).toBeInTheDocument();
    });
  });

  describe('memory leak prevention', () => {
    it('should cleanup timers on unmount', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ToastProvider>{children}</ToastProvider>
      );

      const { result, unmount } = renderHook(() => useToast(), { wrapper });

      act(() => {
        result.current.showToast('Toast 1');
        result.current.showToast('Toast 2');
        result.current.showToast('Toast 3');
      });

      expect(result.current.toasts).toHaveLength(3);

      // Unmount the provider
      unmount();

      // Advance timers - should not cause any errors
      act(() => {
        jest.advanceTimersByTime(10000);
      });

      // No errors should be thrown
    });

    it('should not update state after unmount', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ToastProvider>{children}</ToastProvider>
      );

      const { result, unmount } = renderHook(() => useToast(), { wrapper });

      act(() => {
        result.current.showToast('Test message');
      });

      // Unmount before auto-dismiss
      unmount();

      // Try to trigger auto-dismiss after unmount
      act(() => {
        jest.advanceTimersByTime(5000);
      });

      // Should not throw any errors
    });
  });
});

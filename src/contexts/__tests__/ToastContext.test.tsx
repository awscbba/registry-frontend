import { render, screen, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ToastProvider, useToast } from '../ToastContext';

// Mock the logger
vi.mock('../../utils/logger', () => ({
  getLogger: () => ({
    info: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
  }),
}));

// Test component that uses the ToastContext
function TestComponent() {
  const { toasts, showToast, removeToast } = useToast();
  
  return (
    <div>
      <div data-testid="toast-count">{toasts.length}</div>
      <div data-testid="toasts">
        {toasts.map((toast) => (
          <div key={toast.id} data-testid={`toast-${toast.id}`}>
            <span data-testid={`toast-message-${toast.id}`}>{toast.message}</span>
            <span data-testid={`toast-type-${toast.id}`}>{toast.type}</span>
            <button 
              data-testid={`remove-${toast.id}`}
              onClick={() => removeToast(toast.id)}
            >
              Remove
            </button>
          </div>
        ))}
      </div>
      <button 
        data-testid="show-info" 
        onClick={() => showToast('Info message', 'info')}
      >
        Show Info
      </button>
      <button 
        data-testid="show-success" 
        onClick={() => showToast('Success message', 'success')}
      >
        Show Success
      </button>
      <button 
        data-testid="show-default" 
        onClick={() => showToast('Default message')}
      >
        Show Default
      </button>
    </div>
  );
}

describe('ToastContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('ToastProvider', () => {
    it('should provide initial empty state', () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      expect(screen.getByTestId('toast-count')).toHaveTextContent('0');
    });

    it('should show toast with default type (info)', async () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      await act(async () => {
        screen.getByTestId('show-default').click();
      });

      expect(screen.getByTestId('toast-count')).toHaveTextContent('1');
      
      const toastElements = screen.getAllByTestId(/^toast-toast-/);
      expect(toastElements).toHaveLength(1);
      
      const toastId = toastElements[0].getAttribute('data-testid')?.replace('toast-', '');
      expect(screen.getByTestId(`toast-message-${toastId}`)).toHaveTextContent('Default message');
      expect(screen.getByTestId(`toast-type-${toastId}`)).toHaveTextContent('info');
    });

    it('should show multiple toasts', async () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      await act(async () => {
        screen.getByTestId('show-info').click();
        screen.getByTestId('show-success').click();
      });

      expect(screen.getByTestId('toast-count')).toHaveTextContent('2');
    });

    it('should manually remove toast', async () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      await act(async () => {
        screen.getByTestId('show-info').click();
      });

      expect(screen.getByTestId('toast-count')).toHaveTextContent('1');
      
      const toastElements = screen.getAllByTestId(/^toast-toast-/);
      const toastId = toastElements[0].getAttribute('data-testid')?.replace('toast-', '');
      
      await act(async () => {
        screen.getByTestId(`remove-${toastId}`).click();
      });

      expect(screen.getByTestId('toast-count')).toHaveTextContent('0');
    });
  });

  describe('useToast hook', () => {
    it('should throw error when used outside ToastProvider', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      function BadComponent() {
        const { toasts } = useToast();
        return <div>{toasts.length}</div>;
      }

      expect(() => {
        render(<BadComponent />);
      }).toThrow('useToast must be used within a ToastProvider');

      consoleSpy.mockRestore();
    });
  });
});
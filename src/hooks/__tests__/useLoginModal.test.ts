/**
 * Enterprise-grade unit tests for useLoginModal hook
 * 
 * Test Coverage:
 * - Initial state and basic functionality
 * - URL parameter detection and cleanup
 * - State management across multiple operations
 * - Edge cases and error scenarios
 * - Memory leak prevention
 * - SSR compatibility
 */

import { renderHook, act } from '@testing-library/react';
import { useLoginModal } from '../useLoginModal';

// Mock the logger to prevent console noise in tests
jest.mock('../../utils/logger', () => ({
  getLogger: () => ({
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }),
}));

describe('useLoginModal', () => {
  // Store original window.location for restoration
  const originalLocation = window.location;
  
  beforeEach(() => {
    // Reset window.location before each test
    delete (window as any).location;
    window.location = {
      ...originalLocation,
      search: '',
      pathname: '/test-path',
    } as Location;
    
    // Mock window.history.replaceState
    window.history.replaceState = jest.fn();
  });

  afterEach(() => {
    // Restore original window.location
    window.location = originalLocation;
    jest.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should initialize with isOpen as false', () => {
      const { result } = renderHook(() => useLoginModal());

      expect(result.current.isOpen).toBe(false);
    });

    it('should provide openModal and closeModal functions', () => {
      const { result } = renderHook(() => useLoginModal());

      expect(typeof result.current.openModal).toBe('function');
      expect(typeof result.current.closeModal).toBe('function');
    });

    it('should have stable function references', () => {
      const { result, rerender } = renderHook(() => useLoginModal());

      const firstOpenModal = result.current.openModal;
      const firstCloseModal = result.current.closeModal;

      rerender();

      expect(result.current.openModal).toBe(firstOpenModal);
      expect(result.current.closeModal).toBe(firstCloseModal);
    });
  });

  describe('Modal State Management', () => {
    it('should open modal when openModal is called', () => {
      const { result } = renderHook(() => useLoginModal());

      expect(result.current.isOpen).toBe(false);

      act(() => {
        result.current.openModal();
      });

      expect(result.current.isOpen).toBe(true);
    });

    it('should close modal when closeModal is called', () => {
      const { result } = renderHook(() => useLoginModal());

      // First open the modal
      act(() => {
        result.current.openModal();
      });

      expect(result.current.isOpen).toBe(true);

      // Then close it
      act(() => {
        result.current.closeModal();
      });

      expect(result.current.isOpen).toBe(false);
    });

    it('should handle multiple open/close cycles correctly', () => {
      const { result } = renderHook(() => useLoginModal());

      // Cycle 1
      act(() => {
        result.current.openModal();
      });
      expect(result.current.isOpen).toBe(true);

      act(() => {
        result.current.closeModal();
      });
      expect(result.current.isOpen).toBe(false);

      // Cycle 2
      act(() => {
        result.current.openModal();
      });
      expect(result.current.isOpen).toBe(true);

      act(() => {
        result.current.closeModal();
      });
      expect(result.current.isOpen).toBe(false);

      // Cycle 3
      act(() => {
        result.current.openModal();
      });
      expect(result.current.isOpen).toBe(true);
    });

    it('should remain open when openModal is called multiple times', () => {
      const { result } = renderHook(() => useLoginModal());

      act(() => {
        result.current.openModal();
        result.current.openModal();
        result.current.openModal();
      });

      expect(result.current.isOpen).toBe(true);
    });

    it('should remain closed when closeModal is called multiple times', () => {
      const { result } = renderHook(() => useLoginModal());

      act(() => {
        result.current.openModal();
      });

      act(() => {
        result.current.closeModal();
        result.current.closeModal();
        result.current.closeModal();
      });

      expect(result.current.isOpen).toBe(false);
    });
  });

  describe('URL Parameter Detection', () => {
    it('should open modal when URL has login=true parameter', () => {
      window.location = {
        ...originalLocation,
        search: '?login=true',
        pathname: '/test-path',
      } as Location;

      const { result } = renderHook(() => useLoginModal());

      expect(result.current.isOpen).toBe(true);
    });

    it('should not open modal when URL has login=false parameter', () => {
      window.location = {
        ...originalLocation,
        search: '?login=false',
        pathname: '/test-path',
      } as Location;

      const { result } = renderHook(() => useLoginModal());

      expect(result.current.isOpen).toBe(false);
    });

    it('should not open modal when URL has no login parameter', () => {
      window.location = {
        ...originalLocation,
        search: '?other=value',
        pathname: '/test-path',
      } as Location;

      const { result } = renderHook(() => useLoginModal());

      expect(result.current.isOpen).toBe(false);
    });

    it('should not open modal when URL search is empty', () => {
      window.location = {
        ...originalLocation,
        search: '',
        pathname: '/test-path',
      } as Location;

      const { result } = renderHook(() => useLoginModal());

      expect(result.current.isOpen).toBe(false);
    });

    it('should handle login parameter with other parameters', () => {
      window.location = {
        ...originalLocation,
        search: '?foo=bar&login=true&baz=qux',
        pathname: '/test-path',
      } as Location;

      const { result } = renderHook(() => useLoginModal());

      expect(result.current.isOpen).toBe(true);
    });
  });

  describe('URL Parameter Cleanup', () => {
    it('should clean up login=true parameter from URL', () => {
      window.location = {
        ...originalLocation,
        search: '?login=true',
        pathname: '/test-path',
      } as Location;

      renderHook(() => useLoginModal());

      expect(window.history.replaceState).toHaveBeenCalledWith(
        {},
        '',
        '/test-path'
      );
    });

    it('should preserve other parameters when cleaning up login parameter', () => {
      window.location = {
        ...originalLocation,
        search: '?foo=bar&login=true&baz=qux',
        pathname: '/test-path',
      } as Location;

      renderHook(() => useLoginModal());

      expect(window.history.replaceState).toHaveBeenCalledWith(
        {},
        '',
        '/test-path?foo=bar&baz=qux'
      );
    });

    it('should not call replaceState when login parameter is not present', () => {
      window.location = {
        ...originalLocation,
        search: '?other=value',
        pathname: '/test-path',
      } as Location;

      renderHook(() => useLoginModal());

      expect(window.history.replaceState).not.toHaveBeenCalled();
    });

    it('should not call replaceState when login=false', () => {
      window.location = {
        ...originalLocation,
        search: '?login=false',
        pathname: '/test-path',
      } as Location;

      renderHook(() => useLoginModal());

      expect(window.history.replaceState).not.toHaveBeenCalled();
    });
  });

  describe('Component Lifecycle', () => {
    it('should maintain independent state across multiple instances', () => {
      const { result: result1 } = renderHook(() => useLoginModal());
      const { result: result2 } = renderHook(() => useLoginModal());

      act(() => {
        result1.current.openModal();
      });

      expect(result1.current.isOpen).toBe(true);
      expect(result2.current.isOpen).toBe(false);
    });

    it('should reset state when unmounted and remounted', () => {
      const { result, unmount } = renderHook(() => useLoginModal());

      act(() => {
        result.current.openModal();
      });

      expect(result.current.isOpen).toBe(true);

      unmount();

      // Remount creates new instance with fresh state
      const { result: newResult } = renderHook(() => useLoginModal());

      expect(newResult.current.isOpen).toBe(false);
    });
  });

  describe('SSR Compatibility', () => {
    it('should handle missing window object gracefully', () => {
      const originalWindow = global.window;
      
      // Simulate SSR environment
      delete (global as any).window;

      expect(() => {
        renderHook(() => useLoginModal());
      }).not.toThrow();

      // Restore window
      global.window = originalWindow;
    });
  });

  describe('Edge Cases', () => {
    it('should handle malformed URL parameters', () => {
      window.location = {
        ...originalLocation,
        search: '?login=true&&&invalid',
        pathname: '/test-path',
      } as Location;

      expect(() => {
        renderHook(() => useLoginModal());
      }).not.toThrow();
    });

    it('should handle empty pathname', () => {
      window.location = {
        ...originalLocation,
        search: '?login=true',
        pathname: '',
      } as Location;

      expect(() => {
        renderHook(() => useLoginModal());
      }).not.toThrow();
    });

    it('should handle URL with hash', () => {
      window.location = {
        ...originalLocation,
        search: '?login=true',
        pathname: '/test-path',
        hash: '#section',
      } as Location;

      const { result } = renderHook(() => useLoginModal());

      expect(result.current.isOpen).toBe(true);
    });
  });
});

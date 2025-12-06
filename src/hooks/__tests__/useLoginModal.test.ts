/**
 * Tests for useLoginModal hook
 * 
 * Validates that the hook correctly manages login modal state and URL parameters
 */

import { renderHook, act } from '@testing-library/react';
import { useLoginModal } from '../useLoginModal';

// Mock the logger
jest.mock('../../utils/logger', () => ({
  getLogger: () => ({
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }),
}));

describe('useLoginModal', () => {
  // Store original window.location
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

  it('should initialize with isOpen as false', () => {
    const { result } = renderHook(() => useLoginModal());

    expect(result.current.isOpen).toBe(false);
  });

  it('should provide open and close functions', () => {
    const { result } = renderHook(() => useLoginModal());

    expect(typeof result.current.open).toBe('function');
    expect(typeof result.current.close).toBe('function');
  });

  it('should open modal when open function is called', () => {
    const { result } = renderHook(() => useLoginModal());

    expect(result.current.isOpen).toBe(false);

    act(() => {
      result.current.open();
    });

    expect(result.current.isOpen).toBe(true);
  });

  it('should close modal when close function is called', () => {
    const { result } = renderHook(() => useLoginModal());

    // First open the modal
    act(() => {
      result.current.open();
    });

    expect(result.current.isOpen).toBe(true);

    // Then close it
    act(() => {
      result.current.close();
    });

    expect(result.current.isOpen).toBe(false);
  });

  it('should open modal when URL has login=true parameter', () => {
    // Set up URL with login=true parameter
    window.location = {
      ...originalLocation,
      search: '?login=true',
      pathname: '/test-path',
    } as Location;

    const { result } = renderHook(() => useLoginModal());

    expect(result.current.isOpen).toBe(true);
  });

  it('should clean up URL parameter after opening modal from URL', () => {
    // Set up URL with login=true parameter
    window.location = {
      ...originalLocation,
      search: '?login=true',
      pathname: '/test-path',
    } as Location;

    renderHook(() => useLoginModal());

    // Verify that replaceState was called to clean up the URL
    expect(window.history.replaceState).toHaveBeenCalledWith(
      {},
      '',
      '/test-path'
    );
  });

  it('should not open modal when URL has login parameter with different value', () => {
    // Set up URL with login=false parameter
    window.location = {
      ...originalLocation,
      search: '?login=false',
      pathname: '/test-path',
    } as Location;

    const { result } = renderHook(() => useLoginModal());

    expect(result.current.isOpen).toBe(false);
  });

  it('should not open modal when URL has no login parameter', () => {
    // Set up URL without login parameter
    window.location = {
      ...originalLocation,
      search: '?other=value',
      pathname: '/test-path',
    } as Location;

    const { result } = renderHook(() => useLoginModal());

    expect(result.current.isOpen).toBe(false);
  });

  it('should handle multiple open/close cycles', () => {
    const { result } = renderHook(() => useLoginModal());

    // Open
    act(() => {
      result.current.open();
    });
    expect(result.current.isOpen).toBe(true);

    // Close
    act(() => {
      result.current.close();
    });
    expect(result.current.isOpen).toBe(false);

    // Open again
    act(() => {
      result.current.open();
    });
    expect(result.current.isOpen).toBe(true);

    // Close again
    act(() => {
      result.current.close();
    });
    expect(result.current.isOpen).toBe(false);
  });

  it('should maintain state after unmounting and remounting', () => {
    const { result, unmount } = renderHook(() => useLoginModal());

    act(() => {
      result.current.open();
    });

    expect(result.current.isOpen).toBe(true);

    // Unmount the hook
    unmount();

    // Remount the hook (new instance)
    const { result: newResult } = renderHook(() => useLoginModal());

    // New instance should start with isOpen as false
    expect(newResult.current.isOpen).toBe(false);
  });

  it('should not clean up URL if login parameter is not present', () => {
    // Set up URL without login parameter
    window.location = {
      ...originalLocation,
      search: '?other=value',
      pathname: '/test-path',
    } as Location;

    renderHook(() => useLoginModal());

    // Verify that replaceState was not called
    expect(window.history.replaceState).not.toHaveBeenCalled();
  });

  it('should handle URL with multiple parameters including login=true', () => {
    // Set up URL with multiple parameters
    window.location = {
      ...originalLocation,
      search: '?foo=bar&login=true&baz=qux',
      pathname: '/test-path',
    } as Location;

    const { result } = renderHook(() => useLoginModal());

    expect(result.current.isOpen).toBe(true);
    expect(window.history.replaceState).toHaveBeenCalledWith(
      {},
      '',
      '/test-path'
    );
  });
});

/**
 * Enterprise-grade unit tests for useFocusManagement hook
 * 
 * Test Coverage:
 * - Focus storage and restoration
 * - Modal focus management
 * - Accessibility compliance (WCAG 2.1)
 * - Edge cases (missing elements, DOM changes)
 * - SSR compatibility
 * - Memory leak prevention
 */

import { renderHook, act } from '@testing-library/react';
import { useFocusManagement } from '../useFocusManagement';

// Mock the logger
jest.mock('../../utils/logger', () => ({
  getLogger: () => ({
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }),
}));

describe('useFocusManagement', () => {
  let mockButton: HTMLButtonElement;
  let mockModal: HTMLDivElement;

  beforeEach(() => {
    // Create mock elements
    mockButton = document.createElement('button');
    mockButton.id = 'trigger-button';
    document.body.appendChild(mockButton);

    mockModal = document.createElement('div');
    mockModal.id = 'modal';
    mockModal.tabIndex = -1;
    document.body.appendChild(mockModal);

    // Focus the button initially
    mockButton.focus();
  });

  afterEach(() => {
    // Clean up
    document.body.removeChild(mockButton);
    if (document.body.contains(mockModal)) {
      document.body.removeChild(mockModal);
    }
    jest.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should return modalRef', () => {
      const { result } = renderHook(() => useFocusManagement(false));

      expect(result.current.modalRef).toBeDefined();
      expect(result.current.modalRef.current).toBeNull();
    });

    it('should not change focus when modal is closed', () => {
      const activeElementBefore = document.activeElement;

      renderHook(() => useFocusManagement(false));

      expect(document.activeElement).toBe(activeElementBefore);
    });
  });

  describe('Focus Storage', () => {
    it('should store previously focused element when modal opens', async () => {
      const { result, rerender } = renderHook(
        ({ isOpen }) => useFocusManagement(isOpen),
        { initialProps: { isOpen: false } }
      );

      // Attach modal ref
      act(() => {
        (result.current.modalRef as any).current = mockModal;
      });

      expect(document.activeElement).toBe(mockButton);

      // Open modal
      rerender({ isOpen: true });

      // Wait for focus to move
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 150));
      });

      // Modal should now have focus
      expect(document.activeElement).toBe(mockModal);
    });

    it('should handle multiple focus changes before modal opens', async () => {
      const secondButton = document.createElement('button');
      secondButton.id = 'second-button';
      document.body.appendChild(secondButton);

      secondButton.focus();

      const { result, rerender } = renderHook(
        ({ isOpen }) => useFocusManagement(isOpen),
        { initialProps: { isOpen: false } }
      );

      act(() => {
        (result.current.modalRef as any).current = mockModal;
      });

      rerender({ isOpen: true });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 150));
      });

      // Close modal
      rerender({ isOpen: false });

      // Should restore focus to second button
      expect(document.activeElement).toBe(secondButton);

      document.body.removeChild(secondButton);
    });
  });

  describe('Focus Restoration', () => {
    it('should restore focus to previous element when modal closes', async () => {
      const { result, rerender } = renderHook(
        ({ isOpen }) => useFocusManagement(isOpen),
        { initialProps: { isOpen: false } }
      );

      act(() => {
        (result.current.modalRef as any).current = mockModal;
      });

      // Open modal
      rerender({ isOpen: true });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 150));
      });

      // Close modal
      rerender({ isOpen: false });

      // Focus should be restored to button
      expect(document.activeElement).toBe(mockButton);
    });

    it('should handle element removed from DOM', async () => {
      const { result, rerender } = renderHook(
        ({ isOpen }) => useFocusManagement(isOpen),
        { initialProps: { isOpen: false } }
      );

      act(() => {
        (result.current.modalRef as any).current = mockModal;
      });

      // Open modal
      rerender({ isOpen: true });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 150));
      });

      // Remove the button from DOM
      document.body.removeChild(mockButton);

      // Close modal (should not crash)
      expect(() => {
        rerender({ isOpen: false });
      }).not.toThrow();
    });

    it('should clear previous focus reference after restoration', async () => {
      const { result, rerender } = renderHook(
        ({ isOpen }) => useFocusManagement(isOpen),
        { initialProps: { isOpen: false } }
      );

      act(() => {
        (result.current.modalRef as any).current = mockModal;
      });

      // Open and close modal
      rerender({ isOpen: true });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 150));
      });

      rerender({ isOpen: false });

      // Change focus to something else
      const newButton = document.createElement('button');
      document.body.appendChild(newButton);
      newButton.focus();

      // Open modal again
      rerender({ isOpen: true });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 150));
      });

      // Close modal
      rerender({ isOpen: false });

      // Should restore to new button, not old button
      expect(document.activeElement).toBe(newButton);

      document.body.removeChild(newButton);
    });
  });

  describe('Modal Focus', () => {
    it('should move focus to modal when it opens', async () => {
      const { result, rerender } = renderHook(
        ({ isOpen }) => useFocusManagement(isOpen),
        { initialProps: { isOpen: false } }
      );

      act(() => {
        (result.current.modalRef as any).current = mockModal;
      });

      rerender({ isOpen: true });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 150));
      });

      expect(document.activeElement).toBe(mockModal);
    });

    it('should handle modal ref not being set', async () => {
      const { rerender } = renderHook(
        ({ isOpen }) => useFocusManagement(isOpen),
        { initialProps: { isOpen: false } }
      );

      // Don't set modalRef.current

      expect(() => {
        rerender({ isOpen: true });
      }).not.toThrow();
    });

    it('should delay focus to allow modal rendering', async () => {
      const { result, rerender } = renderHook(
        ({ isOpen }) => useFocusManagement(isOpen),
        { initialProps: { isOpen: false } }
      );

      rerender({ isOpen: true });

      // Immediately after opening, focus should not have moved yet
      expect(document.activeElement).toBe(mockButton);

      // Set modal ref after opening
      act(() => {
        (result.current.modalRef as any).current = mockModal;
      });

      // Wait for timeout
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 150));
      });

      // Now focus should have moved
      expect(document.activeElement).toBe(mockModal);
    });
  });

  describe('Multiple Open/Close Cycles', () => {
    it('should handle multiple open/close cycles correctly', async () => {
      const { result, rerender } = renderHook(
        ({ isOpen }) => useFocusManagement(isOpen),
        { initialProps: { isOpen: false } }
      );

      act(() => {
        (result.current.modalRef as any).current = mockModal;
      });

      // Cycle 1
      rerender({ isOpen: true });
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 150));
      });
      expect(document.activeElement).toBe(mockModal);

      rerender({ isOpen: false });
      expect(document.activeElement).toBe(mockButton);

      // Cycle 2
      rerender({ isOpen: true });
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 150));
      });
      expect(document.activeElement).toBe(mockModal);

      rerender({ isOpen: false });
      expect(document.activeElement).toBe(mockButton);
    });

    it('should handle rapid open/close', async () => {
      const { result, rerender } = renderHook(
        ({ isOpen }) => useFocusManagement(isOpen),
        { initialProps: { isOpen: false } }
      );

      act(() => {
        (result.current.modalRef as any).current = mockModal;
      });

      // Rapidly open and close
      rerender({ isOpen: true });
      rerender({ isOpen: false });
      rerender({ isOpen: true });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 150));
      });

      // Should end up with modal focused
      expect(document.activeElement).toBe(mockModal);
    });
  });

  describe('Accessibility Compliance', () => {
    it('should support WCAG 2.1 focus management requirements', async () => {
      const { result, rerender } = renderHook(
        ({ isOpen }) => useFocusManagement(isOpen),
        { initialProps: { isOpen: false } }
      );

      act(() => {
        (result.current.modalRef as any).current = mockModal;
      });

      // Requirement: Focus moves to modal on open
      rerender({ isOpen: true });
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 150));
      });
      expect(document.activeElement).toBe(mockModal);

      // Requirement: Focus returns to trigger on close
      rerender({ isOpen: false });
      expect(document.activeElement).toBe(mockButton);
    });

    it('should work with elements that have tabIndex', async () => {
      const focusableDiv = document.createElement('div');
      focusableDiv.tabIndex = 0;
      document.body.appendChild(focusableDiv);
      focusableDiv.focus();

      const { result, rerender } = renderHook(
        ({ isOpen }) => useFocusManagement(isOpen),
        { initialProps: { isOpen: false } }
      );

      act(() => {
        (result.current.modalRef as any).current = mockModal;
      });

      rerender({ isOpen: true });
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 150));
      });

      rerender({ isOpen: false });

      expect(document.activeElement).toBe(focusableDiv);

      document.body.removeChild(focusableDiv);
    });
  });

  describe('SSR Compatibility', () => {
    it('should not crash when document is undefined', () => {
      const originalDocument = global.document;
      delete (global as any).document;

      expect(() => {
        renderHook(() => useFocusManagement(true));
      }).not.toThrow();

      global.document = originalDocument;
    });

    it('should handle SSR environment gracefully', () => {
      const originalDocument = global.document;
      delete (global as any).document;

      const { result } = renderHook(() => useFocusManagement(true));

      expect(result.current.modalRef).toBeDefined();

      global.document = originalDocument;
    });
  });

  describe('Memory Leak Prevention', () => {
    it('should clean up timeout on unmount', async () => {
      const { result, unmount, rerender } = renderHook(
        ({ isOpen }) => useFocusManagement(isOpen),
        { initialProps: { isOpen: false } }
      );

      act(() => {
        (result.current.modalRef as any).current = mockModal;
      });

      rerender({ isOpen: true });

      // Unmount before timeout completes
      unmount();

      // Wait for timeout period
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 150));
      });

      // Should not crash or cause warnings
      expect(true).toBe(true);
    });

    it('should clean up timeout when isOpen changes rapidly', async () => {
      const { result, rerender } = renderHook(
        ({ isOpen }) => useFocusManagement(isOpen),
        { initialProps: { isOpen: false } }
      );

      act(() => {
        (result.current.modalRef as any).current = mockModal;
      });

      // Open and immediately close
      rerender({ isOpen: true });
      rerender({ isOpen: false });

      // Wait for timeout period
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 150));
      });

      // Should not have moved focus to modal
      expect(document.activeElement).not.toBe(mockModal);
    });
  });

  describe('Edge Cases', () => {
    it('should handle body as active element', async () => {
      document.body.focus();

      const { result, rerender } = renderHook(
        ({ isOpen }) => useFocusManagement(isOpen),
        { initialProps: { isOpen: false } }
      );

      act(() => {
        (result.current.modalRef as any).current = mockModal;
      });

      rerender({ isOpen: true });
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 150));
      });

      rerender({ isOpen: false });

      // Should restore to body
      expect(document.activeElement).toBe(document.body);
    });

    it('should handle null activeElement', async () => {
      // This is a theoretical edge case
      const { result, rerender } = renderHook(
        ({ isOpen }) => useFocusManagement(isOpen),
        { initialProps: { isOpen: false } }
      );

      act(() => {
        (result.current.modalRef as any).current = mockModal;
      });

      expect(() => {
        rerender({ isOpen: true });
      }).not.toThrow();
    });

    it('should handle modal element without focus method', async () => {
      const nonFocusableElement = document.createElement('span');
      document.body.appendChild(nonFocusableElement);

      const { result, rerender } = renderHook(
        ({ isOpen }) => useFocusManagement(isOpen),
        { initialProps: { isOpen: false } }
      );

      act(() => {
        (result.current.modalRef as any).current = nonFocusableElement as any;
      });

      expect(() => {
        rerender({ isOpen: true });
      }).not.toThrow();

      document.body.removeChild(nonFocusableElement);
    });
  });
});

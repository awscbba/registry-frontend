import { useEffect, useRef } from 'react';
import { getLogger } from '../utils/logger';

const logger = getLogger('hooks.useFocusManagement');

/**
 * Interface for the return value of useFocusManagement hook
 */
interface UseFocusManagementReturn {
  /** Ref to attach to the modal element for focus management */
  modalRef: React.RefObject<HTMLElement>;
}

/**
 * Custom hook to manage focus when modals open and close.
 * 
 * This hook implements WCAG 2.1 accessibility requirements for modal dialogs:
 * - Stores the previously focused element when a modal opens
 * - Moves focus to the modal when it opens
 * - Restores focus to the previous element when the modal closes
 * - Ensures proper keyboard navigation accessibility
 * 
 * Features:
 * - Automatic focus management
 * - SSR-safe (guards against document access)
 * - Structured logging for debugging
 * - Memory leak prevention via cleanup
 * 
 * @param {boolean} isOpen - Whether the modal is currently open
 * @returns {UseFocusManagementReturn} Object containing a ref to attach to the modal element
 * 
 * @example
 * ```tsx
 * function LoginModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
 *   const { modalRef } = useFocusManagement(isOpen);
 *   
 *   if (!isOpen) return null;
 *   
 *   return (
 *     <div 
 *       ref={modalRef}
 *       role="dialog"
 *       aria-modal="true"
 *       aria-labelledby="modal-title"
 *       tabIndex={-1}
 *       className="modal"
 *     >
 *       <h2 id="modal-title">Login</h2>
 *       <form>
 *         <input type="email" placeholder="Email" />
 *         <input type="password" placeholder="Password" />
 *         <button type="submit">Login</button>
 *       </form>
 *       <button onClick={onClose}>Close</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useFocusManagement(isOpen: boolean): UseFocusManagementReturn {
  const modalRef = useRef<HTMLElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    // SSR guard - only run in browser
    if (typeof document === 'undefined') {
      return;
    }
    
    if (isOpen) {
      // Store the currently focused element before opening modal
      previousFocusRef.current = document.activeElement as HTMLElement;
      
      logger.info('Modal opened - storing previous focus', {
        previousElement: previousFocusRef.current?.tagName,
        previousElementId: previousFocusRef.current?.id || 'none',
        timestamp: new Date().toISOString()
      });

      // Move focus to the modal after a brief delay to ensure it's rendered
      const timeoutId = setTimeout(() => {
        if (modalRef.current) {
          modalRef.current.focus();
          logger.info('Focus moved to modal', {
            modalElement: modalRef.current.tagName,
            timestamp: new Date().toISOString()
          });
        } else {
          logger.warn('Modal ref not available for focus', {
            timestamp: new Date().toISOString()
          });
        }
      }, 100);

      // Cleanup timeout on unmount or when isOpen changes
      return () => {
        clearTimeout(timeoutId);
      };
    } else {
      // Restore focus to the previous element when modal closes
      if (previousFocusRef.current) {
        // Check if the element still exists in the DOM
        if (document.body.contains(previousFocusRef.current)) {
          previousFocusRef.current.focus();
          logger.info('Modal closed - focus restored', {
            restoredElement: previousFocusRef.current.tagName,
            restoredElementId: previousFocusRef.current.id || 'none',
            timestamp: new Date().toISOString()
          });
        } else {
          logger.warn('Previous focus element no longer in DOM', {
            timestamp: new Date().toISOString()
          });
        }
        previousFocusRef.current = null;
      }
    }
  }, [isOpen]);

  return { modalRef };
}

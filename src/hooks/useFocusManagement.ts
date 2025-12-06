import { useEffect, useRef } from 'react';
import { getLogger } from '../utils/logger';

const logger = getLogger('hooks.useFocusManagement');

/**
 * Interface for the return value of useFocusManagement hook
 */
interface UseFocusManagementReturn {
  modalRef: React.RefObject<HTMLElement>;
}

/**
 * Custom hook to manage focus when modals open and close
 * 
 * This hook:
 * - Stores the previously focused element when a modal opens
 * - Moves focus to the modal when it opens
 * - Restores focus to the previous element when the modal closes
 * - Ensures proper accessibility for keyboard navigation
 * 
 * @param {boolean} isOpen - Whether the modal is currently open
 * @returns {UseFocusManagementReturn} Object containing a ref to attach to the modal element
 * 
 * @example
 * ```tsx
 * function Modal({ isOpen, onClose }) {
 *   const { modalRef } = useFocusManagement(isOpen);
 *   
 *   return (
 *     <div 
 *       ref={modalRef}
 *       role="dialog"
 *       aria-modal="true"
 *       tabIndex={-1}
 *     >
 *       <h2>Modal Title</h2>
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
    if (isOpen) {
      // Store the currently focused element
      previousFocusRef.current = document.activeElement as HTMLElement;
      
      logger.debug('Modal opened - storing previous focus', {
        previousElement: previousFocusRef.current?.tagName,
        previousElementId: previousFocusRef.current?.id,
        timestamp: new Date().toISOString()
      });

      // Move focus to the modal after a brief delay to ensure it's rendered
      const timeoutId = setTimeout(() => {
        if (modalRef.current) {
          modalRef.current.focus();
          logger.debug('Focus moved to modal', {
            modalElement: modalRef.current.tagName,
            timestamp: new Date().toISOString()
          });
        }
      }, 100);

      return () => clearTimeout(timeoutId);
    } else {
      // Restore focus to the previous element when modal closes
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
        logger.debug('Modal closed - focus restored', {
          restoredElement: previousFocusRef.current.tagName,
          restoredElementId: previousFocusRef.current.id,
          timestamp: new Date().toISOString()
        });
        previousFocusRef.current = null;
      }
    }
  }, [isOpen]);

  return { modalRef };
}

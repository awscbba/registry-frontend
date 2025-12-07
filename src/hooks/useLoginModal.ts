import { useState, useEffect, useCallback } from 'react';
import { getLogger } from '../utils/logger';

const logger = getLogger('useLoginModal');

/**
 * Custom hook to manage login modal state.
 * 
 * Features:
 * - Open/close modal state management
 * - URL parameter detection (opens modal if ?login=true)
 * - Cleanup of URL parameters after opening
 * - Structured logging for debugging
 * 
 * @returns {Object} Modal state and control functions
 * 
 * @example
 * function MyComponent() {
 *   const { isOpen, openModal, closeModal } = useLoginModal();
 *   
 *   return (
 *     <>
 *       <button onClick={openModal}>Login</button>
 *       {isOpen && <LoginModal onClose={closeModal} />}
 *     </>
 *   );
 * }
 */
export function useLoginModal() {
  const [isOpen, setIsOpen] = useState(false);

  // Check URL parameters on mount
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const shouldOpenLogin = params.get('login') === 'true';

    if (shouldOpenLogin) {
      logger.info('Opening login modal from URL parameter');
      setIsOpen(true);

      // Clean up URL parameter
      params.delete('login');
      const newUrl = params.toString()
        ? `${window.location.pathname}?${params.toString()}`
        : window.location.pathname;
      
      window.history.replaceState({}, '', newUrl);
    }
  }, []);

  const openModal = useCallback(() => {
    logger.info('Login modal opened');
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    logger.info('Login modal closed');
    setIsOpen(false);
  }, []);

  return {
    isOpen,
    openModal,
    closeModal,
  };
}

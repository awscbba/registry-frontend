import { useState, useEffect, useRef } from 'react';
import { getLogger } from '../utils/logger';

const logger = getLogger('hooks.useLoginModal');

/**
 * Interface for the return value of useLoginModal hook
 */
interface UseLoginModalReturn {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

/**
 * Custom hook to manage login modal state and URL parameters
 * 
 * This hook:
 * - Manages the open/close state of the login modal
 * - Automatically opens the modal when URL contains login=true parameter
 * - Cleans up URL parameters after opening the modal
 * 
 * @returns {UseLoginModalReturn} Object containing isOpen state and open/close functions
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { isOpen, open, close } = useLoginModal();
 *   
 *   return (
 *     <>
 *       <button onClick={open}>Login</button>
 *       <LoginModal isOpen={isOpen} onClose={close} />
 *     </>
 *   );
 * }
 * ```
 */
export function useLoginModal(): UseLoginModalReturn {
  const [isOpen, setIsOpen] = useState(false);
  
  // Track if component is mounted
  const isMountedRef = useRef(true);

  useEffect(() => {
    // Check if we should auto-open login modal (from /login redirect)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('login') === 'true') {
      if (isMountedRef.current) {
        setIsOpen(true);
        logger.info('Login modal auto-opened from URL parameter', {
          timestamp: new Date().toISOString()
        });
      }
      // Clean up URL parameter
      window.history.replaceState({}, '', window.location.pathname);
    }
    
    // Cleanup
    return () => {
      isMountedRef.current = false;
      logger.debug('useLoginModal hook unmounting', {
        timestamp: new Date().toISOString()
      });
    };
  }, []);

  const open = () => {
    if (isMountedRef.current) {
      setIsOpen(true);
      logger.debug('Login modal opened', {
        timestamp: new Date().toISOString()
      });
    }
  };
  
  const close = () => {
    if (isMountedRef.current) {
      setIsOpen(false);
      logger.debug('Login modal closed', {
        timestamp: new Date().toISOString()
      });
    }
  };

  return { isOpen, open, close };
}

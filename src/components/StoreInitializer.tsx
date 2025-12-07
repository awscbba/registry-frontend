import { useEffect } from 'react';
import { initializeAuth } from '../stores/authStore';
import { getLogger } from '../utils/logger';

const logger = getLogger('StoreInitializer');

/**
 * StoreInitializer - Initializes global stores on app startup
 * 
 * This component should be rendered once at the app root level.
 * It initializes the auth store by checking for stored tokens.
 * 
 * Unlike React Context providers, this doesn't wrap children - it just
 * runs initialization logic once when the app loads.
 */
export function StoreInitializer() {
  useEffect(() => {
    logger.info('Initializing stores');
    
    // Initialize auth state from stored token
    initializeAuth().catch(err => {
      logger.error('Failed to initialize auth', { error: err.message });
    });
  }, []);

  // This component doesn't render anything
  return null;
}

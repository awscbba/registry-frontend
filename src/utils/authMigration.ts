/**
 * Authentication Migration Utility
 * 
 * Helps migrate users from old authentication systems to the new unified system.
 */

import { authLogger } from './logger';

/**
 * Migrate legacy authentication data to new unified format
 */
export function migrateLegacyAuth(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  let migrated = false;

  // Check for legacy authToken and migrate to userAuthToken
  const legacyAuthToken = localStorage.getItem('authToken');
  const legacyUserEmail = localStorage.getItem('userEmail');
  
  if (legacyAuthToken && !localStorage.getItem('userAuthToken')) {
    authLogger.info('Migrating legacy authToken to userAuthToken', { event_type: 'auth_migration' });
    localStorage.setItem('userAuthToken', legacyAuthToken);
    
    // If we have userEmail, create userData object
    if (legacyUserEmail) {
      const userData = {
        email: legacyUserEmail,
        // We don't have other user data from legacy format
        firstName: '',
        lastName: '',
        id: ''
      };
      localStorage.setItem('userData', JSON.stringify(userData));
      authLogger.info('Migrated legacy userEmail to userData', { event_type: 'user_data_migration' });
    }
    
    migrated = true;
  }

  // Check for legacy admin auth_token
  const legacyAdminToken = localStorage.getItem('auth_token');
  const legacyCurrentUser = localStorage.getItem('current_user');
  
  if (legacyAdminToken && !localStorage.getItem('userAuthToken')) {
    authLogger.info('Migrating legacy admin auth_token to userAuthToken', { event_type: 'admin_auth_migration' });
    localStorage.setItem('userAuthToken', legacyAdminToken);
    
    if (legacyCurrentUser) {
      try {
        const userData = JSON.parse(legacyCurrentUser);
        // Mark as admin if migrating from admin system
        userData.isAdmin = true;
        localStorage.setItem('userData', JSON.stringify(userData));
        authLogger.info('Migrated legacy admin user data', { event_type: 'admin_data_migration' });
      } catch (error) {
        authLogger.warn('Failed to parse legacy admin user data', { error: error.message }, error);
      }
    }
    
    migrated = true;
  }

  // Clean up legacy keys after successful migration
  if (migrated) {
    authLogger.info('Cleaning up legacy authentication keys', { event_type: 'auth_cleanup' });
    localStorage.removeItem('authToken');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('current_user');
    localStorage.removeItem('token_expiry');
  }

  return migrated;
}

/**
 * Check if user needs authentication migration
 */
export function needsAuthMigration(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  const hasLegacyAuth = !!(
    localStorage.getItem('authToken') ||
    localStorage.getItem('auth_token')
  );
  
  const hasNewAuth = !!(
    localStorage.getItem('userAuthToken')
  );

  return hasLegacyAuth && !hasNewAuth;
}

/**
 * Get migration status information
 */
export function getAuthMigrationStatus(): {
  needsMigration: boolean;
  legacyKeysFound: string[];
  newKeysFound: string[];
} {
  if (typeof window === 'undefined') {
    return {
      needsMigration: false,
      legacyKeysFound: [],
      newKeysFound: []
    };
  }

  const legacyKeys = ['authToken', 'userEmail', 'auth_token', 'current_user', 'token_expiry'];
  const newKeys = ['userAuthToken', 'userData'];

  const legacyKeysFound = legacyKeys.filter(key => localStorage.getItem(key) !== null);
  const newKeysFound = newKeys.filter(key => localStorage.getItem(key) !== null);

  return {
    needsMigration: legacyKeysFound.length > 0 && newKeysFound.length === 0,
    legacyKeysFound,
    newKeysFound
  };
}

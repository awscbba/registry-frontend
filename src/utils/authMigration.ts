/**
 * Authentication Migration Utility
 * 
 * Helps migrate users from old authentication systems to the new unified system.
 */

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
    console.log('Migrating legacy authToken to userAuthToken');
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
      console.log('Migrated legacy userEmail to userData');
    }
    
    migrated = true;
  }

  // Check for legacy admin auth_token
  const legacyAdminToken = localStorage.getItem('auth_token');
  const legacyCurrentUser = localStorage.getItem('current_user');
  
  if (legacyAdminToken && !localStorage.getItem('userAuthToken')) {
    console.log('Migrating legacy admin auth_token to userAuthToken');
    localStorage.setItem('userAuthToken', legacyAdminToken);
    
    if (legacyCurrentUser) {
      try {
        const userData = JSON.parse(legacyCurrentUser);
        // Mark as admin if migrating from admin system
        userData.isAdmin = true;
        localStorage.setItem('userData', JSON.stringify(userData));
        console.log('Migrated legacy admin user data');
      } catch (error) {
        console.warn('Failed to parse legacy admin user data:', error);
      }
    }
    
    migrated = true;
  }

  // Clean up legacy keys after successful migration
  if (migrated) {
    console.log('Cleaning up legacy authentication keys');
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

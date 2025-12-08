import { atom, computed } from 'nanostores';
import { authService } from '../services/authService';
import type { User } from '../types/user';
import { getLogger } from '../utils/logger';

const logger = getLogger('stores.authStore');

/**
 * Auth Store - Nanostores-based authentication state management
 * 
 * Replaces AuthContext to avoid React Context hydration timing issues with Astro.
 * Nanostores work seamlessly with Astro's partial hydration architecture.
 * 
 * Features:
 * - Global authentication state accessible from any component
 * - No provider wrapper needed
 * - SSR-safe
 * - Works with Astro's island architecture
 * - Framework-agnostic (works with React, Vue, Svelte, vanilla JS)
 */

// Atoms (writable stores)
export const $user = atom<User | null>(null);
export const $isLoading = atom<boolean>(true);
export const $error = atom<string | null>(null);

// Computed stores (derived/readonly)
export const $isAuthenticated = computed($user, (user) => user !== null);

/**
 * Initialize auth state from stored token
 * Call this once on app startup
 */
export async function initializeAuth(): Promise<void> {
  const correlationId = `initAuth-${Date.now()}`;
  
  logger.info('Initializing auth state', { correlationId });
  
  $isLoading.set(true);
  $error.set(null);

  try {
    const isAuth = authService.isAuthenticated();
    
    if (isAuth) {
      const currentUser = authService.getCurrentUser();
      
      if (currentUser) {
        logger.info('User authenticated from stored token', {
          correlationId,
          userId: currentUser.id,
          email: currentUser.email
        });
        
        $user.set(currentUser);
      } else {
        logger.warn('Token exists but user data invalid', { correlationId });
        authService.logout();
        $user.set(null);
      }
    } else {
      logger.info('No authentication token found', { correlationId });
      $user.set(null);
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to initialize auth';
    
    logger.error('Auth initialization failed', {
      correlationId,
      error: errorMessage
    });
    
    $error.set(errorMessage);
    $user.set(null);
  } finally {
    $isLoading.set(false);
  }
}

/**
 * Login user with email and password
 */
export async function login(email: string, password: string): Promise<void> {
  const correlationId = `login-${Date.now()}`;
  
  logger.info('Login attempt', { correlationId, email });
  
  $isLoading.set(true);
  $error.set(null);

  try {
    const response = await authService.login(email, password);
    
    if (response.success && response.user) {
      logger.info('Login successful', {
        correlationId,
        userId: response.user.id,
        email: response.user.email
      });
      
      $user.set(response.user);
    } else {
      const errorMsg = response.message || 'Login failed';
      logger.warn('Login failed', { correlationId, error: errorMsg });
      
      $error.set(errorMsg);
      throw new Error(errorMsg);
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Login failed';
    
    logger.error('Login error', {
      correlationId,
      error: errorMessage
    });
    
    $error.set(errorMessage);
    throw err;
  } finally {
    $isLoading.set(false);
  }
}

/**
 * Logout current user
 */
export function logout(): void {
  const correlationId = `logout-${Date.now()}`;
  const currentUser = $user.get();
  
  logger.info('Logout initiated', {
    correlationId,
    userId: currentUser?.id,
    email: currentUser?.email
  });

  authService.logout();
  $user.set(null);
  $error.set(null);
  
  logger.info('Logout complete', { correlationId });
}

/**
 * Clear any auth errors
 */
export function clearError(): void {
  $error.set(null);
}

/**
 * Get current user (synchronous)
 */
export function getCurrentUser(): User | null {
  return $user.get();
}

/**
 * Check if user is authenticated (synchronous)
 */
export function isAuthenticated(): boolean {
  return $isAuthenticated.get();
}

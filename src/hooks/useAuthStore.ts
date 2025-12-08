import { useStore } from '@nanostores/react';
import { $user, $isLoading, $error, $isAuthenticated, login, logout, clearError } from '../stores/authStore';

/**
 * React hook to use auth store in components
 * 
 * This is a thin wrapper around Nanostores that provides a React-friendly API
 * similar to the old useAuth hook from AuthContext.
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { user, isLoading, login, logout } = useAuthStore();
 *   
 *   if (isLoading) return <div>Loading...</div>;
 *   
 *   return user ? (
 *     <button onClick={logout}>Logout</button>
 *   ) : (
 *     <button onClick={() => login(email, password)}>Login</button>
 *   );
 * }
 * ```
 */
export function useAuthStore() {
  const user = useStore($user);
  const isLoading = useStore($isLoading);
  const error = useStore($error);
  const isAuthenticated = useStore($isAuthenticated);

  return {
    user,
    isLoading,
    error,
    isAuthenticated,
    login,
    logout,
    clearError
  };
}

/**
 * Token debugging utility
 * Add this to browser console to debug token issues
 */

export function debugToken() {
  // Only run in browser
  if (typeof window === 'undefined') {
    return;
  }
  
  const token = localStorage.getItem('auth_token');
  
  if (!token) {
    // eslint-disable-next-line no-console
    console.log('❌ No token found in localStorage');
    return;
  }

  try {
    // Decode JWT payload
    const payload = JSON.parse(atob(token.split('.')[1]));
    const now = Math.floor(Date.now() / 1000);
    const exp = payload.exp;
    const iat = payload.iat;
    
    // eslint-disable-next-line no-console
    console.log('🔍 Token Debug Info:');
    // eslint-disable-next-line no-console
    console.log('Token:', token.substring(0, 50) + '...');
    // eslint-disable-next-line no-console
    console.log('Issued at (iat):', new Date(iat * 1000).toLocaleString());
    // eslint-disable-next-line no-console
    console.log('Expires at (exp):', new Date(exp * 1000).toLocaleString());
    // eslint-disable-next-line no-console
    console.log('Current time:', new Date().toLocaleString());
    // eslint-disable-next-line no-console
    console.log('Time remaining:', Math.max(0, exp - now), 'seconds');
    // eslint-disable-next-line no-console
    console.log('Is expired:', exp < now);
    // eslint-disable-next-line no-console
    console.log('Full payload:', payload);
    
    // Check localStorage data
    const user = localStorage.getItem('current_user');
    const tokenExpiry = localStorage.getItem('token_expiry');
    
    // eslint-disable-next-line no-console
    console.log('📦 localStorage data:');
    // eslint-disable-next-line no-console
    console.log('current_user:', user ? JSON.parse(user) : 'null');
    // eslint-disable-next-line no-console
    console.log('token_expiry:', tokenExpiry);
    
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('❌ Error decoding token:', error);
  }
}

// Make it available globally for browser console (only in browser)
if (typeof window !== 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).debugToken = debugToken;
}

/**
 * Token debugging utility
 * Add this to browser console to debug token issues
 */

export function debugToken() {
  // Only run in browser
  if (typeof window === 'undefined') return;
  
  const token = localStorage.getItem('auth_token');
  
  if (!token) {
    console.log('❌ No token found in localStorage');
    return;
  }

  try {
    // Decode JWT payload
    const payload = JSON.parse(atob(token.split('.')[1]));
    const now = Math.floor(Date.now() / 1000);
    const exp = payload.exp;
    const iat = payload.iat;
    
    console.log('🔍 Token Debug Info:');
    console.log('Token:', token.substring(0, 50) + '...');
    console.log('Issued at (iat):', new Date(iat * 1000).toLocaleString());
    console.log('Expires at (exp):', new Date(exp * 1000).toLocaleString());
    console.log('Current time:', new Date().toLocaleString());
    console.log('Time remaining:', Math.max(0, exp - now), 'seconds');
    console.log('Is expired:', exp < now);
    console.log('Full payload:', payload);
    
    // Check localStorage data
    const user = localStorage.getItem('current_user');
    const tokenExpiry = localStorage.getItem('token_expiry');
    
    console.log('📦 localStorage data:');
    console.log('current_user:', user ? JSON.parse(user) : 'null');
    console.log('token_expiry:', tokenExpiry);
    
  } catch (error) {
    console.error('❌ Error decoding token:', error);
  }
}

// Make it available globally for browser console (only in browser)
if (typeof window !== 'undefined') {
  (window as any).debugToken = debugToken;
}

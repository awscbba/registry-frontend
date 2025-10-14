/**
 * Browser-compatible logger for Astro pages
 * Works in client-side JavaScript without module imports
 */

// Simple browser logger that works without imports
window.BrowserLogger = {
  debug: function(message, context) {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      console.debug(`[DEBUG] ${message}`, context || '');
    }
  },
  
  info: function(message, context) {
    console.info(`[INFO] ${message}`, context || '');
  },
  
  warn: function(message, context) {
    console.warn(`[WARN] ${message}`, context || '');
  },
  
  error: function(message, context, error) {
    console.error(`[ERROR] ${message}`, context || '', error || '');
  },
  
  logApiRequest: function(method, path, context) {
    this.info(`API Request: ${method} ${path}`, context);
  },
  
  logApiResponse: function(method, path, status, context) {
    const message = `API Response: ${method} ${path} -> ${status}`;
    if (status >= 400) {
      this.error(message, context);
    } else {
      this.info(message, context);
    }
  },
  
  logUserAction: function(action, context) {
    this.info(`User Action: ${action}`, context);
  }
};

// Make it globally available
window.logger = window.BrowserLogger;

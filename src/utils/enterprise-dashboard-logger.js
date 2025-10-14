/**
 * Enterprise Dashboard Logger - Clean Architecture Compliant
 * Follows established enterprise logging patterns for Astro pages
 */

// Enterprise logging service for dashboard
window.EnterpriseDashboardLogger = {
  // Log levels
  LogLevel: {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3
  },

  // Current log level (INFO for production, DEBUG for development)
  currentLevel: window.location.hostname === 'localhost' ? 0 : 1,

  // Structured logging with correlation IDs
  logStructured: function(level, category, message, context, additionalData) {
    if (level < this.currentLevel) return;

    const logEntry = {
      timestamp: new Date().toISOString(),
      level: Object.keys(this.LogLevel)[level],
      category: category,
      message: message,
      correlationId: this.generateCorrelationId(),
      context: context || {},
      additionalData: additionalData || {}
    };

    const method = level >= 3 ? 'error' : level >= 2 ? 'warn' : level >= 1 ? 'info' : 'debug';
    console[method](`[${logEntry.level}] ${logEntry.category}: ${logEntry.message}`, logEntry);
  },

  // Generate correlation ID for request tracking
  generateCorrelationId: function() {
    return 'dash-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  },

  // Enterprise logging methods
  debug: function(message, context, additionalData) {
    this.logStructured(this.LogLevel.DEBUG, 'DASHBOARD', message, context, additionalData);
  },

  info: function(message, context, additionalData) {
    this.logStructured(this.LogLevel.INFO, 'DASHBOARD', message, context, additionalData);
  },

  warn: function(message, context, additionalData) {
    this.logStructured(this.LogLevel.WARN, 'DASHBOARD', message, context, additionalData);
  },

  error: function(message, context, error, additionalData) {
    const errorData = {
      ...additionalData,
      error: error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : null
    };
    this.logStructured(this.LogLevel.ERROR, 'DASHBOARD', message, context, errorData);
  },

  // Specialized enterprise logging methods
  logAuthEvent: function(event, context) {
    this.logStructured(this.LogLevel.INFO, 'AUTHENTICATION', event, context, {
      eventType: 'auth_event',
      timestamp: new Date().toISOString()
    });
  },

  logUserAction: function(action, context) {
    this.logStructured(this.LogLevel.INFO, 'USER_ACTION', action, context, {
      eventType: 'user_action',
      timestamp: new Date().toISOString()
    });
  },

  logApiRequest: function(method, path, context) {
    this.logStructured(this.LogLevel.INFO, 'API_ACCESS', `${method} ${path}`, context, {
      eventType: 'api_request',
      httpMethod: method,
      path: path
    });
  },

  logApiResponse: function(method, path, status, context) {
    const level = status >= 400 ? this.LogLevel.ERROR : this.LogLevel.INFO;
    this.logStructured(level, 'API_ACCESS', `${method} ${path} -> ${status}`, context, {
      eventType: 'api_response',
      httpMethod: method,
      path: path,
      statusCode: status
    });
  }
};

// Make it globally available
window.enterpriseLogger = window.EnterpriseDashboardLogger;
window.dashboardLogger = window.EnterpriseDashboardLogger;

// Export for module imports
export const dashboardLogger = window.EnterpriseDashboardLogger;

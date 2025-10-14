/**
 * Client-side logger integration for Astro pages
 * This file gets bundled by Vite and can be imported in Astro pages
 */

import { getLogger, LogLevel } from '../utils/logger';

// Create pre-configured loggers
const dashboardLogger = getLogger('dashboard', LogLevel.INFO);
const authLogger = getLogger('auth', LogLevel.INFO);
const apiLogger = getLogger('api', LogLevel.INFO);

// Make loggers globally available for Astro pages
declare global {
  interface Window {
    dashboardLogger: typeof dashboardLogger;
    authLogger: typeof authLogger;
    apiLogger: typeof apiLogger;
  }
}

window.dashboardLogger = dashboardLogger;
window.authLogger = authLogger;
window.apiLogger = apiLogger;

export { dashboardLogger, authLogger, apiLogger };

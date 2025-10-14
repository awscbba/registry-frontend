/**
 * Clean Architecture - Domain Layer
 * Logging Service Interface
 */

export interface LogContext {
  [key: string]: any;
}

export interface ILoggingService {
  debug(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, context?: LogContext, error?: Error): void;
  
  // Specialized logging methods
  logApiRequest(method: string, path: string, context?: LogContext): void;
  logApiResponse(method: string, path: string, status: number, context?: LogContext): void;
  logUserAction(action: string, context?: LogContext): void;
  logComponentEvent(component: string, event: string, context?: LogContext): void;
}

export interface ILoggerFactory {
  getLogger(name: string): ILoggingService;
  getServiceLogger(serviceName: string): ILoggingService;
  getComponentLogger(componentName: string): ILoggingService;
  getApiLogger(apiName: string): ILoggingService;
}

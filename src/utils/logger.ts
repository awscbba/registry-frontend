/**
 * Frontend logging utility with structured logging similar to backend
 * Provides consistent logging across the frontend application
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

interface LogContext {
  [key: string]: any;
}

interface LogEntry {
  timestamp: string;
  level: string;
  logger: string;
  message: string;
  context?: LogContext;
  error?: string;
  stack?: string;
}

class FrontendLogger {
  private name: string;
  private minLevel: LogLevel;

  constructor(name: string, minLevel: LogLevel = LogLevel.INFO) {
    this.name = name;
    this.minLevel = minLevel;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.minLevel;
  }

  private formatLogEntry(level: LogLevel, message: string, context?: LogContext, error?: Error): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel[level],
      logger: this.name,
      message,
    };

    if (context && Object.keys(context).length > 0) {
      entry.context = context;
    }

    if (error) {
      entry.error = error.message;
      if (error.stack) {
        entry.stack = error.stack;
      }
    }

    return entry;
  }

  private output(level: LogLevel, entry: LogEntry): void {
    const formattedEntry = JSON.stringify(entry, null, 2);
    
    switch (level) {
      case LogLevel.DEBUG:
        // eslint-disable-next-line no-console
        console.debug(formattedEntry);
        break;
      case LogLevel.INFO:
        // eslint-disable-next-line no-console
        console.info(formattedEntry);
        break;
      case LogLevel.WARN:
        // eslint-disable-next-line no-console
        console.warn(formattedEntry);
        break;
      case LogLevel.ERROR:
        // eslint-disable-next-line no-console
        console.error(formattedEntry);
        break;
    }
  }

  debug(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      const entry = this.formatLogEntry(LogLevel.DEBUG, message, context);
      this.output(LogLevel.DEBUG, entry);
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.INFO)) {
      const entry = this.formatLogEntry(LogLevel.INFO, message, context);
      this.output(LogLevel.INFO, entry);
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.WARN)) {
      const entry = this.formatLogEntry(LogLevel.WARN, message, context);
      this.output(LogLevel.WARN, entry);
    }
  }

  error(message: string, context?: LogContext, error?: Error): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      const entry = this.formatLogEntry(LogLevel.ERROR, message, context, error);
      this.output(LogLevel.ERROR, entry);
    }
  }

  // Specialized logging methods similar to backend
  logApiRequest(method: string, path: string, context?: LogContext): void {
    this.info(`API Request: ${method} ${path}`, {
      event_type: 'api_request',
      http_method: method,
      path,
      ...context,
    });
  }

  logApiResponse(method: string, path: string, status: number, context?: LogContext): void {
    const level = status >= 400 ? LogLevel.ERROR : LogLevel.INFO;
    const message = `API Response: ${method} ${path} -> ${status}`;
    
    const logContext = {
      event_type: 'api_response',
      http_method: method,
      path,
      status_code: status,
      ...context,
    };

    if (level === LogLevel.ERROR) {
      this.error(message, logContext);
    } else {
      this.info(message, logContext);
    }
  }

  logUserAction(action: string, context?: LogContext): void {
    this.info(`User Action: ${action}`, {
      event_type: 'user_action',
      action,
      ...context,
    });
  }

  logComponentEvent(component: string, event: string, context?: LogContext): void {
    this.debug(`Component Event: ${component} - ${event}`, {
      event_type: 'component_event',
      component,
      event,
      ...context,
    });
  }
}

// Logger factory functions
export function getLogger(name: string, minLevel?: LogLevel): FrontendLogger {
  return new FrontendLogger(name, minLevel);
}

export function getServiceLogger(serviceName: string): FrontendLogger {
  return getLogger(`service.${serviceName}`);
}

export function getComponentLogger(componentName: string): FrontendLogger {
  return getLogger(`component.${componentName}`);
}

export function getApiLogger(apiName: string): FrontendLogger {
  return getLogger(`api.${apiName}`);
}

// Development vs Production logging levels
const isDevelopment = import.meta.env.DEV;
export const DEFAULT_LOG_LEVEL = isDevelopment ? LogLevel.DEBUG : LogLevel.INFO;

// Utility function to safely handle unknown errors in catch blocks
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'Unknown error occurred';
}

export function getErrorObject(error: unknown): Error | undefined {
  if (error instanceof Error) {
    return error;
  }
  return undefined;
}

// Pre-configured loggers for common use cases
export const adminLogger = getLogger('admin', DEFAULT_LOG_LEVEL);
export const authLogger = getLogger('auth', DEFAULT_LOG_LEVEL);
export const projectLogger = getLogger('project', DEFAULT_LOG_LEVEL);
export const wsLogger = getLogger('websocket', DEFAULT_LOG_LEVEL);
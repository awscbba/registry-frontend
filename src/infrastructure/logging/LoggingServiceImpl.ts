/**
 * Clean Architecture - Infrastructure Layer
 * Logging Service Implementation
 */

import { ILoggingService, ILoggerFactory, LogContext } from '../../domain/interfaces/ILoggingService';
import { getLogger, LogLevel } from '../../utils/logger';

export class LoggingServiceImpl implements ILoggingService {
  private logger: ReturnType<typeof getLogger>;

  constructor(private name: string, private minLevel: LogLevel = LogLevel.INFO) {
    this.logger = getLogger(name, minLevel);
  }

  debug(message: string, context?: LogContext): void {
    this.logger.debug(message, context);
  }

  info(message: string, context?: LogContext): void {
    this.logger.info(message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.logger.warn(message, context);
  }

  error(message: string, context?: LogContext, error?: Error): void {
    this.logger.error(message, context, error);
  }

  logApiRequest(method: string, path: string, context?: LogContext): void {
    this.logger.logApiRequest(method, path, context);
  }

  logApiResponse(method: string, path: string, status: number, context?: LogContext): void {
    this.logger.logApiResponse(method, path, status, context);
  }

  logUserAction(action: string, context?: LogContext): void {
    this.logger.logUserAction(action, context);
  }

  logComponentEvent(component: string, event: string, context?: LogContext): void {
    this.logger.logComponentEvent(component, event, context);
  }
}

export class LoggerFactoryImpl implements ILoggerFactory {
  private static instance: LoggerFactoryImpl;
  private loggers: Map<string, ILoggingService> = new Map();

  private constructor() {}

  static getInstance(): LoggerFactoryImpl {
    if (!LoggerFactoryImpl.instance) {
      LoggerFactoryImpl.instance = new LoggerFactoryImpl();
    }
    return LoggerFactoryImpl.instance;
  }

  getLogger(name: string): ILoggingService {
    if (!this.loggers.has(name)) {
      const isDevelopment = import.meta.env.DEV;
      const logLevel = isDevelopment ? LogLevel.DEBUG : LogLevel.INFO;
      this.loggers.set(name, new LoggingServiceImpl(name, logLevel));
    }
    return this.loggers.get(name)!;
  }

  getServiceLogger(serviceName: string): ILoggingService {
    return this.getLogger(`service.${serviceName}`);
  }

  getComponentLogger(componentName: string): ILoggingService {
    return this.getLogger(`component.${componentName}`);
  }

  getApiLogger(apiName: string): ILoggingService {
    return this.getLogger(`api.${apiName}`);
  }
}

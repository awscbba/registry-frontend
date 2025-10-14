/**
 * Clean Architecture - Application Layer
 * Logging Facade following Clean Architecture principles
 */

import { ILoggingService, ILoggerFactory } from '../domain/interfaces/ILoggingService';
import { LoggerFactoryImpl } from '../infrastructure/logging/LoggingServiceImpl';

// Dependency Injection Container
class LoggingContainer {
  private static loggerFactory: ILoggerFactory = LoggerFactoryImpl.getInstance();

  static getLoggerFactory(): ILoggerFactory {
    return this.loggerFactory;
  }

  // Allow dependency injection for testing
  static setLoggerFactory(factory: ILoggerFactory): void {
    this.loggerFactory = factory;
  }
}

// Clean Architecture compliant logger functions
export function getCleanLogger(name: string): ILoggingService {
  return LoggingContainer.getLoggerFactory().getLogger(name);
}

export function getCleanServiceLogger(serviceName: string): ILoggingService {
  return LoggingContainer.getLoggerFactory().getServiceLogger(serviceName);
}

export function getCleanComponentLogger(componentName: string): ILoggingService {
  return LoggingContainer.getLoggerFactory().getComponentLogger(componentName);
}

export function getCleanApiLogger(apiName: string): ILoggingService {
  return LoggingContainer.getLoggerFactory().getApiLogger(apiName);
}

// For testing - allows dependency injection
export function setLoggerFactory(factory: ILoggerFactory): void {
  LoggingContainer.setLoggerFactory(factory);
}

// Export types for use in other layers
export type { ILoggingService, ILoggerFactory, LogContext } from '../domain/interfaces/ILoggingService';

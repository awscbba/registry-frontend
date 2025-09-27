import '@testing-library/jest-dom';

// Mock import.meta for Jest - this needs to be done before any imports that use it
const mockImportMeta = {
  env: {
    PUBLIC_API_URL: 'https://2t9blvt2c1.execute-api.us-east-1.amazonaws.com/prod',
    DEV: false,
    PROD: true
  }
};

// Mock import.meta globally
Object.defineProperty(globalThis, 'import', {
  value: {
    meta: mockImportMeta
  },
  writable: true
});

// Also mock it on global for compatibility
(global as any).import = {
  meta: mockImportMeta
};

// Global logger mock
jest.mock('../src/utils/logger', () => {
  const mockLogger = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    logApiCall: jest.fn(),
    logApiRequest: jest.fn(),
    logApiResponse: jest.fn(),
    logApiError: jest.fn(),
    logServiceCall: jest.fn(),
    logServiceResponse: jest.fn(),
    logServiceError: jest.fn(),
    logComponentEvent: jest.fn(),
  };
  
  return {
    getApiLogger: jest.fn(() => mockLogger),
    getServiceLogger: jest.fn(() => mockLogger),
    getComponentLogger: jest.fn(() => mockLogger),
    DEFAULT_LOG_LEVEL: 'INFO',
  };
});

// Setup global mocks
global.fetch = jest.fn();
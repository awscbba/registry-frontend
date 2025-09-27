// Mock logger for Jest tests
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

export const getApiLogger = jest.fn(() => mockLogger);
export const getServiceLogger = jest.fn(() => mockLogger);
export const getComponentLogger = jest.fn(() => mockLogger);
export const DEFAULT_LOG_LEVEL = 'INFO';

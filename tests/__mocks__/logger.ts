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
  logUserAction: jest.fn(),
};

export const getLogger = jest.fn(() => mockLogger);
export const getApiLogger = jest.fn(() => mockLogger);
export const getServiceLogger = jest.fn(() => mockLogger);
export const getComponentLogger = jest.fn(() => mockLogger);
export const getErrorMessage = jest.fn((error: unknown) => {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Unknown error occurred';
});
export const getErrorObject = jest.fn((error: unknown) => {
  if (error instanceof Error) return error;
  return undefined;
});
export const DEFAULT_LOG_LEVEL = 'INFO';

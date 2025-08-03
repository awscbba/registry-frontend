import '@testing-library/jest-dom';

// Mock import.meta for Jest - this needs to be done before any imports that use it
const mockImportMeta = {
  env: {
    PUBLIC_API_URL: 'https://2t9blvt2c1.execute-api.us-east-1.amazonaws.com/prod'
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

// Setup global mocks
global.fetch = jest.fn();
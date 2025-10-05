/** @type {import('jest').Config} */
export default {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^../config/api$': '<rootDir>/tests/__mocks__/api.ts',
    '^../../src/config/api$': '<rootDir>/tests/__mocks__/api.ts',
    '^../utils/logger$': '<rootDir>/tests/__mocks__/logger.ts',
    '^../../src/utils/logger$': '<rootDir>/tests/__mocks__/logger.ts',
    '^../../utils/logger$': '<rootDir>/tests/__mocks__/logger.ts',
    '^../services/authService$': '<rootDir>/tests/__mocks__/authService.ts',
    '^../../src/services/authService$': '<rootDir>/tests/__mocks__/authService.ts',
    '^./authService$': '<rootDir>/tests/__mocks__/authService.ts',
  },
  testMatch: [
    '<rootDir>/tests/**/*.test.{ts,tsx}',
    '<rootDir>/src/**/*.test.{ts,tsx}'
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/env.d.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  globals: {
    'ts-jest': {
      useESM: true,
      tsconfig: 'tsconfig.json'
    },
    'import.meta': {
      env: {
        DEV: false,
        PROD: true
      }
    }
  },
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      useESM: true,
      tsconfig: 'tsconfig.json'
    }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  transformIgnorePatterns: [
    'node_modules/(?!(.*\\.mjs$))'
  ],
  // Handle import.meta
  testEnvironmentOptions: {
    customExportConditions: ['node', 'node-addons']
  }
};
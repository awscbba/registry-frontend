/**
 * Mock Data Utilities for Testing
 * 
 * Provides consistent mock data for tests across the application.
 * Includes user objects, API responses, and other test fixtures.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import { vi } from 'vitest';
import type { User } from '../../types/user';

/**
 * Creates a mock user object for testing
 */
export function createMockUser(overrides: Partial<User> = {}): User {
  return {
    id: 'test-user-id-123',
    email: 'test.user@example.com',
    firstName: 'Test',
    lastName: 'User',
    phone: '+1234567890',
    dateOfBirth: '1990-01-01',
    address: {
      street: '123 Test Street',
      city: 'Test City',
      state: 'Test State',
      country: 'Test Country',
      postalCode: '12345'
    },
    isAdmin: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    isActive: true,
    requirePasswordChange: false,
    lastLoginAt: null,
    failedLoginAttempts: 0,
    ...overrides,
  };
}

/**
 * Creates a mock admin user for testing
 */
export function createMockAdminUser(overrides: Partial<User> = {}): User {
  return createMockUser({
    id: 'admin-user-id-456',
    email: 'admin@example.com',
    firstName: 'Admin',
    lastName: 'User',
    isAdmin: true,
    ...overrides,
  });
}

/**
 * Creates a mock authentication response
 */
export function createMockAuthResponse(user: User, token: string = 'mock-jwt-token') {
  return {
    success: true,
    data: {
      user,
      token,
    },
    version: 'v2',
  };
}

/**
 * Creates a mock project for testing
 */
export function createMockProject(overrides: any = {}) {
  return {
    id: 'test-project-id-123',
    name: 'Test Project',
    description: 'A test project for unit testing',
    status: 'active',
    maxParticipants: 50,
    currentParticipants: 25,
    startDate: '2024-02-01',
    endDate: '2024-12-31',
    createdBy: 'admin-user-id',
    isEnabled: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

/**
 * Creates multiple mock projects with different statuses
 */
export function createMockProjects(count: number = 5) {
  const statuses = ['pending', 'active', 'ongoing', 'completed', 'cancelled'];
  
  return Array.from({ length: count }, (_, index) => 
    createMockProject({
      id: `project-${index + 1}`,
      name: `Project ${index + 1}`,
      status: statuses[index % statuses.length],
    })
  );
}

/**
 * Creates a mock subscription for testing
 */
export function createMockSubscription(overrides: any = {}) {
  return {
    id: 'test-subscription-id-123',
    personId: 'test-user-id-123',
    projectId: 'test-project-id-123',
    personName: 'Test User',
    personEmail: 'test.user@example.com',
    status: 'active',
    notes: 'Test subscription notes',
    emailSent: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

/**
 * Creates multiple mock subscriptions
 */
export function createMockSubscriptions(count: number = 3) {
  return Array.from({ length: count }, (_, index) =>
    createMockSubscription({
      id: `subscription-${index + 1}`,
      personId: `person-${index + 1}`,
      projectId: `project-${index + 1}`,
      personName: `Person ${index + 1}`,
      personEmail: `person${index + 1}@example.com`,
    })
  );
}

/**
 * Creates a mock API error response
 */
export function createMockApiError(status: number = 400, message: string = 'Bad Request') {
  const error = new Error(message);
  (error as any).status = status;
  return error;
}

/**
 * Creates a mock network error
 */
export function createMockNetworkError(message: string = 'Network error') {
  const error = new Error(message);
  (error as any).code = 'NETWORK_ERROR';
  return error;
}

/**
 * Creates a mock timeout error
 */
export function createMockTimeoutError(message: string = 'Request timeout') {
  const error = new Error(message);
  (error as any).code = 'TIMEOUT';
  return error;
}

/**
 * Creates a mock toast notification
 */
export function createMockToast(overrides: any = {}) {
  return {
    id: 'test-toast-id-123',
    type: 'info' as const,
    message: 'Test toast message',
    duration: 5000,
    createdAt: Date.now(),
    ...overrides,
  };
}

/**
 * Creates multiple mock toasts
 */
export function createMockToasts(count: number = 3) {
  const types = ['success', 'error', 'warning', 'info'] as const;
  
  return Array.from({ length: count }, (_, index) =>
    createMockToast({
      id: `toast-${index + 1}`,
      type: types[index % types.length],
      message: `Toast message ${index + 1}`,
    })
  );
}

/**
 * Mock fetch response helper
 */
export function createMockFetchResponse(data: any, status: number = 200, ok: boolean = true) {
  return Promise.resolve({
    ok,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  } as Response);
}

/**
 * Mock fetch error helper
 */
export function createMockFetchError(message: string = 'Fetch error') {
  return Promise.reject(new Error(message));
}

/**
 * Delay helper for testing async operations
 */
export function delay(ms: number = 100) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Creates a mock form event
 */
export function createMockFormEvent(formData: Record<string, string> = {}) {
  const form = document.createElement('form');
  
  Object.entries(formData).forEach(([name, value]) => {
    const input = document.createElement('input');
    input.name = name;
    input.value = value;
    form.appendChild(input);
  });
  
  return {
    preventDefault: vi.fn(),
    target: form,
    currentTarget: form,
  } as any;
}

/**
 * Creates a mock keyboard event
 */
export function createMockKeyboardEvent(key: string, options: any = {}) {
  return {
    key,
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
    ...options,
  } as any;
}

/**
 * Creates a mock mouse event
 */
export function createMockMouseEvent(options: any = {}) {
  return {
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
    clientX: 0,
    clientY: 0,
    ...options,
  } as any;
}
/**
 * Comprehensive tests for field mapping utilities
 * 
 * These tests ensure our field transformations work correctly and handle
 * edge cases gracefully without breaking the application.
 */

import {
  transformSubscription,
  transformSubscriptions,
  transformPerson,
  transformPeople,
  transformFields
} from '../fieldMapping';

import { vi } from 'vitest';

// Mock logger to avoid console output during tests
const mockLogger = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn()
};

vi.mock('../logger', () => ({
  getApiLogger: () => mockLogger
}));

describe('Field Mapping Utilities', () => {
  
  describe('transformSubscription', () => {
    it('should transform snake_case fields to camelCase', () => {
      const input = {
        id: 'sub_123',
        person_id: 'person_456',
        project_id: 'project_789',
        person_name: 'John Doe',
        person_email: 'john@example.com',
        status: 'active',
        email_sent: false,
        created_at: '2024-08-26T10:00:00Z',
        updated_at: '2024-08-26T11:00:00Z',
        notes: 'Test subscription'
      };

      const expected = {
        id: 'sub_123',
        personId: 'person_456',
        projectId: 'project_789',
        personName: 'John Doe',
        personEmail: 'john@example.com',
        status: 'active',
        emailSent: false,
        createdAt: '2024-08-26T10:00:00Z',
        updatedAt: '2024-08-26T11:00:00Z',
        notes: 'Test subscription'
      };

      const result = transformSubscription(input);
      expect(result).toEqual(expected);
    });

    it('should preserve fields that do not need transformation', () => {
      const input = {
        id: 'sub_123',
        status: 'active',
        notes: 'Already camelCase'
      };

      const result = transformSubscription(input);
      expect(result.id).toBe('sub_123');
      expect(result.status).toBe('active');
      expect(result.notes).toBe('Already camelCase');
    });

    it('should handle null and undefined values', () => {
      const input = {
        id: 'sub_123',
        person_id: 'person_456',
        project_id: null,
        person_name: undefined,
        created_at: null,
        status: 'active'
      };

      const result = transformSubscription(input);
      expect(result.projectId).toBeNull();
      expect(result.personName).toBeUndefined();
      expect(result.createdAt).toBeNull();
    });

    it('should handle empty objects gracefully', () => {
      const result = transformSubscription({});
      expect(result).toEqual({});
    });

    it('should handle invalid input gracefully', () => {
      expect(transformSubscription(null)).toBeNull();
      expect(transformSubscription(undefined)).toBeUndefined();
      expect(transformSubscription('string')).toBe('string');
      expect(transformSubscription(123)).toBe(123);
    });
  });

  describe('transformSubscriptions', () => {
    it('should transform array of subscriptions', () => {
      const input = [
        {
          id: 'sub_1',
          person_id: 'person_1',
          project_id: 'project_1',
          status: 'active'
        },
        {
          id: 'sub_2',
          person_id: 'person_2',
          project_id: 'project_2',
          status: 'pending'
        }
      ];

      const result = transformSubscriptions(input);
      
      expect(result).toHaveLength(2);
      expect(result[0].personId).toBe('person_1');
      expect(result[0].projectId).toBe('project_1');
      expect(result[1].personId).toBe('person_2');
      expect(result[1].projectId).toBe('project_2');
    });

    it('should handle empty arrays', () => {
      const result = transformSubscriptions([]);
      expect(result).toEqual([]);
    });

    it('should handle invalid input gracefully', () => {
      expect(transformSubscriptions(null as any)).toBeNull();
      expect(transformSubscriptions(undefined as any)).toBeUndefined();
      expect(transformSubscriptions('not-array' as any)).toBe('not-array');
    });

    it('should handle arrays with mixed valid/invalid items', () => {
      const input = [
        { id: 'sub_1', person_id: 'person_1', status: 'active' },
        null,
        { id: 'sub_2', person_id: 'person_2', status: 'pending' },
        undefined,
        'invalid-item'
      ];

      const result = transformSubscriptions(input);
      
      expect(result).toHaveLength(5);
      expect(result[0].personId).toBe('person_1');
      expect(result[1]).toBeNull();
      expect(result[2].personId).toBe('person_2');
      expect(result[3]).toBeUndefined();
      expect(result[4]).toBe('invalid-item');
    });
  });

  describe('transformPerson', () => {
    it('should transform person snake_case fields to camelCase', () => {
      const input = {
        id: 'person_123',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        birth_date: '1990-01-01',
        join_date: '2024-01-01',
        is_active: true,
        linkedin_url: 'https://linkedin.com/in/johndoe',
        created_at: '2024-08-26T10:00:00Z',
        updated_at: '2024-08-26T11:00:00Z'
      };

      const expected = {
        id: 'person_123',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        birthDate: '1990-01-01',
        joinDate: '2024-01-01',
        isActive: true,
        linkedinUrl: 'https://linkedin.com/in/johndoe',
        createdAt: '2024-08-26T10:00:00Z',
        updatedAt: '2024-08-26T11:00:00Z'
      };

      const result = transformPerson(input);
      expect(result).toEqual(expected);
    });

    it('should handle person with minimal fields', () => {
      const input = {
        id: 'person_123',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com'
      };

      const result = transformPerson(input);
      expect(result.firstName).toBe('John');
      expect(result.lastName).toBe('Doe');
      expect(result.email).toBe('john@example.com');
    });
  });

  describe('transformPeople', () => {
    it('should transform array of people', () => {
      const input = [
        {
          id: 'person_1',
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@example.com'
        },
        {
          id: 'person_2',
          first_name: 'Jane',
          last_name: 'Smith',
          email: 'jane@example.com'
        }
      ];

      const result = transformPeople(input);
      
      expect(result).toHaveLength(2);
      expect(result[0].firstName).toBe('John');
      expect(result[0].lastName).toBe('Doe');
      expect(result[1].firstName).toBe('Jane');
      expect(result[1].lastName).toBe('Smith');
    });
  });

  describe('transformFields (generic)', () => {
    it('should transform with custom field mapping', () => {
      const customMapping = {
        'custom_field': 'customField',
        'another_field': 'anotherField'
      };

      const input = {
        id: '123',
        custom_field: 'value1',
        another_field: 'value2',
        normalField: 'value3'
      };

      const result = transformFields(input, customMapping);
      
      expect(result.customField).toBe('value1');
      expect(result.anotherField).toBe('value2');
      expect(result.normalField).toBe('value3');
    });

    it('should handle arrays with custom mapping', () => {
      const customMapping = {
        'snake_field': 'snakeField'
      };

      const input = [
        { id: '1', snake_field: 'value1' },
        { id: '2', snake_field: 'value2' }
      ];

      const result = transformFields(input, customMapping);
      
      expect(Array.isArray(result)).toBe(true);
      expect((result as any[])[0].snakeField).toBe('value1');
      expect((result as any[])[1].snakeField).toBe('value2');
    });
  });



  describe('Edge Cases and Error Handling', () => {
    it('should handle deeply nested objects', () => {
      const input = {
        id: 'test',
        person_id: 'person_123',
        nested: {
          deep_field: 'value', // This won't be transformed (only top-level)
          deeper: {
            very_deep: 'value'
          }
        }
      };

      const result = transformSubscription(input);
      
      expect(result.personId).toBe('person_123');
      expect(result.nested.deep_field).toBe('value'); // Nested fields not transformed
    });

    it('should handle circular references gracefully', () => {
      const input: any = {
        id: 'test',
        person_id: 'person_123'
      };
      input.circular = input; // Create circular reference

      // Should not throw error
      expect(() => transformSubscription(input)).not.toThrow();
    });

    it('should handle objects with prototype pollution attempts', () => {
      const input = {
        id: 'test',
        person_id: 'person_123',
        '__proto__': { malicious: 'value' },
        'constructor': { malicious: 'value' }
      };

      const result = transformSubscription(input);
      
      expect(result.personId).toBe('person_123');
      // Prototype pollution fields should be treated as regular fields
    });

    it('should handle very large arrays efficiently', () => {
      const largeArray = Array.from({ length: 1000 }, (_, i) => ({
        id: `sub_${i}`,
        person_id: `person_${i}`,
        project_id: `project_${i}`,
        status: 'active'
      }));

      const start = Date.now();
      const result = transformSubscriptions(largeArray);
      const duration = Date.now() - start;

      expect(result).toHaveLength(1000);
      expect(result[0].personId).toBe('person_0');
      expect(result[999].personId).toBe('person_999');
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });
  });

  describe('Real-world API Response Scenarios', () => {
    it('should handle typical subscription API response', () => {
      const apiResponse = {
        success: true,
        data: [
          {
            id: "3ef6dd1f-1e15-4509-8989-866a2bb56fcf",
            person_id: "c5378259-7b78-4150-9227-1f3580ebf334",
            project_id: "aee5829f-eda2-43db-9d38-9da763c68e5d",
            person_name: "Unknown",
            person_email: "unknown@example.com",
            status: "pending",
            notes: null,
            email_sent: false,
            created_at: null,
            updated_at: null
          }
        ]
      };

      const transformedData = transformSubscriptions(apiResponse.data);
      
      expect(transformedData[0]).toEqual({
        id: "3ef6dd1f-1e15-4509-8989-866a2bb56fcf",
        personId: "c5378259-7b78-4150-9227-1f3580ebf334",
        projectId: "aee5829f-eda2-43db-9d38-9da763c68e5d",
        personName: "Unknown",
        personEmail: "unknown@example.com",
        status: "pending",
        notes: null,
        emailSent: false,
        createdAt: null,
        updatedAt: null
      });
    });

    it('should handle mixed API response with some camelCase fields', () => {
      // Some APIs might return mixed naming conventions
      const input = {
        id: 'sub_123',
        person_id: 'person_456',    // snake_case
        projectId: 'project_789',   // already camelCase
        person_name: 'John Doe',    // snake_case
        status: 'active',           // no change needed
        emailSent: true,            // already camelCase
        created_at: '2024-01-01'    // snake_case
      };

      const result = transformSubscription(input);
      
      expect(result).toEqual({
        id: 'sub_123',
        personId: 'person_456',
        projectId: 'project_789',
        personName: 'John Doe',
        status: 'active',
        emailSent: true,
        createdAt: '2024-01-01'
      });
    });
  });
});
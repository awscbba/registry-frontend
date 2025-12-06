/**
 * Tests for project utility functions
 */

import { nameToSlug, formatProjectDate } from '../projectUtils';

describe('projectUtils', () => {
  describe('nameToSlug', () => {
    it('should convert project name to lowercase slug', () => {
      expect(nameToSlug('AWS Community Day 2024')).toBe('aws-community-day-2024');
    });

    it('should remove special characters', () => {
      expect(nameToSlug('Project #1: Test!')).toBe('project-1-test');
    });

    it('should replace spaces with hyphens', () => {
      expect(nameToSlug('My New Project')).toBe('my-new-project');
    });

    it('should replace multiple hyphens with single hyphen', () => {
      expect(nameToSlug('Project  -  Name')).toBe('project-name');
    });

    it('should remove leading and trailing dashes', () => {
      expect(nameToSlug('  -Project Name-  ')).toBe('project-name');
    });

    it('should handle empty string', () => {
      expect(nameToSlug('')).toBe('');
    });

    it('should handle string with only special characters', () => {
      expect(nameToSlug('!@#$%^&*()')).toBe('');
    });
  });

  describe('formatProjectDate', () => {
    it('should format valid date string', () => {
      const result = formatProjectDate('2024-12-25');
      // Should return Spanish locale formatted date
      expect(result).toContain('diciembre');
      expect(result).toContain('2024');
    });

    it('should handle undefined date', () => {
      expect(formatProjectDate(undefined)).toBe('No definida');
    });

    it('should handle null date', () => {
      expect(formatProjectDate(null as any)).toBe('No definida');
    });

    it('should handle empty string', () => {
      expect(formatProjectDate('')).toBe('No definida');
    });
  });
});

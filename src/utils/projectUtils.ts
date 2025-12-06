/**
 * Project utility functions for handling project-related operations
 */

import { formatDateLocale } from './dateUtils';

/**
 * Convert a project name to a URL-friendly slug
 * @param name - Project name to convert
 * @returns URL-friendly slug
 * 
 * @example
 * nameToSlug('AWS Community Day 2024') // 'aws-community-day-2024'
 * nameToSlug('Project #1: Test!') // 'project-1-test'
 */
export function nameToSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-+|-+$/g, '') // Remove leading and trailing dashes
    .trim();
}

/**
 * Format a project date for display
 * @param dateString - Date string to format (optional)
 * @returns Formatted date string in Spanish locale
 * 
 * @example
 * formatProjectDate('2024-12-25') // '25 de diciembre de 2024'
 * formatProjectDate(undefined) // 'No definida'
 */
export function formatProjectDate(dateString?: string): string {
  return formatDateLocale(dateString, 'es-ES');
}

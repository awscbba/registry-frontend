/**
 * Field Mapping Utilities
 * 
 * Handles snake_case to camelCase conversion for backend API responses.
 * 
 * Architecture Decision: We maintain snake_case in backend APIs and transform
 * to camelCase in frontend to avoid risky backend migrations.
 */

import { getApiLogger } from './logger';

const logger = getApiLogger('fieldMapping');

// Field mapping configurations
const SUBSCRIPTION_FIELD_MAP: Record<string, string> = {
  'person_id': 'personId',
  'project_id': 'projectId', 
  'person_name': 'personName',
  'person_email': 'personEmail',
  'email_sent': 'emailSent',
  'created_at': 'createdAt',
  'updated_at': 'updatedAt'
} as const;

const PERSON_FIELD_MAP: Record<string, string> = {
  'first_name': 'firstName',
  'last_name': 'lastName',
  'date_of_birth': 'dateOfBirth',
  'birth_date': 'birthDate',
  'join_date': 'joinDate',
  'is_active': 'isActive',
  'linkedin_url': 'linkedinUrl',
  'twitter_url': 'twitterUrl',
  'github_url': 'githubUrl',
  'website_url': 'websiteUrl',
  'created_at': 'createdAt',
  'updated_at': 'updatedAt'
} as const;

/**
 * Transform field names from snake_case to camelCase
 */
function transformFieldNames<T>(
  obj: any, 
  fieldMap: Record<string, string>
): T {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    return obj;
  }

  const transformed: any = {};
  
  try {
    for (const [key, value] of Object.entries(obj)) {
      const mappedKey = fieldMap[key] || key;
      transformed[mappedKey] = value;
    }
    return transformed as T;
  } catch (error) {
    logger.error('Error transforming field names', {
      error: error instanceof Error ? error.message : String(error)
    });
    return obj; // Return original on error
  }
}

/**
 * Transform array of objects from snake_case to camelCase
 */
function transformFieldNamesArray<T>(
  array: any[], 
  fieldMap: Record<string, string>
): T[] {
  if (!Array.isArray(array)) {
    return array;
  }

  try {
    return array.map(obj => transformFieldNames<T>(obj, fieldMap));
  } catch (error) {
    logger.error('Error transforming array field names', {
      error: error instanceof Error ? error.message : String(error)
    });
    return array; // Return original array on error
  }
}

/**
 * Transform subscription objects from snake_case to camelCase
 * 
 * @param subscription - Single subscription object from API
 * @returns Transformed subscription with camelCase fields
 */
export function transformSubscription(subscription: any): any {
  return transformFieldNames(subscription, SUBSCRIPTION_FIELD_MAP);
}

export function transformSubscriptions(subscriptions: any[]): any[] {
  return transformFieldNamesArray(subscriptions, SUBSCRIPTION_FIELD_MAP);
}

export function transformPerson(person: any): any {
  return transformFieldNames(person, PERSON_FIELD_MAP);
}

export function transformPeople(people: any[]): any[] {
  return transformFieldNamesArray(people, PERSON_FIELD_MAP);
}

/**
 * Generic field transformation utility
 */
export function transformFields<T>(
  data: any, 
  fieldMap: Record<string, string>
): T {
  if (Array.isArray(data)) {
    return transformFieldNamesArray<T>(data, fieldMap) as T;
  } else {
    return transformFieldNames<T>(data, fieldMap);
  }
}
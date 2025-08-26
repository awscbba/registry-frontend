/**
 * Field mapping utilities to handle snake_case to camelCase conversion
 * for backend API responses that use inconsistent naming conventions
 */

// Field mapping for Subscription objects
const SUBSCRIPTION_FIELD_MAP: Record<string, string> = {
  'person_id': 'personId',
  'project_id': 'projectId', 
  'person_name': 'personName',
  'person_email': 'personEmail',
  'email_sent': 'emailSent',
  'created_at': 'createdAt',
  'updated_at': 'updatedAt'
};

// Field mapping for Person objects (when needed)
const PERSON_FIELD_MAP: Record<string, string> = {
  'first_name': 'firstName',
  'last_name': 'lastName',
  'date_of_birth': 'dateOfBirth',
  'created_at': 'createdAt',
  'updated_at': 'updatedAt'
};

/**
 * Transforms snake_case field names to camelCase for a single object
 */
function transformFieldNames<T>(obj: any, fieldMap: Record<string, string>): T {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  const transformed: any = {};
  
  for (const [key, value] of Object.entries(obj)) {
    const mappedKey = fieldMap[key] || key;
    transformed[mappedKey] = value;
  }
  
  return transformed as T;
}

/**
 * Transforms snake_case field names to camelCase for an array of objects
 */
function transformFieldNamesArray<T>(array: any[], fieldMap: Record<string, string>): T[] {
  if (!Array.isArray(array)) {
    return array;
  }
  
  return array.map(obj => transformFieldNames<T>(obj, fieldMap));
}

/**
 * Transform subscription objects from snake_case to camelCase
 */
export function transformSubscription(subscription: any): any {
  return transformFieldNames(subscription, SUBSCRIPTION_FIELD_MAP);
}

/**
 * Transform array of subscription objects from snake_case to camelCase
 */
export function transformSubscriptions(subscriptions: any[]): any[] {
  return transformFieldNamesArray(subscriptions, SUBSCRIPTION_FIELD_MAP);
}

/**
 * Transform person objects from snake_case to camelCase
 */
export function transformPerson(person: any): any {
  return transformFieldNames(person, PERSON_FIELD_MAP);
}

/**
 * Transform array of person objects from snake_case to camelCase
 */
export function transformPeople(people: any[]): any[] {
  return transformFieldNamesArray(people, PERSON_FIELD_MAP);
}

/**
 * Generic field transformation utility
 */
export function transformFields<T>(data: any, fieldMap: Record<string, string>): T {
  if (Array.isArray(data)) {
    return transformFieldNamesArray<T>(data, fieldMap) as T;
  } else {
    return transformFieldNames<T>(data, fieldMap);
  }
}
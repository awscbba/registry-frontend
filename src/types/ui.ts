/**
 * Shared UI utilities and constants
 */

// Standardized button class names following AWS design patterns
export const BUTTON_CLASSES = {
  // Primary actions
  PRIMARY: 'btn-primary',
  SECONDARY: 'btn-secondary',
  
  // Specific actions
  SUBMIT: 'btn-submit',
  CANCEL: 'btn-cancel',
  DELETE: 'btn-delete',
  EDIT: 'btn-edit',
  CREATE: 'btn-create',
  
  // Navigation
  BACK: 'btn-back',
  ADMIN: 'btn-admin',
  
  // States
  LOADING: 'btn-loading',
  DISABLED: 'btn-disabled',
  
  // Sizes
  SMALL: 'btn-sm',
  LARGE: 'btn-lg',
  
  // Special actions
  SUBSCRIBE: 'btn-subscribe',
  RETRY: 'btn-retry',
} as const;

// Loading states
export const LOADING_STATES = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
} as const;

export type LoadingState = typeof LOADING_STATES[keyof typeof LOADING_STATES];

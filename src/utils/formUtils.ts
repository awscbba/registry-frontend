/**
 * Shared form utilities for consistent form handling across components
 */

import type { ChangeEvent, FormEvent } from 'react';

/**
 * Generic form data type
 */
export type FormData = Record<string, any>;

/**
 * Form validation result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

/**
 * Form field configuration
 */
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'date' | 'textarea' | 'number';
  required?: boolean;
  placeholder?: string;
  validation?: (value: any) => string | null;
}

/**
 * Generic input change handler
 */
export function createInputChangeHandler<T extends FormData>(
  setFormData: (updater: (prev: T) => T) => void
) {
  return (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? '' : Number(value)) : value
    }));
  };
}

/**
 * Generic form submit handler
 */
export function createSubmitHandler<T extends FormData>(
  formData: T,
  onSubmit: (data: T) => Promise<void>,
  validation?: (data: T) => ValidationResult
) {
  return async (e: FormEvent) => {
    e.preventDefault();
    
    // Validate if validation function provided
    if (validation) {
      const result = validation(formData);
      if (!result.isValid) {
        // Handle validation errors (could be enhanced with error state)
        console.warn('Form validation failed:', result.errors);
        return;
      }
    }
    
    try {
      await onSubmit(formData);
    } catch (error) {
      // Error handling is managed by parent component
      throw error;
    }
  };
}

/**
 * Email validation utility
 */
export function validateEmail(email: string): string | null {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) return 'Email es requerido';
  if (!emailRegex.test(email)) return 'Email no es válido';
  return null;
}

/**
 * Phone validation utility
 */
export function validatePhone(phone: string): string | null {
  const phoneRegex = /^\+?[\d\s\-\(\)]{8,}$/;
  if (!phone) return 'Teléfono es requerido';
  if (!phoneRegex.test(phone)) return 'Teléfono no es válido';
  return null;
}

/**
 * Required field validation
 */
export function validateRequired(value: any, fieldName: string): string | null {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return `${fieldName} es requerido`;
  }
  return null;
}

/**
 * Date validation utility
 */
export function validateDate(date: string): string | null {
  if (!date) return 'Fecha es requerida';
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) return 'Fecha no es válida';
  return null;
}

/**
 * Generic form validator
 */
export function validateForm<T extends FormData>(
  data: T,
  fields: FormField[]
): ValidationResult {
  const errors: Record<string, string> = {};
  
  for (const field of fields) {
    const value = data[field.name];
    
    // Check required fields
    if (field.required) {
      const requiredError = validateRequired(value, field.label);
      if (requiredError) {
        errors[field.name] = requiredError;
        continue;
      }
    }
    
    // Skip validation if field is empty and not required
    if (!value) continue;
    
    // Type-specific validation
    switch (field.type) {
      case 'email':
        const emailError = validateEmail(value);
        if (emailError) errors[field.name] = emailError;
        break;
      case 'tel':
        const phoneError = validatePhone(value);
        if (phoneError) errors[field.name] = phoneError;
        break;
      case 'date':
        const dateError = validateDate(value);
        if (dateError) errors[field.name] = dateError;
        break;
    }
    
    // Custom validation
    if (field.validation) {
      const customError = field.validation(value);
      if (customError) errors[field.name] = customError;
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Reset form data to initial state
 */
export function resetForm<T extends FormData>(
  initialData: T,
  setFormData: (data: T) => void
) {
  setFormData({ ...initialData });
}

/**
 * Check if form has changes
 */
export function hasFormChanges<T extends FormData>(
  currentData: T,
  initialData: T
): boolean {
  return JSON.stringify(currentData) !== JSON.stringify(initialData);
}

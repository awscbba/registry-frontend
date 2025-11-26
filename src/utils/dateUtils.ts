/**
 * Date utility functions to handle timezone-safe date formatting
 */

/**
 * Format a date string (YYYY-MM-DD) for display without timezone conversion
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns Formatted date string (YYYY-MM-DD)
 */
export function formatDateDisplay(dateString: string | undefined | null): string {
  if (!dateString) {
    return 'No especificada';
  }
  
  // Extract just the date part (YYYY-MM-DD) to avoid timezone issues
  const datePart = dateString.split('T')[0];
  return datePart || 'No especificada';
}

/**
 * Format a date string with locale-specific formatting
 * @param dateString - Date string in YYYY-MM-DD format
 * @param locale - Locale string (default: 'es-ES')
 * @returns Formatted date string in locale format
 */
export function formatDateLocale(
  dateString: string | undefined | null,
  locale: string = 'es-ES'
): string {
  if (!dateString) {
    return 'No definida';
  }
  
  // Parse as local date to avoid timezone shifts
  const datePart = dateString.split('T')[0];
  if (!datePart) {
    return 'No definida';
  }
  
  const parts = datePart.split('-');
  if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) {
    return 'No definida';
  }
  
  const year = parts[0];
  const month = parts[1];
  const day = parts[2];
  const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
  
  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format a timestamp for display
 * @param timestamp - ISO timestamp string
 * @param locale - Locale string (default: 'es-ES')
 * @returns Formatted date and time string
 */
export function formatTimestamp(
  timestamp: string | undefined | null,
  locale: string = 'es-ES'
): string {
  if (!timestamp) {
    return 'No disponible';
  }
  
  const date = new Date(timestamp);
  return date.toLocaleDateString(locale);
}

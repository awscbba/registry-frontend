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
  return dateString.split('T')[0];
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
  const [year, month, day] = dateString.split('T')[0].split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  
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

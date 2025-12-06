import { useState, useMemo } from 'react';

/**
 * Configuration options for the usePagination hook
 */
interface UsePaginationOptions {
  /** Number of items to display per page */
  itemsPerPage: number;
  /** Whether to scroll to top when page changes */
  scrollToTop?: boolean;
  /** Scroll behavior when changing pages */
  scrollBehavior?: ScrollBehavior;
}

/**
 * Return type for the usePagination hook
 */
interface UsePaginationReturn<T> {
  /** Current page number (1-indexed) */
  currentPage: number;
  /** Items to display on the current page */
  currentItems: T[];
  /** Total number of pages */
  totalPages: number;
  /** Function to change to a specific page */
  goToPage: (page: number) => void;
  /** Function to go to the next page */
  nextPage: () => void;
  /** Function to go to the previous page */
  previousPage: () => void;
  /** Whether there is a next page available */
  hasNextPage: boolean;
  /** Whether there is a previous page available */
  hasPreviousPage: boolean;
}

/**
 * Custom hook for managing pagination state and logic
 * 
 * @template T - The type of items being paginated
 * @param items - Array of items to paginate
 * @param options - Configuration options for pagination
 * @returns Pagination state and control functions
 * 
 * @example
 * ```tsx
 * const { currentItems, currentPage, totalPages, goToPage } = usePagination(
 *   projects,
 *   { itemsPerPage: 6, scrollToTop: true }
 * );
 * ```
 */
export function usePagination<T>(
  items: T[],
  options: UsePaginationOptions
): UsePaginationReturn<T> {
  const { itemsPerPage, scrollToTop = false, scrollBehavior = 'smooth' } = options;
  
  const [currentPage, setCurrentPage] = useState(1);

  // Calculate pagination values
  const totalPages = useMemo(
    () => Math.ceil(items.length / itemsPerPage),
    [items.length, itemsPerPage]
  );

  const currentItems = useMemo(() => {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return items.slice(indexOfFirstItem, indexOfLastItem);
  }, [items, currentPage, itemsPerPage]);

  const hasNextPage = currentPage < totalPages;
  const hasPreviousPage = currentPage > 1;

  /**
   * Navigate to a specific page
   */
  const goToPage = (page: number) => {
    // Ensure page is within valid range
    const validPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(validPage);

    if (scrollToTop) {
      window.scrollTo({ top: 0, behavior: scrollBehavior });
    }
  };

  /**
   * Navigate to the next page
   */
  const nextPage = () => {
    if (hasNextPage) {
      goToPage(currentPage + 1);
    }
  };

  /**
   * Navigate to the previous page
   */
  const previousPage = () => {
    if (hasPreviousPage) {
      goToPage(currentPage - 1);
    }
  };

  return {
    currentPage,
    currentItems,
    totalPages,
    goToPage,
    nextPage,
    previousPage,
    hasNextPage,
    hasPreviousPage,
  };
}

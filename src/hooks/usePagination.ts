import { useState, useMemo } from 'react';
import { getLogger } from '../utils/logger';

const logger = getLogger('hooks.usePagination');

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
 * Custom hook for managing pagination state and logic.
 * 
 * Features:
 * - Page state management (currentPage, totalPages)
 * - Navigation functions (goToPage, nextPage, previousPage)
 * - Items-per-page configuration
 * - Optional scroll-to-top on page change
 * - Computes current page items efficiently with useMemo
 * - SSR-safe (guards against window access)
 * - Structured logging for debugging
 * 
 * @template T - The type of items being paginated
 * @param items - Array of items to paginate
 * @param options - Configuration options for pagination
 * @returns Pagination state and control functions
 * 
 * @example
 * ```tsx
 * function ProjectList({ projects }: { projects: Project[] }) {
 *   const {
 *     currentItems,
 *     currentPage,
 *     totalPages,
 *     goToPage,
 *     nextPage,
 *     previousPage,
 *     hasNextPage,
 *     hasPreviousPage
 *   } = usePagination(projects, {
 *     itemsPerPage: 6,
 *     scrollToTop: true,
 *     scrollBehavior: 'smooth'
 *   });
 * 
 *   return (
 *     <div>
 *       <div className="projects-grid">
 *         {currentItems.map(project => (
 *           <ProjectCard key={project.id} project={project} />
 *         ))}
 *       </div>
 *       
 *       <div className="pagination">
 *         <button onClick={previousPage} disabled={!hasPreviousPage}>
 *           Previous
 *         </button>
 *         <span>Page {currentPage} of {totalPages}</span>
 *         <button onClick={nextPage} disabled={!hasNextPage}>
 *           Next
 *         </button>
 *       </div>
 *     </div>
 *   );
 * }
 * ```
 */
export function usePagination<T>(
  items: T[],
  options: UsePaginationOptions
): UsePaginationReturn<T> {
  const { itemsPerPage, scrollToTop = false, scrollBehavior = 'smooth' } = options;
  
  const [currentPage, setCurrentPage] = useState(1);

  // Calculate total pages (memoized for performance)
  const totalPages = useMemo(() => {
    const pages = Math.ceil(items.length / itemsPerPage);
    logger.info('Pagination calculated', {
      totalItems: items.length,
      itemsPerPage,
      totalPages: pages
    });
    return pages;
  }, [items.length, itemsPerPage]);

  // Calculate current page items (memoized for performance)
  const currentItems = useMemo(() => {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const pageItems = items.slice(indexOfFirstItem, indexOfLastItem);
    
    logger.info('Current page items computed', {
      currentPage,
      itemsOnPage: pageItems.length,
      startIndex: indexOfFirstItem,
      endIndex: indexOfLastItem
    });
    
    return pageItems;
  }, [items, currentPage, itemsPerPage]);

  const hasNextPage = currentPage < totalPages;
  const hasPreviousPage = currentPage > 1;

  /**
   * Navigate to a specific page
   */
  const goToPage = (page: number) => {
    // Ensure page is within valid range
    const validPage = Math.max(1, Math.min(page, totalPages));
    
    if (validPage !== currentPage) {
      logger.info('Navigating to page', {
        fromPage: currentPage,
        toPage: validPage,
        requestedPage: page
      });
      
      setCurrentPage(validPage);

      // SSR guard - only scroll in browser
      if (scrollToTop && typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: scrollBehavior });
      }
    }
  };

  /**
   * Navigate to the next page
   */
  const nextPage = () => {
    if (hasNextPage) {
      logger.info('Navigating to next page', {
        currentPage,
        nextPage: currentPage + 1
      });
      goToPage(currentPage + 1);
    }
  };

  /**
   * Navigate to the previous page
   */
  const previousPage = () => {
    if (hasPreviousPage) {
      logger.info('Navigating to previous page', {
        currentPage,
        previousPage: currentPage - 1
      });
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

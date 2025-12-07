import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { projectApi } from '../services/projectApi';
import type { Project } from '../types/project';
import { getLogger } from '../utils/logger';

const logger = getLogger('hooks.useProjects');

/**
 * Return type for the useProjects hook
 */
interface UseProjectsReturn {
  /** All available projects (pending and active status) */
  projects: Project[];
  /** Projects with 'ongoing' status */
  ongoingProjects: Project[];
  /** Loading state indicator */
  isLoading: boolean;
  /** Error message if fetch failed */
  error: string | null;
  /** Function to manually refresh projects */
  refreshProjects: () => Promise<void>;
  /** Timestamp of last successful fetch */
  lastFetchedAt: Date | null;
}

/**
 * Custom hook for managing project data fetching and state.
 * 
 * Enterprise-grade implementation with:
 * - Memory leak prevention via cleanup
 * - Race condition handling via request cancellation
 * - Structured logging with correlation IDs
 * - Performance optimization (single-pass filtering with useMemo)
 * - Data freshness tracking
 * - Fetches public projects (no authentication required)
 * 
 * @returns {UseProjectsReturn} Project data, loading state, error state, refresh function, and metadata
 * 
 * @example
 * ```tsx
 * function ProjectList() {
 *   const { projects, ongoingProjects, isLoading, error, refreshProjects, lastFetchedAt } = useProjects();
 *   
 *   if (isLoading) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error}</div>;
 *   
 *   return (
 *     <div>
 *       <h2>Available Projects ({projects.length})</h2>
 *       {projects.map(project => (
 *         <ProjectCard key={project.id} project={project} />
 *       ))}
 *       
 *       <h2>Ongoing Projects ({ongoingProjects.length})</h2>
 *       {ongoingProjects.map(project => (
 *         <ProjectCard key={project.id} project={project} />
 *       ))}
 *       
 *       <button onClick={refreshProjects}>Refresh</button>
 *       {lastFetchedAt && <p>Last updated: {lastFetchedAt.toLocaleString()}</p>}
 *     </div>
 *   );
 * }
 * ```
 */
export function useProjects(): UseProjectsReturn {
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchedAt, setLastFetchedAt] = useState<Date | null>(null);
  
  // Track if component is mounted to prevent memory leaks
  const isMountedRef = useRef(true);
  
  // Track current request ID to handle race conditions
  const currentRequestIdRef = useRef(0);

  const fetchProjects = useCallback(async () => {
    // Generate unique request ID for race condition handling
    const requestId = ++currentRequestIdRef.current;
    const correlationId = `useProjects-${Date.now()}-${requestId}`;
    
    logger.info('Starting project fetch', { 
      correlationId,
      requestId,
      timestamp: new Date().toISOString()
    });

    setIsLoading(true);
    setError(null);

    try {
      // Use getPublicProjects() for unauthenticated access
      const fetchedProjects = await projectApi.getPublicProjects();
      
      // Check if this is still the latest request and component is mounted
      if (!isMountedRef.current || requestId !== currentRequestIdRef.current) {
        logger.info('Request cancelled or component unmounted', { 
          correlationId,
          requestId,
          currentRequestId: currentRequestIdRef.current,
          isMounted: isMountedRef.current
        });
        return;
      }

      logger.info('Projects fetched successfully', {
        correlationId,
        requestId,
        totalCount: fetchedProjects.length,
        timestamp: new Date().toISOString()
      });

      setAllProjects(fetchedProjects);
      setLastFetchedAt(new Date());
      
    } catch (err) {
      // Check if component is still mounted
      if (!isMountedRef.current) {
        logger.info('Error occurred but component unmounted', { correlationId });
        return;
      }
      
      const errorMessage = err instanceof Error ? err.message : 'Failed to load projects';
      
      logger.error('Failed to fetch projects', {
        correlationId,
        requestId,
        error: errorMessage,
        timestamp: new Date().toISOString()
      });
      
      setError(errorMessage);
      
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  // Fetch projects on mount with cleanup
  useEffect(() => {
    fetchProjects();
    
    // Cleanup function to prevent memory leaks
    return () => {
      isMountedRef.current = false;
      logger.info('useProjects hook unmounting', {
        timestamp: new Date().toISOString()
      });
    };
  }, [fetchProjects]);

  // Single-pass filtering with useMemo for performance optimization
  const { projects, ongoingProjects } = useMemo(() => {
    const available: Project[] = [];
    const ongoing: Project[] = [];
    
    for (const project of allProjects) {
      if (project.status === 'pending' || project.status === 'active') {
        available.push(project);
      } else if (project.status === 'ongoing' || project.status === 'completed') {
        ongoing.push(project);
      }
    }
    
    logger.info('Projects filtered', {
      availableCount: available.length,
      ongoingCount: ongoing.length,
      totalCount: allProjects.length
    });
    
    return { projects: available, ongoingProjects: ongoing };
  }, [allProjects]);

  const refreshProjects = useCallback(async () => {
    logger.info('Manually refreshing projects');
    await fetchProjects();
  }, [fetchProjects]);

  return {
    projects,
    ongoingProjects,
    isLoading,
    error,
    refreshProjects,
    lastFetchedAt,
  };
}

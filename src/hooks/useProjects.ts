import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { projectApi } from '../services/projectApi';
import type { Project } from '../types/project';
import { getLogger, getErrorMessage, getErrorObject } from '../utils/logger';

const logger = getLogger('hooks.useProjects');

interface UseProjectsReturn {
  projects: Project[];
  ongoingProjects: Project[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Custom hook for managing project data fetching and state
 * 
 * Fetches all projects and separates them into:
 * - projects: Available projects (pending/active status)
 * - ongoingProjects: Projects currently in progress (ongoing status)
 * 
 * @returns {UseProjectsReturn} Project data, loading state, error state, and refetch function
 */
export function useProjects(): UseProjectsReturn {
  const [projects, setProjects] = useState<Project[]>([]);
  const [ongoingProjects, setOngoingProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Track if component is mounted to prevent memory leaks
  const isMountedRef = useRef(true);
  
  // Track current request to handle race conditions
  const currentRequestIdRef = useRef(0);

  const loadProjects = useCallback(async () => {
    // Generate unique request ID for race condition handling
    const requestId = ++currentRequestIdRef.current;
    const correlationId = `useProjects-${Date.now()}-${requestId}`;
    
    logger.debug('Starting project fetch', { 
      correlationId,
      requestId,
      timestamp: new Date().toISOString()
    });

    setIsLoading(true);
    setError(null);

    try {
      const allProjects = await projectApi.getAllProjects();
      
      // Check if this is still the latest request and component is mounted
      if (!isMountedRef.current || requestId !== currentRequestIdRef.current) {
        logger.debug('Request cancelled or component unmounted', { 
          correlationId,
          requestId,
          currentRequestId: currentRequestIdRef.current,
          isMounted: isMountedRef.current
        });
        return;
      }
      
      // Single-pass filtering for better performance
      const { available, ongoing } = allProjects.reduce<{
        available: Project[];
        ongoing: Project[];
      }>(
        (acc, project) => {
          if (project.status === 'pending' || project.status === 'active') {
            acc.available.push(project);
          } else if (project.status === 'ongoing') {
            acc.ongoing.push(project);
          }
          return acc;
        },
        { available: [], ongoing: [] }
      );

      logger.info('Projects fetched successfully', {
        correlationId,
        requestId,
        availableCount: available.length,
        ongoingCount: ongoing.length,
        totalCount: allProjects.length,
        timestamp: new Date().toISOString()
      });

      setProjects(available);
      setOngoingProjects(ongoing);
      
    } catch (err) {
      // Check if component is still mounted
      if (!isMountedRef.current) {
        logger.debug('Error occurred but component unmounted', { correlationId });
        return;
      }
      
      const errorMessage = getErrorMessage(err);
      const errorObject = getErrorObject(err);
      
      // Structured error logging following project standards
      logger.error('Failed to fetch projects', {
        correlationId,
        requestId,
        error: errorMessage,
        errorType: errorObject ? errorObject.constructor.name : typeof err,
        timestamp: new Date().toISOString()
      }, errorObject);
      
      setError(errorMessage);
      
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  // Load projects on mount with cleanup
  useEffect(() => {
    loadProjects();
    
    // Cleanup function to prevent memory leaks
    return () => {
      isMountedRef.current = false;
      logger.debug('useProjects hook unmounting', {
        timestamp: new Date().toISOString()
      });
    };
  }, [loadProjects]);

  // Provide refetch function for manual refresh
  const refetch = useCallback(async () => {
    logger.debug('Manual refetch triggered', {
      timestamp: new Date().toISOString()
    });
    await loadProjects();
  }, [loadProjects]);

  // Sort projects by startDate (most recent first), fallback to createdAt
  const sortedProjects = useMemo(() => {
    return [...projects].sort((a, b) => {
      const dateA = a.startDate ? new Date(a.startDate).getTime() : new Date(a.createdAt).getTime();
      const dateB = b.startDate ? new Date(b.startDate).getTime() : new Date(b.createdAt).getTime();
      return dateB - dateA; // Most recent first
    });
  }, [projects]);

  // Sort ongoing projects by startDate (most recent first), fallback to createdAt
  const sortedOngoingProjects = useMemo(() => {
    return [...ongoingProjects].sort((a, b) => {
      const dateA = a.startDate ? new Date(a.startDate).getTime() : new Date(a.createdAt).getTime();
      const dateB = b.startDate ? new Date(b.startDate).getTime() : new Date(b.createdAt).getTime();
      return dateB - dateA; // Most recent first
    });
  }, [ongoingProjects]);

  return {
    projects: sortedProjects,
    ongoingProjects: sortedOngoingProjects,
    isLoading,
    error,
    refetch,
  };
}

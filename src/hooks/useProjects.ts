import { useState, useEffect, useCallback } from 'react';
import { projectApi } from '../services/projectApi';
import type { Project } from '../types/project';
import { getLogger } from '../utils/logger';

const logger = getLogger('hooks.useProjects');

/**
 * Custom hook to manage project fetching and state.
 * 
 * Features:
 * - Fetches public projects (no authentication required)
 * - Loading state management
 * - Error handling with user-safe messages
 * - Race condition prevention
 * - Memory leak prevention
 * - Structured logging for debugging
 * 
 * @returns {Object} Projects data, loading state, error state, and refresh function
 * 
 * @example
 * function ProjectList() {
 *   const { projects, isLoading, error, refreshProjects } = useProjects();
 *   
 *   if (isLoading) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error}</div>;
 *   
 *   return (
 *     <div>
 *       {projects.map(project => (
 *         <ProjectCard key={project.id} project={project} />
 *       ))}
 *       <button onClick={refreshProjects}>Refresh</button>
 *     </div>
 *   );
 * }
 */
export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = useCallback(async (isMountedRef: { current: boolean }) => {
    try {
      setIsLoading(true);
      setError(null);
      
      logger.info('Fetching public projects');
      
      // Use getPublicProjects() for unauthenticated access
      const fetchedProjects = await projectApi.getPublicProjects();
      
      // Only update state if component is still mounted
      if (isMountedRef.current) {
        setProjects(fetchedProjects);
        logger.info('Projects fetched successfully', {
          count: fetchedProjects.length,
        });
      }
    } catch (err) {
      // Only update state if component is still mounted
      if (isMountedRef.current) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load projects';
        setError(errorMessage);
        logger.error('Failed to fetch projects', { error: errorMessage });
      }
    } finally {
      // Only update state if component is still mounted
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  // Fetch projects on mount
  useEffect(() => {
    const isMountedRef = { current: true };
    
    fetchProjects(isMountedRef);
    
    // Cleanup function to prevent memory leaks
    return () => {
      isMountedRef.current = false;
    };
  }, [fetchProjects]);

  const refreshProjects = useCallback(() => {
    logger.info('Manually refreshing projects');
    const isMountedRef = { current: true };
    fetchProjects(isMountedRef);
  }, [fetchProjects]);

  return {
    projects,
    isLoading,
    error,
    refreshProjects,
  };
}

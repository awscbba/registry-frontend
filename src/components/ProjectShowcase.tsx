import { useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useLoginModal } from '../hooks/useLoginModal';
import { useProjects } from '../hooks/useProjects';
import { usePagination } from '../hooks/usePagination';
import type { Project } from '../types/project';
import { BUTTON_CLASSES } from '../types/ui';
import { debugToken } from '../utils/tokenDebug';
import { nameToSlug } from '../utils/projectUtils';
import LoginForm from './LoginForm';
import ProjectShowcaseHeader from './ProjectShowcaseHeader';
import ProjectsSection from './ProjectsSection';
import styles from './ProjectShowcase.module.css';

/**
 * View mode for displaying projects
 */
type ViewMode = 'cards' | 'list' | 'icons';

/**
 * ProjectShowcase component
 * 
 * Main component for displaying available and ongoing projects.
 * Provides project browsing, filtering, and subscription functionality.
 * 
 * Features:
 * - Displays available projects (pending/active status)
 * - Displays ongoing projects (ongoing status)
 * - Pagination for both project lists
 * - Multiple view modes (cards, list, icons)
 * - Authentication integration
 * - Login modal for unauthenticated users
 * - Project subscription navigation
 * - Loading and error states
 * - Toast notifications for user feedback
 * 
 * Architecture:
 * - Uses custom hooks for state management (useAuth, useToast, useLoginModal, useProjects, usePagination)
 * - Follows separation of concerns principle
 * - Optimized with useCallback for event handlers
 * 
 * @returns {JSX.Element} Project showcase component
 */
export default function ProjectShowcase() {
  // Use custom hooks for state management
  const { user, isAuthenticated, logout } = useAuth();
  const { showToast } = useToast();
  const { isOpen: showLoginForm, open: openLoginModal, close: closeLoginModal } = useLoginModal();
  const { projects, ongoingProjects, isLoading, error, refetch } = useProjects();
  
  // Local UI state
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  
  // Pagination for available projects
  const {
    currentPage,
    currentItems: currentProjects,
    totalPages,
    goToPage: handlePageChange,
    nextPage,
    previousPage,
    hasNextPage,
    hasPreviousPage,
  } = usePagination(projects, { itemsPerPage: 6, scrollToTop: true });

  // Pagination for ongoing projects
  const {
    currentPage: ongoingCurrentPage,
    currentItems: currentOngoingProjects,
    totalPages: totalOngoingPages,
    goToPage: handleOngoingPageChange,
    nextPage: nextOngoingPage,
    previousPage: previousOngoingPage,
    hasNextPage: hasNextOngoingPage,
    hasPreviousPage: hasPreviousOngoingPage,
  } = usePagination(ongoingProjects, { itemsPerPage: 6, scrollToTop: false });

  const handleLoginSuccess = useCallback(() => {
    closeLoginModal();
    showToast('Inicio de sesión exitoso', 'success');
    refetch();
  }, [closeLoginModal, showToast, refetch]);

  const handleLoginClick = useCallback(() => {
    openLoginModal();
  }, [openLoginModal]);

  const getProjectSlug = useCallback((project: Project): string => {
    return nameToSlug(project.name);
  }, []);

  const handleSubscribeClick = useCallback((project: Project) => {
    const slug = getProjectSlug(project);
    showToast(`Redirigiendo a suscripción de ${project.name}...`, 'info');
    window.location.href = `/subscribe/${slug}/`;
  }, [getProjectSlug, showToast]);

  const handleAdminClick = useCallback(() => {
    showToast('Redirigiendo al panel de administración...', 'info');
    window.location.href = '/admin/';
  }, [showToast]);

  const handleLogout = useCallback(async () => {
    try {
      logout();
      showToast('Sesión cerrada exitosamente', 'success');
      window.location.href = '/';
    } catch {
      window.location.href = '/';
    }
  }, [logout, showToast]);

  const handleRefetch = useCallback(() => {
    showToast('Recargando proyectos...', 'info');
    refetch();
  }, [showToast, refetch]);

  // Show login form if user clicked login button
  if (showLoginForm) {
    return <LoginForm onLoginSuccess={handleLoginSuccess} />;
  }

  if (isLoading) {
    return (
      <div className={styles.projectShowcase}>
        <div className={styles.container}>
          <div className={styles.loadingState}>
            <div className={styles.loadingSpinner}></div>
            <p>Cargando proyectos activos...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.projectShowcase}>
        <div className={styles.container}>
          <div className={styles.errorState}>
            <div className={styles.errorIcon}>
              <svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3>Error al cargar proyectos</h3>
            <p>{error}</p>
            <button onClick={handleRefetch} className={BUTTON_CLASSES.RETRY}>
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.projectShowcase}>
      <div className={styles.container}>
        {/* Header with conditional Admin and Login/Logout Buttons */}
        <ProjectShowcaseHeader
          isAuthenticated={isAuthenticated}
          user={user}
          onAdminClick={handleAdminClick}
          onDebugToken={() => debugToken()}
          onLogout={handleLogout}
          onLoginClick={handleLoginClick}
        />

        {/* Projects Section */}
        {projects.length === 0 && ongoingProjects.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <svg width="64" height="64" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3>No hay proyectos disponibles</h3>
            <p>Actualmente no hay proyectos disponibles para registro.</p>
          </div>
        ) : (
          <>
            {/* Available Projects Section */}
            {projects.length > 0 && (
              <ProjectsSection
                title={`Proyectos Disponibles para Suscripción (${projects.length})`}
                description="Selecciona un proyecto para ver más detalles y suscribirte"
                projects={currentProjects}
                viewMode={viewMode}
                currentPage={currentPage}
                totalPages={totalPages}
                hasNextPage={hasNextPage}
                hasPreviousPage={hasPreviousPage}
                onViewModeChange={setViewMode}
                onSubscribeClick={handleSubscribeClick}
                onNextPage={nextPage}
                onPreviousPage={previousPage}
                onPageChange={handlePageChange}
              />
            )}

            {/* Ongoing Projects Section */}
            {ongoingProjects.length > 0 && (
              <ProjectsSection
                title={`Proyectos en Curso (${ongoingProjects.length})`}
                description="Estos proyectos están actualmente en desarrollo y no aceptan nuevas suscripciones"
                projects={currentOngoingProjects}
                viewMode={viewMode}
                currentPage={ongoingCurrentPage}
                totalPages={totalOngoingPages}
                hasNextPage={hasNextOngoingPage}
                hasPreviousPage={hasPreviousOngoingPage}
                isOngoing={true}
                onViewModeChange={setViewMode}
                onSubscribeClick={handleSubscribeClick}
                onNextPage={nextOngoingPage}
                onPreviousPage={previousOngoingPage}
                onPageChange={handleOngoingPageChange}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

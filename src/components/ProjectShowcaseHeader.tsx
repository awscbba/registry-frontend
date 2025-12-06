import type { User } from '../services/authService';
import { BUTTON_CLASSES } from '../types/ui';
import styles from './ProjectShowcase.module.css';

interface ProjectShowcaseHeaderProps {
  isAuthenticated: boolean;
  user: User | null;
  onAdminClick: () => void;
  onDebugToken: () => void;
  onLogout: () => void;
  onLoginClick: () => void;
}

export default function ProjectShowcaseHeader({
  isAuthenticated,
  user,
  onAdminClick,
  onDebugToken,
  onLogout,
  onLoginClick,
}: ProjectShowcaseHeaderProps) {
  return (
    <div className={styles.headerSection}>
      <div className={styles.headerContent}>
        <div className={styles.headerText}>
          <h1>Proyectos Activos</h1>
          <p>Descubre y únete a los proyectos de la comunidad AWS User Group Cochabamba</p>
          {isAuthenticated && user && (
            <p className={styles.userInfo}>
              Bienvenido, {user.firstName} {user.lastName}
            </p>
          )}
        </div>
        <nav className={styles.headerActions} aria-label="Acciones principales">
          {isAuthenticated ? (
            <>
              {user?.role === 'admin' && (
                <button 
                  onClick={onAdminClick} 
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      onAdminClick();
                    }
                  }}
                  className={BUTTON_CLASSES.ADMIN} 
                  aria-label="Ir al panel de administración"
                >
                  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Administración
                </button>
              )}
              <button 
                onClick={onDebugToken} 
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    onDebugToken();
                  }
                }}
                className="btn-secondary" 
                style={{marginRight: '10px'}} 
                aria-label="Depurar token de autenticación"
              >
                🔍 Debug Token
              </button>
              <button 
                onClick={onLogout} 
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    onLogout();
                  }
                }}
                className="btn-logout" 
                aria-label="Cerrar sesión"
              >
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Cerrar Sesión
              </button>
            </>
          ) : (
            <button 
              onClick={onLoginClick} 
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  onLoginClick();
                }
              }}
              className="btn-login" 
              aria-label="Iniciar sesión"
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              Iniciar Sesión
            </button>
          )}
        </nav>
      </div>
    </div>
  );
}

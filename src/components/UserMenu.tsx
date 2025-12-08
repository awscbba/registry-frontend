import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../hooks/useAuthStore';
import { useToastStore } from '../hooks/useToastStore';

export default function UserMenu() {
  const { user, logout } = useAuthStore();
  const { showSuccessToast } = useToastStore();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLElement>(null);

  useEffect(() => {
    // Close menu when clicking outside
    const handleClickOutside = (event: Event) => {
      const target = event.target as HTMLElement;
      if (menuRef.current && !menuRef.current.contains(target)) {
        setIsOpen(false);
      }
    };

    // Handle keyboard navigation
    const handleKeyDown = (event: any) => {
      if (!isOpen) {
        return;
      }

      switch (event.key) {
        case 'Escape': {
          setIsOpen(false);
          // Return focus to menu button
          const menuButton = document.getElementById('user-menu-button');
          menuButton?.focus();
          break;
        }
        case 'ArrowDown':
          event.preventDefault();
          focusNextMenuItem();
          break;
        case 'ArrowUp':
          event.preventDefault();
          focusPreviousMenuItem();
          break;
        case 'Home':
          event.preventDefault();
          focusFirstMenuItem();
          break;
        case 'End':
          event.preventDefault();
          focusLastMenuItem();
          break;
      }
    };

    if (typeof window !== 'undefined') {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleKeyDown);
      }
    };
  }, [isOpen]);

  const handleLogout = () => {
    logout();
    showSuccessToast('Sesión cerrada exitosamente');
    window.location.href = '/';
  };

  // Keyboard navigation helper functions
  const getMenuItems = () => {
    if (!menuRef.current) {
      return [];
    }
    return Array.from(menuRef.current.querySelectorAll('.dropdown-item')) as HTMLElement[];
  };

  const focusNextMenuItem = () => {
    const items = getMenuItems();
    const currentIndex = items.findIndex(item => item === document.activeElement);
    const nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
    items[nextIndex]?.focus();
  };

  const focusPreviousMenuItem = () => {
    const items = getMenuItems();
    const currentIndex = items.findIndex(item => item === document.activeElement);
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
    items[prevIndex]?.focus();
  };

  const focusFirstMenuItem = () => {
    const items = getMenuItems();
    items[0]?.focus();
  };

  const focusLastMenuItem = () => {
    const items = getMenuItems();
    items[items.length - 1]?.focus();
  };

  const handleMenuButtonKeyDown = (event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowDown':
      case 'Enter':
      case ' ': // Space key
        event.preventDefault();
        setIsOpen(true);
        // Focus first menu item after opening
        setTimeout(() => focusFirstMenuItem(), 0);
        break;
      case 'ArrowUp':
        event.preventDefault();
        setIsOpen(true);
        // Focus last menu item after opening
        setTimeout(() => focusLastMenuItem(), 0);
        break;
    }
  };

  if (!user) {
    return (
      <div className="user-menu-container">
        <div className="auth-buttons">
          <a 
            href="/register" 
            className="register-button"
            aria-label="Ir a página de registro"
          >
            Registrarse
          </a>
          <a 
            href="/login" 
            className="login-button"
            aria-label="Ir a página de inicio de sesión"
          >
            Iniciar Sesión
          </a>
        </div>
        <style jsx>{`
          .user-menu-container {
            position: relative;
          }

          .auth-buttons {
            display: flex;
            align-items: center;
            gap: 12px;
          }

          .register-button,
          .login-button {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 16px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            font-size: 14px;
            transition: all 0.2s;
            white-space: nowrap;
          }

          .register-button {
            background: transparent;
            color: white;
            border: 2px solid var(--secondary-color, #FF9900);
          }

          .register-button:hover {
            background: rgba(255, 153, 0, 0.1);
            transform: translateY(-1px);
          }

          .login-button {
            background: var(--secondary-color, #FF9900);
            color: var(--primary-color, #161d2b);
            border: 2px solid var(--secondary-color, #FF9900);
          }

          .login-button:hover {
            opacity: 0.9;
            transform: translateY(-1px);
          }

          @media (max-width: 768px) {
            .auth-buttons {
              flex-direction: column;
              width: 100%;
              gap: 8px;
            }

            .register-button,
            .login-button {
              width: 100%;
              justify-content: center;
              min-height: 44px;
            }
          }
        `}</style>
      </div>
    );
  }

  const getInitials = () => {
    const first = user.firstName?.charAt(0) || '';
    const last = user.lastName?.charAt(0) || '';
    return (first + last).toUpperCase() || user.email.charAt(0).toUpperCase();
  };

  return (
    <div className="user-menu-container" ref={menuRef}>
      <button
        id="user-menu-button"
        className="user-menu-button"
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleMenuButtonKeyDown}
        aria-label="Menú de usuario"
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        <div className="user-avatar">
          {getInitials()}
        </div>
        <span className="user-name">
          {user.firstName || user.email}
        </span>
        <svg
          className={`chevron ${isOpen ? 'open' : ''}`}
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
        >
          <path
            d="M4 6L8 10L12 6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {isOpen && (
        <div 
          className="dropdown-menu"
          role="menu"
          aria-labelledby="user-menu-button"
        >
          <div className="dropdown-header">
            <div className="user-info">
              <div className="user-name-full">
                {user.firstName} {user.lastName}
              </div>
              <div className="user-email">{user.email}</div>
            </div>
          </div>

          <div className="dropdown-divider"></div>

          <a 
            href="/dashboard" 
            className="dropdown-item"
            role="menuitem"
            tabIndex={0}
            aria-label="Ir a mi perfil de usuario"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                window.location.href = '/dashboard';
              }
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M8 8C9.65685 8 11 6.65685 11 5C11 3.34315 9.65685 2 8 2C6.34315 2 5 3.34315 5 5C5 6.65685 6.34315 8 8 8Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M14 14C14 11.7909 11.3137 10 8 10C4.68629 10 2 11.7909 2 14"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Mi Perfil
          </a>

          {user.isAdmin && (
            <a 
              href="/admin" 
              className="dropdown-item"
              role="menuitem"
              tabIndex={0}
              aria-label="Ir al panel de administración"
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  window.location.href = '/admin';
                }
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path
                  d="M13 2H3C2.44772 2 2 2.44772 2 3V13C2 13.5523 2.44772 14 3 14H13C13.5523 14 14 13.5523 14 13V3C14 2.44772 13.5523 2 13 2Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M2 6H14"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Panel Admin
            </a>
          )}

          <div className="dropdown-divider"></div>

          <button 
            onClick={handleLogout} 
            className="dropdown-item logout"
            role="menuitem"
            tabIndex={0}
            aria-label="Cerrar sesión y salir de la aplicación"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleLogout();
              }
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M6 14H3C2.44772 14 2 13.5523 2 13V3C2 2.44772 2.44772 2 3 2H6"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M11 11L14 8L11 5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M14 8H6"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Cerrar Sesión
          </button>
        </div>
      )}

      <style jsx>{`
        .user-menu-container {
          position: relative;
        }

        .user-menu-button {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 6px 12px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          color: white;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 14px;
        }

        .user-menu-button:hover {
          background: rgba(255, 255, 255, 0.15);
        }

        .user-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--secondary-color, #FF9900);
          color: var(--primary-color, #161d2b);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 13px;
        }

        .user-name {
          font-weight: 500;
          max-width: 120px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .chevron {
          transition: transform 0.2s;
        }

        .chevron.open {
          transform: rotate(180deg);
        }

        .dropdown-menu {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          min-width: 220px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          overflow: hidden;
          z-index: 1000;
          animation: slideDown 0.2s ease-out;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .dropdown-header {
          padding: 16px;
          background: #f9fafb;
        }

        .user-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .user-name-full {
          font-weight: 600;
          color: #1f2937;
          font-size: 14px;
        }

        .user-email {
          font-size: 12px;
          color: #6b7280;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .dropdown-divider {
          height: 1px;
          background: #e5e7eb;
        }

        .dropdown-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          color: #374151;
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
          transition: background 0.2s;
          border: none;
          background: none;
          width: 100%;
          text-align: left;
          cursor: pointer;
        }

        .dropdown-item:hover {
          background: #f3f4f6;
        }

        .dropdown-item.logout {
          color: #dc2626;
        }

        .dropdown-item.logout:hover {
          background: #fef2f2;
        }

        @media (max-width: 768px) {
          .user-name {
            display: none;
          }

          .user-menu-button {
            padding: 6px;
          }

          .dropdown-menu {
            right: -10px;
          }
        }
      `}</style>
    </div>
  );
}

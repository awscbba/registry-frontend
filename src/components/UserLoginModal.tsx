import { useState } from 'react';
import { authService, type LoginRequest } from '../services/authService';
import ForgotPasswordModal from './ForgotPasswordModal';

interface UserLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
  projectName?: string;
  message?: string;
}

export default function UserLoginModal({ 
  isOpen, 
  onClose, 
  onLoginSuccess, 
  projectName,
  message 
}: UserLoginModalProps) {
  const [formData, setFormData] = useState<LoginRequest>({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const result = await authService.login(formData);
      
      if (result.success) {
        // Reset form
        setFormData({ email: '', password: '' });
        
        // Dispatch auth state change event for other components
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('authStateChanged'));
        }
        
        onLoginSuccess();
      } else {
        setError(result.message || 'Login failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({ email: '', password: '' });
    setError(null);
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div 
      className="modal-overlay" 
      onClick={handleClose}
      onKeyDown={(e) => e.key === 'Escape' && handleClose()}
      role="dialog"
      tabIndex={-1}
    >
      <div 
        className="modal-content user-login-modal" 
        onClick={e => e.stopPropagation()}
        onKeyDown={(e) => e.key === 'Escape' && e.stopPropagation()}
        role="document"
        tabIndex={0}
      >
        <div className="modal-header">
          <h2>Iniciar Sesión</h2>
          <button 
            className="modal-close-button" 
            onClick={handleClose}
            aria-label="Cerrar modal"
          >
            ×
          </button>
        </div>

        <div className="modal-body">
          {message && (
            <div className="login-message">
              <div className="message-icon">ℹ️</div>
              <p>{message}</p>
            </div>
          )}

          {projectName && (
            <div className="project-context">
              <p>Para suscribirte a <strong>{projectName}</strong>, necesitas iniciar sesión con tu cuenta existente.</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="email">Email *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                disabled={isLoading}
                placeholder="tu@email.com"
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Contraseña *</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                disabled={isLoading}
                placeholder="Tu contraseña"
                autoComplete="current-password"
              />
              <div className="forgot-password-link">
                <button
                  type="button"
                  className="link-button"
                  onClick={() => setShowForgotPassword(true)}
                  disabled={isLoading}
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            </div>

            {error && (
              <div className="error-message">
                <div className="error-icon">⚠️</div>
                <p>{error}</p>
              </div>
            )}

            <div className="form-actions">
              <button
                type="button"
                onClick={handleClose}
                className="button-secondary"
                disabled={isLoading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="button-primary"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="spinner"></div>
                    Iniciando sesión...
                  </>
                ) : (
                  'Iniciar Sesión'
                )}
              </button>
            </div>
          </form>

          <div className="login-help">
            <p className="help-text">
              ¿No tienes cuenta? Puedes crear una nueva cuenta completando el formulario de suscripción con un email diferente.
            </p>
          </div>
        </div>

        <ForgotPasswordModal
          isOpen={showForgotPassword}
          onClose={() => setShowForgotPassword(false)}
        />

        <style jsx>{`
          .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            padding: 20px;
          }

          .modal-content {
            background: white;
            border-radius: 1rem;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
            max-width: 450px;
            width: 100%;
            max-height: 90vh;
            overflow-y: auto;
          }

          .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 2rem 2rem 0 2rem;
            margin-bottom: 1.5rem;
          }

          .modal-header h2 {
            margin: 0;
            color: #232F3E;
            font-size: 2rem;
            font-weight: 700;
          }

          .modal-close-button {
            background: none;
            border: none;
            font-size: 28px;
            cursor: pointer;
            color: #666;
            padding: 4px;
            line-height: 1;
            transition: color 0.2s;
          }

          .modal-close-button:hover {
            color: #232F3E;
          }

          .modal-body {
            padding: 0 2rem 2rem 2rem;
          }

          .login-message {
            display: flex;
            align-items: flex-start;
            gap: 12px;
            background: #fff3cd;
            border: 1px solid #ffc107;
            border-radius: 0.5rem;
            padding: 1rem;
            margin-bottom: 1.5rem;
          }

          .message-icon {
            font-size: 20px;
            flex-shrink: 0;
          }

          .login-message p {
            margin: 0;
            color: #856404;
            line-height: 1.5;
          }

          .project-context {
            background: #fff3e0;
            border-radius: 0.5rem;
            padding: 1rem;
            margin-bottom: 1.5rem;
            border-left: 4px solid #FF9900;
          }

          .project-context p {
            margin: 0;
            color: #232F3E;
            line-height: 1.5;
          }

          .login-form {
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
          }

          .form-group {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
          }

          .form-group label {
            font-weight: 600;
            color: #232F3E;
            font-size: 0.875rem;
          }

          .form-group input {
            padding: 0.75rem;
            border: 2px solid #e5e7eb;
            border-radius: 0.5rem;
            font-size: 1rem;
            transition: border-color 0.2s ease;
          }

          .form-group input:focus {
            outline: none;
            border-color: #FF9900;
            box-shadow: 0 0 0 3px rgba(255, 153, 0, 0.1);
          }

          .form-group input:disabled {
            background-color: #f9fafb;
            cursor: not-allowed;
          }

          .forgot-password-link {
            text-align: right;
            margin-top: 4px;
          }

          .link-button {
            background: none;
            border: none;
            color: #FF9900;
            cursor: pointer;
            font-size: 14px;
            text-decoration: underline;
            padding: 0;
            transition: color 0.2s;
          }

          .link-button:hover:not(:disabled) {
            color: #E88B00;
          }

          .link-button:disabled {
            color: #9ca3af;
            cursor: not-allowed;
          }

          .error-message {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            background: #fef2f2;
            border: 1px solid #fecaca;
            border-radius: 0.5rem;
            padding: 0.75rem;
          }

          .error-icon {
            color: #dc2626;
            font-size: 18px;
            flex-shrink: 0;
          }

          .error-message p {
            margin: 0;
            color: #dc2626;
            font-size: 0.875rem;
            line-height: 1.5;
          }

          .form-actions {
            display: flex;
            gap: 12px;
            justify-content: flex-end;
            margin-top: 8px;
          }

          .button-secondary {
            padding: 1rem;
            border: 2px solid #e5e7eb;
            background: white;
            color: #232F3E;
            border-radius: 0.5rem;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
          }

          .button-secondary:hover:not(:disabled) {
            background: #f9fafb;
            border-color: #232F3E;
          }

          .button-primary {
            padding: 1rem;
            background: #FF9900;
            color: white;
            border: none;
            border-radius: 0.5rem;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
          }

          .button-primary:hover:not(:disabled) {
            background: #E88B00;
            transform: translateY(-1px);
            box-shadow: 0 4px 8px rgba(255, 153, 0, 0.3);
          }

          .button-primary:disabled,
          .button-secondary:disabled {
            opacity: 0.7;
            cursor: not-allowed;
            transform: none;
          }

          .spinner {
            width: 16px;
            height: 16px;
            border: 2px solid transparent;
            border-top: 2px solid currentColor;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }

          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          .login-help {
            margin-top: 1.5rem;
            padding-top: 1.5rem;
            border-top: 1px solid #e5e7eb;
          }

          .help-text {
            margin: 0;
            color: #666;
            font-size: 14px;
            line-height: 1.5;
            text-align: center;
          }

          @media (max-width: 640px) {
            .modal-content {
              margin: 20px;
              max-width: none;
            }

            .modal-header {
              padding: 1.5rem 1.5rem 0 1.5rem;
            }

            .modal-header h2 {
              font-size: 1.5rem;
            }

            .modal-body {
              padding: 0 1.5rem 1.5rem 1.5rem;
            }

            .form-actions {
              flex-direction: column;
            }

            .button-secondary,
            .button-primary {
              width: 100%;
            }
          }
        `}</style>
      </div>
    </div>
  );
}

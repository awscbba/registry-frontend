import { useState } from 'react';
import { authService, type LoginRequest } from '../services/authService';

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

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content user-login-modal" onClick={e => e.stopPropagation()}>
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
                {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              </button>
            </div>
          </form>

          <div className="login-help">
            <p className="help-text">
              ¿No tienes cuenta? Puedes crear una nueva cuenta completando el formulario de suscripción con un email diferente.
            </p>
          </div>
        </div>

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
            border-radius: 12px;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            max-width: 500px;
            width: 100%;
            max-height: 90vh;
            overflow-y: auto;
          }

          .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 24px 24px 0 24px;
            border-bottom: 1px solid #e5e7eb;
            margin-bottom: 24px;
          }

          .modal-header h2 {
            margin: 0;
            color: #1f2937;
            font-size: 1.5rem;
            font-weight: 600;
          }

          .modal-close-button {
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: #6b7280;
            padding: 4px;
            line-height: 1;
          }

          .modal-close-button:hover {
            color: #374151;
          }

          .modal-body {
            padding: 0 24px 24px 24px;
          }

          .login-message {
            display: flex;
            align-items: flex-start;
            gap: 12px;
            background: #dbeafe;
            border: 1px solid #93c5fd;
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 20px;
          }

          .message-icon {
            font-size: 20px;
            flex-shrink: 0;
          }

          .login-message p {
            margin: 0;
            color: #1e40af;
            line-height: 1.5;
          }

          .project-context {
            background: #f3f4f6;
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 24px;
          }

          .project-context p {
            margin: 0;
            color: #374151;
            line-height: 1.5;
          }

          .login-form {
            display: flex;
            flex-direction: column;
            gap: 20px;
          }

          .form-group {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }

          .form-group label {
            font-weight: 500;
            color: #374151;
            font-size: 14px;
          }

          .form-group input {
            padding: 12px 16px;
            border: 1px solid #d1d5db;
            border-radius: 8px;
            font-size: 16px;
            transition: border-color 0.2s, box-shadow 0.2s;
          }

          .form-group input:focus {
            outline: none;
            border-color: #3b82f6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
          }

          .form-group input:disabled {
            background-color: #f9fafb;
            color: #6b7280;
            cursor: not-allowed;
          }

          .error-message {
            display: flex;
            align-items: flex-start;
            gap: 12px;
            background: #fef2f2;
            border: 1px solid #fecaca;
            border-radius: 8px;
            padding: 16px;
          }

          .error-icon {
            color: #dc2626;
            font-size: 18px;
            flex-shrink: 0;
          }

          .error-message p {
            margin: 0;
            color: #dc2626;
            line-height: 1.5;
          }

          .form-actions {
            display: flex;
            gap: 12px;
            justify-content: flex-end;
            margin-top: 8px;
          }

          .button-secondary {
            padding: 12px 24px;
            border: 1px solid #d1d5db;
            background: white;
            color: #374151;
            border-radius: 8px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
          }

          .button-secondary:hover:not(:disabled) {
            background: #f9fafb;
            border-color: #9ca3af;
          }

          .button-primary {
            padding: 12px 24px;
            background: #3b82f6;
            color: white;
            border: none;
            border-radius: 8px;
            font-weight: 500;
            cursor: pointer;
            transition: background-color 0.2s;
          }

          .button-primary:hover:not(:disabled) {
            background: #2563eb;
          }

          .button-primary:disabled,
          .button-secondary:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }

          .login-help {
            margin-top: 24px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
          }

          .help-text {
            margin: 0;
            color: #6b7280;
            font-size: 14px;
            line-height: 1.5;
            text-align: center;
          }

          @media (max-width: 640px) {
            .modal-content {
              margin: 20px;
              max-width: none;
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

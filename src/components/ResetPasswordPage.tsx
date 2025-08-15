import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!token) {
      setMessage('Token de restablecimiento no válido');
      setIsValidating(false);
      return;
    }

    validateToken();
  }, [token]);

  const validateToken = async () => {
    try {
      const result = await authService.validateResetToken(token!);
      setTokenValid(result.valid);
      
      if (!result.valid) {
        setMessage('El enlace de restablecimiento ha expirado o no es válido');
      }
    } catch (err) {
      setMessage('Error al validar el enlace de restablecimiento');
    } finally {
      setIsValidating(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.newPassword) {
      newErrors.newPassword = 'La contraseña es requerida';
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = 'La contraseña debe tener al menos 8 caracteres';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirma tu contraseña';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const result = await authService.resetPassword(token!, formData.newPassword);
      
      if (result.success) {
        setIsSuccess(true);
        setMessage('Tu contraseña ha sido restablecida exitosamente');
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/');
        }, 3000);
      } else {
        setMessage(result.message || 'Error al restablecer la contraseña');
      }
    } catch (err) {
      setMessage('Error al procesar la solicitud. Inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: 'newPassword' | 'confirmPassword') => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (isValidating) {
    return (
      <div className="reset-password-page">
        <div className="reset-password-container">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Validando enlace...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="reset-password-page">
        <div className="reset-password-container">
          <div className="error-state">
            <div className="error-icon">⚠️</div>
            <h2>Enlace No Válido</h2>
            <p>{message}</p>
            <button 
              className="btn btn-primary" 
              onClick={() => navigate('/')}
            >
              Volver al Inicio
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="reset-password-page">
        <div className="reset-password-container">
          <div className="success-state">
            <div className="success-icon">✓</div>
            <h2>¡Contraseña Restablecida!</h2>
            <p>{message}</p>
            <p className="redirect-message">
              Serás redirigido al inicio de sesión en unos segundos...
            </p>
            <button 
              className="btn btn-primary" 
              onClick={() => navigate('/')}
            >
              Ir al Inicio de Sesión
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="reset-password-page">
      <div className="reset-password-container">
        <div className="reset-password-header">
          <h2>Restablecer Contraseña</h2>
          <p>Ingresa tu nueva contraseña</p>
        </div>

        <form onSubmit={handleSubmit} className="reset-password-form">
          <div className="form-group">
            <label htmlFor="newPassword">Nueva Contraseña</label>
            <input
              id="newPassword"
              type="password"
              value={formData.newPassword}
              onChange={handleInputChange('newPassword')}
              placeholder="Mínimo 8 caracteres"
              disabled={isLoading}
              className={errors.newPassword ? 'error' : ''}
            />
            {errors.newPassword && (
              <span className="error-text">{errors.newPassword}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirmar Contraseña</label>
            <input
              id="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleInputChange('confirmPassword')}
              placeholder="Repite tu nueva contraseña"
              disabled={isLoading}
              className={errors.confirmPassword ? 'error' : ''}
            />
            {errors.confirmPassword && (
              <span className="error-text">{errors.confirmPassword}</span>
            )}
          </div>

          {message && !isSuccess && (
            <div className="message error">
              {message}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={isLoading}
          >
            {isLoading ? 'Restableciendo...' : 'Restablecer Contraseña'}
          </button>
        </form>

        <div className="back-to-login">
          <button 
            className="link-button" 
            onClick={() => navigate('/')}
          >
            ← Volver al inicio de sesión
          </button>
        </div>
      </div>

      <style jsx>{`
        .reset-password-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 20px;
        }

        .reset-password-container {
          background: white;
          border-radius: 12px;
          padding: 40px;
          width: 100%;
          max-width: 450px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
        }

        .reset-password-header {
          text-align: center;
          margin-bottom: 30px;
        }

        .reset-password-header h2 {
          color: #1f2937;
          margin-bottom: 8px;
          font-size: 1.8rem;
        }

        .reset-password-header p {
          color: #6b7280;
          margin: 0;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          margin-bottom: 6px;
          font-weight: 500;
          color: #374151;
        }

        .form-group input {
          width: 100%;
          padding: 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 16px;
          transition: border-color 0.2s;
        }

        .form-group input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .form-group input:disabled {
          background: #f9fafb;
          color: #6b7280;
        }

        .form-group input.error {
          border-color: #ef4444;
        }

        .error-text {
          color: #ef4444;
          font-size: 14px;
          margin-top: 4px;
          display: block;
        }

        .message {
          padding: 12px;
          border-radius: 6px;
          margin-bottom: 20px;
          font-size: 14px;
        }

        .message.error {
          background: #fef2f2;
          color: #991b1b;
          border: 1px solid #fecaca;
        }

        .btn {
          padding: 12px 24px;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
          font-size: 16px;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-primary {
          background: #3b82f6;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background: #2563eb;
        }

        .btn-full {
          width: 100%;
        }

        .back-to-login {
          text-align: center;
          margin-top: 20px;
        }

        .link-button {
          background: none;
          border: none;
          color: #3b82f6;
          cursor: pointer;
          font-size: 14px;
          text-decoration: underline;
        }

        .link-button:hover {
          color: #2563eb;
        }

        .loading-spinner {
          text-align: center;
          padding: 40px 20px;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #f3f4f6;
          border-top: 4px solid #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 20px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .error-state, .success-state {
          text-align: center;
          padding: 20px 0;
        }

        .error-icon, .success-icon {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;
          font-weight: bold;
          margin: 0 auto 20px;
        }

        .error-icon {
          background: #fef2f2;
          color: #ef4444;
        }

        .success-icon {
          background: #10b981;
          color: white;
        }

        .error-state h2, .success-state h2 {
          color: #1f2937;
          margin-bottom: 12px;
        }

        .error-state p, .success-state p {
          color: #6b7280;
          margin-bottom: 20px;
          line-height: 1.5;
        }

        .redirect-message {
          font-size: 14px;
          color: #9ca3af;
          margin-bottom: 24px !important;
        }
      `}</style>
    </div>
  );
}

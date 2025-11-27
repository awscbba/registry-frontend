import { useState } from 'react';
import { authService } from '../services/authService';

interface PasswordChangeProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export default function PasswordChange({ onClose, onSuccess }: PasswordChangeProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Debe tener al menos 8 caracteres');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Debe contener al menos una mayúscula');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Debe contener al menos una minúscula');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Debe contener al menos un número');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Debe contener al menos un carácter especial');
    }
    
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate inputs
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Todos los campos son obligatorios');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas nuevas no coinciden');
      return;
    }

    if (currentPassword === newPassword) {
      setError('La nueva contraseña debe ser diferente a la actual');
      return;
    }

    // Validate password strength
    const passwordErrors = validatePassword(newPassword);
    if (passwordErrors.length > 0) {
      setError(`La contraseña no cumple los requisitos:\n${passwordErrors.join('\n')}`);
      return;
    }

    try {
      setIsSubmitting(true);
      const result = await authService.changePassword(
        currentPassword,
        newPassword,
        confirmPassword
      );

      if (result.success) {
        // Clear form
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        
        // Call success callback
        if (onSuccess) {
          onSuccess();
        }
        
        // Close modal after short delay
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setError(result.message || 'Error al cambiar la contraseña');
      }
    } catch (err) {
      setError('Error al procesar la solicitud');
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const passwordStrength = (password: string): { strength: string; color: string; width: string } => {
    if (!password) return { strength: '', color: '#e5e7eb', width: '0%' };
    
    const errors = validatePassword(password);
    const score = 5 - errors.length;
    
    if (score === 5) return { strength: 'Muy fuerte', color: '#10b981', width: '100%' };
    if (score === 4) return { strength: 'Fuerte', color: '#3b82f6', width: '80%' };
    if (score === 3) return { strength: 'Media', color: '#f59e0b', width: '60%' };
    if (score === 2) return { strength: 'Débil', color: '#ef4444', width: '40%' };
    return { strength: 'Muy débil', color: '#dc2626', width: '20%' };
  };

  const strength = passwordStrength(newPassword);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Cambiar Contraseña</h2>
          <button className="close-button" onClick={onClose} aria-label="Cerrar">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="password-form">
          {error && (
            <div className="alert alert-error">
              <span className="alert-icon">⚠️</span>
              <span style={{ whiteSpace: 'pre-line' }}>{error}</span>
            </div>
          )}

          {/* Current Password */}
          <div className="form-field">
            <label htmlFor="current-password">Contraseña Actual</label>
            <div className="password-input-wrapper">
              <input
                id="current-password"
                type={showPasswords.current ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Ingresa tu contraseña actual"
                disabled={isSubmitting}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => togglePasswordVisibility('current')}
                aria-label={showPasswords.current ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPasswords.current ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div className="form-field">
            <label htmlFor="new-password">Nueva Contraseña</label>
            <div className="password-input-wrapper">
              <input
                id="new-password"
                type={showPasswords.new ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Ingresa tu nueva contraseña"
                disabled={isSubmitting}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => togglePasswordVisibility('new')}
                aria-label={showPasswords.new ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPasswords.new ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            
            {/* Password Strength Indicator */}
            {newPassword && (
              <div className="password-strength">
                <div className="strength-bar">
                  <div 
                    className="strength-fill" 
                    style={{ 
                      width: strength.width, 
                      backgroundColor: strength.color 
                    }}
                  />
                </div>
                <span className="strength-label" style={{ color: strength.color }}>
                  {strength.strength}
                </span>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="form-field">
            <label htmlFor="confirm-password">Confirmar Nueva Contraseña</label>
            <div className="password-input-wrapper">
              <input
                id="confirm-password"
                type={showPasswords.confirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirma tu nueva contraseña"
                disabled={isSubmitting}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => togglePasswordVisibility('confirm')}
                aria-label={showPasswords.confirm ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPasswords.confirm ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          {/* Password Requirements */}
          <div className="password-requirements">
            <p className="requirements-title">La contraseña debe contener:</p>
            <ul>
              <li className={newPassword.length >= 8 ? 'valid' : ''}>
                Al menos 8 caracteres
              </li>
              <li className={/[A-Z]/.test(newPassword) ? 'valid' : ''}>
                Una letra mayúscula
              </li>
              <li className={/[a-z]/.test(newPassword) ? 'valid' : ''}>
                Una letra minúscula
              </li>
              <li className={/[0-9]/.test(newPassword) ? 'valid' : ''}>
                Un número
              </li>
              <li className={/[!@#$%^&*(),.?":{}|<>]/.test(newPassword) ? 'valid' : ''}>
                Un carácter especial (!@#$%^&*...)
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="form-actions">
            <button
              type="button"
              onClick={onClose}
              className="btn-cancel"
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Cambiando...' : 'Cambiar Contraseña'}
            </button>
          </div>
        </form>

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
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
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

          .close-button {
            background: none;
            border: none;
            font-size: 28px;
            cursor: pointer;
            color: #6b7280;
            padding: 0;
            line-height: 1;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .close-button:hover {
            color: #374151;
          }

          .password-form {
            padding: 0 24px 24px 24px;
            display: flex;
            flex-direction: column;
            gap: 20px;
          }

          .alert {
            padding: 12px 16px;
            border-radius: 6px;
            display: flex;
            align-items: flex-start;
            gap: 8px;
          }

          .alert-error {
            background: #fef2f2;
            border: 1px solid #fecaca;
            color: #991b1b;
          }

          .alert-icon {
            font-size: 18px;
            flex-shrink: 0;
          }

          .form-field {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }

          .form-field label {
            font-weight: 500;
            color: #374151;
            font-size: 14px;
          }

          .password-input-wrapper {
            position: relative;
            display: flex;
            align-items: center;
          }

          .password-input-wrapper input {
            flex: 1;
            padding: 10px 40px 10px 12px;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            font-size: 14px;
            transition: border-color 0.2s;
          }

          .password-input-wrapper input:focus {
            outline: none;
            border-color: #3b82f6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
          }

          .password-input-wrapper input:disabled {
            background: #f9fafb;
            cursor: not-allowed;
          }

          .toggle-password {
            position: absolute;
            right: 8px;
            background: none;
            border: none;
            cursor: pointer;
            padding: 4px 8px;
            font-size: 18px;
            color: #6b7280;
          }

          .toggle-password:hover {
            color: #374151;
          }

          .password-strength {
            display: flex;
            align-items: center;
            gap: 12px;
          }

          .strength-bar {
            flex: 1;
            height: 6px;
            background: #e5e7eb;
            border-radius: 3px;
            overflow: hidden;
          }

          .strength-fill {
            height: 100%;
            transition: width 0.3s, background-color 0.3s;
          }

          .strength-label {
            font-size: 12px;
            font-weight: 500;
            min-width: 80px;
            text-align: right;
          }

          .password-requirements {
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            padding: 16px;
          }

          .requirements-title {
            margin: 0 0 12px 0;
            font-weight: 500;
            color: #374151;
            font-size: 14px;
          }

          .password-requirements ul {
            margin: 0;
            padding-left: 20px;
            list-style: none;
          }

          .password-requirements li {
            color: #6b7280;
            font-size: 13px;
            line-height: 1.8;
            position: relative;
          }

          .password-requirements li::before {
            content: '○';
            position: absolute;
            left: -20px;
            color: #d1d5db;
          }

          .password-requirements li.valid {
            color: #10b981;
          }

          .password-requirements li.valid::before {
            content: '✓';
            color: #10b981;
          }

          .form-actions {
            display: flex;
            gap: 12px;
            padding-top: 8px;
          }

          .btn-cancel {
            flex: 1;
            padding: 10px 24px;
            background: white;
            color: #374151;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 500;
            transition: all 0.2s;
          }

          .btn-cancel:hover:not(:disabled) {
            background: #f9fafb;
          }

          .btn-submit {
            flex: 1;
            padding: 10px 24px;
            background: #3b82f6;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 500;
            transition: background 0.2s;
          }

          .btn-submit:hover:not(:disabled) {
            background: #2563eb;
          }

          .btn-cancel:disabled,
          .btn-submit:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }

          @media (max-width: 640px) {
            .modal-content {
              margin: 20px;
            }

            .form-actions {
              flex-direction: column;
            }
          }
        `}</style>
      </div>
    </div>
  );
}

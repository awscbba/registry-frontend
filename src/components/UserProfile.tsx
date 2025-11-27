import { useState, useEffect } from 'react';
import { authService, type User } from '../services/authService';

interface UserProfileProps {
  onPasswordChangeClick: () => void;
}

interface ProfileFormData {
  firstName: string;
  lastName: string;
  phone: string;
  dateOfBirth: string;
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
}

export default function UserProfile({ onPasswordChangeClick }: UserProfileProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<ProfileFormData>({
    firstName: '',
    lastName: '',
    phone: '',
    dateOfBirth: '',
    address: {
      street: '',
      city: '',
      state: '',
      postalCode: '',
      country: '',
    },
  });

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Refresh user data from backend
      await authService.refreshUserData();
      const currentUser = authService.getCurrentUser();
      
      if (currentUser) {
        setUser(currentUser);
        // Initialize form with user data
        setFormData({
          firstName: currentUser.firstName || '',
          lastName: currentUser.lastName || '',
          phone: (currentUser as any).phone || '',
          dateOfBirth: (currentUser as any).dateOfBirth || '',
          address: (currentUser as any).address || {
            street: '',
            city: '',
            state: '',
            postalCode: '',
            country: '',
          },
        });
      }
    } catch {
      setError('Error al cargar el perfil');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAddressChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      address: {
        ...prev.address,
        [field]: value,
      },
    }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);
      setSuccess(null);
      
      const result = await authService.updateProfile(formData);
      
      if (result.success) {
        setSuccess('Perfil actualizado exitosamente');
        setIsEditing(false);
        if (result.user) {
          setUser(result.user);
        }
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.message || 'Error al actualizar el perfil');
      }
    } catch {
      setError('Error al guardar los cambios');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset form to current user data
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: (user as any).phone || '',
        dateOfBirth: (user as any).dateOfBirth || '',
        address: (user as any).address || {
          street: '',
          city: '',
          state: '',
          postalCode: '',
          country: '',
        },
      });
    }
    setIsEditing(false);
    setError(null);
    setSuccess(null);
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando perfil...</p>
      </div>
    );
  }

  return (
    <div className="user-profile">
      <div className="profile-header">
        <h2>Mi Perfil</h2>
        {!isEditing && (
          <button onClick={() => setIsEditing(true)} className="btn-edit">
            ✏️ Editar Perfil
          </button>
        )}
      </div>

      {error && (
        <div className="alert alert-error">
          <span className="alert-icon">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          <span className="alert-icon">✅</span>
          <span>{success}</span>
        </div>
      )}

      <div className="profile-content">
        {/* Personal Information */}
        <div className="profile-section">
          <h3>Información Personal</h3>
          <div className="form-grid">
            <div className="form-field">
              <label>Nombre</label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  placeholder="Nombre"
                />
              ) : (
                <p className="field-value">{user?.firstName || '-'}</p>
              )}
            </div>

            <div className="form-field">
              <label>Apellido</label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  placeholder="Apellido"
                />
              ) : (
                <p className="field-value">{user?.lastName || '-'}</p>
              )}
            </div>

            <div className="form-field">
              <label>Email</label>
              <p className="field-value">{user?.email || '-'}</p>
              {isEditing && (
                <small className="field-hint">
                  El email no puede ser modificado. Contacta a soporte si necesitas cambiarlo.
                </small>
              )}
            </div>

            <div className="form-field">
              <label>Teléfono</label>
              {isEditing ? (
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="Teléfono"
                />
              ) : (
                <p className="field-value">{formData.phone || '-'}</p>
              )}
            </div>

            <div className="form-field">
              <label>Fecha de Nacimiento</label>
              {isEditing ? (
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                />
              ) : (
                <p className="field-value">{formData.dateOfBirth || '-'}</p>
              )}
            </div>
          </div>
        </div>

        {/* Address Information */}
        <div className="profile-section">
          <h3>Dirección</h3>
          <div className="form-grid">
            <div className="form-field full-width">
              <label>Calle</label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.address.street}
                  onChange={(e) => handleAddressChange('street', e.target.value)}
                  placeholder="Calle"
                />
              ) : (
                <p className="field-value">{formData.address.street || '-'}</p>
              )}
            </div>

            <div className="form-field">
              <label>Ciudad</label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.address.city}
                  onChange={(e) => handleAddressChange('city', e.target.value)}
                  placeholder="Ciudad"
                />
              ) : (
                <p className="field-value">{formData.address.city || '-'}</p>
              )}
            </div>

            <div className="form-field">
              <label>Estado/Provincia</label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.address.state}
                  onChange={(e) => handleAddressChange('state', e.target.value)}
                  placeholder="Estado"
                />
              ) : (
                <p className="field-value">{formData.address.state || '-'}</p>
              )}
            </div>

            <div className="form-field">
              <label>Código Postal</label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.address.postalCode}
                  onChange={(e) => handleAddressChange('postalCode', e.target.value)}
                  placeholder="Código Postal"
                />
              ) : (
                <p className="field-value">{formData.address.postalCode || '-'}</p>
              )}
            </div>

            <div className="form-field">
              <label>País</label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.address.country}
                  onChange={(e) => handleAddressChange('country', e.target.value)}
                  placeholder="País"
                />
              ) : (
                <p className="field-value">{formData.address.country || '-'}</p>
              )}
            </div>
          </div>
        </div>

        {/* Security Section */}
        <div className="profile-section">
          <h3>Seguridad</h3>
          <div className="security-actions">
            <button onClick={onPasswordChangeClick} className="btn-secondary">
              🔐 Cambiar Contraseña
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        {isEditing && (
          <div className="profile-actions">
            <button onClick={handleCancel} className="btn-cancel" disabled={isSaving}>
              Cancelar
            </button>
            <button onClick={handleSave} className="btn-save" disabled={isSaving}>
              {isSaving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        .user-profile {
          background: white;
          border-radius: 8px;
          padding: 24px;
        }

        .profile-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 2px solid #e5e7eb;
        }

        .profile-header h2 {
          margin: 0;
          color: #1f2937;
          font-size: 1.5rem;
        }

        .btn-edit {
          padding: 8px 16px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
          transition: background 0.2s;
        }

        .btn-edit:hover {
          background: #2563eb;
        }

        .alert {
          padding: 12px 16px;
          border-radius: 6px;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .alert-error {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #991b1b;
        }

        .alert-success {
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          color: #166534;
        }

        .alert-icon {
          font-size: 18px;
        }

        .profile-content {
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        .profile-section {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 20px;
        }

        .profile-section h3 {
          margin: 0 0 20px 0;
          color: #374151;
          font-size: 1.1rem;
          font-weight: 600;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
        }

        .form-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .form-field.full-width {
          grid-column: 1 / -1;
        }

        .form-field label {
          font-weight: 500;
          color: #374151;
          font-size: 14px;
        }

        .form-field input {
          padding: 10px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
          transition: border-color 0.2s;
        }

        .form-field input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .field-value {
          margin: 0;
          padding: 10px 12px;
          background: #f9fafb;
          border-radius: 6px;
          color: #1f2937;
          font-size: 14px;
        }

        .field-hint {
          color: #6b7280;
          font-size: 12px;
          font-style: italic;
        }

        .security-actions {
          display: flex;
          gap: 12px;
        }

        .btn-secondary {
          padding: 10px 20px;
          background: white;
          color: #374151;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
        }

        .btn-secondary:hover {
          background: #f9fafb;
          border-color: #9ca3af;
        }

        .profile-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
        }

        .btn-cancel {
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

        .btn-save {
          padding: 10px 24px;
          background: #10b981;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
          transition: background 0.2s;
        }

        .btn-save:hover:not(:disabled) {
          background: #059669;
        }

        .btn-cancel:disabled,
        .btn-save:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .loading-container {
          text-align: center;
          padding: 60px 20px;
          color: #6b7280;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #e5e7eb;
          border-top: 4px solid #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 16px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .form-grid {
            grid-template-columns: 1fr;
          }

          .profile-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }

          .profile-actions {
            flex-direction: column;
          }

          .btn-cancel,
          .btn-save {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}

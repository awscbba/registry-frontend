import { useState } from 'react';
import type { Person } from '../types/person';

interface PersonEditFormProps {
  person: Person;
  onSave: (updatedPerson: Person) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

export default function PersonEditForm({ person, onSave, onCancel, isSubmitting }: PersonEditFormProps) {
  const [formData, setFormData] = useState<Person>({
    ...person,
    // Ensure address object exists
    address: person.address || {
      country: '',
      state: '',
      city: '',
      street: '',
      postalCode: ''
    }
  });

  const handleInputChange = (field: keyof Person, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddressChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      address: {
        ...prev.address,
        [field]: value
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(formData);
  };

  return (
    <div className="person-edit-form">
      <div className="form-header">
        <h2>Editar Persona</h2>
        <p>Modifica la información de {person.firstName} {person.lastName}</p>
      </div>

      <form onSubmit={handleSubmit} className="edit-form">
        <div className="form-grid">
          {/* Personal Information */}
          <div className="form-section">
            <h3>Información Personal</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName">Nombre *</label>
                <input
                  type="text"
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  required
                  disabled={isSubmitting}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="lastName">Apellido *</label>
                <input
                  type="text"
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="email">Email *</label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                  disabled={isSubmitting}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="phone">Teléfono</label>
                <input
                  type="tel"
                  id="phone"
                  value={formData.phone || ''}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="dateOfBirth">Fecha de Nacimiento</label>
                <input
                  type="date"
                  id="dateOfBirth"
                  value={formData.dateOfBirth || ''}
                  onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="form-section">
            <h3>Dirección</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="country">País</label>
                <input
                  type="text"
                  id="country"
                  value={formData.address?.country || ''}
                  onChange={(e) => handleAddressChange('country', e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="state">Estado/Departamento</label>
                <input
                  type="text"
                  id="state"
                  value={formData.address?.state || ''}
                  onChange={(e) => handleAddressChange('state', e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="city">Ciudad</label>
                <input
                  type="text"
                  id="city"
                  value={formData.address?.city || ''}
                  onChange={(e) => handleAddressChange('city', e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="postalCode">Código Postal</label>
                <input
                  type="text"
                  id="postalCode"
                  value={formData.address?.postalCode || ''}
                  onChange={(e) => handleAddressChange('postalCode', e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group full-width">
                <label htmlFor="street">Dirección</label>
                <input
                  type="text"
                  id="street"
                  value={formData.address?.street || ''}
                  onChange={(e) => handleAddressChange('street', e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-secondary"
            disabled={isSubmitting}
          >
            Cancelar
          </button>
          
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className="loading-spinner small"></div>
                Guardando...
              </>
            ) : (
              'Guardar Cambios'
            )}
          </button>
        </div>
      </form>

      <style jsx>{`
        .person-edit-form {
          background: white;
          border-radius: 12px;
          padding: 2rem;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          max-width: 800px;
          margin: 0 auto;
        }

        .form-header {
          margin-bottom: 2rem;
          text-align: center;
          padding-bottom: 1rem;
          border-bottom: 2px solid #f3f4f6;
        }

        .form-header h2 {
          color: var(--primary-color);
          margin-bottom: 0.5rem;
          font-size: 1.75rem;
          font-weight: 700;
        }

        .form-header p {
          color: #6b7280;
          font-size: 1rem;
        }

        .edit-form {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .form-grid {
          display: grid;
          gap: 2rem;
        }

        .form-section {
          background: #f9fafb;
          padding: 1.5rem;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
        }

        .form-section h3 {
          color: var(--primary-color);
          margin-bottom: 1rem;
          font-size: 1.25rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .form-row:last-child {
          margin-bottom: 0;
        }

        .form-group {
          display: flex;
          flex-direction: column;
        }

        .form-group.full-width {
          grid-column: 1 / -1;
        }

        .form-group label {
          font-weight: 600;
          color: #374151;
          margin-bottom: 0.5rem;
          font-size: 0.875rem;
        }

        .form-group input {
          padding: 0.75rem;
          border: 2px solid #d1d5db;
          border-radius: 6px;
          font-size: 1rem;
          transition: all 0.2s ease;
          background: white;
        }

        .form-group input:focus {
          outline: none;
          border-color: var(--secondary-color);
          box-shadow: 0 0 0 3px rgba(255, 153, 0, 0.1);
        }

        .form-group input:disabled {
          background: #f3f4f6;
          color: #6b7280;
          cursor: not-allowed;
        }

        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          padding-top: 1rem;
          border-top: 2px solid #f3f4f6;
        }

        .btn {
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          border: none;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-primary {
          background: linear-gradient(135deg, #FF9900 0%, #E88B00 100%);
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(255, 153, 0, 0.3);
        }

        .btn-secondary {
          background: #6b7280;
          color: white;
        }

        .btn-secondary:hover:not(:disabled) {
          background: #4b5563;
          transform: translateY(-1px);
        }

        .loading-spinner.small {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .person-edit-form {
            padding: 1rem;
            margin: 1rem;
          }

          .form-row {
            grid-template-columns: 1fr;
          }

          .form-actions {
            flex-direction: column;
          }

          .btn {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}
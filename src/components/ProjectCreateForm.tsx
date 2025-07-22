import { useState } from 'react';
import type { ProjectCreate } from '../types/project';
import { BUTTON_CLASSES } from '../types/ui';
import { createInputChangeHandler, validateRequired, validateDate } from '../utils/formUtils';

interface ProjectCreateFormProps {
  onSubmit: (project: ProjectCreate) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export default function ProjectCreateForm({ onSubmit, onCancel, isSubmitting = false }: ProjectCreateFormProps) {
  const [formData, setFormData] = useState<ProjectCreate>({
    name: '',
    description: '',
    status: 'active',
    startDate: '',
    endDate: '',
    registrationEndDate: '',
    isEnabled: true,
    maxParticipants: undefined,
    createdBy: 'Admin' // Default value, could be dynamic based on user
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = createInputChangeHandler(setFormData);

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Required field validations
    const nameError = validateRequired(formData.name, 'Nombre del proyecto');
    if (nameError) newErrors.name = nameError;

    const descriptionError = validateRequired(formData.description, 'Descripción');
    if (descriptionError) newErrors.description = descriptionError;

    // Date validations
    if (formData.startDate) {
      const startDateError = validateDate(formData.startDate);
      if (startDateError) newErrors.startDate = startDateError;
    }

    if (formData.endDate) {
      const endDateError = validateDate(formData.endDate);
      if (endDateError) newErrors.endDate = endDateError;
    }

    if (formData.registrationEndDate) {
      const regEndDateError = validateDate(formData.registrationEndDate);
      if (regEndDateError) newErrors.registrationEndDate = regEndDateError;
    }

    // Date logic validations
    if (formData.startDate && formData.endDate) {
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);
      if (startDate >= endDate) {
        newErrors.endDate = 'La fecha de fin debe ser posterior a la fecha de inicio';
      }
    }

    if (formData.registrationEndDate && formData.startDate) {
      const regEndDate = new Date(formData.registrationEndDate);
      const startDate = new Date(formData.startDate);
      if (regEndDate > startDate) {
        newErrors.registrationEndDate = 'La fecha límite de registro debe ser anterior o igual a la fecha de inicio';
      }
    }

    // Max participants validation
    if (formData.maxParticipants !== undefined && formData.maxParticipants <= 0) {
      newErrors.maxParticipants = 'El número máximo de participantes debe ser mayor a 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      // Clean up undefined values
      const cleanFormData: ProjectCreate = {
        ...formData,
        maxParticipants: formData.maxParticipants || undefined,
        startDate: formData.startDate || undefined,
        endDate: formData.endDate || undefined,
        registrationEndDate: formData.registrationEndDate || undefined,
      };

      await onSubmit(cleanFormData);
    } catch (error) {
      // Error handling is managed by parent component
    }
  };

  return (
    <div className="project-create-form">
      <div className="form-header">
        <h2>Crear Nuevo Proyecto</h2>
        <p>Complete la información del proyecto</p>
      </div>

      <form onSubmit={handleSubmit} className="form">
        <div className="form-grid">
          {/* Project Name */}
          <div className="form-group">
            <label htmlFor="name" className="form-label required">
              Nombre del Proyecto
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={`form-input ${errors.name ? 'error' : ''}`}
              placeholder="Ingrese el nombre del proyecto"
              disabled={isSubmitting}
            />
            {errors.name && <span className="error-message">{errors.name}</span>}
          </div>

          {/* Project Description */}
          <div className="form-group full-width">
            <label htmlFor="description" className="form-label required">
              Descripción
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className={`form-textarea ${errors.description ? 'error' : ''}`}
              placeholder="Describa el proyecto, objetivos y detalles importantes"
              rows={4}
              disabled={isSubmitting}
            />
            {errors.description && <span className="error-message">{errors.description}</span>}
          </div>

          {/* Start Date */}
          <div className="form-group">
            <label htmlFor="startDate" className="form-label">
              Fecha de Inicio
            </label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              value={formData.startDate}
              onChange={handleInputChange}
              className={`form-input ${errors.startDate ? 'error' : ''}`}
              disabled={isSubmitting}
            />
            {errors.startDate && <span className="error-message">{errors.startDate}</span>}
          </div>

          {/* End Date */}
          <div className="form-group">
            <label htmlFor="endDate" className="form-label">
              Fecha de Fin
            </label>
            <input
              type="date"
              id="endDate"
              name="endDate"
              value={formData.endDate}
              onChange={handleInputChange}
              className={`form-input ${errors.endDate ? 'error' : ''}`}
              disabled={isSubmitting}
            />
            {errors.endDate && <span className="error-message">{errors.endDate}</span>}
          </div>

          {/* Registration End Date */}
          <div className="form-group">
            <label htmlFor="registrationEndDate" className="form-label">
              Fecha Límite de Registro
            </label>
            <input
              type="date"
              id="registrationEndDate"
              name="registrationEndDate"
              value={formData.registrationEndDate}
              onChange={handleInputChange}
              className={`form-input ${errors.registrationEndDate ? 'error' : ''}`}
              disabled={isSubmitting}
            />
            {errors.registrationEndDate && <span className="error-message">{errors.registrationEndDate}</span>}
            <small className="form-help">Fecha límite para que las personas se registren al proyecto</small>
          </div>

          {/* Max Participants */}
          <div className="form-group">
            <label htmlFor="maxParticipants" className="form-label">
              Máximo de Participantes
            </label>
            <input
              type="number"
              id="maxParticipants"
              name="maxParticipants"
              value={formData.maxParticipants || ''}
              onChange={handleInputChange}
              className={`form-input ${errors.maxParticipants ? 'error' : ''}`}
              placeholder="Opcional"
              min="1"
              disabled={isSubmitting}
            />
            {errors.maxParticipants && <span className="error-message">{errors.maxParticipants}</span>}
            <small className="form-help">Dejar vacío para sin límite</small>
          </div>

          {/* Project Status */}
          <div className="form-group">
            <label htmlFor="status" className="form-label">
              Estado del Proyecto
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="form-select"
              disabled={isSubmitting}
            >
              <option value="active">Activo</option>
              <option value="inactive">Inactivo</option>
              <option value="completed">Completado</option>
            </select>
          </div>

          {/* Enable/Disable Project */}
          <div className="form-group full-width">
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="isEnabled"
                  checked={formData.isEnabled}
                  onChange={handleCheckboxChange}
                  className="checkbox-input"
                  disabled={isSubmitting}
                />
                <span className="checkbox-text">
                  Proyecto habilitado (visible en la página principal)
                </span>
              </label>
              <small className="form-help">
                Si está deshabilitado, el proyecto no aparecerá en la página principal para registro
              </small>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          <button
            type="button"
            onClick={onCancel}
            className={BUTTON_CLASSES.CANCEL}
            disabled={isSubmitting}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className={BUTTON_CLASSES.SUBMIT}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="loading-spinner small"></span>
                Creando...
              </>
            ) : (
              'Crear Proyecto'
            )}
          </button>
        </div>
      </form>

      <style jsx>{`
        .project-create-form {
          background: white;
          border-radius: 12px;
          padding: 2rem;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          max-width: 800px;
          margin: 0 auto;
        }

        .form-header {
          text-align: center;
          margin-bottom: 2rem;
          padding-bottom: 1rem;
          border-bottom: 2px solid #f0f0f0;
        }

        .form-header h2 {
          color: #232F3E;
          margin-bottom: 0.5rem;
          font-size: 1.75rem;
          font-weight: 600;
        }

        .form-header p {
          color: #666;
          font-size: 1rem;
        }

        .form {
          width: 100%;
        }

        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
        }

        .form-group.full-width {
          grid-column: 1 / -1;
        }

        .form-label {
          font-weight: 600;
          color: #232F3E;
          margin-bottom: 0.5rem;
          font-size: 0.875rem;
        }

        .form-label.required::after {
          content: ' *';
          color: #FF9900;
        }

        .form-input,
        .form-textarea,
        .form-select {
          padding: 0.75rem;
          border: 2px solid #e1e5e9;
          border-radius: 8px;
          font-size: 1rem;
          transition: border-color 0.2s ease;
          background: white;
        }

        .form-input:focus,
        .form-textarea:focus,
        .form-select:focus {
          outline: none;
          border-color: #FF9900;
          box-shadow: 0 0 0 3px rgba(255, 153, 0, 0.1);
        }

        .form-input.error,
        .form-textarea.error,
        .form-select.error {
          border-color: #dc3545;
        }

        .form-textarea {
          resize: vertical;
          min-height: 100px;
        }

        .form-help {
          color: #666;
          font-size: 0.75rem;
          margin-top: 0.25rem;
        }

        .error-message {
          color: #dc3545;
          font-size: 0.75rem;
          margin-top: 0.25rem;
        }

        .checkbox-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .checkbox-label {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          cursor: pointer;
          font-size: 0.875rem;
        }

        .checkbox-input {
          width: 18px;
          height: 18px;
          margin: 0;
          cursor: pointer;
        }

        .checkbox-text {
          color: #232F3E;
          font-weight: 500;
        }

        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          padding-top: 1.5rem;
          border-top: 2px solid #f0f0f0;
        }

        .btn-cancel {
          background: #6c757d;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          transition: background-color 0.2s ease;
        }

        .btn-cancel:hover:not(:disabled) {
          background: #5a6268;
        }

        .btn-submit {
          background: linear-gradient(135deg, #FF9900 0%, #E88B00 100%);
          color: white;
          border: none;
          padding: 0.75rem 2rem;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .btn-submit:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(255, 153, 0, 0.3);
        }

        .btn-submit:disabled,
        .btn-cancel:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        .loading-spinner {
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

        @media (max-width: 768px) {
          .project-create-form {
            padding: 1.5rem;
            margin: 1rem;
          }

          .form-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
          }

          .form-actions {
            flex-direction: column-reverse;
          }

          .btn-cancel,
          .btn-submit {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}

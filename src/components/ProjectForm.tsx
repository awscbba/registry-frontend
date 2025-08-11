import React, { useState } from 'react';
import type { Project, ProjectCreate, ProjectUpdate } from '../types/project';

interface ProjectFormProps {
  project?: Project;
  onSubmit: (data: ProjectCreate | ProjectUpdate) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function ProjectForm({ project, onSubmit, onCancel, isLoading = false }: ProjectFormProps) {
  const [formData, setFormData] = useState({
    name: project?.name || '',
    description: project?.description || '',
    status: project?.status || 'pending' as const,
    maxParticipants: project?.maxParticipants || '',
    startDate: project?.startDate || '',
    endDate: project?.endDate || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre del proyecto es requerido';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'La descripción es requerida';
    }

    if (formData.maxParticipants && isNaN(Number(formData.maxParticipants))) {
      newErrors.maxParticipants = 'Debe ser un número válido';
    }

    if (formData.maxParticipants && Number(formData.maxParticipants) < 1) {
      newErrors.maxParticipants = 'Debe ser mayor a 0';
    }

    if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
      newErrors.endDate = 'La fecha de fin debe ser posterior a la fecha de inicio';
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
      const submitData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        status: formData.status,
        maxParticipants: formData.maxParticipants ? Number(formData.maxParticipants) : undefined,
        startDate: formData.startDate || undefined,
        endDate: formData.endDate || undefined,
      };

      await onSubmit(submitData);
    } catch {
      // Error handling is managed by parent component
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  return (
    <div className="project-form">
      <form onSubmit={handleSubmit} className="form-container">
        {/* Basic Information */}
        <div className="form-section">
          <h3 className="section-title">Información del Proyecto</h3>
          
          <div className="form-group">
            <label htmlFor="name" className="form-label">
              Nombre del Proyecto *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={`form-control ${errors.name ? 'error' : ''}`}
              disabled={isLoading}
              placeholder="Ej: AWS Workshop Cochabamba 2025"
            />
            {errors.name && <span className="error-message">{errors.name}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="description" className="form-label">
              Descripción *
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className={`form-control ${errors.description ? 'error' : ''}`}
              disabled={isLoading}
              placeholder="Describe el proyecto, objetivos y contenido..."
              rows={4}
            />
            {errors.description && <span className="error-message">{errors.description}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="status" className="form-label">
                Estado
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="form-control"
                disabled={isLoading}
              >
                <option value="pending">Pendiente</option>
                <option value="active">Activo</option>
                <option value="ongoing">En Curso</option>
                <option value="completed">Completado</option>
                <option value="cancelled">Cancelado</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="maxParticipants" className="form-label">
                Participantes Máximos <span className="optional">(opcional)</span>
              </label>
              <input
                type="number"
                id="maxParticipants"
                name="maxParticipants"
                value={formData.maxParticipants}
                onChange={handleInputChange}
                className={`form-control ${errors.maxParticipants ? 'error' : ''}`}
                disabled={isLoading}
                placeholder="50"
                min="1"
              />
              {errors.maxParticipants && <span className="error-message">{errors.maxParticipants}</span>}
            </div>
          </div>
        </div>

        {/* Dates */}
        <div className="form-section">
          <h3 className="section-title">Fechas del Proyecto</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="startDate" className="form-label">
                Fecha de Inicio <span className="optional">(opcional)</span>
              </label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={formData.startDate}
                onChange={handleInputChange}
                className="form-control"
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="endDate" className="form-label">
                Fecha de Fin <span className="optional">(opcional)</span>
              </label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                value={formData.endDate}
                onChange={handleInputChange}
                className={`form-control ${errors.endDate ? 'error' : ''}`}
                disabled={isLoading}
              />
              {errors.endDate && <span className="error-message">{errors.endDate}</span>}
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-secondary"
            disabled={isLoading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isLoading}
          >
            {isLoading ? 'Guardando...' : project ? 'Actualizar Proyecto' : 'Crear Proyecto'}
          </button>
        </div>
      </form>

      <style jsx>{`
        .project-form {
          max-width: 800px;
          margin: 0 auto;
        }

        .form-container {
          background: white;
          border-radius: 12px;
          padding: 30px;
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
        }

        .form-section {
          margin-bottom: 40px;
        }

        .form-section:last-of-type {
          margin-bottom: 30px;
        }

        .section-title {
          font-size: 1.4rem;
          font-weight: 600;
          color: var(--primary-color);
          margin-bottom: 20px;
          padding-bottom: 10px;
          border-bottom: 2px solid var(--secondary-color);
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
          color: var(--text-color);
          font-size: 0.95rem;
        }

        .optional {
          font-weight: 400;
          color: #666;
          font-size: 0.85rem;
        }

        .form-control {
          width: 100%;
          padding: 12px 16px;
          border: 2px solid var(--border-color);
          border-radius: 8px;
          font-family: inherit;
          font-size: 1rem;
          transition: all 0.3s ease;
          background-color: white;
        }

        .form-control:focus {
          outline: none;
          border-color: var(--accent-color);
          box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.1);
        }

        .form-control.error {
          border-color: var(--error-color);
        }

        .form-control:disabled {
          background-color: #f5f5f5;
          cursor: not-allowed;
          opacity: 0.7;
        }

        textarea.form-control {
          resize: vertical;
          min-height: 100px;
        }

        .error-message {
          display: block;
          color: var(--error-color);
          font-size: 0.85rem;
          margin-top: 5px;
          font-weight: 500;
        }

        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 15px;
          padding-top: 20px;
          border-top: 1px solid var(--border-color);
        }

        .btn {
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.3s ease;
          min-width: 140px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .btn-primary {
          background-color: var(--secondary-color);
          color: var(--primary-color);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .btn-primary:hover:not(:disabled) {
          background-color: #e68a00;
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
        }

        .btn-secondary {
          background-color: #f8f9fa;
          color: var(--text-color);
          border: 2px solid var(--border-color);
        }

        .btn-secondary:hover:not(:disabled) {
          background-color: #e9ecef;
          border-color: #adb5bd;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        @media (max-width: 768px) {
          .form-container {
            padding: 20px;
          }

          .form-row {
            grid-template-columns: 1fr;
            gap: 15px;
          }

          .form-actions {
            flex-direction: column;
          }

          .btn {
            width: 100%;
          }

          .section-title {
            font-size: 1.2rem;
          }
        }
      `}</style>
    </div>
  );
}

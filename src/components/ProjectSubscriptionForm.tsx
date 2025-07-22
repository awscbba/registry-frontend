import { useState, useEffect } from 'react';
import { projectApi, ApiError } from '../services/projectApi';
import { peopleApi } from '../services/api';
import type { Project, SubscriptionCreate } from '../types/project';
import type { PersonCreate } from '../types/person';
import { BUTTON_CLASSES } from '../types/ui';

interface ProjectSubscriptionFormProps {
  projectId: string;
}

export default function ProjectSubscriptionForm({ projectId }: ProjectSubscriptionFormProps) {
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form data
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    address: {
      street: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'Bolivia'
    },
    notes: ''
  });

  useEffect(() => {
    loadProject();
  }, [projectId]);

  const loadProject = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const projectData = await projectApi.getProject(projectId);
      setProject(projectData);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(`Error al cargar proyecto: ${err.message}`);
      } else {
        setError('Proyecto no encontrado');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      // First, create the person
      const personData: PersonCreate = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        dateOfBirth: formData.dateOfBirth,
        address: formData.address
      };

      const createdPerson = await peopleApi.createPerson(personData);

      // Then, create the subscription
      const subscriptionData: SubscriptionCreate = {
        projectId: projectId,
        personId: createdPerson.id,
        status: 'pending',
        notes: formData.notes || undefined
      };

      await projectApi.createSubscription(subscriptionData);

      setSuccess('¡Suscripción exitosa! Te has registrado correctamente al proyecto.');
      
      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        dateOfBirth: '',
        address: {
          street: '',
          city: '',
          state: '',
          postalCode: '',
          country: 'Bolivia'
        },
        notes: ''
      });

    } catch (err) {
      if (err instanceof ApiError) {
        setError(`Error al procesar suscripción: ${err.message}`);
      } else {
        setError('Error desconocido al procesar la suscripción');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="subscription-form">
        <div className="container">
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Cargando información del proyecto...</p>
          </div>
        </div>

        <style jsx>{`
          .loading-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 4rem 0;
          }

          .loading-spinner {
            width: 40px;
            height: 40px;
            border: 4px solid #f3f4f6;
            border-top: 4px solid #3b82f6;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 1rem;
          }

          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error && !project) {
    return (
      <div className="subscription-form">
        <div className="container">
          <div className="error-state">
            <div className="error-icon">
              <svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3>Proyecto no encontrado</h3>
            <p>{error}</p>
            <a href="/" className={BUTTON_CLASSES.BACK}>Volver al inicio</a>
          </div>
        </div>

        <style jsx>{`
          .error-state {
            text-align: center;
            padding: 4rem 0;
          }

          .error-icon {
            color: #ef4444;
            margin-bottom: 1rem;
          }

          .btn-back {
            background: #3b82f6;
            color: white;
            text-decoration: none;
            padding: 0.75rem 1.5rem;
            border-radius: 0.5rem;
            display: inline-block;
            margin-top: 1rem;
          }

          .btn-back:hover {
            background: #2563eb;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="subscription-form">
      <div className="container">
        {/* Project Header */}
        <div className="project-header">
          <a href="/" className="back-link">
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Volver a proyectos
          </a>
          
          <div className="project-info">
            <h1>Suscribirse a: {project?.name}</h1>
            <p>{project?.description}</p>
            <span className="project-status active">Proyecto Activo</span>
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="alert success">
            <div className="alert-icon">
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="alert-content">
              <h4>¡Suscripción exitosa!</h4>
              <p>{success}</p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="alert error">
            <div className="alert-icon">
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="alert-content">
              <h4>Error en la suscripción</h4>
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* Subscription Form */}
        <div className="form-container">
          <form onSubmit={handleSubmit} className="subscription-form-content">
            <div className="form-section">
              <h3>Información Personal</h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="firstName">Nombre *</label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                    disabled={isSubmitting}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="lastName">Apellido *</label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
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
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    disabled={isSubmitting}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="phone">Teléfono *</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="dateOfBirth">Fecha de Nacimiento *</label>
                <input
                  type="date"
                  id="dateOfBirth"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleInputChange}
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="form-section">
              <h3>Dirección</h3>
              
              <div className="form-group">
                <label htmlFor="address.street">Calle y Número</label>
                <input
                  type="text"
                  id="address.street"
                  name="address.street"
                  value={formData.address.street}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="address.city">Ciudad</label>
                  <input
                    type="text"
                    id="address.city"
                    name="address.city"
                    value={formData.address.city}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="address.state">Departamento</label>
                  <input
                    type="text"
                    id="address.state"
                    name="address.state"
                    value={formData.address.state}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="address.postalCode">Código Postal</label>
                  <input
                    type="text"
                    id="address.postalCode"
                    name="address.postalCode"
                    value={formData.address.postalCode}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="address.country">País</label>
                  <input
                    type="text"
                    id="address.country"
                    name="address.country"
                    value={formData.address.country}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3>Información Adicional</h3>
              
              <div className="form-group">
                <label htmlFor="notes">Notas o comentarios (opcional)</label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={4}
                  placeholder="¿Por qué te interesa este proyecto? ¿Tienes alguna experiencia relevante?"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="form-actions">
              <button
                type="submit"
                disabled={isSubmitting}
                className={BUTTON_CLASSES.SUBMIT}
              >
                {isSubmitting ? (
                  <>
                    <div className="button-spinner"></div>
                    Procesando...
                  </>
                ) : (
                  <>
                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Suscribirse al Proyecto
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      <style jsx>{`
        .subscription-form {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 2rem 0;
        }

        .container {
          max-width: 800px;
          margin: 0 auto;
          padding: 0 1rem;
        }

        .project-header {
          margin-bottom: 2rem;
        }

        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          color: white;
          text-decoration: none;
          margin-bottom: 1.5rem;
          opacity: 0.9;
          transition: opacity 0.3s ease;
        }

        .back-link:hover {
          opacity: 1;
        }

        .project-info {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border-radius: 1rem;
          padding: 2rem;
          color: white;
          text-align: center;
        }

        .project-info h1 {
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 1rem;
        }

        .project-info p {
          opacity: 0.9;
          margin-bottom: 1rem;
          line-height: 1.6;
        }

        .project-status {
          display: inline-block;
          padding: 0.5rem 1rem;
          border-radius: 9999px;
          font-size: 0.875rem;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .project-status.active {
          background: rgba(34, 197, 94, 0.2);
          color: #dcfce7;
          border: 1px solid rgba(34, 197, 94, 0.3);
        }

        .alert {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          padding: 1rem;
          border-radius: 0.75rem;
          margin-bottom: 2rem;
        }

        .alert.success {
          background: rgba(34, 197, 94, 0.1);
          border: 1px solid rgba(34, 197, 94, 0.3);
          color: #dcfce7;
        }

        .alert.error {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #fecaca;
        }

        .alert-icon {
          flex-shrink: 0;
          margin-top: 0.125rem;
        }

        .alert-content h4 {
          font-weight: 600;
          margin-bottom: 0.25rem;
        }

        .alert-content p {
          opacity: 0.9;
        }

        .form-container {
          background: white;
          border-radius: 1rem;
          padding: 2rem;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        }

        .form-section {
          margin-bottom: 2rem;
        }

        .form-section:last-child {
          margin-bottom: 0;
        }

        .form-section h3 {
          font-size: 1.25rem;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 1.5rem;
          padding-bottom: 0.5rem;
          border-bottom: 2px solid #f3f4f6;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        .form-group label {
          display: block;
          font-weight: 500;
          color: #374151;
          margin-bottom: 0.5rem;
        }

        .form-group input,
        .form-group textarea {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 0.5rem;
          font-size: 1rem;
          transition: border-color 0.3s ease, box-shadow 0.3s ease;
        }

        .form-group input:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .form-group input:disabled,
        .form-group textarea:disabled {
          background: #f9fafb;
          cursor: not-allowed;
        }

        .form-actions {
          display: flex;
          justify-content: center;
          margin-top: 2rem;
        }

        .btn-submit {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          padding: 1rem 2rem;
          border-radius: 0.75rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1rem;
          min-width: 200px;
          justify-content: center;
        }

        .btn-submit:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(102, 126, 234, 0.4);
        }

        .btn-submit:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        .button-spinner {
          width: 20px;
          height: 20px;
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
          .form-row {
            grid-template-columns: 1fr;
          }

          .project-info h1 {
            font-size: 1.5rem;
          }

          .form-container {
            padding: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
}

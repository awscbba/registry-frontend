import { useState, useEffect } from 'react';
import { projectApi, ApiError } from '../services/projectApi';
import type { Project, SubscriptionCreate } from '../types/project';
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
  
  // Form data - simplified for new workflow
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    notes: ''
  });

  useEffect(() => {
    loadProject();
  }, [projectId]);

  // Helper function to convert project name to URL-friendly slug
  const nameToSlug = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .trim();
  };

  // Mapping function to get consistent slugs for known projects
  const getProjectSlug = (project: Project): string => {
    const name = project.name.toLowerCase();
    
    // Map known projects to their expected slugs
    if (name.includes('aws workshop')) {
      return 'aws-workshop-2025';
    } else if (name.includes('serverless bootcamp')) {
      return 'serverless-bootcamp';
    } else if (name.includes('testproy') || name.includes('test')) {
      return 'cloud-fundamentals'; // Map test project to cloud-fundamentals
    }
    
    // Fallback to generated slug
    return nameToSlug(project.name);
  };

  const loadProject = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // First, get all projects to find the one matching the slug
      const allProjects = await projectApi.getPublicProjects();
      
      // Find project by slug
      const foundProject = allProjects.find(project => 
        getProjectSlug(project) === projectId
      );
      
      if (!foundProject) {
        setError('Proyecto no encontrado');
        return;
      }
      
      setProject(foundProject);
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
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      // Use the service layer for consistent API calls and error handling
      const subscriptionData: SubscriptionCreate = {
        person: {
          name: `${formData.firstName} ${formData.lastName}`.trim(),
          email: formData.email
        },
        projectId: project!.id,
        notes: formData.notes || undefined
      };

      const result = await projectApi.createSubscription(subscriptionData);
      
      // Handle success based on API response
      if (result && typeof result === 'object' && 'person_created' in result) {
        if (result.person_created) {
          setSuccess('¡Suscripción enviada exitosamente! Tu cuenta ha sido creada y tu solicitud está pendiente de aprobación por un administrador. Te notificaremos por email cuando sea aprobada.');
        } else {
          setSuccess('¡Suscripción enviada exitosamente! Tu solicitud está pendiente de aprobación por un administrador. Te notificaremos por email cuando sea aprobada.');
        }
      } else {
        setSuccess('¡Suscripción enviada exitosamente! Tu solicitud está pendiente de aprobación por un administrador. Te notificaremos por email cuando sea aprobada.');
      }
      
      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        notes: ''
      });

    } catch (err) {
      if (err instanceof ApiError) {
        // Handle specific API errors with user-friendly messages
        if (err.message.includes('already subscribed') || err.message.includes('ya suscrito')) {
          setError('Ya tienes una suscripción a este proyecto. Por favor inicia sesión para ver el estado de tu suscripción.');
        } else if (err.message.includes('account exists') || err.message.includes('cuenta existe')) {
          setError('Ya tienes una cuenta registrada con este email. Por favor inicia sesión para suscribirte al proyecto.');
        } else {
          setError(`Error al procesar suscripción: ${err.message}`);
        }
      } else if (err instanceof Error) {
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
          <div className="form-intro">
            <h2>Solicitar Suscripción</h2>
            <p>Completa la información básica para solicitar acceso a este proyecto. Un administrador revisará tu solicitud.</p>
          </div>

          <form onSubmit={handleSubmit} className="subscription-form-content">
            <div className="form-section">
              <h3>Información Básica</h3>
              
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
                    placeholder="Tu nombre"
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
                    placeholder="Tu apellido"
                  />
                </div>
              </div>

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
                  placeholder="tu@email.com"
                />
                <small className="form-help">
                  Usaremos este email para notificarte sobre el estado de tu solicitud
                </small>
              </div>
            </div>

            <div className="form-section">
              <h3>Información Adicional</h3>
              
              <div className="form-group">
                <label htmlFor="notes">¿Por qué te interesa este proyecto? (opcional)</label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={4}
                  placeholder="Cuéntanos sobre tu interés en el proyecto, experiencia relevante, o cualquier información que consideres importante..."
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

        .form-intro {
          text-align: center;
          margin-bottom: 2rem;
          padding-bottom: 2rem;
          border-bottom: 1px solid #e5e7eb;
        }

        .form-intro h2 {
          font-size: 1.5rem;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 0.5rem;
        }

        .form-intro p {
          color: #6b7280;
          line-height: 1.6;
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

        .form-help {
          display: block;
          margin-top: 0.25rem;
          font-size: 0.875rem;
          color: #6b7280;
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

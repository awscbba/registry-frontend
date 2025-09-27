import { useState, useEffect } from 'react';
import { getComponentLogger, getErrorMessage, getErrorObject } from '../utils/logger';
import { projectApi, ApiError } from '../services/projectApi';
import { authService } from '../services/authService';
import type { Project, SubscriptionCreate } from '../types/project';
import { BUTTON_CLASSES } from '../types/ui';
import UserLoginModal from './UserLoginModal';
import UserDashboard from './UserDashboard';

interface ProjectSubscriptionFormProps {
  projectId: string;
}

const logger = getComponentLogger('ProjectSubscriptionForm');

export default function ProjectSubscriptionForm({ projectId }: ProjectSubscriptionFormProps) {
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Authentication state
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showUserDashboard, setShowUserDashboard] = useState(false);
  const [loginMessage, setLoginMessage] = useState<string>('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // Form data - simplified for new workflow
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    notes: ''
  });

  useEffect(() => {
    loadProject();
    checkUserLoginStatus();
  }, [projectId]);

  const checkUserLoginStatus = () => {
    setIsLoggedIn(authService.isAuthenticated());
  };

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
    try {
      setIsLoading(true);
      setError(null);
      
      // First, get all projects to find the one matching the slug
      const allProjects = await projectApi.getPublicProjects();
      
      // Find project by slug
      const matchingProject = allProjects.find(p => {
        const projectSlug = getProjectSlug(p);
        return projectSlug === projectId;
      });
      
      if (!matchingProject) {
        setError('Proyecto no encontrado');
        return;
      }
      
      setProject(matchingProject);
    } catch (err) {
      logger.error('Error loading project', { project_id: projectId, error: getErrorMessage(err) }, getErrorObject(err));
      setError('Error al cargar el proyecto');
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

  const handleUserSubscription = async (projectId: string, notes?: string) => {
    const result = await authService.subscribeToProject(projectId, notes);
    setSuccess('¡Suscripción enviada exitosamente! Tu solicitud está pendiente de aprobación por un administrador.');
    return result;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      // Enterprise validation before API call
      if (!formData.firstName?.trim() || !formData.lastName?.trim() || !formData.email?.trim()) {
        throw new Error('Required fields missing: firstName, lastName, and email are mandatory');
      }

      if (!project?.id) {
        throw new Error('Invalid project: Project ID is required');
      }

      // Use proper business logic for subscription creation
      const subscriptionData: SubscriptionCreate = {
        personId: formData.email, // Use email as unique identifier, not display name
        projectId: project.id,
        notes: formData.notes?.trim() || undefined
      };

      logger.info('Creating subscription', { 
        projectId: project.id, 
        personEmail: formData.email,
        event_type: 'subscription_create_attempt'
      });

      const result = await projectApi.createSubscription(subscriptionData);
      
      // Handle success based on API response
      if (result && typeof result === 'object' && 'personCreated' in result) {
        if (result.personCreated) {
          if (result.emailSent) {
            setSuccess('¡Suscripción enviada exitosamente! 🎉\n\nTu cuenta ha sido creada y se ha enviado un email de bienvenida con tus credenciales de acceso. Revisa tu bandeja de entrada (y la carpeta de spam) para encontrar tus datos de inicio de sesión.\n\nUna vez que recibas el email, podrás iniciar sesión y cambiar tu contraseña temporal por una de tu elección.');
          } else {
            setSuccess('¡Suscripción enviada exitosamente! 🎉\n\nTu cuenta ha sido creada, pero no pudimos enviar el email de bienvenida. Por favor contacta al administrador para obtener tus credenciales de acceso.\n\nTu solicitud está pendiente de aprobación por un administrador.');
          }
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
          setLoginMessage('Ya tienes una suscripción a este proyecto. Inicia sesión para ver el estado de tu suscripción.');
          setShowLoginModal(true);
        } else if (err.message.includes('account exists') || err.message.includes('cuenta existe')) {
          setLoginMessage('Ya tienes una cuenta registrada con este email. Inicia sesión para suscribirte al proyecto.');
          setShowLoginModal(true);
        } else {
          setError(`Error al procesar suscripción: ${err.message}`);
        }
      } else {
        setError('Error desconocido al procesar la suscripción');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLoginSuccess = () => {
    setShowLoginModal(false);
    setIsLoggedIn(true);
    setShowUserDashboard(true);
    checkUserLoginStatus();
  };

  const handleShowUserDashboard = () => {
    if (authService.isAuthenticated()) {
      setShowUserDashboard(true);
    } else {
      setLoginMessage('Inicia sesión para ver tu panel de usuario y gestionar tus suscripciones.');
      setShowLoginModal(true);
    }
  };

  if (isLoading) {
    return (
      <div className="subscription-form-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Cargando información del proyecto...</p>
        </div>
      </div>
    );
  }

  if (error && !project) {
    return (
      <div className="subscription-form-container">
        <div className="error-state">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={loadProject} className={BUTTON_CLASSES.SECONDARY}>
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="subscription-form-container">
        <div className="error-state">
          <h2>Proyecto no encontrado</h2>
          <p>El proyecto que buscas no existe o no está disponible.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="subscription-form-container">
      {/* User Status Bar */}
      {isLoggedIn && (
        <div className="user-status-bar">
          <div className="user-info">
            <span className="user-icon">👤</span>
            <span>Conectado como {authService.getCurrentUser()?.firstName}</span>
          </div>
          <button 
            onClick={handleShowUserDashboard}
            className="dashboard-button"
          >
            Mi Panel
          </button>
        </div>
      )}

      <div className="subscription-form">
        {/* Project Information */}
        <div className="project-info">
          <h1>{project.name}</h1>
          <p className="project-description">{project.description}</p>
          
          <div className="project-details">
            <div className="detail-item">
              <span className="detail-label">Fecha de inicio:</span>
              <span className="detail-value">{project.startDate ? new Date(project.startDate).toLocaleDateString() : 'No especificada'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Fecha de fin:</span>
              <span className="detail-value">{project.endDate ? new Date(project.endDate).toLocaleDateString() : 'No especificada'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Participantes máximos:</span>
              <span className="detail-value">{project.maxParticipants}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Estado:</span>
              <span className={`status-badge status-${project.status}`}>
                {project.status === 'active' ? 'Activo' : 
                 project.status === 'completed' ? 'Completado' : 
                 project.status}
              </span>
            </div>
          </div>
        </div>

        {/* Subscription Form or User Actions */}
        {isLoggedIn ? (
          <div className="authenticated-section">
            <div className="auth-message">
              <div className="message-icon">✅</div>
              <div className="message-content">
                <h3>¡Estás conectado!</h3>
                <p>Puedes gestionar tus suscripciones desde tu panel de usuario.</p>
              </div>
            </div>
            <div className="auth-actions">
              <button 
                onClick={handleShowUserDashboard}
                className={BUTTON_CLASSES.PRIMARY}
              >
                Ver Mi Panel de Usuario
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Success Message */}
            {success && (
              <div className="success-message">
                <div className="success-icon">✅</div>
                <p>{success}</p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="error-message">
                <div className="error-icon">⚠️</div>
                <p>{error}</p>
              </div>
            )}

            {/* Subscription Form */}
            <div className="form-intro">
              <h2>Solicitar Suscripción</h2>
              <p>Completa la información básica para solicitar acceso a este proyecto. Un administrador revisará tu solicitud.</p>
              <div className="existing-user-notice">
                <p>¿Ya tienes una cuenta? 
                  <button 
                    type="button"
                    onClick={() => {
                      setLoginMessage('Inicia sesión para suscribirte al proyecto con tu cuenta existente.');
                      setShowLoginModal(true);
                    }}
                    className="login-link"
                  >
                    Inicia sesión aquí
                  </button>
                </p>
              </div>
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
                </div>

                <div className="form-group">
                  <label htmlFor="notes">Notas adicionales</label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                    placeholder="Información adicional que quieras compartir (opcional)"
                    rows={4}
                  />
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={BUTTON_CLASSES.PRIMARY}
                >
                  {isSubmitting ? 'Enviando solicitud...' : 'Enviar Solicitud de Suscripción'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>

      {/* Modals */}
      <UserLoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLoginSuccess={handleLoginSuccess}
        projectName={project.name}
        message={loginMessage}
      />

      <UserDashboard
        isOpen={showUserDashboard}
        onClose={() => setShowUserDashboard(false)}
        currentProjectId={project.id}
        onSubscribeToProject={handleUserSubscription}
      />

      <style jsx>{`
        .subscription-form-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }

        .user-status-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #f0f9ff;
          border: 1px solid #0ea5e9;
          border-radius: 8px;
          padding: 12px 20px;
          margin-bottom: 24px;
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #0c4a6e;
          font-weight: 500;
        }

        .user-icon {
          font-size: 18px;
        }

        .dashboard-button {
          background: #0ea5e9;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .dashboard-button:hover {
          background: #0284c7;
        }

        .authenticated-section {
          background: #f9fafb;
          border-radius: 12px;
          padding: 32px;
          text-align: center;
        }

        .auth-message {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          margin-bottom: 24px;
          text-align: left;
        }

        .message-icon {
          font-size: 24px;
          flex-shrink: 0;
        }

        .message-content h3 {
          margin: 0 0 8px 0;
          color: #1f2937;
          font-size: 1.25rem;
        }

        .message-content p {
          margin: 0;
          color: #6b7280;
          line-height: 1.5;
        }

        .existing-user-notice {
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          border-radius: 8px;
          padding: 16px;
          margin-top: 16px;
        }

        .existing-user-notice p {
          margin: 0;
          color: #1e40af;
          text-align: center;
        }

        .login-link {
          background: none;
          border: none;
          color: #2563eb;
          text-decoration: underline;
          cursor: pointer;
          font-weight: 500;
          margin-left: 4px;
        }

        .login-link:hover {
          color: #1d4ed8;
        }

        .loading-state,
        .error-state {
          text-align: center;
          padding: 60px 20px;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #e5e7eb;
          border-top: 4px solid #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 20px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .subscription-form {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          overflow: hidden;
        }

        .project-info {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 40px;
          text-align: center;
        }

        .project-info h1 {
          margin: 0 0 16px 0;
          font-size: 2rem;
          font-weight: 700;
        }

        .project-description {
          margin: 0 0 32px 0;
          font-size: 1.1rem;
          opacity: 0.9;
          line-height: 1.6;
        }

        .project-details {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          max-width: 600px;
          margin: 0 auto;
        }

        .detail-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .detail-label {
          font-size: 14px;
          opacity: 0.8;
          font-weight: 500;
        }

        .detail-value {
          font-weight: 600;
        }

        .status-badge {
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          display: inline-block;
        }

        .status-badge.status-active {
          background: rgba(34, 197, 94, 0.2);
          color: #15803d;
        }

        .status-badge.status-completed {
          background: rgba(156, 163, 175, 0.2);
          color: #374151;
        }

        .form-intro {
          padding: 40px;
          text-align: center;
          border-bottom: 1px solid #e5e7eb;
        }

        .form-intro h2 {
          margin: 0 0 16px 0;
          color: #1f2937;
          font-size: 1.5rem;
          font-weight: 600;
        }

        .form-intro p {
          margin: 0;
          color: #6b7280;
          line-height: 1.6;
        }

        .subscription-form-content {
          padding: 40px;
        }

        .form-section {
          margin-bottom: 32px;
        }

        .form-section h3 {
          margin: 0 0 24px 0;
          color: #1f2937;
          font-size: 1.25rem;
          font-weight: 600;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 20px;
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

        .form-group input,
        .form-group textarea {
          padding: 12px 16px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 16px;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .form-group input:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .form-group input:disabled,
        .form-group textarea:disabled {
          background-color: #f9fafb;
          color: #6b7280;
          cursor: not-allowed;
        }

        .form-group textarea {
          resize: vertical;
          min-height: 100px;
        }

        .success-message,
        .error-message {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 16px;
          border-radius: 8px;
          margin-bottom: 24px;
        }

        .success-message {
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
        }

        .success-icon {
          color: #16a34a;
          font-size: 20px;
          flex-shrink: 0;
        }

        .success-message p {
          margin: 0;
          color: #15803d;
          line-height: 1.5;
        }

        .error-message {
          background: #fef2f2;
          border: 1px solid #fecaca;
        }

        .error-icon {
          color: #dc2626;
          font-size: 20px;
          flex-shrink: 0;
        }

        .error-message p {
          margin: 0;
          color: #dc2626;
          line-height: 1.5;
        }

        .form-actions {
          display: flex;
          justify-content: center;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
        }

        @media (max-width: 768px) {
          .subscription-form-container {
            padding: 16px;
          }

          .project-info {
            padding: 32px 24px;
          }

          .project-info h1 {
            font-size: 1.75rem;
          }

          .project-details {
            grid-template-columns: 1fr;
            gap: 16px;
          }

          .form-intro,
          .subscription-form-content {
            padding: 32px 24px;
          }

          .form-row {
            grid-template-columns: 1fr;
            gap: 16px;
          }

          .user-status-bar {
            flex-direction: column;
            gap: 12px;
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
}

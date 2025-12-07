import React, { useState, useEffect } from 'react';
import type { Project } from '../types/project';
import type { EnhancedProject, ProjectSubmission, FormSchema } from '../types/dynamicForm';
import { getApiLogger } from '../utils/logger';
import { dynamicFormApi } from '../services/dynamicFormApi';
import { getSiteUrl } from '../config/api';
import { authService } from '../services/authService';
import { DynamicFormRenderer } from './DynamicFormRenderer';

interface EnhancedProjectShowcaseProps {
  project: Project;
  currentUserId?: string;
  onSubscribe?: () => void;
  className?: string;
}

const logger = getApiLogger('EnhancedProjectShowcase');

export const EnhancedProjectShowcase: React.FC<EnhancedProjectShowcaseProps> = ({
  project,
  currentUserId,
  onSubscribe: _onSubscribe,
  className = '',
}) => {
  const [enhancedProject, setEnhancedProject] = useState<EnhancedProject>(project);
  const [submissions, setSubmissions] = useState<ProjectSubmission[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Authentication state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [existingSubscription, setExistingSubscription] = useState<any>(null);
  const [checkingSubscription, setCheckingSubscription] = useState(false);

  // Ensure client-side rendering and inject form schema
  useEffect(() => {
    setIsClient(true);
    
    // Set enhanced project with formSchema (existing or empty for admin customization)
    const emptyFormSchema: FormSchema = {
      version: '1.0',
      richTextDescription: '',
      fields: []
    };

    setEnhancedProject(prev => ({
      ...prev,
      formSchema: project.formSchema || emptyFormSchema
    }));
  }, [project.formSchema]);

  // Load enhanced project data and submissions
  useEffect(() => {
    if (isClient) {
      loadProjectSubmissions();
    }
  }, [project.id, isClient]);

  // Check authentication status
  useEffect(() => {
    if (isClient) {
      checkUserLoginStatus();
      
      // Re-check periodically and on focus
      const interval = setInterval(checkUserLoginStatus, 2000);
      const handleFocus = () => checkUserLoginStatus();
      const handleStorageChange = (e: StorageEvent) => {
        if (e.key === 'userAuthToken' || e.key === 'userData') {
          checkUserLoginStatus();
        }
      };

      window.addEventListener('focus', handleFocus);
      window.addEventListener('storage', handleStorageChange);

      return () => {
        clearInterval(interval);
        window.removeEventListener('focus', handleFocus);
        window.removeEventListener('storage', handleStorageChange);
      };
    }
  }, [isClient]);

  // Check subscription status when user logs in
  useEffect(() => {
    if (isClient && isLoggedIn && project.id) {
      checkSubscriptionStatus();
    }
  }, [isClient, isLoggedIn, project.id]);

  const checkUserLoginStatus = () => {
    const authenticated = authService.isAuthenticated();
    setIsLoggedIn(authenticated);
  };

  const checkSubscriptionStatus = async () => {
    if (!project.id) {return;}
    
    setCheckingSubscription(true);
    try {
      const subscription = await authService.checkProjectSubscription(project.id);
      setExistingSubscription(subscription);
      logger.debug('Subscription status checked', { 
        projectId: project.id, 
        hasSubscription: !!subscription 
      });
    } catch (error) {
      logger.error('Error checking subscription status', { error, projectId: project.id });
    } finally {
      setCheckingSubscription(false);
    }
  };

  const loadProjectSubmissions = async () => {
    try {
      const projectSubmissions = await dynamicFormApi.getProjectSubmissions(project.id);
      setSubmissions(projectSubmissions);
      
      logger.debug('Loaded project submissions', { 
        projectId: project.id, 
        submissionCount: projectSubmissions.length 
      });
    } catch (error) {
      logger.error('Failed to load project submissions', { error, projectId: project.id });
    }
  };

  const handleFormSubmissionSuccess = (submission: ProjectSubmission) => {
    setSubmissions(prev => {
      // Update existing submission or add new one
      const existingIndex = prev.findIndex(s => s.personId === submission.personId);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = submission;
        return updated;
      } else {
        return [...prev, submission];
      }
    });

    logger.info('Form submission successful', { 
      projectId: project.id, 
      submissionId: submission.id 
    });
  };

  const handleFormSubmissionError = (error: Error) => {
    logger.error('Form submission failed', { error, projectId: project.id });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubscribe = async (e?: React.FormEvent) => {
    if (e) {e.preventDefault();}
    
    if (!isClient) {
      return;
    }

    // If user is logged in, use one-click subscription
    if (isLoggedIn) {
      setIsSubmitting(true);
      try {
        await authService.subscribeToProject(project.id, formData.notes);
        
        // Wait a moment for the backend to process
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Refresh subscription status
        await checkSubscriptionStatus();
        
        // Show success message after state is updated
        window.alert('¡Suscripción enviada exitosamente! Tu solicitud está pendiente de aprobación por un administrador.');
      } catch (error) {
        logger.error('Subscription error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        
        // Check if already subscribed
        if (errorMessage.includes('already subscribed') || errorMessage.includes('ya existe')) {
          await checkSubscriptionStatus();
          window.alert('Ya tienes una suscripción a este proyecto.');
        } else {
          window.alert('Error al procesar la suscripción. Por favor intenta nuevamente.');
        }
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // For non-logged-in users, validate required fields
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim()) {
      window.alert('Por favor completa todos los campos requeridos (Nombre, Apellido, Email)');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Use the same API structure as ProjectSubscriptionForm
      const subscriptionData = {
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: '',
        dateOfBirth: '1990-01-01',
        projectId: project.id,
        address: {
          street: '',
          city: '',
          state: '',
          postalCode: '',
          country: ''
        }
      };

      // Import projectApi dynamically to avoid SSR issues
      const { projectApi } = await import('../services/projectApi');
      await projectApi.createSubscription(subscriptionData);
      
      // Show success message
      window.alert('¡Suscripción enviada exitosamente! Tu solicitud está pendiente de aprobación por un administrador.');
      
      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        notes: ''
      });
      
    } catch (error) {
      logger.error('Subscription error:', error);
      window.alert('Error al procesar la suscripción. Por favor intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderRichTextDescription = (description: string) => {
    // Enhanced markdown rendering
    const html = description
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^### (.*$)/gm, '<h3 class="text-lg font-semibold mb-2 mt-3">$1</h3>')
      .replace(/^## (.*$)/gm, '<h2 class="text-xl font-bold mb-3 mt-4">$1</h2>')
      .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mb-3 mt-4">$1</h1>')
      .replace(/^- (.*$)/gm, '<li class="ml-4 mb-1 list-disc">$1</li>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">$1</a>')
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="max-w-full h-auto rounded-lg my-4 shadow-sm" />')
      .replace(/\n\n/g, '</p><p class="mb-2">')
      .replace(/\n/g, '<br />');

    // Wrap in paragraphs and lists
    const wrappedHtml = `<div class="prose max-w-none"><p class="mb-2">${html}</p></div>`
      .replace(/<p class="mb-2"><li/g, '<ul class="list-disc ml-4 mb-4"><li')
      .replace(/<\/li><\/p>/g, '</li></ul>');

    return <div dangerouslySetInnerHTML={{ __html: wrappedHtml }} />;
  };

  const hasFormSchema = isClient && enhancedProject.formSchema && 
    (enhancedProject.formSchema.fields.length > 0 || enhancedProject.formSchema.richTextDescription);

  return (
    <div className={className}>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Project Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{project.name}</h1>
              <p className="text-gray-600 mb-4">{project.description}</p>
              
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  project.status === 'active' ? 'bg-green-100 text-green-800' :
                  project.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  project.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {project.status}
                </span>
                
                {project.maxParticipants && (
                  <span>Max: {project.maxParticipants} participants</span>
                )}
                
                {project.subscriptionCount !== undefined && (
                  <span>Subscribed: {project.subscriptionCount}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {!isClient ? (
          <div className="p-6 border-b border-gray-200">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <div className="text-center">
                <p className="text-gray-600">Loading project details...</p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Rich Text Description */}
            {hasFormSchema && enhancedProject.formSchema?.richTextDescription && (
              <div className="p-6 border-b border-gray-200 bg-gray-50">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Project Details</h2>
                {renderRichTextDescription(enhancedProject.formSchema.richTextDescription)}
              </div>
            )}

            {/* Subscription Form Section */}
            <div className="p-6 border-b border-gray-200">
              {isLoggedIn ? (
                // Authenticated user view
                checkingSubscription ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600">Verificando estado de suscripción...</p>
                  </div>
                ) : existingSubscription ? (
                  // Already subscribed
                  <div className={`border-2 rounded-lg p-6 ${
                    existingSubscription.status === 'active' ? 'bg-green-50 border-green-200' :
                    existingSubscription.status === 'pending' ? 'bg-yellow-50 border-yellow-200' :
                    'bg-gray-50 border-gray-200'
                  }`}>
                    <div className="text-center">
                      <div className="text-5xl mb-4">
                        {existingSubscription.status === 'active' ? '✅' :
                         existingSubscription.status === 'pending' ? '⏳' :
                         '❌'}
                      </div>
                      <h3 className={`text-xl font-semibold mb-2 ${
                        existingSubscription.status === 'active' ? 'text-green-800' :
                        existingSubscription.status === 'pending' ? 'text-yellow-800' :
                        'text-gray-800'
                      }`}>
                        {existingSubscription.status === 'active' ? 'Ya estás suscrito a este proyecto' :
                         existingSubscription.status === 'pending' ? 'Tu solicitud está pendiente de aprobación' :
                         'Tu suscripción fue cancelada'}
                      </h3>
                      <p className={`mb-4 ${
                        existingSubscription.status === 'active' ? 'text-green-700' :
                        existingSubscription.status === 'pending' ? 'text-yellow-700' :
                        'text-gray-700'
                      }`}>
                        {existingSubscription.status === 'pending' 
                          ? `Solicitud enviada el ${new Date(existingSubscription.subscribedAt).toLocaleDateString()}`
                          : `Te suscribiste el ${new Date(existingSubscription.subscribedAt).toLocaleDateString()}`
                        }
                      </p>
                      <div className="inline-block bg-white rounded-lg px-4 py-2 border border-gray-300">
                        <span className="text-sm font-medium text-gray-700">Estado: </span>
                        <span className={`text-sm font-bold ${
                          existingSubscription.status === 'active' ? 'text-green-600' :
                          existingSubscription.status === 'pending' ? 'text-yellow-600' :
                          'text-gray-600'
                        }`}>
                          {existingSubscription.status === 'active' ? 'Activo' :
                           existingSubscription.status === 'pending' ? 'Pendiente de Aprobación' :
                           existingSubscription.status === 'cancelled' ? 'Cancelado' :
                           existingSubscription.status}
                        </span>
                      </div>
                      {existingSubscription.status === 'pending' && (
                        <p className="text-xs text-yellow-600 mt-4">
                          Un administrador revisará tu solicitud pronto. Te notificaremos por email cuando sea aprobada.
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  // Logged in but not subscribed
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
                    <div className="text-center">
                      <div className="text-5xl mb-4">📝</div>
                      <h3 className="text-xl font-semibold text-blue-800 mb-2">Suscríbete a este proyecto</h3>
                      <p className="text-blue-700 mb-6">
                        Haz clic en el botón para enviar tu solicitud de suscripción.
                      </p>
                      <button
                        onClick={() => handleSubscribe()}
                        disabled={isSubmitting}
                        className="px-8 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? 'Enviando...' : 'Suscribirse al Proyecto'}
                      </button>
                    </div>
                  </div>
                )
              ) : (
                // Non-authenticated user view
                <>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Solicitar Suscripción</h2>
                  <p className="text-sm text-gray-600 mb-6">Completa la información básica para solicitar acceso a este proyecto. Un administrador revisará tu solicitud.</p>
                  
                  {/* Basic Subscription Form - Show for non-logged-in users */}
                  <form onSubmit={handleSubscribe} className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Información Básica</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nombre <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Tu nombre"
                        required
                        disabled={isSubmitting}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Apellido <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Tu apellido"
                        required
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="tu@email.com"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notas adicionales
                    </label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Información adicional que quieras compartir (opcional)"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                {/* Submit Button - Only show if no dynamic form */}
                {!(hasFormSchema && enhancedProject.formSchema?.fields.length > 0) && (
                  <div className="text-center mt-6">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-8 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? 'Enviando...' : 'Enviar Solicitud de Suscripción'}
                    </button>
                    <p className="text-xs text-gray-600 mt-2">
                      Un administrador revisará tu solicitud y te notificará por email
                    </p>
                  </div>
                )}
              </form>

              {/* Dynamic Form Fields - Show if available */}
              {hasFormSchema && enhancedProject.formSchema?.fields.length > 0 && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Información Adicional</h3>
                  <DynamicFormRenderer
                    projectId={project.id}
                    personId={currentUserId}
                    formSchema={enhancedProject.formSchema}
                    onSubmissionSuccess={handleFormSubmissionSuccess}
                    onSubmissionError={handleFormSubmissionError}
                    hideSubmitButton={true}
                  />
                </div>
              )}

              {/* Submit Button - Show after dynamic form */}
              {hasFormSchema && enhancedProject.formSchema?.fields.length > 0 && (
                <div className="text-center mb-6">
                  <button
                    type="button"
                    onClick={handleSubscribe}
                    disabled={isSubmitting}
                    className="px-8 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Enviando...' : 'Enviar Solicitud de Suscripción'}
                  </button>
                  <p className="text-xs text-gray-600 mt-2">
                    Un administrador revisará tu solicitud y te notificará por email
                  </p>
                </div>
              )}

                  {/* Existing User Notice */}
                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-700">
                      ¿Ya tienes una cuenta? 
                      <a 
                        href={getSiteUrl('/login')}
                        className="ml-1 text-blue-600 hover:text-blue-800 underline"
                      >
                        Inicia sesión aquí
                      </a>
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Submission Statistics */}
            {hasFormSchema && submissions.length > 0 && (
              <div className="p-6 bg-gray-50">
                <h3 className="text-md font-semibold text-gray-900 mb-3">Response Statistics</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="text-2xl font-bold text-blue-600">{submissions.length}</div>
                    <div className="text-sm text-gray-600">Total Responses</div>
                  </div>
                  
                  {enhancedProject.formSchema?.fields.map((field) => {
                    const responses = submissions
                      .map(s => s.responses[field.id])
                      .filter(Boolean);
                    
                    return (
                      <div key={field.id} className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="text-2xl font-bold text-green-600">{responses.length}</div>
                        <div className="text-sm text-gray-600">
                          Answered: {field.question.substring(0, 30)}
                          {field.question.length > 30 ? '...' : ''}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}

        {/* Project Dates */}
        {(project.startDate || project.endDate || project.registrationEndDate) && (
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <h3 className="text-md font-semibold text-gray-900 mb-3">Important Dates</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              {project.startDate && (
                <div>
                  <span className="font-medium text-gray-700">Start Date:</span>
                  <div className="text-gray-600">{project.startDate.split('T')[0]}</div>
                </div>
              )}
              {project.endDate && (
                <div>
                  <span className="font-medium text-gray-700">End Date:</span>
                  <div className="text-gray-600">{project.endDate.split('T')[0]}</div>
                </div>
              )}
              {project.registrationEndDate && (
                <div>
                  <span className="font-medium text-gray-700">Registration Ends:</span>
                  <div className="text-gray-600">{project.registrationEndDate.split('T')[0]}</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

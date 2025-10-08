import React, { useState, useEffect } from 'react';
import type { Project } from '../types/project';
import type { EnhancedProject, ProjectSubmission } from '../types/dynamicForm';
import { getApiLogger } from '../utils/logger';
import { dynamicFormApi } from '../services/dynamicFormApi';
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

  // Ensure client-side rendering and inject form schema
  useEffect(() => {
    setIsClient(true);
    
    // Set enhanced project with existing formSchema if available
    if (project.formSchema) {
      setEnhancedProject(prev => ({
        ...prev,
        formSchema: project.formSchema
      }));
    }
  }, [project.formSchema]);

  // Load enhanced project data and submissions
  useEffect(() => {
    if (isClient) {
      loadProjectSubmissions();
    }
  }, [project.id, isClient]);

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

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isClient) {
      return;
    }

    // Validate required fields
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
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Solicitar Suscripción</h2>
              <p className="text-sm text-gray-600 mb-6">Completa la información básica para solicitar acceso a este proyecto. Un administrador revisará tu solicitud.</p>
              
              {/* Basic Subscription Form - Always Show */}
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
                  <button 
                    type="button"
                    className="ml-1 text-blue-600 hover:text-blue-800 underline"
                    onClick={() => window.alert('Funcionalidad de login será implementada')}
                  >
                    Inicia sesión aquí
                  </button>
                </p>
              </div>
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
                  <div className="text-gray-600">{new Date(project.startDate).toLocaleDateString()}</div>
                </div>
              )}
              {project.endDate && (
                <div>
                  <span className="font-medium text-gray-700">End Date:</span>
                  <div className="text-gray-600">{new Date(project.endDate).toLocaleDateString()}</div>
                </div>
              )}
              {project.registrationEndDate && (
                <div>
                  <span className="font-medium text-gray-700">Registration Ends:</span>
                  <div className="text-gray-600">{new Date(project.registrationEndDate).toLocaleDateString()}</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

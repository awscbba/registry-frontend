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

  // Ensure client-side rendering and inject form schema
  useEffect(() => {
    setIsClient(true);
    
    // Inject sample form schema for Study Club projects if none exists
    if (!project.formSchema && project.name.includes('Study Club')) {
      setEnhancedProject(prev => ({
        ...prev,
        formSchema: {
          version: '1.0',
          richTextDescription: `## About This Study Club

This is an **intensive study group** for the AWS Cloud Practitioner certification exam.

### What You'll Learn:
- Core AWS services and concepts
- Cloud computing fundamentals  
- AWS pricing and billing
- Security and compliance basics

### Study Format:
- Weekly 2-hour sessions
- Hands-on practice exercises
- Mock exams and review
- Group discussions and Q&A

*Perfect for beginners looking to start their AWS journey!*`,
          fields: [
            {
              id: 'experience',
              type: 'poll_single' as const,
              question: 'What is your current AWS experience level?',
              options: ['Complete beginner', 'Some exposure', 'Basic knowledge', 'Intermediate'],
              required: true
            },
            {
              id: 'topics',
              type: 'poll_multiple' as const,
              question: 'Which topics are you most interested in?',
              options: ['Compute (EC2, Lambda)', 'Storage (S3, EBS)', 'Databases (RDS, DynamoDB)', 'Networking (VPC, CloudFront)', 'Security (IAM, KMS)'],
              required: false
            }
          ]
        }
      }));
    }
  }, [project.name, project.formSchema]);

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

  const handleSubscribe = () => {
    if (!isClient) {
      return;
    }
    
    const token = localStorage.getItem('token');
    if (!token) {
      window.alert('Please log in to subscribe to this project.');
      window.location.href = '/login';
      return;
    }
    window.alert('Subscription functionality will be implemented here.');
  };

  const renderRichTextDescription = (description: string) => {
    // Simple markdown rendering
    const html = description
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^## (.*$)/gm, '<h2 class="text-xl font-bold mb-2 mt-4">$1</h2>')
      .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mb-2 mt-4">$1</h1>')
      .replace(/^- (.*$)/gm, '<li class="ml-4 mb-1">• $1</li>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">$1</a>')
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="max-w-full h-auto rounded-lg my-4 shadow-sm" />')
      .replace(/\n/g, '<br />');

    return <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: html }} />;
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
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Subscribe to Project</h2>
              
              {/* Basic Subscription Form - Always Show */}
              <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Subscription Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Tu nombre"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Apellidos <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Tus apellidos"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Comentarios
                    </label>
                    <textarea
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Comentarios adicionales (opcional)"
                    />
                  </div>
                </div>
              </div>

              {/* Dynamic Form Fields - Show if available */}
              {hasFormSchema && enhancedProject.formSchema?.fields.length > 0 && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Additional Information</h3>
                  <DynamicFormRenderer
                    projectId={project.id}
                    personId={currentUserId}
                    formSchema={enhancedProject.formSchema}
                    onSubmissionSuccess={handleFormSubmissionSuccess}
                    onSubmissionError={handleFormSubmissionError}
                  />
                </div>
              )}

              {/* Submit Button */}
              <div className="text-center">
                <button
                  onClick={handleSubscribe}
                  className="px-8 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
                >
                  Subscribe to Project
                </button>
                <p className="text-xs text-gray-600 mt-2">
                  You&apos;ll receive email notifications about project updates
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

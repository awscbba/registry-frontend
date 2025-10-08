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
  const [enhancedProject] = useState<EnhancedProject>(project);
  const [showForm, setShowForm] = useState(false);
  const [submissions, setSubmissions] = useState<ProjectSubmission[]>([]);
  const [isClient, setIsClient] = useState(false);

  // Ensure client-side rendering
  useEffect(() => {
    setIsClient(true);
  }, []);

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

  // Add sample form schema for testing if none exists and client-side
  if (isClient && !enhancedProject.formSchema && project.name.includes('Study Club')) {
    enhancedProject.formSchema = {
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
    };
  }

  const userSubmission = currentUserId 
    ? submissions.find(s => s.personId === currentUserId)
    : null;

  // Client-side form schema handling
  if (isClient) {
    console.log('Project data:', project);
    console.log('Enhanced project:', enhancedProject);
    
    // Add sample form schema for testing if none exists
    if (!enhancedProject.formSchema) {
      enhancedProject.formSchema = {
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
      };
      console.log('Added sample form schema for testing');
    }
    
    console.log('Has form schema:', enhancedProject.formSchema && 
      (enhancedProject.formSchema.fields.length > 0 || enhancedProject.formSchema.richTextDescription));
    console.log('Form schema:', enhancedProject.formSchema);
  }

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

        {/* Rich Text Description */}
        {isClient && hasFormSchema && enhancedProject.formSchema && enhancedProject.formSchema.richTextDescription && (
          <div className="p-6 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Project Details</h2>
            {renderRichTextDescription(enhancedProject.formSchema.richTextDescription)}
          </div>
        )}

        {/* Subscription Form Section */}
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Subscribe to Project</h2>
          
          {!isClient ? (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <div className="text-center">
                <p className="text-gray-600">Loading subscription form...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Enhanced Dynamic Form */}
              {hasFormSchema && enhancedProject.formSchema && enhancedProject.formSchema.fields.length > 0 ? (
                <div>
                  {currentUserId && (
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm text-gray-600">Complete the form below to subscribe</p>
                      <button
                        onClick={() => setShowForm(!showForm)}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        {showForm ? 'Hide Form' : userSubmission ? 'View/Edit Response' : 'Fill Form'}
                      </button>
                    </div>
                  )}

                  {userSubmission && !showForm && (
                    <div className="bg-green-50 border border-green-200 rounded-md p-3 mb-4">
                      <p className="text-sm text-green-700">
                        ✓ You submitted a response on {new Date(userSubmission.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  )}

                  {(showForm || !currentUserId) && (
                    <DynamicFormRenderer
                      projectId={project.id}
                      personId={currentUserId}
                      formSchema={enhancedProject.formSchema}
                      onSubmissionSuccess={handleFormSubmissionSuccess}
                      onSubmissionError={handleFormSubmissionError}
                    />
                  )}
                </div>
              ) : (
                /* Basic Subscription Form with Test Form Builder */
                <div className="space-y-6">
                  {/* Basic Subscription */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <div className="text-center">
                      <h3 className="text-lg font-medium text-blue-900 mb-2">Ready to Join?</h3>
                      <p className="text-blue-700 mb-4">
                        Click the button below to subscribe to this project and receive updates.
                      </p>
                      <button
                        onClick={handleSubscribe}
                        className="px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
                      >
                        Subscribe Now
                      </button>
                      <p className="text-xs text-blue-600 mt-2">
                        You&apos;ll receive email notifications about project updates
                      </p>
                    </div>
                  </div>

                  {/* Test Dynamic Form */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                    <h3 className="text-lg font-medium text-green-900 mb-4">Test Dynamic Form</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          What is your experience level with AWS?
                        </label>
                        <div className="space-y-2">
                          <label className="flex items-center">
                            <input type="radio" name="experience" value="beginner" className="mr-2" />
                            Beginner
                          </label>
                          <label className="flex items-center">
                            <input type="radio" name="experience" value="intermediate" className="mr-2" />
                            Intermediate
                          </label>
                          <label className="flex items-center">
                            <input type="radio" name="experience" value="advanced" className="mr-2" />
                            Advanced
                          </label>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Which topics interest you? (Select all that apply)
                        </label>
                        <div className="space-y-2">
                          <label className="flex items-center">
                            <input type="checkbox" value="compute" className="mr-2" />
                            Compute Services (EC2, Lambda)
                          </label>
                          <label className="flex items-center">
                            <input type="checkbox" value="storage" className="mr-2" />
                            Storage Services (S3, EBS)
                          </label>
                          <label className="flex items-center">
                            <input type="checkbox" value="database" className="mr-2" />
                            Database Services (RDS, DynamoDB)
                          </label>
                        </div>
                      </div>

                      <button className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors">
                        Submit Form Response
                      </button>
                    </div>
                  </div>
                </div>
              )}
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

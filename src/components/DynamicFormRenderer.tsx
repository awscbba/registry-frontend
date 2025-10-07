import React, { useState, useEffect } from 'react';
import type { FormSchema, ProjectSubmission, ProjectSubmissionCreate } from '../types/dynamicForm';
import { dynamicFormApi } from '../services/dynamicFormApi';
import { getApiLogger } from '../utils/logger';

interface DynamicFormRendererProps {
  projectId: string;
  personId?: string;
  formSchema: FormSchema;
  onSubmissionSuccess?: (submission: ProjectSubmission) => void;
  onSubmissionError?: (error: Error) => void;
  className?: string;
}

const logger = getApiLogger('DynamicFormRenderer');

export const DynamicFormRenderer: React.FC<DynamicFormRendererProps> = ({
  projectId,
  personId,
  formSchema,
  onSubmissionSuccess,
  onSubmissionError,
  className = '',
}) => {
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingSubmission, setExistingSubmission] = useState<ProjectSubmission | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load existing submission if user is logged in
  useEffect(() => {
    if (personId) {
      loadExistingSubmission();
    }
  }, [personId, projectId]);

  const loadExistingSubmission = async () => {
    if (!personId) {
      return;
    }
    
    setIsLoading(true);
    try {
      const submission = await dynamicFormApi.getPersonProjectSubmission(personId, projectId);
      if (submission) {
        setExistingSubmission(submission);
        setResponses(submission.responses);
      }
    } catch (error) {
      logger.error('Failed to load existing submission', { error, personId, projectId });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFieldChange = (fieldId: string, value: any) => {
    setResponses(prev => ({
      ...prev,
      [fieldId]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!personId) {
      onSubmissionError?.(new Error('User must be logged in to submit form'));
      return;
    }

    // Validate required fields
    const missingFields = formSchema.fields
      .filter(field => field.required && !responses[field.id])
      .map(field => field.question);

    if (missingFields.length > 0) {
      onSubmissionError?.(new Error(`Please fill in required fields: ${missingFields.join(', ')}`));
      return;
    }

    setIsSubmitting(true);
    try {
      const submissionData: ProjectSubmissionCreate = {
        projectId,
        personId,
        responses,
      };

      const submission = await dynamicFormApi.submitFormResponse(submissionData);
      setExistingSubmission(submission);
      onSubmissionSuccess?.(submission);
      
      logger.info('Form submitted successfully', { projectId, personId });
    } catch (error) {
      logger.error('Form submission failed', { error, projectId, personId });
      onSubmissionError?.(error as Error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = (field: any) => {
    const value = responses[field.id] || '';

    switch (field.type) {
      case 'poll_single':
        return (
          <div key={field.id} className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {field.question}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className="space-y-2">
              {field.options.map((option: string, index: number) => (
                <label key={index} className="flex items-center">
                  <input
                    type="radio"
                    name={field.id}
                    value={option}
                    checked={value === option}
                    onChange={(e) => handleFieldChange(field.id, e.target.value)}
                    className="mr-2 text-blue-600 focus:ring-blue-500"
                    disabled={isSubmitting}
                  />
                  <span className="text-sm text-gray-700">{option}</span>
                </label>
              ))}
            </div>
          </div>
        );

      case 'poll_multiple': {
        const selectedOptions = Array.isArray(value) ? value : [];
        return (
          <div key={field.id} className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {field.question}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className="space-y-2">
              {field.options.map((option: string, index: number) => (
                <label key={index} className="flex items-center">
                  <input
                    type="checkbox"
                    value={option}
                    checked={selectedOptions.includes(option)}
                    onChange={(e) => {
                      const newValue = e.target.checked
                        ? [...selectedOptions, option]
                        : selectedOptions.filter((o: string) => o !== option);
                      handleFieldChange(field.id, newValue);
                    }}
                    className="mr-2 text-blue-600 focus:ring-blue-500"
                    disabled={isSubmitting}
                  />
                  <span className="text-sm text-gray-700">{option}</span>
                </label>
              ))}
            </div>
          </div>
        );
      }

      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="h-10 bg-gray-200 rounded w-full"></div>
      </div>
    );
  }

  if (!formSchema.fields || formSchema.fields.length === 0) {
    return (
      <div className={`text-gray-500 text-center py-8 ${className}`}>
        No form fields configured for this project.
      </div>
    );
  }

  return (
    <div className={className}>
      {existingSubmission && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-700">
            You have already submitted a response on {new Date(existingSubmission.createdAt).toLocaleDateString()}.
            You can update your responses below.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {formSchema.fields.map(renderField)}

        <div className="pt-4 border-t border-gray-200">
          <button
            type="submit"
            disabled={isSubmitting || !personId}
            className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${
              isSubmitting || !personId
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500'
            }`}
          >
            {isSubmitting ? 'Submitting...' : existingSubmission ? 'Update Response' : 'Submit Response'}
          </button>
          
          {!personId && (
            <p className="mt-2 text-sm text-gray-500 text-center">
              Please log in to submit your response.
            </p>
          )}
        </div>
      </form>
    </div>
  );
};

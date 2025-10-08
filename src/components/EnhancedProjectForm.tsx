import React, { useState, useEffect } from 'react';
import type { Project, ProjectCreate, ProjectUpdate } from '../types/project';
import type { FormSchema } from '../types/dynamicForm';
import { getApiLogger } from '../utils/logger';
import { FormBuilder } from './FormBuilder';
import RichTextEditor from './RichTextEditor';
import ImageUpload from './ImageUpload';

interface EnhancedProjectFormProps {
  project?: Project;
  onSubmit: (projectData: ProjectCreate | ProjectUpdate, formSchema?: FormSchema) => void;
  onCancel: () => void;
  isLoading?: boolean;
  className?: string;
}

const logger = getApiLogger('EnhancedProjectForm');

export const EnhancedProjectForm: React.FC<EnhancedProjectFormProps> = ({
  project,
  onSubmit,
  onCancel,
  isLoading = false,
  className = '',
}) => {
  const [projectData, setProjectData] = useState<ProjectCreate | ProjectUpdate>({
    name: project?.name || '',
    description: project?.description || '',
    status: project?.status || 'pending',
    maxParticipants: project?.maxParticipants || undefined,
    startDate: project?.startDate || '',
    endDate: project?.endDate || '',
    registrationEndDate: project?.registrationEndDate || '',
    isEnabled: project?.isEnabled ?? true,
  });

  const [formSchema, setFormSchema] = useState<FormSchema>({
    version: '1.0',
    fields: [],
    richTextDescription: '',
  });

  const [showFormBuilder, setShowFormBuilder] = useState(false);

  // Load existing form schema if editing
  useEffect(() => {
    if (project && (project as any).formSchema) {
      setFormSchema((project as any).formSchema);
      setShowFormBuilder(true);
    }
  }, [project]);

  const handleInputChange = (field: keyof typeof projectData, value: any) => {
    setProjectData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!projectData.name?.trim()) {
      logger.error('Project name is required');
      return;
    }

    if (!projectData.description?.trim()) {
      logger.error('Project description is required');
      return;
    }

    logger.info('Submitting enhanced project', { 
      projectId: project?.id,
      hasFormSchema: showFormBuilder && (formSchema.fields.length > 0 || formSchema.richTextDescription),
    });

    // Submit with form schema if form builder is enabled and has content
    const schemaToSubmit = showFormBuilder && (formSchema.fields.length > 0 || formSchema.richTextDescription) 
      ? formSchema 
      : undefined;

    onSubmit(projectData, schemaToSubmit);
  };

  return (
    <div className={className}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Project Information */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Project Name *
              </label>
              <input
                type="text"
                value={projectData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Basic Description *
              </label>
              <textarea
                value={projectData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Brief description of the project"
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                This is the basic description. You can add a rich text description with images below.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={projectData.status}
                onChange={(e) => handleInputChange('status', e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="pending">Pending</option>
                <option value="active">Active</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Participants
              </label>
              <input
                type="number"
                value={projectData.maxParticipants || ''}
                onChange={(e) => handleInputChange('maxParticipants', e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                min="1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={projectData.startDate}
                onChange={(e) => handleInputChange('startDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={projectData.endDate}
                onChange={(e) => handleInputChange('endDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Registration End Date
              </label>
              <input
                type="date"
                value={projectData.registrationEndDate}
                onChange={(e) => handleInputChange('registrationEndDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={projectData.isEnabled}
                  onChange={(e) => handleInputChange('isEnabled', e.target.checked)}
                  className="mr-2 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Project is enabled</span>
              </label>
            </div>
          </div>
        </div>

        {/* Dynamic Form Builder Toggle */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Enhanced Features</h3>
              <p className="text-sm text-gray-600">Add rich descriptions and custom form fields</p>
            </div>
            <button
              type="button"
              onClick={() => setShowFormBuilder(!showFormBuilder)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                showFormBuilder
                  ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {showFormBuilder ? 'Hide Form Builder' : 'Enable Form Builder'}
            </button>
          </div>

          {showFormBuilder && (
            <FormBuilder
              initialSchema={formSchema}
              onChange={setFormSchema}
            />
          )}
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isLoading ? 'Saving...' : project ? 'Update Project' : 'Create Project'}
          </button>
        </div>
      </form>
    </div>
  );
};

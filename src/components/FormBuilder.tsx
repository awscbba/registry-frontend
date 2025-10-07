import React, { useState } from 'react';
import type { FormSchema, CustomField } from '../types/dynamicForm';
import { getApiLogger } from '../utils/logger';
import { RichTextEditor } from './RichTextEditor';

interface FormBuilderProps {
  initialSchema?: FormSchema;
  onChange: (schema: FormSchema) => void;
  className?: string;
}

const logger = getApiLogger('FormBuilder');

export const FormBuilder: React.FC<FormBuilderProps> = ({
  initialSchema,
  onChange,
  className = '',
}) => {
  const [schema, setSchema] = useState<FormSchema>(
    initialSchema || {
      version: '1.0',
      fields: [],
      richTextDescription: '',
    }
  );

  const updateSchema = (updates: Partial<FormSchema>) => {
    const newSchema = { ...schema, ...updates };
    setSchema(newSchema);
    onChange(newSchema);
  };

  const addField = (type: 'poll_single' | 'poll_multiple') => {
    const newField: CustomField = {
      id: `field_${Date.now()}`,
      type,
      question: '',
      options: ['Option 1', 'Option 2'],
      required: false,
    };

    const newFields = [...schema.fields, newField];
    updateSchema({ fields: newFields });
    
    logger.debug('Added new field', { type, fieldId: newField.id });
  };

  const updateField = (fieldId: string, updates: Partial<CustomField>) => {
    const newFields = schema.fields.map(field =>
      field.id === fieldId ? { ...field, ...updates } : field
    );
    updateSchema({ fields: newFields });
  };

  const removeField = (fieldId: string) => {
    const newFields = schema.fields.filter(field => field.id !== fieldId);
    updateSchema({ fields: newFields });
    
    logger.debug('Removed field', { fieldId });
  };

  const addOption = (fieldId: string) => {
    const field = schema.fields.find(f => f.id === fieldId);
    if (!field) {
      return;
    }

    const newOptions = [...field.options, `Option ${field.options.length + 1}`];
    updateField(fieldId, { options: newOptions });
  };

  const updateOption = (fieldId: string, optionIndex: number, value: string) => {
    const field = schema.fields.find(f => f.id === fieldId);
    if (!field) {
      return;
    }

    const newOptions = [...field.options];
    newOptions[optionIndex] = value;
    updateField(fieldId, { options: newOptions });
  };

  const removeOption = (fieldId: string, optionIndex: number) => {
    const field = schema.fields.find(f => f.id === fieldId);
    if (!field || field.options.length <= 2) {
      return; // Keep at least 2 options
    }

    const newOptions = field.options.filter((_, index) => index !== optionIndex);
    updateField(fieldId, { options: newOptions });
  };

  const renderFieldEditor = (field: CustomField, index: number) => (
    <div key={field.id} className="border border-gray-200 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-gray-900">
          {field.type === 'poll_single' ? 'Single Choice Poll' : 'Multiple Choice Poll'} #{index + 1}
        </h4>
        <button
          type="button"
          onClick={() => removeField(field.id)}
          className="text-red-600 hover:text-red-800 text-sm"
        >
          Remove
        </button>
      </div>

      <div className="space-y-3">
        {/* Question */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Question
          </label>
          <input
            type="text"
            value={field.question}
            onChange={(e) => updateField(field.id, { question: e.target.value })}
            placeholder="Enter your question..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Required checkbox */}
        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={field.required}
              onChange={(e) => updateField(field.id, { required: e.target.checked })}
              className="mr-2 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Required field</span>
          </label>
        </div>

        {/* Options */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Options
          </label>
          <div className="space-y-2">
            {field.options.map((option, optionIndex) => (
              <div key={optionIndex} className="flex items-center space-x-2">
                <input
                  type="text"
                  value={option}
                  onChange={(e) => updateOption(field.id, optionIndex, e.target.value)}
                  placeholder={`Option ${optionIndex + 1}`}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
                {field.options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeOption(field.id, optionIndex)}
                    className="text-red-600 hover:text-red-800 text-sm px-2"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => addOption(field.id)}
            className="mt-2 text-sm text-blue-600 hover:text-blue-800"
          >
            + Add Option
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className={className}>
      <div className="space-y-6">
        {/* Rich Text Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Project Description (Rich Text)
          </label>
          <RichTextEditor
            value={schema.richTextDescription}
            onChange={(value) => updateSchema({ richTextDescription: value })}
            placeholder="Enter a detailed description of your project. You can use markdown formatting and upload images."
          />
        </div>

        {/* Form Fields */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Form Fields</h3>
            <div className="space-x-2">
              <button
                type="button"
                onClick={() => addField('poll_single')}
                className="px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
              >
                + Single Choice
              </button>
              <button
                type="button"
                onClick={() => addField('poll_multiple')}
                className="px-3 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
              >
                + Multiple Choice
              </button>
            </div>
          </div>

          {schema.fields.length === 0 ? (
            <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
              <p>No form fields yet.</p>
              <p className="text-sm">Add single or multiple choice questions above.</p>
            </div>
          ) : (
            <div>
              {schema.fields.map((field, index) => renderFieldEditor(field, index))}
            </div>
          )}
        </div>

        {/* Schema Summary */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">Form Summary</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <p>Description: {schema.richTextDescription ? 'Configured' : 'Not set'}</p>
            <p>Fields: {schema.fields.length} question{schema.fields.length !== 1 ? 's' : ''}</p>
            <p>Required fields: {schema.fields.filter(f => f.required).length}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

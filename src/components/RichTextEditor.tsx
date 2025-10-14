import React, { useState, useRef } from 'react';
import { getApiLogger } from '../utils/logger';
import { ImageUpload } from './ImageUpload';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  showPreview?: boolean;
}

const logger = getApiLogger('RichTextEditor');

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Enter your description...',
  className = '',
  showPreview = true,
}) => {
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertText = (text: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newValue = value.substring(0, start) + text + value.substring(end);
    
    onChange(newValue);
    
    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + text.length, start + text.length);
    }, 0);
  };

  const handleImageUploaded = (imageUrl: string, cloudFrontUrl: string) => {
    const imageMarkdown = `![Image](${cloudFrontUrl})`;
    insertText(imageMarkdown);
    setShowImageUpload(false);
    logger.info('Image inserted into editor', { cloudFrontUrl });
  };

  const handleImageUploadError = (error: Error) => {
    logger.error('Image upload failed', { error });
    setShowImageUpload(false);
  };

  const formatText = (format: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);

    let formattedText = '';
    switch (format) {
      case 'bold':
        formattedText = `**${selectedText || 'bold text'}**`;
        break;
      case 'italic':
        formattedText = `*${selectedText || 'italic text'}*`;
        break;
      case 'heading':
        formattedText = `## ${selectedText || 'Heading'}`;
        break;
      case 'list':
        formattedText = `- ${selectedText || 'List item'}`;
        break;
      case 'link':
        formattedText = `[${selectedText || 'Link text'}](https://example.com)`;
        break;
      default:
        return;
    }

    insertText(formattedText);
  };

  const renderMarkdown = (text: string) => {
    // Simple markdown rendering for preview
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^## (.*$)/gm, '<h2 class="text-xl font-bold mb-2">$1</h2>')
      .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mb-2">$1</h1>')
      .replace(/^- (.*$)/gm, '<li class="ml-4">• $1</li>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">$1</a>')
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="max-w-full h-auto rounded-lg my-2" />')
      .replace(/\n/g, '<br />');
  };

  return (
    <div className={className}>
      <div className="border border-gray-300 rounded-lg overflow-hidden">
        {/* Toolbar */}
        <div className="bg-gray-50 border-b border-gray-300 p-2 flex items-center space-x-2">
          <button
            type="button"
            onClick={() => formatText('bold')}
            className="p-1 rounded hover:bg-gray-200 transition-colors"
            title="Bold"
          >
            <strong>B</strong>
          </button>
          
          <button
            type="button"
            onClick={() => formatText('italic')}
            className="p-1 rounded hover:bg-gray-200 transition-colors"
            title="Italic"
          >
            <em>I</em>
          </button>
          
          <button
            type="button"
            onClick={() => formatText('heading')}
            className="p-1 rounded hover:bg-gray-200 transition-colors text-sm"
            title="Heading"
          >
            H2
          </button>
          
          <button
            type="button"
            onClick={() => formatText('list')}
            className="p-1 rounded hover:bg-gray-200 transition-colors"
            title="List"
          >
            •
          </button>
          
          <button
            type="button"
            onClick={() => formatText('link')}
            className="p-1 rounded hover:bg-gray-200 transition-colors text-sm"
            title="Link"
          >
            🔗
          </button>
          
          <button
            type="button"
            onClick={() => setShowImageUpload(!showImageUpload)}
            className="p-1 rounded hover:bg-gray-200 transition-colors text-sm"
            title="Insert Image"
          >
            📷
          </button>

          <div className="flex-1"></div>

          {showPreview && (
            <button
              type="button"
              onClick={() => setIsPreviewMode(!isPreviewMode)}
              className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
            >
              {isPreviewMode ? 'Edit' : 'Preview'}
            </button>
          )}
        </div>

        {/* Image Upload */}
        {showImageUpload && (
          <div className="bg-blue-50 border-b border-gray-300 p-3">
            <ImageUpload
              onImageUploaded={handleImageUploaded}
              onUploadError={handleImageUploadError}
              className="mb-2"
            />
            <p className="text-xs text-gray-600">
              Upload an image to insert into your description. Supported formats: JPEG, PNG, GIF, WebP (max 10MB)
            </p>
          </div>
        )}

        {/* Editor/Preview */}
        <div className="min-h-[200px]">
          {isPreviewMode ? (
            <div 
              className="p-4 prose max-w-none"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(value) }}
            />
          ) : (
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              className="w-full h-48 p-4 border-none resize-none focus:outline-none focus:ring-0"
              style={{ minHeight: '200px' }}
            />
          )}
        </div>

        {/* Help Text */}
        {!isPreviewMode && (
          <div className="bg-gray-50 border-t border-gray-300 p-2 text-xs text-gray-600">
            <strong>Markdown supported:</strong> **bold**, *italic*, ## headings, - lists, [links](url), images via upload
          </div>
        )}
      </div>
    </div>
  );
};

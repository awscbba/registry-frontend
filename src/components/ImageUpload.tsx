import React, { useState, useRef } from 'react';
import { dynamicFormApi } from '../services/dynamicFormApi';
import { getApiLogger } from '../utils/logger';

interface ImageUploadProps {
  onImageUploaded?: (imageUrl: string, cloudFrontUrl: string) => void;
  onUploadError?: (error: Error) => void;
  className?: string;
  accept?: string;
  maxSize?: number; // in bytes
}

const logger = getApiLogger('ImageUpload');

export const ImageUpload: React.FC<ImageUploadProps> = ({
  onImageUploaded,
  onUploadError,
  className = '',
  accept = 'image/jpeg,image/jpg,image/png,image/gif,image/webp',
  maxSize = 10 * 1024 * 1024, // 10MB default
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // eslint-disable-next-line no-undef
  const validateFile = (file: File): string | null => {
    // Check file type
    const allowedTypes = accept.split(',').map(type => type.trim());
    if (!allowedTypes.includes(file.type)) {
      return `File type ${file.type} is not allowed. Allowed types: ${allowedTypes.join(', ')}`;
    }

    // Check file size
    if (file.size > maxSize) {
      const maxSizeMB = Math.round(maxSize / (1024 * 1024));
      const fileSizeMB = Math.round(file.size / (1024 * 1024));
      return `File size ${fileSizeMB}MB exceeds maximum allowed size of ${maxSizeMB}MB`;
    }

    return null;
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    // Validate file
    const validationError = validateFile(file);
    if (validationError) {
      onUploadError?.(new Error(validationError));
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      logger.debug('Starting image upload', { filename: file.name, size: file.size });

      // Get presigned upload URL
      const uploadResponse = await dynamicFormApi.getImageUploadUrl({
        filename: file.name,
        content_type: file.type,
        file_size: file.size,
      });

      setUploadProgress(25);

      // Upload to S3
      await dynamicFormApi.uploadImageToS3(uploadResponse.uploadUrl, file);
      
      setUploadProgress(100);

      logger.info('Image uploaded successfully', { 
        filename: file.name, 
        cloudFrontUrl: uploadResponse.cloudFrontUrl 
      });

      onImageUploaded?.(uploadResponse.uploadUrl, uploadResponse.cloudFrontUrl);

    } catch (error) {
      logger.error('Image upload failed', { error, filename: file.name });
      onUploadError?.(error as Error);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={className}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
        disabled={isUploading}
      />
      
      <button
        type="button"
        onClick={handleButtonClick}
        disabled={isUploading}
        className={`inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium transition-colors ${
          isUploading
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-white text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500'
        }`}
      >
        {isUploading ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Uploading... {uploadProgress}%
          </>
        ) : (
          <>
            <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Upload Image
          </>
        )}
      </button>

      {isUploading && uploadProgress > 0 && (
        <div className="mt-2">
          <div className="bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
};

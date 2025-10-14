import type { Project } from './project';

export interface CustomField {
  id: string;
  type: 'poll_single' | 'poll_multiple';
  question: string;
  options: string[];
  required: boolean;
}

export interface FormSchema {
  version: string;
  fields: CustomField[];
  richTextDescription: string;
}

export interface ProjectImage {
  url: string;
  filename: string;
  size: number;
}

export interface EnhancedProject extends Project {
  customFields?: Record<string, any>;
  formSchema?: FormSchema;
  images?: ProjectImage[];
}

export interface ProjectSubmission {
  id: string;
  projectId: string;
  personId: string;
  responses: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectSubmissionCreate {
  projectId: string;
  personId: string;
  responses: Record<string, any>;
}

export interface ImageUploadRequest {
  filename: string;
  content_type: string;
  file_size: number;
}

export interface ImageUploadResponse {
  uploadUrl: string;
  imageId: string;
  cloudFrontUrl: string;
}

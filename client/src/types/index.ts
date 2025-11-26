export type FieldType = 
  | 'text' 
  | 'textarea' 
  | 'number' 
  | 'email' 
  | 'date' 
  | 'checkbox' 
  | 'radio' 
  | 'select';

export interface FieldOption {
  label: string;
  value: string;
  nestedFields?: Field[];
}

export interface Field {
  _id?: string;
  label: string;
  type: FieldType;
  name: string;
  required: boolean;
  options?: FieldOption[];
  validation?: {
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    regex?: string;
  };
  order: number;
}

export interface Form {
  _id?: string;
  title: string;
  description: string;
  fields: Field[];
  version: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Submission {
  _id?: string;
  formId: string;
  formVersion: number;
  answers: Map<string, any> | Record<string, any>;
  submittedAt: string;
  ip?: string;
  metadata?: Map<string, string>;
}


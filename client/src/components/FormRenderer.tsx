import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { formsApi, submissionsApi } from '../api/config';
import { Form, Field } from '../types';
import './FormRenderer.css';

const FormRenderer: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form, setForm] = useState<Form | null>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [nestedAnswers, setNestedAnswers] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchForm(id);
    }
  }, [id]);

  const fetchForm = async (formId: string) => {
    try {
      setLoading(true);
      const response = await formsApi.getById(formId);
      setForm(response.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load form');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (fieldName: string, value: any) => {
    setAnswers({ ...answers, [fieldName]: value });
    // Clear errors for this field
    if (errors[fieldName]) {
      const newErrors = { ...errors };
      delete newErrors[fieldName];
      setErrors(newErrors);
    }
  };

  const handleNestedChange = (parentFieldName: string, nestedFieldName: string, value: any) => {
    const key = `${parentFieldName}_${nestedFieldName}`;
    setNestedAnswers({ ...nestedAnswers, [key]: value });
    // Clear errors for this nested field
    if (errors[key]) {
      const newErrors = { ...errors };
      delete newErrors[key];
      setErrors(newErrors);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form || !id) return;

    setSubmitting(true);
    setErrors({});

    try {
      // Merge nested answers into main answers
      const allAnswers = { ...answers, ...nestedAnswers };
      
      await submissionsApi.submit(id, allAnswers);
      
      setSubmitSuccess(true);
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err: any) {
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      } else {
        setError(err.response?.data?.error || 'Failed to submit form');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="card">
          <p>Loading form...</p>
        </div>
      </div>
    );
  }

  if (error && !form) {
    return (
      <div className="container">
        <div className="card">
          <p className="error">{error}</p>
          <button className="btn btn-secondary" onClick={() => navigate('/')}>
            Back to Forms
          </button>
        </div>
      </div>
    );
  }

  if (!form) {
    return null;
  }

  if (submitSuccess) {
    return (
      <div className="container">
        <div className="card success-message">
          <h2>Form Submitted Successfully!</h2>
          <p>Thank you for your submission. Redirecting...</p>
        </div>
      </div>
    );
  }

  const sortedFields = [...form.fields].sort((a, b) => a.order - b.order);

  return (
    <div className="container">
      <div className="form-container">
        <div className="form-header">
          <h1>{form.title}</h1>
          {form.description && <p className="form-description">{form.description}</p>}
        </div>

        {error && (
          <div className="card error-message">
            <p className="error">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="dynamic-form">
          {sortedFields.map((field) => (
            <FieldRenderer
              key={field._id || field.name}
              field={field}
              value={answers[field.name]}
              nestedAnswers={nestedAnswers}
              onChange={handleChange}
              onNestedChange={handleNestedChange}
              errors={errors[field.name] || []}
              nestedErrors={Object.keys(errors)
                .filter(key => key.startsWith(`${field.name}_`))
                .reduce((acc, key) => {
                  acc[key] = errors[key];
                  return acc;
                }, {} as Record<string, string[]>)}
            />
          ))}

          <div className="form-actions">
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={() => navigate('/')}
              disabled={submitting}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit Form'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface FieldRendererProps {
  field: Field;
  value: any;
  nestedAnswers: Record<string, any>;
  onChange: (name: string, value: any) => void;
  onNestedChange: (parentName: string, nestedName: string, value: any) => void;
  errors: string[];
  nestedErrors: Record<string, string[]>;
}

const FieldRenderer: React.FC<FieldRendererProps> = ({
  field,
  value,
  nestedAnswers,
  onChange,
  onNestedChange,
  errors,
  nestedErrors,
}) => {
  const handleFieldChange = (newValue: any) => {
    onChange(field.name, newValue);
  };

  const renderField = () => {
    const fieldId = `field-${field.name}`;
    const hasError = errors && errors.length > 0;

    switch (field.type) {
      case 'text':
        return (
          <input
            id={fieldId}
            type="text"
            value={value || ''}
            onChange={(e) => handleFieldChange(e.target.value)}
            required={field.required}
            className={hasError ? 'error' : ''}
            minLength={field.validation?.minLength}
            maxLength={field.validation?.maxLength}
            pattern={field.validation?.regex}
          />
        );

      case 'textarea':
        return (
          <textarea
            id={fieldId}
            value={value || ''}
            onChange={(e) => handleFieldChange(e.target.value)}
            required={field.required}
            className={hasError ? 'error' : ''}
            minLength={field.validation?.minLength}
            maxLength={field.validation?.maxLength}
            rows={4}
          />
        );

      case 'number':
        return (
          <input
            id={fieldId}
            type="number"
            value={value || ''}
            onChange={(e) => handleFieldChange(e.target.value ? Number(e.target.value) : '')}
            required={field.required}
            className={hasError ? 'error' : ''}
            min={field.validation?.min}
            max={field.validation?.max}
          />
        );

      case 'email':
        return (
          <input
            id={fieldId}
            type="email"
            value={value || ''}
            onChange={(e) => handleFieldChange(e.target.value)}
            required={field.required}
            className={hasError ? 'error' : ''}
          />
        );

      case 'date':
        return (
          <input
            id={fieldId}
            type="date"
            value={value || ''}
            onChange={(e) => handleFieldChange(e.target.value)}
            required={field.required}
            className={hasError ? 'error' : ''}
          />
        );

      case 'checkbox':
        if (!field.options || field.options.length === 0) {
          return (
            <label>
              <input
                id={fieldId}
                type="checkbox"
                checked={value || false}
                onChange={(e) => handleFieldChange(e.target.checked)}
                required={field.required}
              />
              {field.label}
            </label>
          );
        } else {
          const selectedValues = Array.isArray(value) ? value : [];
          return (
            <div className="checkbox-group">
              {field.options.map((option, index) => (
                <label key={index} className="checkbox-option">
                  <input
                    type="checkbox"
                    checked={selectedValues.includes(option.value)}
                    onChange={(e) => {
                      const newValues = e.target.checked
                        ? [...selectedValues, option.value]
                        : selectedValues.filter(v => v !== option.value);
                      handleFieldChange(newValues);
                    }}
                  />
                  {option.label}
                </label>
              ))}
            </div>
          );
        }

      case 'radio':
        if (!field.options || field.options.length === 0) {
          return <p className="error">No options defined for this radio field</p>;
        }
        return (
          <div className="radio-group">
            {field.options.map((option, index) => (
              <label key={index} className="radio-option">
                <input
                  type="radio"
                  name={field.name}
                  value={option.value}
                  checked={value === option.value}
                  onChange={(e) => handleFieldChange(e.target.value)}
                  required={field.required}
                />
                {option.label}
              </label>
            ))}
          </div>
        );

      case 'select':
        if (!field.options || field.options.length === 0) {
          return <p className="error">No options defined for this select field</p>;
        }
        return (
          <select
            id={fieldId}
            value={value || ''}
            onChange={(e) => handleFieldChange(e.target.value)}
            required={field.required}
            className={hasError ? 'error' : ''}
          >
            <option value="">-- Select --</option>
            {field.options.map((option, index) => (
              <option key={index} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      default:
        return <p className="error">Unknown field type: {field.type}</p>;
    }
  };

  const selectedOption = (field.type === 'radio' || field.type === 'select') && value && field.options
    ? field.options.find(opt => opt.value === value)
    : null;

  return (
    <div className={`form-field ${field.required ? 'required' : ''}`}>
      <label htmlFor={`field-${field.name}`}>
        {field.label}
        {field.required && <span className="required-asterisk"> *</span>}
      </label>
      {renderField()}
      {errors && errors.length > 0 && (
        <div className="field-errors">
          {errors.map((error, index) => (
            <span key={index} className="error">{error}</span>
          ))}
        </div>
      )}
      {selectedOption && selectedOption.nestedFields && selectedOption.nestedFields.length > 0 && (
        <div className="nested-fields">
          {selectedOption.nestedFields.map((nestedField, index) => {
            const nestedKey = `${field.name}_${nestedField.name}`;
            const nestedValue = nestedAnswers[nestedKey];
            const nestedFieldErrors = nestedErrors[nestedKey] || [];

            return (
              <div key={index} className="nested-field">
                <label htmlFor={`field-${nestedKey}`}>
                  {nestedField.label}
                  {nestedField.required && <span className="required-asterisk"> *</span>}
                </label>
                <NestedFieldRenderer
                  field={nestedField}
                  value={nestedValue}
                  onChange={(val) => onNestedChange(field.name, nestedField.name, val)}
                  fieldId={`field-${nestedKey}`}
                  errors={nestedFieldErrors}
                />
                {nestedFieldErrors.length > 0 && (
                  <div className="field-errors">
                    {nestedFieldErrors.map((error, idx) => (
                      <span key={idx} className="error">{error}</span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

interface NestedFieldRendererProps {
  field: Field;
  value: any;
  onChange: (value: any) => void;
  fieldId: string;
  errors: string[];
}

const NestedFieldRenderer: React.FC<NestedFieldRendererProps> = ({
  field,
  value,
  onChange,
  fieldId,
  errors,
}) => {
  const hasError = errors && errors.length > 0;

  switch (field.type) {
    case 'text':
      return (
        <input
          id={fieldId}
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          required={field.required}
          className={hasError ? 'error' : ''}
        />
      );
    case 'textarea':
      return (
        <textarea
          id={fieldId}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          required={field.required}
          className={hasError ? 'error' : ''}
          rows={3}
        />
      );
    case 'number':
      return (
        <input
          id={fieldId}
          type="number"
          value={value || ''}
          onChange={(e) => onChange(e.target.value ? Number(e.target.value) : '')}
          required={field.required}
          className={hasError ? 'error' : ''}
        />
      );
    case 'email':
      return (
        <input
          id={fieldId}
          type="email"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          required={field.required}
          className={hasError ? 'error' : ''}
        />
      );
    case 'date':
      return (
        <input
          id={fieldId}
          type="date"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          required={field.required}
          className={hasError ? 'error' : ''}
        />
      );
    default:
      return (
        <input
          id={fieldId}
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          required={field.required}
          className={hasError ? 'error' : ''}
        />
      );
  }
};

export default FormRenderer;

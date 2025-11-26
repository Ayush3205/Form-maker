import React, { useEffect, useState } from 'react';
import { adminFormsApi } from '../api/config';
import { Form, Field, FieldType } from '../types';
import './AdminPanel.css';

const AdminPanel: React.FC = () => {
  const [forms, setForms] = useState<Form[]>([]);
  const [selectedForm, setSelectedForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showFieldModal, setShowFieldModal] = useState(false);
  const [showSubmissions, setShowSubmissions] = useState(false);
  const [editingField, setEditingField] = useState<Field | null>(null);

  useEffect(() => {
    fetchForms();
  }, []);

  const fetchForms = async () => {
    try {
      setLoading(true);
      const response = await adminFormsApi.getAll();
      setForms(response.data);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching forms:', err);
      if (err.code === 'ERR_NETWORK' || err.message?.includes('Network Error')) {
        setError('Cannot connect to server. Make sure the backend is running on port 5001. Run: npm run dev');
      } else {
        setError(err.response?.data?.error || err.message || 'Failed to load forms');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateForm = async (title: string, description: string) => {
    try {
      const response = await adminFormsApi.create({ title, description, fields: [] });
      setForms([...forms, response.data]);
      setSelectedForm(response.data);
      setShowFormModal(false);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create form');
    }
  };

  const handleUpdateForm = async (formId: string, updates: Partial<Form>) => {
    try {
      const response = await adminFormsApi.update(formId, updates);
      const updatedForms = forms.map(f => f._id === formId ? response.data : f);
      setForms(updatedForms);
      setSelectedForm(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update form');
    }
  };

  const handleDeleteForm = async (formId: string) => {
    if (!window.confirm('Are you sure you want to delete this form? All submissions will be deleted.')) {
      return;
    }
    try {
      await adminFormsApi.delete(formId);
      setForms(forms.filter(f => f._id !== formId));
      if (selectedForm?._id === formId) {
        setSelectedForm(null);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete form');
    }
  };

  const handleAddField = (field: Field) => {
    if (!selectedForm) return;

    const updatedFields = [...selectedForm.fields];
    if (editingField && editingField._id) {
      const index = updatedFields.findIndex(f => f._id === editingField._id);
      if (index >= 0) {
        updatedFields[index] = { ...field, _id: editingField._id, order: editingField.order };
      }
    } else {
      const maxOrder = updatedFields.length > 0 
        ? Math.max(...updatedFields.map(f => f.order)) 
        : -1;
      updatedFields.push({ ...field, order: maxOrder + 1 });
    }

    handleUpdateForm(selectedForm._id!, { fields: updatedFields });
    setShowFieldModal(false);
    setEditingField(null);
  };

  const handleDeleteField = (fieldId: string) => {
    if (!selectedForm) return;
    const updatedFields = selectedForm.fields.filter(f => f._id !== fieldId);
    handleUpdateForm(selectedForm._id!, { fields: updatedFields });
  };

  const handleEditField = (field: Field) => {
    setEditingField(field);
    setShowFieldModal(true);
  };

  const handleReorderFields = (startIndex: number, endIndex: number) => {
    if (!selectedForm) return;
    const updatedFields = [...selectedForm.fields];
    const [removed] = updatedFields.splice(startIndex, 1);
    updatedFields.splice(endIndex, 0, removed);
    
    // Update order numbers
    updatedFields.forEach((field, index) => {
      field.order = index;
    });

    handleUpdateForm(selectedForm._id!, { fields: updatedFields });
  };

  if (loading) {
    return (
      <div className="container">
        <div className="card">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="admin-header">
        <h1>Admin Panel</h1>
        <button 
          className="btn btn-primary" 
          onClick={() => setShowFormModal(true)}
        >
          Create New Form
        </button>
      </div>

      {error && (
        <div className="card error-message">
          <p className="error">{error}</p>
        </div>
      )}

      <div className="admin-layout">
        <div className="forms-list">
          <h2>Forms</h2>
          {forms.length === 0 ? (
            <p>No forms yet. Create one to get started.</p>
          ) : (
            forms.map(form => (
              <div 
                key={form._id} 
                className={`form-item ${selectedForm?._id === form._id ? 'active' : ''}`}
                onClick={() => setSelectedForm(form)}
              >
                <div className="form-item-header">
                  <h3>{form.title}</h3>
                  <div className="form-item-actions">
                    <button
                      className="btn-icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUpdateForm(form._id!, { isActive: !form.isActive });
                      }}
                      title={form.isActive ? 'Deactivate' : 'Activate'}
                    >
                      {form.isActive ? '✓' : '✗'}
                    </button>
                    <button
                      className="btn-icon btn-danger"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteForm(form._id!);
                      }}
                      title="Delete"
                    >
                      ×
                    </button>
                  </div>
                </div>
                <p className="form-description">{form.description || 'No description'}</p>
                <p className="form-meta">{form.fields.length} field(s)</p>
              </div>
            ))
          )}
        </div>

        {selectedForm && !showSubmissions && (
          <FormEditor
            form={selectedForm}
            onUpdate={(updates) => handleUpdateForm(selectedForm._id!, updates)}
            onAddField={() => {
              setEditingField(null);
              setShowFieldModal(true);
            }}
            onEditField={handleEditField}
            onDeleteField={handleDeleteField}
            onReorderFields={handleReorderFields}
            onViewSubmissions={() => setShowSubmissions(true)}
          />
        )}
        {selectedForm && showSubmissions && (
          <SubmissionsViewer
            formId={selectedForm._id!}
            form={selectedForm}
            onBack={() => setShowSubmissions(false)}
          />
        )}
      </div>

      {showFormModal && (
        <FormModal
          onClose={() => setShowFormModal(false)}
          onSave={handleCreateForm}
        />
      )}

      {showFieldModal && (
        <FieldModal
          field={editingField}
          onClose={() => {
            setShowFieldModal(false);
            setEditingField(null);
          }}
          onSave={handleAddField}
        />
      )}
    </div>
  );
};

interface FormEditorProps {
  form: Form;
  onUpdate: (updates: Partial<Form>) => void;
  onAddField: () => void;
  onEditField: (field: Field) => void;
  onDeleteField: (fieldId: string) => void;
  onReorderFields: (startIndex: number, endIndex: number) => void;
  onViewSubmissions: () => void;
}

const FormEditor: React.FC<FormEditorProps> = ({
  form,
  onUpdate,
  onAddField,
  onEditField,
  onDeleteField,
  onReorderFields,
  onViewSubmissions,
}) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const sortedFields = [...form.fields].sort((a, b) => a.order - b.order);

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    
    onReorderFields(draggedIndex, index);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <div className="form-editor">
      <div className="form-editor-header">
        <h2>{form.title}</h2>
        <div className="form-editor-actions">
          <button className="btn btn-secondary" onClick={onViewSubmissions}>
            View Submissions
          </button>
          <button className="btn btn-primary" onClick={onAddField}>
            Add Field
          </button>
        </div>
      </div>

      <div className="form-info">
        <div className="form-group">
          <label>Title</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => onUpdate({ title: e.target.value })}
            onBlur={() => onUpdate({})}
          />
        </div>
        <div className="form-group">
          <label>Description</label>
          <textarea
            value={form.description}
            onChange={(e) => onUpdate({ description: e.target.value })}
            onBlur={() => onUpdate({})}
          />
        </div>
      </div>

      <div className="fields-list">
        <h3>Fields</h3>
        {sortedFields.length === 0 ? (
          <p>No fields yet. Add a field to get started.</p>
        ) : (
          sortedFields.map((field, index) => (
            <div
              key={field._id || index}
              className="field-item"
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
            >
              <div className="field-item-header">
                <span className="drag-handle">☰</span>
                <div className="field-item-info">
                  <strong>{field.label}</strong>
                  <span className="field-type">{field.type}</span>
                  {field.required && <span className="field-required">Required</span>}
                </div>
                <div className="field-item-actions">
                  <button
                    className="btn-icon"
                    onClick={() => onEditField(field)}
                    title="Edit"
                  >
                    ✏️
                  </button>
                  <button
                    className="btn-icon btn-danger"
                    onClick={() => field._id && onDeleteField(field._id)}
                    title="Delete"
                  >
                    ×
                  </button>
                </div>
              </div>
              {field.options && field.options.length > 0 && (
                <div className="field-options">
                  Options: {field.options.map(opt => opt.label).join(', ')}
                  {field.options.some(opt => opt.nestedFields && opt.nestedFields.length > 0) && (
                    <span className="nested-fields-indicator"> (with nested fields)</span>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

interface FormModalProps {
  onClose: () => void;
  onSave: (title: string, description: string) => void;
}

const FormModal: React.FC<FormModalProps> = ({ onClose, onSave }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave(title, description);
    setTitle('');
    setDescription('');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create New Form</h2>
          <button className="btn-icon" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface FieldModalProps {
  field: Field | null;
  onClose: () => void;
  onSave: (field: Field) => void;
}

const FieldModal: React.FC<FieldModalProps> = ({ field, onSave, onClose }) => {
  const [label, setLabel] = useState(field?.label || '');
  const [type, setType] = useState<FieldType>(field?.type || 'text');
  const [name, setName] = useState(field?.name || '');
  const [required, setRequired] = useState(field?.required || false);
  const [options, setOptions] = useState<Array<{label: string, value: string, nestedFields?: Field[]}>>(
    field?.options || []
  );
  const [validation, setValidation] = useState(field?.validation || {});
  const [editingOptionIndex, setEditingOptionIndex] = useState<number | null>(null);

  useEffect(() => {
    if (field) {
      setLabel(field.label);
      setType(field.type);
      setName(field.name);
      setRequired(field.required);
      setOptions(field.options || []);
      setValidation(field.validation || {});
    }
  }, [field]);

  useEffect(() => {
    // Auto-generate name from label if empty
    if (!name && label) {
      setName(label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
    }
  }, [label, name]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim() || !name.trim()) return;

    const fieldData: Field = {
      label: label.trim(),
      type,
      name: name.trim(),
      required,
      order: field?.order || 0,
    };

    if (options.length > 0) {
      fieldData.options = options;
    }

    if (Object.keys(validation).length > 0) {
      fieldData.validation = validation;
    }

    onSave(fieldData);
    handleReset();
  };

  const handleReset = () => {
    setLabel('');
    setType('text');
    setName('');
    setRequired(false);
    setOptions([]);
    setValidation({});
  };

  const handleAddOption = () => {
    setOptions([...options, { label: '', value: '' }]);
  };

  const handleUpdateOption = (index: number, updates: Partial<typeof options[0]>) => {
    const updated = [...options];
    updated[index] = { ...updated[index], ...updates };
    setOptions(updated);
  };

  const handleDeleteOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const needsOptions = type === 'radio' || type === 'select' || type === 'checkbox';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{field ? 'Edit Field' : 'Add Field'}</h2>
          <button className="btn-icon" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Label *</label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label>Name (field identifier) *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              pattern="[a-z0-9-]+"
              title="Only lowercase letters, numbers, and hyphens"
            />
          </div>
          <div className="form-group">
            <label>Type *</label>
            <select value={type} onChange={(e) => setType(e.target.value as FieldType)}>
              <option value="text">Text</option>
              <option value="textarea">Textarea</option>
              <option value="number">Number</option>
              <option value="email">Email</option>
              <option value="date">Date</option>
              <option value="checkbox">Checkbox</option>
              <option value="radio">Radio</option>
              <option value="select">Select</option>
            </select>
          </div>
          <div className="form-group checkbox-group-admin">
            <label className="checkbox-label-admin">
              <input
                type="checkbox"
                checked={required}
                onChange={(e) => setRequired(e.target.checked)}
              />
              <span>Required</span>
            </label>
          </div>

          {needsOptions && (
            <div className="form-group">
              <label>Options</label>
              {options.map((option, index) => (
                <div key={index} className="option-item">
                  <input
                    type="text"
                    placeholder="Option label"
                    value={option.label}
                    onChange={(e) => handleUpdateOption(index, { label: e.target.value })}
                  />
                  <input
                    type="text"
                    placeholder="Option value"
                    value={option.value}
                    onChange={(e) => handleUpdateOption(index, { value: e.target.value })}
                  />
                  {(type === 'radio' || type === 'select') && (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setEditingOptionIndex(editingOptionIndex === index ? null : index)}
                    >
                      {editingOptionIndex === index ? 'Hide' : 'Add'} Nested Fields
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn-icon btn-danger"
                    onClick={() => handleDeleteOption(index)}
                  >
                    ×
                  </button>
                  {editingOptionIndex === index && (type === 'radio' || type === 'select') && (
                    <NestedFieldsEditor
                      fields={option.nestedFields || []}
                      onChange={(nestedFields) => handleUpdateOption(index, { nestedFields })}
                    />
                  )}
                </div>
              ))}
              <button type="button" className="btn btn-secondary" onClick={handleAddOption}>
                Add Option
              </button>
            </div>
          )}

          {type === 'number' && (
            <>
              <div className="form-group">
                <label>Min Value</label>
                <input
                  type="number"
                  step="any"
                  value={validation.min !== undefined ? validation.min : ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setValidation({ 
                      ...validation, 
                      min: val === '' ? undefined : parseFloat(val) 
                    });
                  }}
                />
              </div>
              <div className="form-group">
                <label>Max Value</label>
                <input
                  type="number"
                  step="any"
                  value={validation.max !== undefined ? validation.max : ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setValidation({ 
                      ...validation, 
                      max: val === '' ? undefined : parseFloat(val) 
                    });
                  }}
                />
              </div>
            </>
          )}

          {(type === 'text' || type === 'textarea') && (
            <>
              <div className="form-group">
                <label>Min Length</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={validation.minLength !== undefined ? validation.minLength : ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setValidation({ 
                      ...validation, 
                      minLength: val === '' ? undefined : parseInt(val, 10) 
                    });
                  }}
                />
              </div>
              <div className="form-group">
                <label>Max Length</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={validation.maxLength !== undefined ? validation.maxLength : ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setValidation({ 
                      ...validation, 
                      maxLength: val === '' ? undefined : parseInt(val, 10) 
                    });
                  }}
                />
              </div>
              <div className="form-group">
                <label>Regex Pattern</label>
                <input
                  type="text"
                  value={validation.regex || ''}
                  onChange={(e) => setValidation({ ...validation, regex: e.target.value || undefined })}
                  placeholder="^[a-zA-Z]+$"
                />
              </div>
            </>
          )}

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {field ? 'Update' : 'Add'} Field
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface NestedFieldsEditorProps {
  fields: Field[];
  onChange: (fields: Field[]) => void;
}

const NestedFieldsEditor: React.FC<NestedFieldsEditorProps> = ({ fields, onChange }) => {
  const [localFields, setLocalFields] = useState<Field[]>(fields);

  useEffect(() => {
    onChange(localFields);
  }, [localFields, onChange]);

  const handleAddNestedField = () => {
    setLocalFields([...localFields, {
      label: '',
      type: 'text',
      name: '',
      required: false,
      order: localFields.length
    }]);
  };

  const handleUpdateNestedField = (index: number, updates: Partial<Field>) => {
    const updated = [...localFields];
    updated[index] = { ...updated[index], ...updates };
    setLocalFields(updated);
  };

  const handleDeleteNestedField = (index: number) => {
    setLocalFields(localFields.filter((_, i) => i !== index));
  };

  return (
    <div className="nested-fields-editor">
      <h4>Nested Fields</h4>
      {localFields.map((field, index) => (
        <div key={index} className="nested-field-item">
          <input
            type="text"
            placeholder="Field label"
            value={field.label}
            onChange={(e) => handleUpdateNestedField(index, { label: e.target.value })}
          />
          <select
            value={field.type}
            onChange={(e) => handleUpdateNestedField(index, { type: e.target.value as FieldType })}
          >
            <option value="text">Text</option>
            <option value="textarea">Textarea</option>
            <option value="number">Number</option>
            <option value="email">Email</option>
            <option value="date">Date</option>
          </select>
          <input
            type="text"
            placeholder="Field name"
            value={field.name}
            onChange={(e) => handleUpdateNestedField(index, { name: e.target.value })}
          />
          <label className="checkbox-label-admin" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={field.required}
              onChange={(e) => handleUpdateNestedField(index, { required: e.target.checked })}
            />
            <span>Required</span>
          </label>
          <button
            type="button"
            className="btn-icon btn-danger"
            onClick={() => handleDeleteNestedField(index)}
          >
            ×
          </button>
        </div>
      ))}
      <button type="button" className="btn btn-secondary" onClick={handleAddNestedField}>
        Add Nested Field
      </button>
    </div>
  );
};

interface SubmissionsViewerProps {
  formId: string;
  form: Form;
  onBack: () => void;
}

const SubmissionsViewer: React.FC<SubmissionsViewerProps> = ({ formId, form, onBack }) => {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);

  useEffect(() => {
    fetchSubmissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formId, page]);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const response = await adminFormsApi.getSubmissions(formId, page, 10);
      setSubmissions(response.data.submissions);
      setPagination(response.data.pagination);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const response = await adminFormsApi.exportSubmissions(formId);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `form-${formId}-submissions.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to export submissions');
    }
  };

  const formatAnswer = (value: any): string => {
    if (value === null || value === undefined) return '-';
    if (Array.isArray(value)) return value.join(', ');
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  if (loading && !submissions.length) {
    return (
      <div className="form-editor">
        <div className="card">
          <p>Loading submissions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="form-editor">
      <div className="form-editor-header">
        <h2>Submissions - {form.title}</h2>
        <div className="form-editor-actions">
          <button className="btn btn-secondary" onClick={onBack}>
            Back to Form
          </button>
          <button className="btn btn-primary" onClick={handleExport}>
            Export CSV
          </button>
        </div>
      </div>

      {error && (
        <div className="card error-message">
          <p className="error">{error}</p>
        </div>
      )}

      {submissions.length === 0 ? (
        <div className="card">
          <p>No submissions yet.</p>
        </div>
      ) : (
        <>
          <div className="submissions-table-container">
            <table className="submissions-table">
              <thead>
                <tr>
                  <th>Submitted At</th>
                  {form.fields.map((field) => (
                    <th key={field._id || field.name}>{field.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {submissions.map((submission) => {
                  // MongoDB Maps are serialized as objects in JSON
                  const answers = submission.answers || {};
                  
                  return (
                    <tr key={submission._id}>
                      <td>{new Date(submission.submittedAt).toLocaleString()}</td>
                      {form.fields.map((field) => {
                        const value = answers[field.name];
                        // Check for nested fields (they use parentField_nestedField naming)
                        const nestedAnswers: string[] = [];
                        
                        if (field.options) {
                          field.options.forEach(option => {
                            if (option.nestedFields) {
                              option.nestedFields.forEach(nestedField => {
                                const nestedKey = `${field.name}_${nestedField.name}`;
                                const nestedValue = answers[nestedKey];
                                if (nestedValue !== undefined && nestedValue !== null && nestedValue !== '') {
                                  nestedAnswers.push(`${nestedField.label}: ${formatAnswer(nestedValue)}`);
                                }
                              });
                            }
                          });
                        }
                        
                        return (
                          <td key={field._id || field.name}>
                            {formatAnswer(value)}
                            {nestedAnswers.length > 0 && (
                              <div className="nested-answers">
                                {nestedAnswers.map((na, idx) => (
                                  <div key={idx} className="nested-answer">{na}</div>
                                ))}
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {pagination && pagination.pages > 1 && (
            <div className="pagination">
              <button
                className="btn btn-secondary"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
              >
                Previous
              </button>
              <span>
                Page {pagination.page} of {pagination.pages} ({pagination.total} total)
              </span>
              <button
                className="btn btn-secondary"
                onClick={() => setPage(page + 1)}
                disabled={page >= pagination.pages}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminPanel;

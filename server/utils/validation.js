const validator = require('express-validator');

const validateField = (field, value) => {
  const errors = [];

  if (field.required) {
    if (value === null || value === undefined || value === '') {
      errors.push(`${field.label} is required`);
      return errors;
    }
  } else if (value === null || value === undefined || value === '') {
    return errors;
  }
  switch (field.type) {
    case 'email':
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        errors.push(`${field.label} must be a valid email address`);
      }
      break;

    case 'number':
      const numValue = Number(value);
      if (isNaN(numValue)) {
        errors.push(`${field.label} must be a number`);
      } else {
        if (field.validation?.min !== undefined && numValue < field.validation.min) {
          errors.push(`${field.label} must be at least ${field.validation.min}`);
        }
        if (field.validation?.max !== undefined && numValue > field.validation.max) {
          errors.push(`${field.label} must be at most ${field.validation.max}`);
        }
      }
      break;

    case 'text':
    case 'textarea':
      const strValue = String(value);
      if (field.validation?.minLength !== undefined && strValue.length < field.validation.minLength) {
        errors.push(`${field.label} must be at least ${field.validation.minLength} characters`);
      }
      if (field.validation?.maxLength !== undefined && strValue.length > field.validation.maxLength) {
        errors.push(`${field.label} must be at most ${field.validation.maxLength} characters`);
      }
      if (field.validation?.regex) {
        try {
          const regex = new RegExp(field.validation.regex);
          if (!regex.test(strValue)) {
            errors.push(`${field.label} format is invalid`);
          }
        } catch (e) {
        }
      }
      break;

    case 'date':
      const dateValue = new Date(value);
      if (isNaN(dateValue.getTime())) {
        errors.push(`${field.label} must be a valid date`);
      }
      break;

    case 'radio':
    case 'select':
      if (!field.options || field.options.length === 0) {
        errors.push(`${field.label} has no options defined`);
      } else {
        const validValues = field.options.map(opt => opt.value);
        if (!validValues.includes(value)) {
          errors.push(`${field.label} must be one of the provided options`);
        }
      }
      break;

    case 'checkbox':
      if (!Array.isArray(value)) {
        errors.push(`${field.label} must be an array`);
      } else if (field.options && field.options.length > 0) {
        const validValues = field.options.map(opt => opt.value);
        const invalidValues = value.filter(v => !validValues.includes(v));
        if (invalidValues.length > 0) {
          errors.push(`${field.label} contains invalid options`);
        }
      }
      break;
  }

  return errors;
};

const validateSubmission = (form, answers) => {
  const errors = {};
  let hasErrors = false;

  const sortedFields = [...form.fields].sort((a, b) => a.order - b.order);

  sortedFields.forEach(field => {
    const value = answers[field.name];
    const fieldErrors = validateField(field, value);
    
    if (fieldErrors.length > 0) {
      errors[field.name] = fieldErrors;
      hasErrors = true;
    }

    if ((field.type === 'radio' || field.type === 'select') && value && field.options) {
      const selectedOption = field.options.find(opt => opt.value === value);
      if (selectedOption && selectedOption.nestedFields && selectedOption.nestedFields.length > 0) {
        selectedOption.nestedFields.forEach(nestedField => {
          const nestedValue = answers[`${field.name}_${nestedField.name}`];
          const nestedErrors = validateField(nestedField, nestedValue);
          if (nestedErrors.length > 0) {
            errors[`${field.name}_${nestedField.name}`] = nestedErrors;
            hasErrors = true;
          }
        });
      }
    }
  });

  return {
    isValid: !hasErrors,
    errors
  };
};

module.exports = {
  validateField,
  validateSubmission
};


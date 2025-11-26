const express = require('express');
const router = express.Router();
const { authenticateAdmin } = require('../middleware/auth');
const Form = require('../models/Form');
const Submission = require('../models/Submission');

router.use(authenticateAdmin);

router.get('/forms', async (req, res) => {
  try {
    const forms = await Form.find().sort({ createdAt: -1 });
    res.json(forms);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/forms/:id', async (req, res) => {
  try {
    const form = await Form.findById(req.params.id);
    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }
    res.json(form);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/forms', async (req, res) => {
  try {
    const { title, description, fields } = req.body;
    
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const form = new Form({
      title,
      description: description || '',
      fields: fields || []
    });

    await form.save();
    res.status(201).json(form);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update form
router.put('/forms/:id', async (req, res) => {
  try {
    const { title, description, fields, isActive } = req.body;
    
    const form = await Form.findById(req.params.id);
    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }

    // If fields are being modified, increment version
    const fieldsChanged = JSON.stringify(form.fields) !== JSON.stringify(fields);
    
    if (title !== undefined) form.title = title;
    if (description !== undefined) form.description = description;
    if (fields !== undefined) form.fields = fields;
    if (isActive !== undefined) form.isActive = isActive;
    
    if (fieldsChanged && fields) {
      form.version += 1;
    }

    await form.save();
    res.json(form);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete form
router.delete('/forms/:id', async (req, res) => {
  try {
    const form = await Form.findById(req.params.id);
    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }

    // Optionally delete associated submissions
    await Submission.deleteMany({ formId: form._id });
    await Form.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Form deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/forms/:id/submissions', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const submissions = await Submission.find({ formId: req.params.id })
      .sort({ submittedAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Submission.countDocuments({ formId: req.params.id });

    res.json({
      submissions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/submissions', async (req, res) => {
  try {
    const { page = 1, limit = 10, formId } = req.query;
    const skip = (page - 1) * limit;

    const query = formId ? { formId } : {};

    const submissions = await Submission.find(query)
      .populate('formId', 'title')
      .sort({ submittedAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Submission.countDocuments(query);

    res.json({
      submissions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Export submissions as CSV
router.get('/forms/:id/submissions/export', async (req, res) => {
  try {
    const form = await Form.findById(req.params.id);
    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }

    const submissions = await Submission.find({ formId: req.params.id })
      .sort({ submittedAt: -1 });

    // Build CSV - collect all field labels including nested fields
    const headers = ['Submitted At'];
    const fieldHeaders = [];
    
    form.fields.forEach(field => {
      headers.push(field.label);
      fieldHeaders.push({ field });
      
      // Add nested field headers if any
      if (field.options) {
        field.options.forEach(option => {
          if (option.nestedFields) {
            option.nestedFields.forEach(nestedField => {
              headers.push(`${field.label} - ${nestedField.label}`);
              fieldHeaders.push({ field, nested: nestedField });
            });
          }
        });
      }
    });
    
    const rows = submissions.map(sub => {
      const row = [sub.submittedAt.toISOString()];
      
      // Convert Map to object if needed
      const answers = sub.answers instanceof Map 
        ? Object.fromEntries(sub.answers) 
        : sub.answers || {};
      
      fieldHeaders.forEach(({ field, nested }) => {
        if (nested) {
          const key = `${field.name}_${nested.name}`;
          const value = answers[key];
          row.push(value !== undefined && value !== null && value !== '' ? String(value) : '');
        } else {
          const value = answers[field.name];
          row.push(value !== undefined && value !== null && value !== '' ? String(value) : '');
        }
      });
      
      return row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',');
    });

    const csv = [headers.map(h => `"${h}"`).join(','), ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="form-${req.params.id}-submissions.csv"`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;


const express = require('express');
const router = express.Router();
const Form = require('../models/Form');
const Submission = require('../models/Submission');
const { validateSubmission } = require('../utils/validation');

// Submit form response
router.post('/', async (req, res) => {
  try {
    const { formId, answers } = req.body;

    if (!formId || !answers) {
      return res.status(400).json({ 
        error: 'formId and answers are required' 
      });
    }

    const form = await Form.findById(formId);
    if (!form || !form.isActive) {
      return res.status(404).json({ error: 'Form not found or inactive' });
    }

    // Validate submission
    const validation = validateSubmission(form, answers);
    
    if (!validation.isValid) {
      return res.status(400).json({
        error: 'Validation failed',
        errors: validation.errors
      });
    }

    // Create submission
    const submission = new Submission({
      formId: form._id,
      formVersion: form.version,
      answers: new Map(Object.entries(answers)),
      ip: req.ip || req.headers['x-forwarded-for'] || ''
    });

    await submission.save();
    
    res.status(201).json({
      message: 'Submission successful',
      submissionId: submission._id
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;


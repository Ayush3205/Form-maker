const express = require('express');
const router = express.Router();
const Form = require('../models/Form');

router.get('/', async (req, res) => {
  try {
    const forms = await Form.find({ isActive: true })
      .select('title description createdAt')
      .sort({ createdAt: -1 });
    res.json(forms);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get form definition by ID (public)
router.get('/:id', async (req, res) => {
  try {
    const form = await Form.findById(req.params.id);
    
    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }

    if (!form.isActive) {
      return res.status(404).json({ error: 'Form not found' });
    }

    // Sort fields by order
    const sortedFields = [...form.fields].sort((a, b) => a.order - b.order);
    const formData = {
      ...form.toObject(),
      fields: sortedFields
    };

    res.json(formData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;


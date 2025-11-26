const mongoose = require('mongoose');

const fieldSchema = new mongoose.Schema({
  label: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['text', 'textarea', 'number', 'email', 'date', 'checkbox', 'radio', 'select'],
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  required: {
    type: Boolean,
    default: false
  },
  options: [{
    label: String,
    value: String,
    nestedFields: [{
      label: String,
      type: String,
      name: String,
      required: Boolean,
      options: [{
        label: String,
        value: String
      }]
    }]
  }],
  validation: {
    min: Number,
    max: Number,
    regex: String,
    minLength: Number,
    maxLength: Number
  },
  order: {
    type: Number,
    default: 0
  }
}, { _id: true });

const formSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  fields: [fieldSchema],
  version: {
    type: Number,
    default: 1
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

formSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Form', formSchema);


const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  formId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Form',
    required: true,
    index: true
  },
  formVersion: {
    type: Number,
    required: true
  },
  answers: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    required: true
  },
  submittedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  ip: {
    type: String,
    default: ''
  },
  metadata: {
    type: Map,
    of: String
  }
});

submissionSchema.index({ formId: 1, submittedAt: -1 });

module.exports = mongoose.model('Submission', submissionSchema);


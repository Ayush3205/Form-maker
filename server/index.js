const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { sanitizeBody, sanitizeQuery } = require('./middleware/sanitize');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(sanitizeBody);
app.use(sanitizeQuery);

app.use('/api/admin', require('./routes/admin'));
app.use('/api/forms', require('./routes/forms'));
app.use('/api/submissions', require('./routes/submissions'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/form-builder')
  .then(() => {
    console.log('Connected to MongoDB');
    const PORT = process.env.PORT || 5001;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });


const jwt = require('jsonwebtoken');

// Simple token-based authentication
const authenticateAdmin = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '') || 
                req.headers['x-admin-token'] ||
                req.query.token;

  const adminToken = process.env.ADMIN_TOKEN || 'admin-token-12345';

  if (!token || token !== adminToken) {
    return res.status(401).json({ 
      error: 'Unauthorized. Admin token required.' 
    });
  }

  req.admin = true;
  next();
};

module.exports = { authenticateAdmin };


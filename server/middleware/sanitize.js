const sanitizeInput = (obj) => {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    return obj
      .trim()
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .replace(/[<>]/g, '');
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeInput(item));
  }

  if (typeof obj === 'object' && obj.constructor === Object) {
    const sanitized = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const sanitizedKey = sanitizeInput(key);
        sanitized[sanitizedKey] = sanitizeInput(obj[key]);
      }
    }
    return sanitized;
  }

  return obj;
};

const sanitizeBody = (req, res, next) => {
  if (req.body) {
    req.body = sanitizeInput(req.body);
  }
  next();
};

const sanitizeQuery = (req, res, next) => {
  if (req.query) {
    req.query = sanitizeInput(req.query);
  }
  next();
};

module.exports = {
  sanitizeBody,
  sanitizeQuery,
  sanitizeInput
};


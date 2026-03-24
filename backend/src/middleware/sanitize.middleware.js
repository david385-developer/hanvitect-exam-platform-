const { sanitizeObject } = require('../utils/sanitize');

const sanitizeMiddleware = (req, res, next) => {
  if (req.body && Object.keys(req.body).length > 0) {
    req.body = sanitizeObject(req.body);
  }
  if (req.query && Object.keys(req.query).length > 0) {
    req.query = sanitizeObject(req.query);
  }
  if (req.params && Object.keys(req.params).length > 0) {
    req.params = sanitizeObject(req.params);
  }
  next();
};

module.exports = sanitizeMiddleware;

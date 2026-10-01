const validateRequest = (schema) => (req, res, next) => {
  req.body = schema.parse(req.body);
  next();
};

module.exports = validateRequest;
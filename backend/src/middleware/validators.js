const validate = (schema, property) => {
  return (req, res, next) => {
    // Express 5 exposes req.query as a getter, so plain assignment is a no-op.
    // defineProperty shadows it per request, and works for body and params too.
    Object.defineProperty(req, property, {
      value: schema.parse(req[property]),
      writable: true,
      configurable: true,
      enumerable: true,
    });

    next();
  };
};

const validateBody = (schema) => validate(schema, "body");
const validateQuery = (schema) => validate(schema, "query");
const validateParams = (schema) => validate(schema, "params");

module.exports = {
  validateBody,
  validateQuery,
  validateParams
};


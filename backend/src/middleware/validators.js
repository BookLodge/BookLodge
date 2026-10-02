const validate = (schema, property) => {
  return (req, res, next) => {
    req[property] = schema.parse(req[property]);
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


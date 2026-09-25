const AppError = require("./AppError");

class ExternalAPIError extends AppError {
  constructor(message = "External service request failed", statusCode = 502) {
    super(message, statusCode);
  }
}

module.exports = ExternalAPIError;
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);

    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

class ExternalAPIError extends AppError {
  constructor(message, statusCode = 502, { provider = null, ambiguous = false } = {}) {
    super(message, statusCode);

    // { code, message, description, httpStatus } from the provider, or null for a transport
    // failure, where there was no provider response to read.
    this.provider = provider;

    // The provider may have completed the work before the failure surfaced, so retrying is unsafe.
    this.ambiguous = ambiguous;
  }
}

module.exports = {
  ExternalAPIError,
  AppError
};

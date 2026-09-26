class AppError extends Error {
  constructor(message, statusCode) {
    super(message);

    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

class ExternalAPIError extends AppError {
  constructor(message, statusCode = 502) {
    super(message, statusCode);
  }
}

module.exports = {
  ExternalAPIError,
  AppError
};

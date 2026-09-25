const AppError = require("../utils/AppError");
const ExternalAPIError = require("../utils/ExternalAPIError");
const { sendError } = require("../utils/apiResponse");

const errorHandler = (err, req, res, next) => {
  let error = err;

  // Handle Zod validation errors
  if (err.name === "ZodError") {
    const message =
      err.issues?.map((issue) => issue.message).join(", ") ||
      "Validation failed";

    error = new AppError(message, 400);
  }

  // Handle database duplicate key errors
  else if (err.code === 11000) {
    const field = err.keyPattern
      ? Object.keys(err.keyPattern)[0]
      : "field";

    error = new AppError(
      `A record with the provided ${field} already exists`,
      409
    );
  }

  // Handle database casting errors
  else if (err.name === "CastError") {
    error = new AppError("Invalid resource identifier", 400);
  }

  // Handle errors coming from an external provider
  else if (err instanceof ExternalAPIError) {
    error = err;
  }

  // Handle unexpected errors
  if (!error.isOperational) {
    console.error("Unexpected error:", err);

    return sendError(
      res,
      "Internal server error",
      500,
      null
    );
  }

  return sendError(
    res,
    error.message,
    error.statusCode || 500,
    null
  );
};

module.exports = errorHandler;
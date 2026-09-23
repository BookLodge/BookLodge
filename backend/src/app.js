const express = require("express");
const { sendSuccess } = require("./utils/apiResponse");
const AppError = require("./utils/AppError");
const errorHandler = require("./middleware/errorHandler");

const app = express();

app.use(express.json());

// Test successful response
app.get("/test-success", (req, res) => {
  return sendSuccess(res, "Request successful", {
    message: "Centralized response is working",
  });
});

// Test expected application error
app.get("/test-app-error", (req, res, next) => {
  next(new AppError("Hotel not found", 404));
});

// Test unexpected error
app.get("/test-unexpected-error", (req, res, next) => {
  next(new Error("Something unexpected happened"));
});

// Test asynchronous error
app.get("/test-async-error", async (req, res) => {
  throw new Error("Something went wrong asynchronously");
});

// Centralized error handler MUST come after routes
app.use(errorHandler);

module.exports = app;
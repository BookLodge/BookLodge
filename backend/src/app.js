const express = require("express");
const cors = require("cors");
const routes = require("./routes");
const errorHandler = require("./middleware/errorHandler");
const { AppError } = require("./errors");
const env = require("./config/env");

const app = express();

// Normalise to a bare origin so a trailing slash or path in FRONTEND_URL cannot break the match
const allowedOrigin = new URL(env.FRONTEND_URL).origin;

app.use(
  cors({
    origin: (origin, callback) => {
      // No Origin header means Postman, curl or server to server calls, which CORS does not apply to
      if (!origin || origin === allowedOrigin) {
        return callback(null, true);
      }
      return callback(new AppError("Not allowed by CORS", 403));
    },
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    maxAge: 600,
  })
);

app.use(express.json());

app.use("/api", routes);

// Centralized error handler MUST come after routes
app.use(errorHandler);
module.exports = app;
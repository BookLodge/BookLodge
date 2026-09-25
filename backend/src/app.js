const express = require("express");
const errorHandler = require("./middleware/errorHandler");

const app = express();

app.use(express.json());


// Centralized error handler MUST come after routes
app.use(errorHandler);

module.exports = app;
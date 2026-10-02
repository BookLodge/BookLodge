const express = require("express");
const routes = require("./routes");
const errorHandler = require("./middleware/errorHandler");

const app = express();

app.use(express.json());

app.use("/api", routes);

// Centralized error handler MUST come after routes
app.use(errorHandler);
module.exports = app;

const express = require('express');
const healthRoutes = require('./routes/healthRoutes');

const app = express();

// Middleware
app.use(express.json());

// Routes
app.use('/api/health', healthRoutes);

// Feature routes (auth, hotels, bookings, admin) and the central error
// handler are mounted here by their respective issues.

module.exports = app;

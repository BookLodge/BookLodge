const express = require('express');
const { getDBStatus, isDBConnected } = require('./config/db');

const app = express();

app.use(express.json());

// Health check: confirms the API is up and reports database connectivity.
// Useful for local checks, deployment platforms and uptime monitors.
app.get('/api/health', (req, res) => {
  const dbConnected = isDBConnected();
  res.status(dbConnected ? 200 : 503).json({
    success: dbConnected,
    message: dbConnected ? 'Service is healthy' : 'Database is not connected',
    data: {
      database: getDBStatus(),
      uptime: Math.round(process.uptime()),
    },
  });
});

// Feature routes (auth, hotels, bookings, admin) and the central error
// handler are mounted here by their respective issues.

module.exports = app;

const express = require('express');
const { isDBConnected, getDBStatus } = require('../config/db');

const router = express.Router();

// Liveness check for deployment platforms and uptime monitors.
// Returns a plain 200 only; internal state (database status, uptime) is never
// sent to the client. Database problems are logged server-side instead.
router.get('/', (req, res) => {
  if (!isDBConnected()) {
    console.warn(`[health] Database is not connected (status: ${getDBStatus()})`);
  }

  res.status(200).json({
    success: true,
    message: 'OK',
    data: null,
  });
});

module.exports = router;

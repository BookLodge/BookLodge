require('dotenv').config({ quiet: true });

const app = require('./app');
const { connectDB, disconnectDB } = require('./config/db');

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

// If shutdown hangs (e.g. a stuck request), force exit after this long.
const SHUTDOWN_TIMEOUT_MS = 10000;

let server;
let isShuttingDown = false;

/**
 * Startup order: connect to the database FIRST, then accept HTTP traffic.
 * If the database is unreachable the process exits with code 1 instead of
 * serving requests that would all fail.
 */
async function start() {
  try {
    await connectDB(MONGO_URI);

    // Express 5 also calls this callback with an error (e.g. port in use);
    // that case is handled by the 'error' listener below.
    server = app.listen(PORT, (err) => {
      if (err) return;
      console.log(`[server] Listening on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
    });

    server.on('error', (err) => {
      console.error(`[server] HTTP server error: ${err.message}`);
      shutdown('serverError', 1);
    });
  } catch (err) {
    console.error(`[server] Failed to start: ${err.message}`);
    await disconnectDB().catch(() => {});
    process.exit(1);
  }
}

/**
 * Shutdown order: stop accepting new requests, let in-flight requests finish,
 * THEN close the database connection, then exit.
 */
async function shutdown(reason, exitCode = 0) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log(`[server] ${reason} received. Shutting down gracefully...`);

  const forceExitTimer = setTimeout(() => {
    console.error('[server] Graceful shutdown timed out. Forcing exit.');
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);
  forceExitTimer.unref();

  try {
    if (server && server.listening) {
      await new Promise((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      });
      console.log('[server] HTTP server closed');
    }
    await disconnectDB();
    process.exit(exitCode);
  } catch (err) {
    console.error(`[server] Error during shutdown: ${err.message}`);
    process.exit(1);
  }
}

process.on('SIGINT', () => shutdown('SIGINT')); // Ctrl+C
process.on('SIGTERM', () => shutdown('SIGTERM')); // hosting platforms, Docker

process.on('unhandledRejection', (reason) => {
  console.error('[server] Unhandled promise rejection:', reason);
  shutdown('unhandledRejection', 1);
});

process.on('uncaughtException', (err) => {
  console.error('[server] Uncaught exception:', err);
  shutdown('uncaughtException', 1);
});

start();

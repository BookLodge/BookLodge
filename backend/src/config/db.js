const mongoose = require('mongoose');

/**
 * Database connection and lifecycle management.
 *
 * This module is the ONLY place in the application that opens or closes the
 * MongoDB connection. Feature code never calls mongoose.connect() directly;
 * it uses Mongoose models, which share the connection opened here.
 *
 * Usage:
 *   server.js   -> connectDB(uri) on startup, disconnectDB() on shutdown
 *   tests       -> connectDB(testUri) in setup, disconnectDB() in teardown
 *   health      -> getDBStatus() / isDBConnected()
 */

const DEFAULT_OPTIONS = {
  // Fail fast at startup instead of hanging when the database is unreachable.
  serverSelectionTimeoutMS: 10000,
  // Upper bound on concurrent sockets kept open to MongoDB.
  maxPoolSize: 10,
};

const STATES = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
};

let listenersAttached = false;

function attachConnectionListeners() {
  if (listenersAttached) return;
  const { connection } = mongoose;

  connection.on('connected', () => {
    console.log(`[db] Connected to MongoDB (database: ${connection.name})`);
  });
  connection.on('disconnected', () => {
    console.warn('[db] Disconnected from MongoDB');
  });
  connection.on('reconnected', () => {
    console.log('[db] Reconnected to MongoDB');
  });
  connection.on('error', (err) => {
    // Never log the connection string: it contains credentials.
    console.error(`[db] MongoDB connection error: ${err.message}`);
  });

  listenersAttached = true;
}

/**
 * Open the MongoDB connection.
 * @param {string} uri MongoDB connection string (from environment configuration)
 * @param {object} [options] Extra Mongoose connection options
 * @returns {Promise<mongoose.Connection>}
 */
async function connectDB(uri, options = {}) {
  if (!uri) {
    throw new Error('Database connection string is missing. Set MONGO_URI in your .env file.');
  }

  // Already connected: reuse the existing connection (safe to call twice).
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  // Strip query filters on fields that are not in the schema.
  mongoose.set('strictQuery', true);

  attachConnectionListeners();
  await mongoose.connect(uri, { ...DEFAULT_OPTIONS, ...options });
  return mongoose.connection;
}

/**
 * Close the MongoDB connection. Safe to call when already disconnected.
 * @returns {Promise<void>}
 */
async function disconnectDB() {
  if (mongoose.connection.readyState === 0) return;
  await mongoose.connection.close();
  console.log('[db] MongoDB connection closed');
}

/** @returns {boolean} true when the connection is ready for queries */
function isDBConnected() {
  return mongoose.connection.readyState === 1;
}

/** @returns {string} human-readable connection state */
function getDBStatus() {
  return STATES[mongoose.connection.readyState] || 'unknown';
}

module.exports = {
  connectDB,
  disconnectDB,
  isDBConnected,
  getDBStatus,
};

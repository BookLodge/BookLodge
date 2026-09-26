// Central environment configuration.
// Loads .env once and exposes every setting the app uses through one object.
// Other modules import this file instead of reading process.env directly.
require('dotenv').config({ quiet: true });

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 5000,
  MONGO_URI: process.env.MONGO_URI,
  MONGO_URI_TEST: process.env.MONGO_URI_TEST,
};

module.exports = env;
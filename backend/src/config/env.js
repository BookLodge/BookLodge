const fs = require('fs');
const path = require('path');
const { z } = require('zod');

// --- 1. Environment file loading ------------------------------------------
// Which file we load is decided by NODE_ENV, which the runtime must inject
// (test runner, Docker, hosting platform).
//   NODE_ENV === "test" -> ".env.test"
//   otherwise           -> ".env"  (covers development)
// If the chosen file is unavailable (CI, containers, hosting platforms) we
// skip loading and fall back to values injected directly into process.env,
// which implies production.
const requestedEnv = process.env.NODE_ENV;
const envFile = requestedEnv === 'test' ? '.env.test' : '.env';
const envPath = path.resolve(__dirname, '..', '..', envFile);
const loadedFromFile = fs.existsSync(envPath);

if (loadedFromFile) {
  require('dotenv').config({ path: envPath, quiet: true });
}

// An explicit NODE_ENV always wins. Otherwise a missing ".env" implies
// production (directly injected config); a present one implies development.
const NODE_ENV = requestedEnv || (loadedFromFile ? 'development' : 'production');

// --- 2. Validation --------------------------------------------------------
const MAX_PORT = 65535; // Upper bound of a valid TCP/UDP port.

const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1024).max(MAX_PORT).default(5000),

  // Database
  MONGO_URI: z.url(),

  // JWT
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters long'),
  JWT_EXPIRES_IN: z.string().min(1),

  // External API
  LITEAPI_BASE_URL: z.url(),
  LITEAPI_KEY: z.string().min(1),
  LITEAPI_SECRET: z.string().min(1),
});

const parsed = envSchema.safeParse({ ...process.env, NODE_ENV });

if (!parsed.success) {
  console.error(`[env] Invalid environment configuration (${envFile}):`);
  for (const issue of parsed.error.issues) {
    const key = issue.path.join('.') || '(root)';
    console.error(`  - ${key}: ${issue.message}`);
  }
  process.exit(1);
}

module.exports = parsed.data;

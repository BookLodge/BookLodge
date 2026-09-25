# Database Integration & Access Convention

BookLodge uses **MongoDB** through **Mongoose**. This document defines how the database connection is managed and how every feature must access data.

## 1. Setup

1. Install MongoDB locally, or create a free MongoDB Atlas cluster.
2. Copy `.env.example` to `.env` inside `BACKEND/`.
3. Set `MONGO_URI` (and `MONGO_URI_TEST` for tests).
4. Run:

```bash
cd BACKEND
npm install
npm run dev
```

5. Confirm: `GET http://localhost:5000/api/health` returns `"database": "connected"`.

| Variable | Required | Purpose |
| --- | --- | --- |
| `MONGO_URI` | Yes | Connection string for the development/production database |
| `MONGO_URI_TEST` | For tests | Separate database used only by automated tests |

> Atlas users: whitelist your IP (or `0.0.0.0/0` for the deployed server) under Network Access, or the connection will time out.

## 2. Connection Lifecycle

The connection is owned by `src/config/db.js`, which exports:

| Function | Purpose |
| --- | --- |
| `connectDB(uri, options?)` | Opens the connection. Throws if the URI is missing or the server is unreachable within 10s. Safe to call twice. |
| `disconnectDB()` | Closes the connection. Safe to call when already closed. |
| `isDBConnected()` | `true` when ready for queries. |
| `getDBStatus()` | `"connected"`, `"disconnected"`, `"connecting"` or `"disconnecting"`. |

**Startup (`src/server.js`):** connect to MongoDB first, then start the HTTP server. If the database cannot be reached, the process logs the reason and exits with code `1`.

**Shutdown:** on `SIGINT` (Ctrl+C) or `SIGTERM` (hosting platform), the server stops accepting requests, lets in-flight requests finish, closes the database connection, then exits. A 10s timeout forces exit if something hangs.

**Crash safety:** unhandled promise rejections and uncaught exceptions trigger the same graceful shutdown with exit code `1`.

## 3. Access Convention (rules for every feature)

1. **One connection, one owner.** Only `server.js` (and test setup) call `connectDB` / `disconnectDB`. Never call `mongoose.connect()` anywhere else.
2. **Models live in `src/models/`.** One model per file, PascalCase singular name, exported as `module.exports = mongoose.model('User', userSchema)`. Always use `{ timestamps: true }`.
3. **Controllers do not query the database.** Controllers call services; services use models. This keeps business logic testable and out of route handlers.
4. **Never expose passwords.** Mark `password` with `select: false` and strip it (plus `__v`) in the schema's `toJSON` transform.
5. **Validate IDs before querying.** Invalid ObjectIds are rejected by Zod / `mongoose.isValidObjectId()` and return `400`, not `500`.
6. **Declare indexes in the schema.** e.g. `User.email` unique, `Booking.reference` unique, `Booking.customerId` and `Booking.status` indexed for history and admin filtering.
7. **Paginate every list.** Use `.find().skip((page - 1) * limit).limit(limit)` with `countDocuments()` for `total`; use `.lean()` for read-only results.
8. **Let errors reach the central error handler.** Do not send database errors to the client. The error handler maps:
   - Duplicate key (`code 11000`) → `409` e.g. "Email already exists"
   - `CastError` → `400` "Invalid ID"
   - `ValidationError` → `400` with the field message
9. **No hard-coded connection strings.** Always read from environment configuration.
10. **Tests use `MONGO_URI_TEST`**, never the development or production database.
> **Windows / Nigeria tip:** if you get `querySrv ECONNREFUSED`, use Atlas's **Legacy URI String** (Connect > Drivers > toggle) instead of the `mongodb+srv://` string, or set your DNS to 8.8.8.8.
# BookLodge — Backend

REST API for BookLodge, a hotel booking platform. Accounts, search, booking and cancellation are
served here. Hotel inventory, rates and payment come from [LiteAPI](https://docs.liteapi.travel).

**LiteAPI provides** hotel data, room rates and pricing, availability re-checked at prebook, the
customer payment flow, and the reservation itself.

**BookLodge owns** user accounts and authentication, the customer-facing booking flow,
application-level validation and authorization, local booking records, and the orchestration
between the frontend and the provider. A local `Booking` links to the provider's reservation by id;
it is not itself the hotel reservation.

## Stack

Express 5 (CommonJS) · Mongoose 9 / MongoDB · Zod 4 for validation · JWT (jsonwebtoken) · bcrypt ·
axios · express-rate-limit · Vitest 5.

Node 22.12 or newer — that is Vitest's floor; the runtime itself needs 20.19.

## Getting started

```bash
cd backend
npm install
cp .env.example .env      # then fill it in
npm run dev               # or: npm start
```

The server connects to MongoDB *first* and only then starts listening. If the database is
unreachable it exits with code 1 rather than serving requests that would all fail. Shutdown on
`SIGINT`/`SIGTERM` stops accepting connections, lets in-flight requests finish, closes the
database, and force-exits if that takes more than 10 seconds.

### Configuration

`src/config/env.js` validates every variable at boot and exits with a list of what is wrong. It is
the only module that reads `process.env`.

| Variable | Required | Notes |
| --- | --- | --- |
| `NODE_ENV` | no | `development` \| `test` \| `production`, default `development` |
| `PORT` | no | defaults to `5000`; must be within 1024–65535 |
| `MONGO_URI` | **yes** | MongoDB connection string |
| `FRONTEND_URL` | no | defaults to `http://localhost:3000`; the only origin CORS accepts |
| `JWT_SECRET` | **yes** | at least 32 characters |
| `JWT_EXPIRES_IN` | **yes** | e.g. `1h`, `7d` |
| `LITEAPI_BASE_URL` | **yes** | e.g. `https://api.liteapi.travel/v3.0` |
| `LITEAPI_KEY` | **yes** | sent to LiteAPI as the `X-API-Key` header |

Which file is loaded depends on `NODE_ENV`: `test` loads `.env.test`, anything else loads `.env`.
When the chosen file does not exist — CI, containers, hosting platforms — the values must already
be in `process.env`; a missing `.env` is treated as production.

Neither file is committed. `.env.test` holds live sandbox credentials and needs the same variables
as `.env`.

## How a booking works

The flow is deliberately split into two calls with the customer's payment in between.

1. **Search.** `GET /api/locations/search?query=Paris` gives `placeId`s.
   `POST /api/hotels/search` takes one and returns hotels, each with its cheapest rate.
2. **Rates.** `POST /api/hotels/:hotelId/details` returns the hotel and every rate for the dates.
   Each rate carries an `offerId`, the only handle LiteAPI accepts for the next step.
3. **Prebook.** `POST /api/bookings/prebook` with `{ offerId }`, authenticated. LiteAPI re-checks
   availability and re-prices the room and returns `prebookId`, `transactionId` and `secretKey`.
   BookLodge records a **BookingAttempt** holding that `prebookId`/`transactionId` pair together
   with a `clientReference` minted here, and returns the whole payload — `secretKey` included — to
   the caller.
4. **Payment.** The frontend opens LiteAPI's Payment SDK with `secretKey` and the customer pays.
   BookLodge is not involved and needs no Stripe account of its own. `secretKey` is a live payment
   credential: it goes to the client that is paying, and is never persisted, logged or placed in a
   URL.
5. **Book.** `POST /api/bookings` with `{ prebookId, holder, guests }`. The controller looks up the
   caller's pending attempt for that `prebookId` and books with the **stored**
   `prebookId`/`transactionId`/`clientReference`, sending `payment.method: "TRANSACTION_ID"`. On
   success the attempt is marked `BOOKED` and a `Booking` is written.
6. **Confirm, view, cancel.** `GET /api/bookings/:bookingId/confirmation` reports the status;
   `PUT /api/bookings/:bookingId` cancels through LiteAPI.

### The server decides whether to book, not the client

It is tempting to have the frontend send `paymentSuccessful: true` once the SDK returns and book on
the strength of that. We do not, because a flag set by the client is not evidence of anything.

LiteAPI offers no way to check a payment *before* booking. There is no `payment.*` webhook, and
`payment_status` and `payment_transaction_id` exist only on booking records, which `/rates/book`
is what creates. **The book call is therefore the payment gate.** Booking with the
`prebookId`/`transactionId` pair only succeeds once the PaymentIntent behind that pair has actually
been confirmed, so the provider — not the frontend — is what establishes that payment happened. A
caller who never paid gets a provider error and no reservation.

Because the pair is read from the stored attempt and never from the request body, client-supplied
payment data cannot reach `/rates/book` at all: `POST /api/bookings` accepts no `transactionId`.

### Idempotency

`clientReference` (`BL-<uuid>`) is minted once, when the prebook is recorded, and reused by every
booking attempt made against it. A client retrying a timed-out `POST /api/bookings` therefore sends
the same reference, which is what allows LiteAPI to recognise the duplicate instead of creating a
second reservation. Once an attempt is `BOOKED`, a retry finds no pending attempt and gets a `409`,
so the duplicate is stopped here as well.

## Request lifecycle

```
route → validate → controller → liteApiService → liteApiClient → LiteAPI
```

Validation replaces `req.body`, `req.query` and `req.params` with the parsed result, so a missing or
wrongly-typed field fails with `400` before any controller runs, and unknown keys are dropped rather
than forwarded.

`src/services/liteapi/` is the only place that knows LiteAPI exists. Endpoints, payload shapes,
credentials, response formats and error codes all stay behind it; nothing above it imports axios or
reads a `LITEAPI_*` variable.

Every provider response is validated against a Zod schema in `services/liteapi/schemas/` before it is
trusted, then mapped into a BookLodge shape by `services/liteapi/mappers/`. A payload we cannot make
sense of becomes a `502` rather than something half-parsed reaching a controller.

## Layout

```
backend/
├── src/
│   ├── config/       env validation, the single MongoDB connection
│   ├── routes/       one router per domain, mounted under /api
│   ├── schemas/      request validation
│   ├── controllers/  HTTP handling only
│   ├── models/       User, Booking, BookingAttempt
│   ├── middleware/   auth, roles, rate limiting, validation, error handling
│   ├── services/
│   │   ├── liteapi/  the adapter: client, service, mappers, schemas,
│   │   │             errors.js, retryPolicy.js
│   │   └── emailService.js
│   ├── utils/        response helper, JWT helpers, reference generator
│   ├── app.js        express app, CORS, route mounting
│   └── server.js     startup, shutdown, process-level error handling
├── tests/
│   ├── unit/         mappers, policy, adapter, auth, validation
│   ├── integration/  the app booted and called over HTTP
│   └── e2e/          live provider and database, opt-in booking
├── vitest.config.js
└── vitest.e2e.config.js
```

## API reference

Base URL `/api`. Every response uses the shape in the next section.

| Endpoint | Method | Auth | Request | Success |
| --- | --- | --- | --- | --- |
| `/health` | GET | — | — | 200 `{ message: "OK" }` |
| `/auth/register` | POST | — | `{ firstName, lastName, email, password, phone }` | 201 `{ user }` |
| `/auth/login` | POST | — | `{ email, password }` | 200 `{ token, user }` |
| `/users/me` | GET | Bearer | — | 200 `{ user }` |
| `/users/:id` | GET | Bearer, admin | — | 200 `{ user }` |
| `/locations/search` | GET | — | `?query=` | 200 `{ locations }` |
| `/hotels/search` | POST | — | stay criteria + `placeId` | 200 `{ hotels }` |
| `/hotels/:hotelId/details` | POST | — | stay criteria | 200 `{ hotel, rates }` |
| `/bookings/prebook` | POST | Bearer | `{ offerId }` | 200 `{ prebook, … }` |
| `/bookings` | POST | Bearer | `{ prebookId, holder, guests }` | 201 `{ booking }` |
| `/bookings/my-bookings` | GET | Bearer | `?page=&limit=` | 200 `{ bookings, total, page, limit }` |
| `/bookings/:bookingId` | GET | Bearer | — | 200 `{ booking }` |
| `/bookings/:bookingId/confirmation` | GET | Bearer | — | 200 `{ status }` |
| `/bookings/:bookingId` | PUT | Bearer | — | 200 `{ bookingId, status, cancellationFee, refundAmount, currency }` |

"Stay criteria" is the same object everywhere and is validated as a unit:

```json
{
  "checkin": "2026-11-01",
  "checkout": "2026-11-03",
  "occupancies": [{ "adults": 2, "children": [] }],
  "currency": "USD",
  "guestNationality": "US"
}
```

`checkin` and `checkout` are ISO dates (`YYYY-MM-DD`); `children` holds ages. `placeId` comes from
`/locations/search` and is required by search but not by details.

**Details** returns the hotel plus every rate for the dates. Each rate is the input to prebook:

```json
{
  "id": "lp1899",
  "name": "…",
  "description": "…",
  "photo": "…",
  "address": "…",
  "city": "…",
  "country": "…",
  "rating": 4,
  "location": { "latitude": 48.85, "longitude": 2.35 },
  "facilities": ["…"],
  "checkin": "15:00",
  "checkout": "11:00",
  "rates": [
    {
      "offerId": "…",
      "amount": 402.29,
      "currency": "EUR",
      "occupancyNumber": 1,
      "roomName": "…",
      "boardName": "…",
      "refundable": true
    }
  ]
}
```

**Search** returns each hotel with only its cheapest rate, under `startingRate`. LiteAPI returns
rates cheapest-first and the list is passed through as it comes — there is no pagination.

**Prebook** returns the provider payload plus the reference we minted:

```json
{
  "prebookId": "…",
  "offerId": "…",
  "hotelId": "lp1899",
  "price": { "amount": 402.29, "currency": "EUR" },
  "transactionId": "…",
  "secretKey": "…",
  "clientReference": "BL-…"
}
```

**Book** takes `holder` (`{ firstName, lastName, email }`) and `guests`
(`[{ occupancyNumber, firstName, lastName, email }]`), and responds with the stored booking:
`{ clientReference, status, hotel, stay, rooms, holder, price, liteApi }`.

Cancellation asks LiteAPI, then marks the local booking `CANCELLED`. The booking must currently be
`CONFIRMED` and the caller must own it or be an admin.

The JWT payload is `{ userId, role }`. Register returns the user document (`data.user._id`); login
returns a trimmed object (`data.user.id`). The two spellings differ — worth knowing before writing
frontend code against both.

## Response and error contract

Every response is written by `utils/apiResponse.js`, so the shape cannot drift per endpoint:

```json
{ "success": true, "message": "Hotels retrieved successfully", "data": { } }
{ "success": false, "message": "No pending prebook for this booking", "data": null }
```

`src/errors.js` holds two classes and the distinction between them is the point:

- **`AppError`** — a fault of ours: bad request, not found, forbidden. Operational, so its message
  reaches the client.
- **`ExternalAPIError`** — the provider failed. Extends `AppError` and adds `provider`
  (`{ code, message, description, httpStatus }`, or `null` when no response ever arrived) and
  `ambiguous`.

Provider failures therefore carry detail a client can act on, and nothing else is ever echoed back:

```json
{
  "success": false,
  "message": "Booking failed",
  "data": {
    "provider": { "code": 2014, "description": "booking incomplete" },
    "ambiguous": true
  }
}
```

`middleware/errorHandler.js` is the single place a status code is chosen: a `ZodError` becomes a
`400`, a duplicate key `409`, a `CastError` `400`, our own errors keep their status, and anything
unrecognised becomes a `500` `"Internal server error"` with the real error logged and never
returned.

We match on LiteAPI's `error.code` and never on the HTTP status — their codes are not statuses, and
a provider code of `404` has nothing to do with an HTTP 404. `description` is the field LiteAPI
recommends showing a user, so it is surfaced; their generic `message` stays in our logs. Only a real
HTTP 404 stays a 404; every other provider failure becomes a `502`.

`ambiguous: true` means the provider may have completed the work before the failure surfaced.
Retrying is then unsafe and the outcome needs investigating, so `POST /api/bookings` records the
attempt as `BOOKING_AMBIGUOUS` rather than failed.

## Provider resilience

`services/liteapi/retryPolicy.js` decides retries per operation and per provider code, never from the
HTTP status, and denies by default. Operations are grouped by what a retry would cost:

| Class | Operations | Retry a lost request (no response at all)? |
| --- | --- | --- |
| `READ` | hotel search, hotel details, location search | yes — asking again changes nothing |
| `EXPIRING_WRITE` | prebook | no — each attempt reserves another hold |
| `STATE_CHANGING` | book, cancel | no — the provider may have acted; a retry risks a duplicate booking or a double charge |

| Provider code | Meaning | Retried? |
| --- | --- | --- |
| 4290 | request limit exceeded | yes, honouring `Retry-After` |
| 4291 | rate-limit subsystem error | yes |
| 4000 / 4002 / 4003 | bad request, missing or invalid field | no — our request is wrong |
| 4005 | duplicate `clientReference` | no — recover instead |
| 2013 / 2014 / 5000 | booking failed / incomplete / unable to process | no — ambiguous on a write |
| 2001 | no availability, or the price moved | no — search again |
| anything else | | no |

A request refused at the rate-limit edge was never processed, which is why 4290 and 4291 are the one
write-side failure that is safe to retry. Three attempts in total, with a deterministic backoff of
250 ms and then 750 ms. Only register and login carry a rate limiter of our own; the booking routes
leave that to LiteAPI, which is what the 4290 and 4291 handling is for.

Only a missing `err.response` counts as a lost request: axios rejects on any non-2xx, so a `4002`
carrying a provider body is a provider answer, not a request that went missing.

## Data models

| Model | One row per | Purpose |
| --- | --- | --- |
| `User` | account | credentials, role, `isActive` |
| `Booking` | successful reservation | the record shown in booking history |
| `BookingAttempt` | prebook | the server-owned `prebookId`/`transactionId` pair and idempotency key |

**Booking** — `userId`, `clientReference` (unique), `status`
(`PENDING_PAYMENT` \| `BOOKING_PROCESSING` \| `CONFIRMED` \| `PAYMENT_FAILED` \| `BOOKING_FAILED` \|
`CANCELLED`), `hotel { hotelId, name }`, `stay { checkin, checkout }`,
`rooms [{ occupancyNumber, roomName, boardName }]`, `holder { firstName, lastName, email }`,
`price { amount, currency }`, `payment { transactionId }`, `liteApi { bookingId }`.

**BookingAttempt** — `userId`, `clientReference` (unique), `prebookId`, `transactionId`,
`offer { hotelId, price }`, `status` (`PENDING_PAYMENT` \| `BOOKED` \| `PAYMENT_FAILED` \|
`BOOKING_AMBIGUOUS`), `bookingId`, `expiresAt`.

It is a separate collection so an attempt that was never paid for cannot turn up in a booking list.
A TTL index deletes each attempt at `expiresAt`, 48 hours after the prebook, ahead of the one to two
business days LiteAPI takes to release an unused hold. `secretKey` is deliberately not a field.

## Tests

```bash
npm test           # unit + integration
npm run test:e2e   # live LiteAPI sandbox + test database
```

`npm test` runs 19 files / 297 tests. Unit tests cover the adapter, mappers, retry policy, auth and
validation; integration tests boot the app and call it over HTTP with the provider mocked at the
`liteApiService` boundary, so no network is involved. `.env.test` must exist, because environment
validation runs at import — but no database is touched.

`npm run test:e2e` exercises the real flow against the LiteAPI sandbox and the test database:
register, search, walk hotels until a rate prebooks, then book, confirm and cancel, cleaning up its
own documents afterwards. Two things to know before running it:

- The booking steps are skipped unless `E2E_BOOKING=1`, because completing the payment is a browser
  step that a server-only run cannot perform.
- Registration is rate-limited to 5 per hour per IP, so repeated runs within the hour fail at the
  auth step.

Test files load source modules through `createRequire`. The source is CommonJS and the tests are
ESM, and going through Node keeps one instance of each module, which is what makes `instanceof`
checks hold across that boundary.

## Not built yet

So that nothing above is mistaken for a promise — these are the gaps as the code stands:

- **Booking without an account.** Prebook and book both require a token, so there is no guest
  checkout and no reference-based lookup.
- **Enforcing `User.isActive`.** The field exists, but nothing checks it — deactivation would not
  currently stop a login or invalidate a token.
- **Confirmation email.** `services/emailService.js` exists and nothing calls it.
- **Webhooks.** Status changes are learned from our own calls; LiteAPI pushes nothing to us.
- **Search pagination.** The provider returns rates cheapest-first and the list is passed through.
- **Duplicate recovery for code 4005.** A duplicate reference is reported, not resolved back into the
  existing booking.

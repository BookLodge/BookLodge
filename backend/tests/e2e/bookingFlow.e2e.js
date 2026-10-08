import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createRequire } from "node:module";

// Source modules are CommonJS; loading them through Node keeps one instance of each module.
const require = createRequire(import.meta.url);
const app = require("../../src/app.js");
const env = require("../../src/config/env.js");
const { connectDB, disconnectDB } = require("../../src/config/db.js");
const Booking = require("../../src/models/Booking.js");
const BookingAttempt = require("../../src/models/BookingAttempt.js");
const User = require("../../src/models/User.js");

// Runs against the live LiteAPI sandbox and the test database: `npm run test:e2e`.
// Offers are perishable — the sandbox rejects one that has sold out (2001) or whose
// price moved since the search (409) — so hotels and rates are walked until one
// prebooks rather than trusting any single rate.
//
// Registering consumes the 5-per-hour register limiter, so repeated runs in one
// hour will start failing at the auth step.
const CHECKIN = day(30);
const CHECKOUT = day(32);
const CURRENCY = "USD";
const NATIONALITY = "US";
const OCCUPANCIES = [{ adults: 2, children: [] }];
const PLACE = "Paris";
const HOTELS_TO_TRY = 8;
const RATES_PER_HOTEL = 3;

const email = `e2e-${Date.now()}@example.com`;
const PASSWORD = "e2e-password-123";
const HOLDER = { firstName: "E2E", lastName: "Traveller", email };

let server;
let base;
let token;
let userId;
let bookingId;
let hotels;
let offer;
let cancelResult;

function day(offset) {
  return new Date(Date.now() + offset * 86_400_000).toISOString().slice(0, 10);
}

const call = async (method, path, { body, auth } = {}) => {
  const res = await fetch(`${base}${path}`, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(auth ? { Authorization: `Bearer ${auth}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  let payload = null;
  try {
    payload = await res.json();
  } catch {
    // provider failures can come back with an empty body
  }

  return { status: res.status, body: payload };
};

const stayCriteria = {
  checkin: CHECKIN,
  checkout: CHECKOUT,
  occupancies: OCCUPANCIES,
  currency: CURRENCY,
  guestNationality: NATIONALITY,
};

beforeAll(async () => {
  // Mongoose dumps the whole cluster topology on failure; the suite only needs to say why it stopped.
  try {
    await connectDB(env.MONGO_URI);
  } catch (err) {
    throw new Error(`cannot reach the test database (${new URL(env.MONGO_URI).host}): ${err.message}`);
  }

  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  base = `http://127.0.0.1:${server.address().port}`;

  const registered = await call("POST", "/api/auth/register", {
    body: { ...HOLDER, password: PASSWORD, phone: "+10000000000" },
  });
  expect(registered.status).toBe(201);
  userId = registered.body.data.user._id;

  const loggedIn = await call("POST", "/api/auth/login", { body: { email, password: PASSWORD } });
  expect(loggedIn.status).toBe(200);
  token = loggedIn.body.data.token;
});

afterAll(async () => {
  // Best effort: leave neither a live reservation nor test documents behind.
  try {
    if (bookingId) {
      const stored = await Booking.findById(bookingId);
      if (stored?.status === "CONFIRMED") {
        await call("PUT", `/api/bookings/${bookingId}`, { auth: token });
      }
      await Booking.deleteOne({ _id: bookingId });
    }
    if (userId) {
      await BookingAttempt.deleteMany({ userId });
      await User.deleteOne({ _id: userId });
    }
  } catch (err) {
    console.error("[e2e] cleanup failed:", err.message);
  }

  if (server) await new Promise((resolve) => server.close(resolve));
  await disconnectDB();
});

describe("booking flow", () => {
  it("finds hotels for a place", async () => {
    const places = await call("GET", `/api/locations/search?query=${encodeURIComponent(PLACE)}`);
    expect(places.status).toBe(200);
    expect(places.body.data.locations.length).toBeGreaterThan(0);

    const searched = await call("POST", "/api/hotels/search", {
      body: { placeId: places.body.data.locations[0].placeId, ...stayCriteria },
    });

    expect(searched.status).toBe(200);
    expect(searched.body.data.hotels.length).toBeGreaterThan(0);
    hotels = searched.body.data.hotels;
  });

  it("returns rates and finds a bookable offer", async () => {
    for (const hotel of hotels.slice(0, HOTELS_TO_TRY)) {
      const details = await call("POST", `/api/hotels/${hotel.id}/details`, { body: stayCriteria });
      if (details.status !== 200) continue;

      for (const rate of details.body.data.rates.slice(0, RATES_PER_HOTEL)) {
        const prebooked = await call("POST", "/api/bookings/prebook", {
          auth: token,
          body: { offerId: rate.offerId },
        });
        if (prebooked.status === 200) {
          offer = { hotel, rate, prebook: prebooked.body.data };
          console.log(`[e2e] ${hotel.name} @ ${offer.prebook.price.amount} ${offer.prebook.price.currency}`);
          return;
        }
      }
    }

    expect.fail(`no bookable offer among the first ${HOTELS_TO_TRY} hotels for ${CHECKIN} -> ${CHECKOUT}`);
  });

  it("hands the client the payment details it needs", () => {
    // LiteAPI books only once the PaymentIntent behind `secretKey` has been confirmed
    // with Stripe on the client, so the API has to pass those credentials through intact.
    expect(offer.prebook).toMatchObject({
      prebookId: expect.any(String),
      offerId: offer.rate.offerId,
      hotelId: offer.hotel.id,
      transactionId: expect.any(String),
      secretKey: expect.any(String),
      price: { currency: CURRENCY },
    });
  });

  it("books a prebooked rate and persists it", async (ctx) => {
    // The Stripe confirmation between prebook and book is a browser step, so a
    // server-only run cannot complete it: the provider answers 2014 "payment not
    // completed". Opt in with E2E_BOOKING=1 once payment is wired up client-side.
    if (!process.env.E2E_BOOKING) ctx.skip();

    const booked = await call("POST", "/api/bookings", {
      auth: token,
      body: {
        prebookId: offer.prebook.prebookId,
        holder: HOLDER,
        guests: [{ occupancyNumber: 1, ...HOLDER }],
      },
    });

    expect(booked.status).toBe(201);
    bookingId = booked.body.data._id;

    expect(booked.body.data).toMatchObject({
      userId,
      status: "CONFIRMED",
      holder: { email },
      price: { currency: CURRENCY },
      payment: { transactionId: offer.prebook.transactionId },
      hotel: { hotelId: offer.hotel.id },
    });
    expect(booked.body.data.price.amount).toBeGreaterThan(0);
    expect(booked.body.data.liteApi.bookingId).toBeTruthy();
  });

  it("retrieves the booking by id for its owner", async (ctx) => {
    if (!bookingId) ctx.skip();

    const fetched = await call("GET", `/api/bookings/${bookingId}`, { auth: token });

    expect(fetched.status).toBe(200);
    expect(fetched.body.data).toMatchObject({ _id: bookingId, userId, status: "CONFIRMED" });
  });

  it("reports the confirmation status", async (ctx) => {
    if (!bookingId) ctx.skip();

    const confirmation = await call("GET", `/api/bookings/${bookingId}/confirmation`, { auth: token });

    expect(confirmation.status).toBe(200);
    expect(confirmation.body.data).toEqual({ status: "CONFIRMED" });
  });

  it("lists the booking in the owner's bookings", async (ctx) => {
    if (!bookingId) ctx.skip();

    const listed = await call("GET", "/api/bookings/my-bookings", { auth: token });

    expect(listed.status).toBe(200);
    expect(listed.body.data.total).toBeGreaterThan(0);
    expect(listed.body.data.page).toBe(1);
    expect(listed.body.data.bookings.map((booking) => booking._id)).toContain(bookingId);
  });

  it("cancels the booking through the provider", async (ctx) => {
    if (!bookingId) ctx.skip();

    const cancelled = await call("PUT", `/api/bookings/${bookingId}`, { auth: token });

    expect(cancelled.status).toBe(200);
    cancelResult = cancelled.body.data;

    expect(cancelResult.status).toBe("CANCELLED");
    expect(cancelResult.bookingId).toBeTruthy();
  });

  it("persists the cancelled status", async (ctx) => {
    if (!cancelResult) ctx.skip();

    const fetched = await call("GET", `/api/bookings/${bookingId}`, { auth: token });

    expect(fetched.status).toBe(200);
    expect(fetched.body.data.status).toBe("CANCELLED");
  });
});

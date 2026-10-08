import { describe, it, expect, vi, beforeAll, beforeEach, afterAll, afterEach } from "vitest";
import { createRequire } from "node:module";

// Source modules are CommonJS; loading them through Node keeps one instance of each module.
const require = createRequire(import.meta.url);
const app = require("../../src/app.js");
const { liteApiService } = require("../../src/services/liteapi/liteApiService.js");
const { ExternalAPIError } = require("../../src/errors.js");
const { generateToken } = require("../../src/utils/authHelper.js");
const Booking = require("../../src/models/Booking.js");
const BookingAttempt = require("../../src/models/BookingAttempt.js");

const ownerId = "507f1f77bcf86cd799439011";
const strangerId = "507f1f77bcf86cd799439098";
const adminId = "507f1f77bcf86cd7994390ad";
const bookingId = "507f1f77bcf86cd799439012";

const storedReference = "BL-2f1c9a4e-7d3b-4f8a-9c1e-5a6b7c8d9e0f";

// The client no longer sends payment details: the pair it books with comes from the attempt.
const bookingBody = {
  prebookId: "pb_abc123",
  holder: { firstName: "Ada", lastName: "Lovelace", email: "ada@example.com" },
  guests: [
    { occupancyNumber: 1, firstName: "Ada", lastName: "Lovelace", email: "ada@example.com" },
  ],
};

const pendingAttempt = () => ({
  userId: ownerId,
  clientReference: storedReference,
  prebookId: "pb_abc123",
  transactionId: "txn_abc123",
  status: "PENDING_PAYMENT",
  bookingId: null,
  save: vi.fn().mockResolvedValue(),
});

const bookedRate = {
  clientReference: "BL-2f1c9a4e-7d3b-4f8a-9c1e-5a6b7c8d9e0f",
  status: "CONFIRMED",
  hotel: { hotelId: "lp1897", name: "Sample Hotel" },
  stay: { checkin: "2026-11-02", checkout: "2026-11-05" },
  rooms: [{ occupancyNumber: 1, roomName: "Standard Room", boardName: "Room Only" }],
  holder: { firstName: "Ada", lastName: "Lovelace", email: "ada@example.com" },
  price: { amount: 412.76, currency: "USD" },
  liteApi: { bookingId: "b_7f3d9c2a" },
};

const savedBooking = {
  _id: bookingId,
  userId: ownerId,
  ...bookedRate,
  payment: { transactionId: "txn_abc123" },
};

let server;
let base;
let token;
let adminToken;
let attempt;

beforeAll(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  base = `http://127.0.0.1:${server.address().port}`;
  token = generateToken({ _id: ownerId, role: "customer" });
  adminToken = generateToken({ _id: adminId, role: "admin" });
});

afterAll(() => new Promise((resolve) => server.close(resolve)));

beforeEach(() => {
  attempt = pendingAttempt();
  vi.spyOn(BookingAttempt, "findOne").mockResolvedValue(attempt);
});

afterEach(() => vi.restoreAllMocks());

const book = (body, authToken = token) =>
  fetch(`${base}/api/bookings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    },
    body: JSON.stringify(body),
  });

describe("POST /api/bookings", () => {
  it("returns 201 with the persisted booking", async () => {
    vi.spyOn(liteApiService, "bookRate").mockResolvedValue(bookedRate);
    vi.spyOn(Booking, "create").mockResolvedValue(savedBooking);

    const response = await book(bookingBody);

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({
      success: true,
      message: "Hotel booked successfully",
      data: savedBooking,
    });
  });

  it("persists the booking against the authenticated user", async () => {
    vi.spyOn(liteApiService, "bookRate").mockResolvedValue(bookedRate);
    const create = vi.spyOn(Booking, "create").mockResolvedValue(savedBooking);

    await book(bookingBody);

    expect(create).toHaveBeenCalledTimes(1);
    expect(create.mock.calls[0][0]).toEqual({
      ...bookedRate,
      userId: ownerId,
      payment: { transactionId: "txn_abc123" },
    });
  });

  it("stores only the fields the Booking model declares", async () => {
    vi.spyOn(liteApiService, "bookRate").mockResolvedValue(bookedRate);
    const create = vi.spyOn(Booking, "create").mockResolvedValue(savedBooking);

    await book(bookingBody);

    const persisted = create.mock.calls[0][0];
    expect(persisted).not.toHaveProperty("prebookId");
    expect(persisted).not.toHaveProperty("guests");
    expect(persisted).not.toHaveProperty("transactionId");
  });

  it("does not persist when the provider rejects the booking", async () => {
    vi.spyOn(liteApiService, "bookRate").mockRejectedValue(
      new ExternalAPIError("Booking failed", 502)
    );
    const create = vi.spyOn(Booking, "create");

    const response = await book(bookingBody);

    expect(response.status).toBe(502);
    expect(create).not.toHaveBeenCalled();
    expect(attempt.status).toBe("PAYMENT_FAILED");
    expect(attempt.save).toHaveBeenCalled();
  });

  it("books with the pair the server stored, not one the client sent", async () => {
    const spy = vi.spyOn(liteApiService, "bookRate").mockResolvedValue(bookedRate);
    vi.spyOn(Booking, "create").mockResolvedValue(savedBooking);

    await book({ ...bookingBody, transactionId: "client-supplied", clientReference: "client-supplied" });

    const sent = spy.mock.calls[0][0];
    expect(sent.clientReference).toBe(storedReference);
    expect(sent.transactionId).toBe("txn_abc123");
  });

  it("books only against a pending attempt owned by the caller", async () => {
    const spy = vi.spyOn(liteApiService, "bookRate");
    BookingAttempt.findOne.mockResolvedValue(null);

    const response = await book(bookingBody);

    expect(response.status).toBe(409);
    expect(spy).not.toHaveBeenCalled();
    expect(BookingAttempt.findOne).toHaveBeenCalledWith({
      userId: ownerId,
      prebookId: "pb_abc123",
      status: "PENDING_PAYMENT",
    });
  });

  it("flags an ambiguous provider outcome and keeps it for recovery", async () => {
    vi.spyOn(liteApiService, "bookRate").mockRejectedValue(
      new ExternalAPIError("Booking failed", 502, {
        provider: { code: 2014, message: "booking incomplete", description: "payment or booking confirmation did not finish", httpStatus: 400 },
        ambiguous: true,
      })
    );
    const create = vi.spyOn(Booking, "create");

    const response = await book(bookingBody);

    expect(response.status).toBe(502);
    expect(create).not.toHaveBeenCalled();
    expect(attempt.status).toBe("BOOKING_AMBIGUOUS");
    expect(await response.json()).toMatchObject({
      success: false,
      data: { provider: { code: 2014 }, ambiguous: true },
    });
  });

  it("marks the attempt consumed once the booking is persisted", async () => {
    vi.spyOn(liteApiService, "bookRate").mockResolvedValue(bookedRate);
    vi.spyOn(Booking, "create").mockResolvedValue(savedBooking);

    await book(bookingBody);

    expect(attempt.status).toBe("BOOKED");
    expect(attempt.bookingId).toBe(bookingId);
    expect(attempt.save).toHaveBeenCalled();
  });

  it("reports a duplicate booking as a conflict", async () => {
    vi.spyOn(liteApiService, "bookRate").mockResolvedValue(bookedRate);
    vi.spyOn(Booking, "create").mockRejectedValue(
      Object.assign(new Error("E11000 duplicate key error"), { code: 11000 })
    );

    const response = await book(bookingBody);

    expect(response.status).toBe(409);
  });

  it("passes the booking through with a server-minted client reference", async () => {
    const spy = vi.spyOn(liteApiService, "bookRate").mockResolvedValue(bookedRate);
    vi.spyOn(Booking, "create").mockResolvedValue(savedBooking);

    await book(bookingBody);

    const sent = spy.mock.calls[0][0];
    expect(sent).toMatchObject(bookingBody);
    expect(sent.clientReference).toMatch(/^BL-/);
  });

  it("ignores a client-supplied client reference", async () => {
    const spy = vi.spyOn(liteApiService, "bookRate").mockResolvedValue(bookedRate);
    vi.spyOn(Booking, "create").mockResolvedValue(savedBooking);

    await book({ ...bookingBody, clientReference: "client-supplied" });

    expect(spy.mock.calls[0][0].clientReference).toMatch(/^BL-/);
  });

  it("refuses a request with no token and never reaches the provider", async () => {
    const spy = vi.spyOn(liteApiService, "bookRate");

    const response = await book(bookingBody, null);

    expect(response.status).toBe(401);
    expect(spy).not.toHaveBeenCalled();
  });

  it("refuses an invalid token and never reaches the provider", async () => {
    const spy = vi.spyOn(liteApiService, "bookRate");

    const response = await book(bookingBody, "not-a-token");

    expect(response.status).toBe(401);
    expect(spy).not.toHaveBeenCalled();
  });

  it("rejects a body missing a required field without reaching the provider", async () => {
    const spy = vi.spyOn(liteApiService, "bookRate");

    const { prebookId, ...withoutPrebookId } = bookingBody;
    const response = await book(withoutPrebookId);

    expect(response.status).toBe(400);
    expect(spy).not.toHaveBeenCalled();
  });

  it("rejects a request with no body without reaching the provider", async () => {
    const spy = vi.spyOn(liteApiService, "bookRate");

    const response = await fetch(`${base}/api/bookings`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(response.status).toBe(400);
    expect(spy).not.toHaveBeenCalled();
  });

  it("reports a provider failure with the provider's status", async () => {
    vi.spyOn(liteApiService, "bookRate").mockRejectedValue(
      new ExternalAPIError("Booking failed", 502)
    );

    const response = await book(bookingBody);

    expect(response.status).toBe(502);
    expect(await response.json()).toMatchObject({
      success: false,
      message: "Booking failed",
    });
  });
});

describe("GET /api/bookings/:bookingId", () => {
  const storedBooking = {
    _id: bookingId,
    userId: ownerId,
    clientReference: "BL-2f1c9d",
    status: "CONFIRMED",
    hotel: { hotelId: "lp1a2b3c", name: "Hotel Lutetia" },
    stay: { checkin: "2026-11-02T00:00:00.000Z", checkout: "2026-11-05T00:00:00.000Z" },
    price: { amount: 412.5, currency: "EUR" },
  };

  const getBooking = (id = bookingId, authToken = token) =>
    fetch(`${base}/api/bookings/${id}`, {
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
    });

  it("returns 200 with the booking", async () => {
    vi.spyOn(Booking, "findOne").mockResolvedValue(storedBooking);

    const response = await getBooking();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      success: true,
      message: "Booking retrieved successfully",
      data: storedBooking,
    });
  });

  it("scopes the lookup to the authenticated user", async () => {
    const spy = vi.spyOn(Booking, "findOne").mockResolvedValue(storedBooking);

    await getBooking();

    expect(spy).toHaveBeenCalledWith({ _id: bookingId, userId: ownerId });
  });

  it("reports a booking the user does not own as not found", async () => {
    vi.spyOn(Booking, "findOne").mockResolvedValue(null);

    const response = await getBooking();

    expect(response.status).toBe(404);
    expect(await response.json()).toMatchObject({
      success: false,
      message: "Booking not found",
    });
  });

  it("lets an admin retrieve a booking the caller does not own", async () => {
    const byId = vi.spyOn(Booking, "findById").mockResolvedValue(storedBooking);
    const scoped = vi.spyOn(Booking, "findOne").mockResolvedValue(null);

    const response = await getBooking(bookingId, adminToken);

    expect(response.status).toBe(200);
    expect((await response.json()).data).toEqual(storedBooking);
    expect(byId).toHaveBeenCalledWith(bookingId);
    expect(scoped).not.toHaveBeenCalled();
  });

  it("keeps a customer scoped to their own bookings", async () => {
    const byId = vi.spyOn(Booking, "findById").mockResolvedValue(storedBooking);
    const scoped = vi.spyOn(Booking, "findOne").mockResolvedValue(null);

    const response = await getBooking();

    expect(response.status).toBe(404);
    expect(scoped).toHaveBeenCalledWith({ _id: bookingId, userId: ownerId });
    expect(byId).not.toHaveBeenCalled();
  });

  it("refuses a request with no token and never queries the database", async () => {
    const spy = vi.spyOn(Booking, "findOne");

    const response = await getBooking(bookingId, null);

    expect(response.status).toBe(401);
    expect(spy).not.toHaveBeenCalled();
  });

  it("refuses an invalid token and never queries the database", async () => {
    const spy = vi.spyOn(Booking, "findOne");

    const response = await getBooking(bookingId, "not-a-token");

    expect(response.status).toBe(401);
    expect(spy).not.toHaveBeenCalled();
  });

  it("rejects a malformed booking id without querying the database", async () => {
    const spy = vi.spyOn(Booking, "findOne");

    const response = await getBooking("not-an-object-id");

    expect(response.status).toBe(400);
    expect(spy).not.toHaveBeenCalled();
  });
});

describe("GET /api/bookings/:bookingId/confirmation", () => {
  const storedBooking = (overrides = {}) => ({
    _id: bookingId,
    userId: ownerId,
    clientReference: "BL-2f1c9d",
    status: "CONFIRMED",
    hotel: { hotelId: "lp1a2b3c", name: "Hotel Lutetia" },
    stay: { checkin: "2026-11-02T00:00:00.000Z", checkout: "2026-11-05T00:00:00.000Z" },
    holder: { firstName: "Ada", lastName: "Lovelace", email: "ada@example.com" },
    price: { amount: 412.5, currency: "EUR" },
    payment: { transactionId: "txn_abc123" },
    liteApi: { bookingId: "b_7f3d9c2a" },
    ...overrides,
  });

  const confirm = (id = bookingId, authToken = token) =>
    fetch(`${base}/api/bookings/${id}/confirmation`, {
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
    });

  it("returns 200 with only the booking status", async () => {
    vi.spyOn(Booking, "findOne").mockResolvedValue(storedBooking());

    const response = await confirm();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      success: true,
      message: "Booking confirmation retrieved successfully",
      data: { status: "CONFIRMED" },
    });
  });

  it("returns whatever status the booking is currently in", async () => {
    vi.spyOn(Booking, "findOne").mockResolvedValue(
      storedBooking({ status: "BOOKING_PROCESSING" })
    );

    const response = await confirm();

    expect((await response.json()).data).toEqual({ status: "BOOKING_PROCESSING" });
  });

  it("scopes the lookup to the authenticated user", async () => {
    const spy = vi.spyOn(Booking, "findOne").mockResolvedValue(storedBooking());

    await confirm();

    expect(spy).toHaveBeenCalledWith({ _id: bookingId, userId: ownerId });
  });

  it("reports a booking the user does not own as not found", async () => {
    vi.spyOn(Booking, "findOne").mockResolvedValue(null);

    const response = await confirm();

    expect(response.status).toBe(404);
    expect(await response.json()).toMatchObject({
      success: false,
      message: "Booking not found",
    });
  });

  it("never reaches LiteAPI", async () => {
    vi.spyOn(Booking, "findOne").mockResolvedValue(storedBooking());
    const book = vi.spyOn(liteApiService, "bookRate");
    const cancel = vi.spyOn(liteApiService, "cancelBooking");

    await confirm();

    expect(book).not.toHaveBeenCalled();
    expect(cancel).not.toHaveBeenCalled();
  });

  it("refuses a request with no token and never queries the database", async () => {
    const spy = vi.spyOn(Booking, "findOne");

    const response = await confirm(bookingId, null);

    expect(response.status).toBe(401);
    expect(spy).not.toHaveBeenCalled();
  });

  it("refuses an invalid token and never queries the database", async () => {
    const spy = vi.spyOn(Booking, "findOne");

    const response = await confirm(bookingId, "not-a-token");

    expect(response.status).toBe(401);
    expect(spy).not.toHaveBeenCalled();
  });

  it("rejects a malformed booking id without querying the database", async () => {
    const spy = vi.spyOn(Booking, "findOne");

    const response = await confirm("not-an-object-id");

    expect(response.status).toBe(400);
    expect(spy).not.toHaveBeenCalled();
  });
});

describe("PUT /api/bookings/:bookingId", () => {
  const providerBookingId = "hSq2gVDrf";

  const cancelled = {
    bookingId: providerBookingId,
    status: "CANCELLED",
    cancellationFee: 25,
    refundAmount: 125,
    currency: "USD",
  };

  const storedBooking = (overrides = {}) => ({
    _id: bookingId,
    userId: ownerId,
    status: "CONFIRMED",
    liteApi: { bookingId: providerBookingId },
    save: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  });

  const cancel = (id = bookingId, authToken = token) =>
    fetch(`${base}/api/bookings/${id}`, {
      method: "PUT",
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
    });

  it("returns 200 with the cancellation and marks the booking cancelled", async () => {
    const booking = storedBooking();
    vi.spyOn(Booking, "findById").mockResolvedValue(booking);
    const spy = vi.spyOn(liteApiService, "cancelBooking").mockResolvedValue(cancelled);

    const response = await cancel();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      success: true,
      message: "Booking cancelled successfully",
      data: cancelled,
    });
    expect(booking.status).toBe("CANCELLED");
    expect(booking.save).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("cancels at the provider with the provider's booking id, not ours", async () => {
    vi.spyOn(Booking, "findById").mockResolvedValue(storedBooking());
    const spy = vi.spyOn(liteApiService, "cancelBooking").mockResolvedValue(cancelled);

    await cancel();

    expect(spy).toHaveBeenCalledWith(providerBookingId);
  });

  it("reports an unknown booking as not found and never reaches the provider", async () => {
    vi.spyOn(Booking, "findById").mockResolvedValue(null);
    const spy = vi.spyOn(liteApiService, "cancelBooking");

    const response = await cancel();

    expect(response.status).toBe(404);
    expect(await response.json()).toMatchObject({ success: false, message: "Booking not found" });
    expect(spy).not.toHaveBeenCalled();
  });

  it("refuses a booking owned by another user and never reaches the provider", async () => {
    vi.spyOn(Booking, "findById").mockResolvedValue(storedBooking({ userId: strangerId }));
    const spy = vi.spyOn(liteApiService, "cancelBooking");

    const response = await cancel();

    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({
      success: false,
      message: "You are not authorized to cancel this booking",
    });
    expect(spy).not.toHaveBeenCalled();
  });

  it("lets an admin cancel a booking the caller does not own", async () => {
    const booking = storedBooking({ userId: strangerId });
    vi.spyOn(Booking, "findById").mockResolvedValue(booking);
    const spy = vi.spyOn(liteApiService, "cancelBooking").mockResolvedValue(cancelled);

    const response = await cancel(bookingId, adminToken);

    expect(response.status).toBe(200);
    expect(booking.status).toBe("CANCELLED");
    expect(booking.save).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(providerBookingId);
  });

  it("still refuses an admin a booking that cannot be cancelled", async () => {
    vi.spyOn(Booking, "findById").mockResolvedValue(
      storedBooking({ userId: strangerId, status: "CANCELLED" })
    );
    const spy = vi.spyOn(liteApiService, "cancelBooking");

    const response = await cancel(bookingId, adminToken);

    expect(response.status).toBe(400);
    expect(spy).not.toHaveBeenCalled();
  });

  it("refuses a booking that is not confirmed and never reaches the provider", async () => {
    vi.spyOn(Booking, "findById").mockResolvedValue(storedBooking({ status: "PENDING_PAYMENT" }));
    const spy = vi.spyOn(liteApiService, "cancelBooking");

    const response = await cancel();

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      success: false,
      message: "This booking cannot be cancelled",
    });
    expect(spy).not.toHaveBeenCalled();
  });

  it("leaves the booking uncancelled when the provider refuses", async () => {
    const booking = storedBooking();
    vi.spyOn(Booking, "findById").mockResolvedValue(booking);
    vi.spyOn(liteApiService, "cancelBooking").mockRejectedValue(
      new ExternalAPIError("Cancelling the booking failed", 502)
    );

    const response = await cancel();

    expect(response.status).toBe(502);
    expect(booking.status).toBe("CONFIRMED");
    expect(booking.save).not.toHaveBeenCalled();
  });

  it("refuses a request with no token and never queries the database", async () => {
    const spy = vi.spyOn(Booking, "findById");

    const response = await cancel(bookingId, null);

    expect(response.status).toBe(401);
    expect(spy).not.toHaveBeenCalled();
  });

  it("refuses an invalid token and never queries the database", async () => {
    const spy = vi.spyOn(Booking, "findById");

    const response = await cancel(bookingId, "not-a-token");

    expect(response.status).toBe(401);
    expect(spy).not.toHaveBeenCalled();
  });

  it("rejects a malformed booking id without querying the database", async () => {
    const spy = vi.spyOn(Booking, "findById");

    const response = await cancel("not-an-object-id");

    expect(response.status).toBe(400);
    expect(spy).not.toHaveBeenCalled();
  });
});

describe("GET /api/bookings/my-bookings", () => {
  const rows = [
    {
      _id: "507f1f77bcf86cd799439021",
      clientReference: "BL-a1b2c3",
      status: "CONFIRMED",
      hotel: { hotelId: "lp1a2b3c", name: "Hotel Lutetia" },
      stay: { checkin: "2026-11-02T00:00:00.000Z", checkout: "2026-11-05T00:00:00.000Z" },
      price: { amount: 412.5, currency: "EUR" },
    },
    {
      _id: "507f1f77bcf86cd799439022",
      clientReference: "BL-d4e5f6",
      status: "CANCELLED",
      hotel: { hotelId: "lp4d5e6f", name: "Hotel de Rome" },
      stay: { checkin: "2026-12-01T00:00:00.000Z", checkout: "2026-12-03T00:00:00.000Z" },
      price: { amount: 120, currency: "EUR" },
    },
  ];

  const listQuery = (result) => {
    const query = {
      select: vi.fn(() => query),
      sort: vi.fn(() => query),
      skip: vi.fn(() => query),
      limit: vi.fn(() => query),
      lean: vi.fn().mockResolvedValue(result),
    };

    return query;
  };

  const stubList = (result = rows, total = rows.length) => {
    const query = listQuery(result);

    return {
      query,
      find: vi.spyOn(Booking, "find").mockReturnValue(query),
      count: vi.spyOn(Booking, "countDocuments").mockResolvedValue(total),
    };
  };

  const myBookings = (search = "", authToken = token) =>
    fetch(`${base}/api/bookings/my-bookings${search}`, {
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
    });

  it("returns the page of bookings with the total", async () => {
    stubList();

    const response = await myBookings();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      success: true,
      message: "Bookings retrieved successfully",
      data: { bookings: rows, total: 2, page: 1, limit: 10 },
    });
  });

  it("scopes the query to the authenticated user, never the query string", async () => {
    const { find, count } = stubList();

    await myBookings("?userId=507f1f77bcf86cd799439098&customerId=507f1f77bcf86cd799439098");

    expect(find).toHaveBeenCalledWith({ userId: ownerId });
    expect(count).toHaveBeenCalledWith({ userId: ownerId });
  });

  it("excludes the provider and payment internals from each booking", async () => {
    const { query } = stubList();

    await myBookings();

    expect(query.select).toHaveBeenCalledWith("-__v -userId -payment -liteApi");
  });

  it("orders newest first", async () => {
    const { query } = stubList();

    await myBookings();

    expect(query.sort).toHaveBeenCalledWith({ createdAt: -1 });
  });

  it("applies the requested page and limit", async () => {
    const { query } = stubList();

    await myBookings("?page=3&limit=5");

    expect(query.skip).toHaveBeenCalledWith(10);
    expect(query.limit).toHaveBeenCalledWith(5);
  });

  it("defaults to the first page of ten", async () => {
    const { query } = stubList();

    await myBookings();

    expect(query.skip).toHaveBeenCalledWith(0);
    expect(query.limit).toHaveBeenCalledWith(10);
  });

  it("reads the results without hydrating documents", async () => {
    const { query } = stubList();

    await myBookings();

    expect(query.lean).toHaveBeenCalledTimes(1);
  });

  it("caps the page size at fifty", async () => {
    const { find } = stubList();

    const response = await myBookings("?limit=500");

    expect(response.status).toBe(400);
    expect(find).not.toHaveBeenCalled();
  });

  it.each(["?page=0", "?page=abc", "?page=1.5", "?limit=0", "?limit=1.5", "?limit=-3"])(
    "rejects %s without querying the database",
    async (search) => {
      const { find } = stubList();

      const response = await myBookings(search);

      expect(response.status).toBe(400);
      expect(find).not.toHaveBeenCalled();
    }
  );

  it("returns an empty page rather than a 404 when the user has no bookings", async () => {
    stubList([], 0);

    const response = await myBookings();

    expect(response.status).toBe(200);
    expect((await response.json()).data).toEqual({
      bookings: [],
      total: 0,
      page: 1,
      limit: 10,
    });
  });

  it("is not swallowed by the booking id route", async () => {
    const { find } = stubList();
    const byId = vi.spyOn(Booking, "findById");

    const response = await myBookings();

    expect(response.status).toBe(200);
    expect(find).toHaveBeenCalledTimes(1);
    expect(byId).not.toHaveBeenCalled();
  });

  it("never reaches LiteAPI", async () => {
    stubList();
    const book = vi.spyOn(liteApiService, "bookRate");
    const cancel = vi.spyOn(liteApiService, "cancelBooking");

    await myBookings();

    expect(book).not.toHaveBeenCalled();
    expect(cancel).not.toHaveBeenCalled();
  });

  it("refuses a request with no token and never queries the database", async () => {
    const find = vi.spyOn(Booking, "find");

    const response = await myBookings("", null);

    expect(response.status).toBe(401);
    expect(find).not.toHaveBeenCalled();
  });

  it("refuses an invalid token and never queries the database", async () => {
    const find = vi.spyOn(Booking, "find");

    const response = await myBookings("", "not-a-token");

    expect(response.status).toBe(401);
    expect(find).not.toHaveBeenCalled();
  });
});

import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from "vitest";
import { createRequire } from "node:module";

// Source modules are CommonJS; loading them through Node keeps one instance of each module.
const require = createRequire(import.meta.url);
const app = require("../../src/app.js");
const { liteApiService } = require("../../src/services/liteapi/liteApiService.js");
const { ExternalAPIError } = require("../../src/errors.js");
const { generateToken } = require("../../src/utils/authHelper.js");
const Booking = require("../../src/models/Booking.js");

const ownerId = "507f1f77bcf86cd799439011";
const bookingId = "507f1f77bcf86cd799439012";

const bookingBody = {
  prebookId: "pb_abc123",
  holder: { firstName: "Ada", lastName: "Lovelace", email: "ada@example.com" },
  guests: [
    { occupancyNumber: 1, firstName: "Ada", lastName: "Lovelace", email: "ada@example.com" },
  ],
  transactionId: "txn_abc123",
};

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

beforeAll(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  base = `http://127.0.0.1:${server.address().port}`;
  token = generateToken({ _id: "507f1f77bcf86cd799439011", role: "customer" });
});

afterAll(() => new Promise((resolve) => server.close(resolve)));

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
  const ownerId = "507f1f77bcf86cd799439011";
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
    vi.spyOn(Booking, "findById").mockResolvedValue(
      storedBooking({ userId: "507f1f77bcf86cd799439099" })
    );
    const spy = vi.spyOn(liteApiService, "cancelBooking");

    const response = await cancel();

    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({
      success: false,
      message: "You are not authorized to cancel this booking",
    });
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

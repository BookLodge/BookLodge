import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from "vitest";
import { createRequire } from "node:module";

// Source modules are CommonJS; loading them through Node keeps one instance of each module.
const require = createRequire(import.meta.url);
const app = require("../../src/app.js");
const { liteApiService } = require("../../src/services/liteapi/liteApiService.js");
const { ExternalAPIError } = require("../../src/errors.js");
const { generateToken } = require("../../src/utils/authHelper.js");

const bookingBody = {
  prebookId: "pb_abc123",
  holder: { firstName: "Ada", lastName: "Lovelace", email: "ada@example.com" },
  guests: [
    { occupancyNumber: 1, firstName: "Ada", lastName: "Lovelace", email: "ada@example.com" },
  ],
  transactionId: "txn_abc123",
};

const booked = { bookingId: "bk_abc123" };

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
  it("returns 201 with the booking result", async () => {
    const spy = vi.spyOn(liteApiService, "bookRate").mockResolvedValue(booked);

    const response = await book(bookingBody);

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({
      success: true,
      message: "Hotel booked successfully",
      data: booked,
    });
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("passes the booking through with a server-minted client reference", async () => {
    const spy = vi.spyOn(liteApiService, "bookRate").mockResolvedValue(booked);

    await book(bookingBody);

    const sent = spy.mock.calls[0][0];
    expect(sent).toMatchObject(bookingBody);
    expect(sent.clientReference).toMatch(/^BL-/);
  });

  it("ignores a client-supplied client reference", async () => {
    const spy = vi.spyOn(liteApiService, "bookRate").mockResolvedValue(booked);

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

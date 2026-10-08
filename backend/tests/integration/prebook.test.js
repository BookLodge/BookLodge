import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from "vitest";
import { createRequire } from "node:module";

// Source modules are CommonJS; loading them through Node keeps one instance of each module.
const require = createRequire(import.meta.url);
const app = require("../../src/app.js");
const { liteApiService } = require("../../src/services/liteapi/liteApiService.js");
const BookingAttempt = require("../../src/models/BookingAttempt.js");
const { ExternalAPIError } = require("../../src/errors.js");
const { generateToken } = require("../../src/utils/authHelper.js");

const offerId = "offer-abc123";
const userId = "507f1f77bcf86cd799439011";
const clientReference = "BL-2f1c9a4e-7d3b-4f8a-9c1e-5a6b7c8d9e0f";

const prebook = {
  prebookId: "pb_abc123",
  offerId,
  hotelId: "lp1899",
  price: { amount: 402.29, currency: "EUR" },
  transactionId: "txn_abc123",
  secretKey: "test-secret",
};

let server;
let base;
let token;

beforeAll(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  base = `http://127.0.0.1:${server.address().port}`;
  token = generateToken({ _id: userId, role: "customer" });
});

afterAll(() => new Promise((resolve) => server.close(resolve)));

afterEach(() => vi.restoreAllMocks());

const post = (body, { auth = token } = {}) =>
  fetch(`${base}/api/bookings/prebook`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(auth ? { Authorization: `Bearer ${auth}` } : {}),
    },
    body: JSON.stringify(body),
  });

describe("POST /api/bookings/prebook", () => {
  it("returns the prebook result for a valid offer", async () => {
    const spy = vi.spyOn(liteApiService, "prebook").mockResolvedValue(prebook);
    vi.spyOn(BookingAttempt, "create").mockResolvedValue({ clientReference });

    const response = await post({ offerId });

    expect(response.status).toBe(200);
    expect(spy).toHaveBeenCalledWith({ offerId });
    expect(await response.json()).toEqual({
      success: true,
      message: "Hotel prebooked successfully",
      data: { ...prebook, clientReference },
    });
  });

  it("hands the service the validated body rather than the raw one", async () => {
    const spy = vi.spyOn(liteApiService, "prebook").mockResolvedValue(prebook);
    vi.spyOn(BookingAttempt, "create").mockResolvedValue({ clientReference });

    await post({ offerId, usePaymentSdk: false });

    expect(spy).toHaveBeenCalledWith({ offerId });
  });

  it("records the prebook as an attempt owned by the caller", async () => {
    vi.spyOn(liteApiService, "prebook").mockResolvedValue(prebook);
    const create = vi.spyOn(BookingAttempt, "create").mockResolvedValue({ clientReference });

    await post({ offerId });

    const stored = create.mock.calls[0][0];
    expect(stored).toMatchObject({
      userId,
      prebookId: prebook.prebookId,
      transactionId: prebook.transactionId,
      offer: { hotelId: prebook.hotelId, price: prebook.price },
    });
    expect(stored.clientReference).toMatch(/^BL-/);
    expect(stored.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it("never stores the payment client secret", async () => {
    vi.spyOn(liteApiService, "prebook").mockResolvedValue(prebook);
    const create = vi.spyOn(BookingAttempt, "create").mockResolvedValue({ clientReference });

    await post({ offerId });

    expect(JSON.stringify(create.mock.calls[0][0])).not.toContain(prebook.secretKey);
  });

  it("refuses an anonymous prebook without reaching the provider", async () => {
    const spy = vi.spyOn(liteApiService, "prebook");

    const response = await post({ offerId }, { auth: null });

    expect(response.status).toBe(401);
    expect(spy).not.toHaveBeenCalled();
  });

  it("rejects a request with no offerId without reaching the provider", async () => {
    const spy = vi.spyOn(liteApiService, "prebook");

    const response = await post({});

    expect(response.status).toBe(400);
    expect(spy).not.toHaveBeenCalled();
  });

  it("rejects a non-string offerId without reaching the provider", async () => {
    const spy = vi.spyOn(liteApiService, "prebook");

    const response = await post({ offerId: 123 });

    expect(response.status).toBe(400);
    expect(spy).not.toHaveBeenCalled();
  });

  it("rejects a request with no body without reaching the provider", async () => {
    const spy = vi.spyOn(liteApiService, "prebook");

    const response = await fetch(`${base}/api/bookings/prebook`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(response.status).toBe(400);
    expect(spy).not.toHaveBeenCalled();
  });

  it("records no attempt when the provider rejects the offer", async () => {
    vi.spyOn(liteApiService, "prebook").mockRejectedValue(
      new ExternalAPIError("Prebooking failed", 404)
    );
    const create = vi.spyOn(BookingAttempt, "create");

    const response = await post({ offerId: "expired" });

    expect(response.status).toBe(404);
    expect(create).not.toHaveBeenCalled();
  });

  it("reports an unknown offer as not found", async () => {
    vi.spyOn(liteApiService, "prebook").mockRejectedValue(
      new ExternalAPIError("Prebooking failed", 404)
    );

    const response = await post({ offerId: "expired" });

    expect(response.status).toBe(404);
    expect(await response.json()).toMatchObject({
      success: false,
      message: "Prebooking failed",
    });
  });

  it("reports a provider failure with the provider's status", async () => {
    vi.spyOn(liteApiService, "prebook").mockRejectedValue(
      new ExternalAPIError("Prebooking failed", 502)
    );

    const response = await post({ offerId });

    expect(response.status).toBe(502);
    expect(await response.json()).toMatchObject({
      success: false,
      message: "Prebooking failed",
    });
  });
});

import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from "vitest";
import { createRequire } from "node:module";

// Source modules are CommonJS; loading them through Node keeps one instance of each module.
const require = createRequire(import.meta.url);
const app = require("../../src/app.js");
const { liteApiService } = require("../../src/services/liteapi/liteApiService.js");
const { ExternalAPIError } = require("../../src/errors.js");

const offerId = "offer-abc123";

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

beforeAll(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

afterAll(() => new Promise((resolve) => server.close(resolve)));

afterEach(() => vi.restoreAllMocks());

const post = (body) =>
  fetch(`${base}/api/bookings/prebook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

describe("POST /api/bookings/prebook", () => {
  it("returns the prebook result for a valid offer", async () => {
    const spy = vi.spyOn(liteApiService, "prebook").mockResolvedValue(prebook);

    const response = await post({ offerId });

    expect(response.status).toBe(200);
    expect(spy).toHaveBeenCalledWith({ offerId });
    expect(await response.json()).toEqual({
      success: true,
      message: "Hotel prebooked successfully",
      data: prebook,
    });
  });

  it("hands the service the validated body rather than the raw one", async () => {
    const spy = vi.spyOn(liteApiService, "prebook").mockResolvedValue(prebook);

    await post({ offerId, usePaymentSdk: false });

    expect(spy).toHaveBeenCalledWith({ offerId });
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

    const response = await fetch(`${base}/api/bookings/prebook`, { method: "POST" });

    expect(response.status).toBe(400);
    expect(spy).not.toHaveBeenCalled();
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

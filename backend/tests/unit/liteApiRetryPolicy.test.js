import { describe, it, expect } from "vitest";
import { createRequire } from "node:module";

// Source modules are CommonJS; loading them through Node keeps one instance of each module.
const require = createRequire(import.meta.url);
const { planRetry, retryAfterMs, MAX_ATTEMPTS } = require("../../src/services/liteapi/retryPolicy.js");

const plan = (overrides = {}) =>
  planRetry({
    operation: "hotelSearch",
    transportFailure: false,
    provider: null,
    attempt: 1,
    ...overrides,
  });

const provider = (code) => ({ code, message: null, description: null, httpStatus: null });

describe("planRetry", () => {
  it("retries a read that never got an answer", () => {
    expect(plan({ transportFailure: true })).toMatchObject({ retry: true, delayMs: 250 });
  });

  it("backoff grows with each attempt", () => {
    expect(plan({ transportFailure: true, attempt: 1 }).delayMs).toBe(250);
    expect(plan({ transportFailure: true, attempt: 2 }).delayMs).toBe(750);
  });

  it.each(["prebook", "bookRate", "cancelBooking"])(
    "does not retry a write that never got an answer (%s)",
    (operation) => {
      expect(plan({ operation, transportFailure: true })).toMatchObject({
        retry: false,
        reason: "not safe to retry",
      });
    }
  );

  it.each(["hotelSearch", "hotelDetails", "locationSearch", "prebook", "bookRate", "cancelBooking"])(
    "retries %s when the provider refused it at the rate limit",
    (operation) => {
      expect(plan({ operation, transportFailure: true, provider: provider(4290) })).toMatchObject({
        retry: true,
      });
    }
  );

  it("retries a rate-limit subsystem error", () => {
    expect(plan({ transportFailure: true, provider: provider(4291) })).toMatchObject({ retry: true });
  });

  it("honours Retry-After over the computed backoff", () => {
    expect(plan({ transportFailure: true, provider: provider(4290), retryAfter: 5000 }).delayMs).toBe(5000);
  });

  it.each([4000, 4002, 4003, 4005])("does not retry the request-shaped code %i", (code) => {
    expect(plan({ provider: provider(code) })).toMatchObject({ retry: false });
  });

  it.each([2013, 2014, 5000])("does not retry the ambiguous booking code %i", (code) => {
    expect(plan({ operation: "bookRate", provider: provider(code) })).toMatchObject({ retry: false });
  });

  it("does not retry a code it does not know", () => {
    expect(plan({ provider: provider(9999) })).toMatchObject({ retry: false });
  });

  it("stops once the attempt limit is reached", () => {
    expect(plan({ transportFailure: true, attempt: MAX_ATTEMPTS })).toMatchObject({
      retry: false,
      reason: "attempt limit reached",
    });
  });
});

describe("retryAfterMs", () => {
  it("converts the header from seconds to milliseconds", () => {
    expect(retryAfterMs({ "retry-after": "30" })).toBe(30_000);
  });

  it("ignores a missing or unusable header", () => {
    expect(retryAfterMs(undefined)).toBeNull();
    expect(retryAfterMs({ "retry-after": "Wed, 21 Oct 2026 07:28:00 GMT" })).toBeNull();
    expect(retryAfterMs({ "retry-after": "0" })).toBeNull();
  });
});

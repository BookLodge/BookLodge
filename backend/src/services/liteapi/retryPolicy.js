const { OPERATION_CLASS } = require("./errors");

const MAX_ATTEMPTS = 3;
const BASE_DELAY_MS = 250;

// The provider refused the request at the edge, so nothing was processed and repeating it is safe
// for a read and a write alike. Every other code stays put: it either describes a bad request or
// leaves the outcome unknown.
const RETRYABLE_CODES = new Set([4290, 4291]);

const retryAfterMs = (headers) => {
  const seconds = Number(headers?.["retry-after"]);

  return Number.isFinite(seconds) && seconds > 0 ? seconds * 1000 : null;
};

// Deterministic backoff, threefold each time: 250ms, then 750ms.
const backoffMs = (attempt) => BASE_DELAY_MS * 3 ** (attempt - 1);

const planRetry = ({ operation, transportFailure, provider, attempt, retryAfter }) => {
  if (attempt >= MAX_ATTEMPTS) {
    return { retry: false, delayMs: null, reason: "attempt limit reached" };
  }

  if (provider && RETRYABLE_CODES.has(provider.code)) {
    return {
      retry: true,
      delayMs: retryAfter ?? backoffMs(attempt),
      reason: `provider code ${provider.code}`,
    };
  }

  // A read that never got an answer is safe to repeat. A write is not: the provider may have
  // completed it before the connection dropped, and repeating it risks a duplicate booking.
  if (transportFailure && OPERATION_CLASS[operation] === "READ") {
    return { retry: true, delayMs: backoffMs(attempt), reason: "read failed in transit" };
  }

  return { retry: false, delayMs: null, reason: "not safe to retry" };
};

module.exports = { planRetry, retryAfterMs, MAX_ATTEMPTS };

import { describe, it, expect } from "vitest";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { mapPrebookResponse } = require("../../src/services/liteapi/mappers/prebookMapper.js");

const liteApiPrebook = (overrides = {}) => ({
  data: {
    prebookId: "prebook-xyz789",
    offerId: "offer-abc123",
    hotelId: "hotel-123",
    price: 690.21,
    currency: "USD",
    transactionId: "tr_9f8c7b6a",
    secretKey: "sk_live_abc123",
    ...overrides,
  },
});

const bookLodgePrebook = (overrides = {}) => ({
  prebookId: "prebook-xyz789",
  offerId: "offer-abc123",
  hotelId: "hotel-123",
  price: { amount: 690.21, currency: "USD" },
  transactionId: "tr_9f8c7b6a",
  secretKey: "sk_live_abc123",
  ...overrides,
});

describe("mapPrebookResponse", () => {
  it("maps the LiteAPI prebook response into the BookLodge response", () => {
    expect(mapPrebookResponse(liteApiPrebook())).toEqual(bookLodgePrebook());
  });

  it("preserves the price", () => {
    const response = liteApiPrebook({ price: 250.5, currency: "EUR" });

    expect(mapPrebookResponse(response).price).toEqual({ amount: 250.5, currency: "EUR" });
  });

  it("preserves the transaction id", () => {
    const response = liteApiPrebook({ transactionId: "tr_other" });

    expect(mapPrebookResponse(response).transactionId).toBe("tr_other");
  });

  it("preserves the secret key", () => {
    const response = liteApiPrebook({ secretKey: "sk_other" });

    expect(mapPrebookResponse(response).secretKey).toBe("sk_other");
  });

  it("carries only the fields BookLodge defines", () => {
    const response = liteApiPrebook();
    response.data.roomTypes = [];
    response.data.commission = 12.5;

    const result = mapPrebookResponse(response);

    expect(Object.keys(result)).toEqual([
      "prebookId",
      "offerId",
      "hotelId",
      "price",
      "transactionId",
      "secretKey",
    ]);
    expect(result.price).toEqual({ amount: 690.21, currency: "USD" });
    expect(result).not.toHaveProperty("currency");
  });

  it("does not mutate the LiteAPI response", () => {
    const response = liteApiPrebook();
    const snapshot = structuredClone(response);

    mapPrebookResponse(response);

    expect(response).toEqual(snapshot);
  });
});

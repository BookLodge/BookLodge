import { describe, it, expect } from "vitest";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  mapBookRateRequest,
  mapBookRateResponse,
} = require("../../src/services/liteapi/mappers/bookRateMapper.js");

const bookRateRequest = (overrides = {}) => ({
  prebookId: "prebook-xyz789",
  clientReference: "BL-2f1c9a4e-7d3b-4f8a-9c1e-5a6b7c8d9e0f",
  holder: { firstName: "Ada", lastName: "Lovelace", email: "ada@example.com" },
  guests: [
    { occupancyNumber: 1, firstName: "Ada", lastName: "Lovelace", email: "ada@example.com" },
    { occupancyNumber: 2, firstName: "Grace", lastName: "Hopper", email: "grace@example.com" },
  ],
  transactionId: "tr_9f8c7b6a",
  ...overrides,
});

const liteApiBookRate = (overrides = {}) => ({
  data: {
    bookingId: "b_7f3d9c2a",
    ...overrides,
  },
});

describe("mapBookRateRequest", () => {
  it("copies the prebook id and the client reference", () => {
    const result = mapBookRateRequest(bookRateRequest());

    expect(result.prebookId).toBe("prebook-xyz789");
    expect(result.clientReference).toBe("BL-2f1c9a4e-7d3b-4f8a-9c1e-5a6b7c8d9e0f");
  });

  it("maps the holder", () => {
    expect(mapBookRateRequest(bookRateRequest()).holder).toEqual({
      firstName: "Ada",
      lastName: "Lovelace",
      email: "ada@example.com",
    });
  });

  it("maps every guest with its occupancy number", () => {
    expect(mapBookRateRequest(bookRateRequest()).guests).toEqual([
      { occupancyNumber: 1, firstName: "Ada", lastName: "Lovelace", email: "ada@example.com" },
      { occupancyNumber: 2, firstName: "Grace", lastName: "Hopper", email: "grace@example.com" },
    ]);
  });

  it("moves the transaction id into the payment block", () => {
    const result = mapBookRateRequest(bookRateRequest());

    expect(result.payment).toEqual({ method: "TRANSACTION_ID", transactionId: "tr_9f8c7b6a" });
    expect(result).not.toHaveProperty("transactionId");
  });

  it("does not carry a secret key", () => {
    expect(mapBookRateRequest(bookRateRequest())).not.toHaveProperty("secretKey");
  });

  it("carries only the provider request fields", () => {
    const result = mapBookRateRequest(bookRateRequest());

    expect(Object.keys(result)).toEqual([
      "prebookId",
      "clientReference",
      "holder",
      "guests",
      "payment",
    ]);
  });

  it("does not mutate the input", () => {
    const request = bookRateRequest();
    const snapshot = structuredClone(request);

    mapBookRateRequest(request);

    expect(request).toEqual(snapshot);
  });
});

describe("mapBookRateResponse", () => {
  it("maps the LiteAPI booking id", () => {
    expect(mapBookRateResponse(liteApiBookRate())).toEqual({ bookingId: "b_7f3d9c2a" });
  });

  it("strips provider fields that BookLodge does not model", () => {
    const response = liteApiBookRate();
    response.data.status = "CONFIRMED";
    response.data.hotelConfirmationCode = "HC-1234";
    response.data.roomTypes = [];

    const result = mapBookRateResponse(response);

    expect(Object.keys(result)).toEqual(["bookingId"]);
    expect(result).not.toHaveProperty("hotelConfirmationCode");
  });
});

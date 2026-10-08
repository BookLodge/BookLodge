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
    clientReference: "BL-2f1c9a4e-7d3b-4f8a-9c1e-5a6b7c8d9e0f",
    status: "CONFIRMED",
    hotelConfirmationCode: "HC-1234",
    checkin: "2026-11-02",
    checkout: "2026-11-05",
    hotel: { hotelId: "lp1897", name: "Sample Hotel" },
    bookedRooms: [
      {
        occupancy_number: 1,
        roomType: { roomTypeId: "RT123", name: "Standard Room" },
        boardName: "Room Only",
      },
    ],
    holder: { firstName: "Ada", lastName: "Lovelace", email: "ada@example.com" },
    price: 412.76,
    currency: "USD",
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
  it("maps the provider booking onto the Booking model shape", () => {
    expect(mapBookRateResponse(liteApiBookRate())).toEqual({
      clientReference: "BL-2f1c9a4e-7d3b-4f8a-9c1e-5a6b7c8d9e0f",
      status: "CONFIRMED",
      hotel: { hotelId: "lp1897", name: "Sample Hotel" },
      stay: { checkin: "2026-11-02", checkout: "2026-11-05" },
      rooms: [{ occupancyNumber: 1, roomName: "Standard Room", boardName: "Room Only" }],
      holder: { firstName: "Ada", lastName: "Lovelace", email: "ada@example.com" },
      price: { amount: 412.76, currency: "USD" },
      liteApi: { bookingId: "b_7f3d9c2a" },
    });
  });

  it("does not mutate the provider response", () => {
    const response = liteApiBookRate();
    const snapshot = structuredClone(response);

    mapBookRateResponse(response);

    expect(response).toEqual(snapshot);
  });

  it.each(["CANCELED", "CANCELLED"])(
    "maps the provider's %s status to our CANCELLED",
    (status) => {
      const response = liteApiBookRate({ status });

      expect(mapBookRateResponse(response).status).toBe("CANCELLED");
    }
  );

  it.each([
    ["an absent room type", { roomType: undefined }],
    ["an absent board name", { boardName: undefined }],
  ])("leaves a room field null for %s", (label, roomOverrides) => {
    const response = liteApiBookRate({
      bookedRooms: [{ occupancy_number: 2, ...roomOverrides }],
    });

    expect(mapBookRateResponse(response).rooms).toEqual([
      { occupancyNumber: 2, roomName: null, boardName: null },
    ]);
  });

  it("keeps the occupancy number the provider calls occupancy_number", () => {
    const response = liteApiBookRate({
      bookedRooms: [
        { occupancy_number: 1, roomType: { name: "Standard Room" }, boardName: "Room Only" },
        { occupancy_number: 3, roomType: { name: "Suite" }, boardName: "Breakfast" },
      ],
    });

    expect(mapBookRateResponse(response).rooms).toEqual([
      { occupancyNumber: 1, roomName: "Standard Room", boardName: "Room Only" },
      { occupancyNumber: 3, roomName: "Suite", boardName: "Breakfast" },
    ]);
  });

  it("strips provider fields that BookLodge does not model", () => {
    const result = mapBookRateResponse(liteApiBookRate());

    expect(result).not.toHaveProperty("hotelConfirmationCode");
    expect(result).not.toHaveProperty("data");
    expect(result).not.toHaveProperty("bookingId");
    expect(Object.keys(result)).toEqual([
      "clientReference",
      "status",
      "hotel",
      "stay",
      "rooms",
      "holder",
      "price",
      "liteApi",
    ]);
  });
});

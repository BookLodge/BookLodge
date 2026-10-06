import { describe, it, expect } from "vitest";
import { createRequire } from "node:module";

// Source modules are CommonJS; loading them through Node keeps one instance of each module.
const require = createRequire(import.meta.url);
const { mapHotelDetailsResponse } = require("../../src/services/liteapi/mappers/hotelDetailsMapper.js");

const hotelDetails = (overrides = {}) => ({
  data: {
    id: "hotel-123",
    name: "Example Hotel",
    description: "A comfortable hotel...",
    main_photo: "https://example.com/main.jpg",
    address: "123 Example Street",
    city: "Lagos",
    country: "NG",
    starRating: 4,
    location: { latitude: 6.5244, longitude: 3.3792 },
    facilities: ["Swimming Pool", "Free WiFi"],
    checkin: "03:00 PM",
    checkout: "11:00 AM",
    ...overrides,
  },
});

const rate = (overrides = {}) => ({
  name: "Deluxe King Room",
  boardName: "Breakfast Included",
  retailRate: { total: [{ amount: 412.76, currency: "USD" }] },
  cancellationPolicies: { refundableTag: "RFN" },
  ...overrides,
});

const roomType = (overrides = {}) => ({
  offerId: "offer-abc",
  rates: [rate()],
  ...overrides,
});

const hotelRates = (entries) => ({
  data: entries.map(({ hotelId, roomTypes }) => ({ hotelId, roomTypes })),
});

const bookLodgeRate = (overrides = {}) => ({
  offerId: "offer-abc",
  roomName: "Deluxe King Room",
  boardName: "Breakfast Included",
  amount: 412.76,
  currency: "USD",
  refundable: true,
  ...overrides,
});

describe("mapHotelDetailsResponse", () => {
  it("maps the LiteAPI hotel metadata into the BookLodge hotel", () => {
    const result = mapHotelDetailsResponse(hotelDetails(), { data: [] });

    expect(result).toEqual({
      id: "hotel-123",
      name: "Example Hotel",
      description: "A comfortable hotel...",
      photo: "https://example.com/main.jpg",
      address: "123 Example Street",
      city: "Lagos",
      country: "NG",
      rating: 4,
      location: { latitude: 6.5244, longitude: 3.3792 },
      facilities: ["Swimming Pool", "Free WiFi"],
      checkin: "03:00 PM",
      checkout: "11:00 AM",
      rates: [],
    });
  });

  it("maps a LiteAPI rate into a BookLodge rate", () => {
    const response = hotelRates([
      { hotelId: "hotel-123", roomTypes: [roomType()] },
    ]);

    expect(mapHotelDetailsResponse(hotelDetails(), response).rates).toEqual([bookLodgeRate()]);
  });

  it("includes rates from every room type", () => {
    const response = hotelRates([
      {
        hotelId: "hotel-123",
        roomTypes: [
          roomType(),
          roomType({
            offerId: "offer-xyz",
            rates: [rate({ name: "Twin Room", boardName: "Room Only" })],
          }),
        ],
      },
    ]);

    const { rates } = mapHotelDetailsResponse(hotelDetails(), response);

    expect(rates).toHaveLength(2);
    expect(rates.map((item) => item.offerId)).toEqual(["offer-abc", "offer-xyz"]);
    expect(rates[1]).toEqual(
      bookLodgeRate({ offerId: "offer-xyz", roomName: "Twin Room", boardName: "Room Only" })
    );
  });

  it("includes every rate within a room type", () => {
    const response = hotelRates([
      {
        hotelId: "hotel-123",
        roomTypes: [
          roomType({
            rates: [
              rate(),
              rate({
                name: "Twin Room",
                boardName: "Room Only",
                retailRate: { total: [{ amount: 250, currency: "EUR" }] },
              }),
            ],
          }),
        ],
      },
    ]);

    const { rates } = mapHotelDetailsResponse(hotelDetails(), response);

    expect(rates).toHaveLength(2);
    expect(rates).toEqual([
      bookLodgeRate(),
      bookLodgeRate({
        roomName: "Twin Room",
        boardName: "Room Only",
        amount: 250,
        currency: "EUR",
      }),
    ]);
  });

  it("flattens rates in room type then rate order", () => {
    const response = hotelRates([
      {
        hotelId: "hotel-123",
        roomTypes: [
          roomType({
            offerId: "offer-first",
            rates: [
              rate({ name: "First A" }),
              rate({ name: "First B" }),
            ],
          }),
          roomType({
            offerId: "offer-second",
            rates: [rate({ name: "Second A" })],
          }),
        ],
      },
    ]);

    const { rates } = mapHotelDetailsResponse(hotelDetails(), response);

    expect(rates.map((item) => [item.offerId, item.roomName])).toEqual([
      ["offer-first", "First A"],
      ["offer-first", "First B"],
      ["offer-second", "Second A"],
    ]);
  });

  it("uses the first entry of retailRate.total", () => {
    const response = hotelRates([
      {
        hotelId: "hotel-123",
        roomTypes: [
          roomType({
            rates: [
              rate({
                retailRate: {
                  total: [
                    { amount: 412.76, currency: "USD" },
                    { amount: 100, currency: "USD" },
                  ],
                },
              }),
            ],
          }),
        ],
      },
    ]);

    expect(mapHotelDetailsResponse(hotelDetails(), response).rates[0]).toEqual(bookLodgeRate());
  });

  it("maps the RFN tag to refundable: true", () => {
    const response = hotelRates([
      {
        hotelId: "hotel-123",
        roomTypes: [roomType({ rates: [rate({ cancellationPolicies: { refundableTag: "RFN" } })] })],
      },
    ]);

    expect(mapHotelDetailsResponse(hotelDetails(), response).rates[0].refundable).toBe(true);
  });

  it("maps a non-RFN tag to refundable: false", () => {
    const response = hotelRates([
      {
        hotelId: "hotel-123",
        roomTypes: [
          roomType({ rates: [rate({ cancellationPolicies: { refundableTag: "NRFN" } })] }),
        ],
      },
    ]);

    expect(mapHotelDetailsResponse(hotelDetails(), response).rates[0].refundable).toBe(false);
  });

  it("skips a rate whose retailRate.total is empty", () => {
    const response = hotelRates([
      {
        hotelId: "hotel-123",
        roomTypes: [
          roomType({
            rates: [rate({ retailRate: { total: [] } }), rate({ name: "Twin Room" })],
          }),
        ],
      },
    ]);

    const { rates } = mapHotelDetailsResponse(hotelDetails(), response);

    expect(rates).toEqual([bookLodgeRate({ roomName: "Twin Room" })]);
  });

  it("does not fail on a room type that has no rates", () => {
    const response = hotelRates([
      {
        hotelId: "hotel-123",
        roomTypes: [roomType({ offerId: "offer-empty", rates: [] }), roomType()],
      },
    ]);

    const { rates } = mapHotelDetailsResponse(hotelDetails(), response);

    expect(rates).toEqual([bookLodgeRate()]);
  });

  it("only includes rates belonging to the requested hotel", () => {
    const response = hotelRates([
      { hotelId: "hotel-999", roomTypes: [roomType({ offerId: "offer-other" })] },
      { hotelId: "hotel-123", roomTypes: [roomType()] },
    ]);

    const { rates } = mapHotelDetailsResponse(hotelDetails(), response);

    expect(rates).toEqual([bookLodgeRate()]);
  });

  it("returns no rates when the rates response has no matching hotel", () => {
    const response = hotelRates([
      { hotelId: "hotel-999", roomTypes: [roomType({ offerId: "offer-other" })] },
    ]);

    expect(mapHotelDetailsResponse(hotelDetails(), response).rates).toEqual([]);
  });

  it("returns no rates when the matching hotel has no usable rate", () => {
    const response = hotelRates([
      {
        hotelId: "hotel-123",
        roomTypes: [roomType({ rates: [rate({ retailRate: { total: [] } })] })],
      },
    ]);

    expect(mapHotelDetailsResponse(hotelDetails(), response).rates).toEqual([]);
  });
});

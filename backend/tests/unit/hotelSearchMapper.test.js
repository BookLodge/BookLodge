import { describe, it, expect } from "vitest";
import { createRequire } from "node:module";

// Source modules are CommonJS; loading them through Node keeps one instance of each module.
const require = createRequire(import.meta.url);
const { mapHotelSearchRequest, mapHotelSearchResponse } = require("../../src/services/hotelSearchMapper.js");

const searchRequest = () => ({
  placeId: "ChIJ...",
  checkin: "2026-10-20",
  checkout: "2026-10-23",
  occupancies: [{ adults: 2, children: [7, 12] }],
  currency: "USD",
  guestNationality: "NG",
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

const liteApiHotel = (overrides = {}) => ({
  id: "hotel-123",
  name: "Example Hotel",
  main_photo: "https://cdn.example.com/hotel-123.jpg",
  address: "123 Example Street",
  rating: 8.75,
  ...overrides,
});

const liteApiResponse = (entries) => ({
  data: entries.map(({ hotel, roomTypes }) => ({ hotelId: hotel.id, roomTypes })),
  hotels: entries.map(({ hotel }) => hotel),
});

describe("hotelSearchMapper", () => {
  describe("mapHotelSearchRequest", () => {
    it("maps a BookLodge search into the LiteAPI request", () => {
      expect(mapHotelSearchRequest(searchRequest())).toEqual({
        placeId: "ChIJ...",
        checkin: "2026-10-20",
        checkout: "2026-10-23",
        occupancies: [{ adults: 2, children: [7, 12] }],
        currency: "USD",
        guestNationality: "NG",
        maxRatesPerHotel: 1,
        includeHotelData: true,
      });
    });

    it("drops fields that are not part of the LiteAPI request", () => {
      const mapped = mapHotelSearchRequest({ ...searchRequest(), sortBy: "price" });

      expect(mapped).not.toHaveProperty("sortBy");
      expect(mapped).toEqual(mapHotelSearchRequest(searchRequest()));
    });
  });

  describe("mapHotelSearchResponse", () => {
    it("normalizes a LiteAPI response into the BookLodge response", () => {
      const response = liteApiResponse([
        { hotel: liteApiHotel(), roomTypes: [roomType()] },
      ]);

      expect(mapHotelSearchResponse(response)).toEqual({
        hotels: [
          {
            id: "hotel-123",
            name: "Example Hotel",
            photo: "https://cdn.example.com/hotel-123.jpg",
            address: "123 Example Street",
            rating: 8.75,
            startingRate: {
              offerId: "offer-abc",
              roomName: "Deluxe King Room",
              boardName: "Breakfast Included",
              amount: 412.76,
              currency: "USD",
              refundable: true,
            },
          },
        ],
      });
    });

    it("maps a non-refundable rate to refundable: false", () => {
      const response = liteApiResponse([
        {
          hotel: liteApiHotel(),
          roomTypes: [
            roomType({
              rates: [rate({ cancellationPolicies: { refundableTag: "NRFN" } })],
            }),
          ],
        },
      ]);

      expect(mapHotelSearchResponse(response).hotels[0].startingRate.refundable).toBe(false);
    });

    it("returns every hotel that has a usable rate", () => {
      const second = liteApiHotel({
        id: "hotel-456",
        name: "Second Hotel",
        main_photo: "https://cdn.example.com/hotel-456.jpg",
        address: "456 Example Avenue",
        rating: 9.1,
      });

      const response = liteApiResponse([
        { hotel: liteApiHotel(), roomTypes: [roomType()] },
        {
          hotel: second,
          roomTypes: [
            roomType({
              offerId: "offer-xyz",
              rates: [
                rate({
                  name: "Twin Room",
                  boardName: "Room Only",
                  retailRate: { total: [{ amount: 250, currency: "EUR" }] },
                  cancellationPolicies: { refundableTag: "NRFN" },
                }),
              ],
            }),
          ],
        },
      ]);

      expect(mapHotelSearchResponse(response)).toEqual({
        hotels: [
          {
            id: "hotel-123",
            name: "Example Hotel",
            photo: "https://cdn.example.com/hotel-123.jpg",
            address: "123 Example Street",
            rating: 8.75,
            startingRate: {
              offerId: "offer-abc",
              roomName: "Deluxe King Room",
              boardName: "Breakfast Included",
              amount: 412.76,
              currency: "USD",
              refundable: true,
            },
          },
          {
            id: "hotel-456",
            name: "Second Hotel",
            photo: "https://cdn.example.com/hotel-456.jpg",
            address: "456 Example Avenue",
            rating: 9.1,
            startingRate: {
              offerId: "offer-xyz",
              roomName: "Twin Room",
              boardName: "Room Only",
              amount: 250,
              currency: "EUR",
              refundable: false,
            },
          },
        ],
      });
    });

    it("orders hotels by the LiteAPI rate results", () => {
      const second = liteApiHotel({
        id: "hotel-456",
        name: "Second Hotel",
        main_photo: "https://cdn.example.com/hotel-456.jpg",
        address: "456 Example Avenue",
        rating: 9.1,
      });
      const response = liteApiResponse([
        { hotel: liteApiHotel(), roomTypes: [roomType()] },
        { hotel: second, roomTypes: [roomType({ offerId: "offer-xyz" })] },
      ]);
      response.hotels.reverse();

      expect(mapHotelSearchResponse(response).hotels.map((hotel) => hotel.id)).toEqual([
        "hotel-123",
        "hotel-456",
      ]);
    });

    it("excludes a hotel with no room types", () => {
      const response = liteApiResponse([
        { hotel: liteApiHotel(), roomTypes: [roomType()] },
        { hotel: liteApiHotel({ id: "hotel-456" }), roomTypes: [] },
      ]);

      const result = mapHotelSearchResponse(response);

      expect(result.hotels).toHaveLength(1);
      expect(result.hotels[0].id).toBe("hotel-123");
    });

    it("excludes a hotel whose room types have no rates", () => {
      const response = liteApiResponse([
        { hotel: liteApiHotel(), roomTypes: [roomType()] },
        { hotel: liteApiHotel({ id: "hotel-456" }), roomTypes: [roomType({ rates: [] })] },
      ]);

      const result = mapHotelSearchResponse(response);

      expect(result.hotels).toHaveLength(1);
      expect(result.hotels[0].id).toBe("hotel-123");
    });

    it("uses the first room type that carries a rate", () => {
      const response = liteApiResponse([
        {
          hotel: liteApiHotel(),
          roomTypes: [
            roomType({ offerId: "offer-empty", rates: [] }),
            roomType({ offerId: "offer-priced" }),
          ],
        },
      ]);

      expect(mapHotelSearchResponse(response).hotels[0].startingRate.offerId).toBe("offer-priced");
    });

    it("returns no hotels when none has a usable rate", () => {
      const response = liteApiResponse([
        { hotel: liteApiHotel(), roomTypes: [] },
        { hotel: liteApiHotel({ id: "hotel-456" }), roomTypes: [roomType({ rates: [] })] },
      ]);

      expect(mapHotelSearchResponse(response)).toEqual({ hotels: [] });
    });
  });
});

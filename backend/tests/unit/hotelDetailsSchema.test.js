import { describe, it, expect } from "vitest";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  hotelDetailsRequestSchema,
  liteApiHotelDetailsResponseSchema,
  hotelDetailsResponseSchema,
} = require("../../src/services/liteapi/schemas/hotelDetailsSchema.js");

const requestBody = () => ({
  checkin: "2026-10-20",
  checkout: "2026-10-23",
  occupancies: [{ adults: 2, children: [7, 12] }],
  currency: "USD",
  guestNationality: "NG",
});

const liteApiDetails = () => ({
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
  },
});

const rate = (overrides = {}) => ({
  offerId: "offer-abc",
  roomName: "Deluxe King Room",
  boardName: "Breakfast Included",
  amount: 412.76,
  currency: "USD",
  refundable: true,
  ...overrides,
});

const bookLodgeDetails = () => ({
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
  rates: [rate()],
});

describe("hotelDetailsSchema", () => {
  describe("hotelDetailsRequestSchema", () => {
    it("accepts the request body without a hotel id", () => {
      expect(hotelDetailsRequestSchema.safeParse(requestBody()).success).toBe(true);
    });

    it("drops a hotel id supplied in the body", () => {
      const result = hotelDetailsRequestSchema.parse({ ...requestBody(), hotelId: "hotel-123" });

      expect(result).not.toHaveProperty("hotelId");
      expect(result).toEqual(requestBody());
    });

    it("rejects a request without a guest nationality", () => {
      const { guestNationality, ...body } = requestBody();

      expect(hotelDetailsRequestSchema.safeParse(body).success).toBe(false);
    });

    it("rejects a check-in date that is not an ISO date", () => {
      expect(
        hotelDetailsRequestSchema.safeParse({ ...requestBody(), checkin: "20-10-2026" }).success
      ).toBe(false);
    });

    it("rejects an occupancy with a non-integer adult count", () => {
      const body = { ...requestBody(), occupancies: [{ adults: "2", children: [] }] };

      expect(hotelDetailsRequestSchema.safeParse(body).success).toBe(false);
    });

    it("rejects an occupancy whose children are not ages", () => {
      const body = { ...requestBody(), occupancies: [{ adults: 2, children: ["7"] }] };

      expect(hotelDetailsRequestSchema.safeParse(body).success).toBe(false);
    });
  });

  describe("liteApiHotelDetailsResponseSchema", () => {
    it("accepts a LiteAPI hotel details response", () => {
      expect(liteApiHotelDetailsResponseSchema.safeParse(liteApiDetails()).success).toBe(true);
    });

    it("ignores LiteAPI fields that BookLodge does not use", () => {
      const body = liteApiDetails();
      body.data.chain = "Independent";

      const { data } = liteApiHotelDetailsResponseSchema.parse(body);

      expect(data).not.toHaveProperty("chain");
    });

    it("rejects a response without a hotel name", () => {
      const body = liteApiDetails();
      delete body.data.name;

      expect(liteApiHotelDetailsResponseSchema.safeParse(body).success).toBe(false);
    });

    it("rejects coordinates that are not numbers", () => {
      const body = liteApiDetails();
      body.data.location.latitude = "6.5244";

      expect(liteApiHotelDetailsResponseSchema.safeParse(body).success).toBe(false);
    });
  });

  describe("hotelDetailsResponseSchema", () => {
    it("accepts the BookLodge hotel details response", () => {
      expect(hotelDetailsResponseSchema.safeParse(bookLodgeDetails()).success).toBe(true);
    });

    it("accepts a hotel with multiple available rates", () => {
      const body = {
        ...bookLodgeDetails(),
        rates: [
          rate(),
          rate({ offerId: "offer-xyz", roomName: "Twin Room", amount: 250, refundable: false }),
        ],
      };

      const result = hotelDetailsResponseSchema.parse(body);

      expect(result.rates).toHaveLength(2);
      expect(result.rates.map((item) => item.offerId)).toEqual(["offer-abc", "offer-xyz"]);
    });

    it("rejects a rate that is missing its refundable flag", () => {
      const { refundable, ...incomplete } = rate();

      expect(
        hotelDetailsResponseSchema.safeParse({ ...bookLodgeDetails(), rates: [incomplete] }).success
      ).toBe(false);
    });

    it("rejects a rate whose amount is not a number", () => {
      const body = { ...bookLodgeDetails(), rates: [rate({ amount: "412.76" })] };

      expect(hotelDetailsResponseSchema.safeParse(body).success).toBe(false);
    });
  });
});

const { describe, it, expect } = require("vitest");
const { mapHotelDetailsResponse } = require("../../src/services/liteapi/mappers/hotelDetailsMapper");
const {
  liteApiHotelDetailsResponseSchema,
  hotelDetailsResponseSchema,
} = require("../../src/services/liteapi/schemas/hotelDetailsSchema");

const hotelDetailsFixture = {
  data: {
    id: "hotel-123",
    name: "Test Hotel",
    hotelDescription: "A comfortable hotel",
    main_photo: "https://images.example/hotel-main.jpg",
    hotelImages: [
      {
        url: "https://images.example/hotel-pool.jpg",
        caption: "Swimming pool",
      },
    ],
    rooms: [
      {
        id: 501,
        roomName: "Deluxe King",
        description: "A room with a king bed",
        photos: [
          {
            url: "https://images.example/room-1.jpg",
            imageDescription: "King bed",
            mainPhoto: true,
            hd_url: "https://images.example/room-1-hd.jpg",
          },
          {
            url: "https://images.example/room-2.jpg",
            imageDescription: "Bathroom",
          },
        ],
      },
      {
        id: 502,
        roomName: "Standard Twin",
        photos: [],
      },
    ],
    address: "1 Test Road",
    city: "Lagos",
    country: "Nigeria",
    starRating: 4,
    location: { latitude: 6.5, longitude: 3.4 },
    hotelFacilities: ["Wi-Fi"],
    checkinCheckoutTimes: { checkin_start: "14:00", checkout: "11:00" },
  },
};

const ratesFixture = {
  data: [
    {
      hotelId: "hotel-123",
      roomTypes: [
        {
          offerId: "offer-1",
          rates: [
            {
              occupancyNumber: 2,
              name: "Deluxe King",
              boardName: "Room only",
              retailRate: { total: [{ amount: 120, currency: "USD" }] },
              cancellationPolicies: { refundableTag: "RFN" },
            },
          ],
        },
      ],
      hotels: [],
    },
  ],
};

describe("hotel details photos", () => {
  it("preserves hotel gallery and room photos in the LiteAPI response schema", () => {
    const result = liteApiHotelDetailsResponseSchema.safeParse(hotelDetailsFixture);

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.data.hotelImages).toHaveLength(1);
    expect(result.data.data.rooms[0].photos).toHaveLength(2);
    expect(result.data.data.rooms[0].photos[0].hd_url).toBe(
      "https://images.example/room-1-hd.jpg"
    );
  });

  it("maps hotel gallery and each room's photos into the BookLodge response", () => {
    const providerDetails = liteApiHotelDetailsResponseSchema.parse(hotelDetailsFixture);
    const result = mapHotelDetailsResponse(providerDetails, ratesFixture);

    expect(result.photo).toBe("https://images.example/hotel-main.jpg");
    expect(result.photos).toEqual([
      {
        url: "https://images.example/hotel-pool.jpg",
        caption: "Swimming pool",
      },
    ]);
    expect(result.rooms).toEqual([
      {
        id: 501,
        name: "Deluxe King",
        description: "A room with a king bed",
        photos: [
          {
            url: "https://images.example/room-1.jpg",
            imageDescription: "King bed",
            mainPhoto: true,
            hd_url: "https://images.example/room-1-hd.jpg",
          },
          {
            url: "https://images.example/room-2.jpg",
            imageDescription: "Bathroom",
          },
        ],
      },
      {
        id: 502,
        name: "Standard Twin",
        photos: [],
      },
    ]);
    expect(result.rates[0].roomName).toBe("Deluxe King");
  });

  it("validates the mapped BookLodge response including photos", () => {
    const providerDetails = liteApiHotelDetailsResponseSchema.parse(hotelDetailsFixture);
    const mapped = mapHotelDetailsResponse(providerDetails, ratesFixture);

    expect(hotelDetailsResponseSchema.safeParse(mapped).success).toBe(true);
  });

  it("handles hotels and rooms with no photo arrays", () => {
    const detailsWithoutPhotos = {
      data: {
        ...hotelDetailsFixture.data,
        hotelImages: undefined,
        rooms: [
          {
            id: 503,
            roomName: "Basic Room",
            photos: undefined,
          },
        ],
      },
    };

    const providerDetails = liteApiHotelDetailsResponseSchema.parse(detailsWithoutPhotos);
    const mapped = mapHotelDetailsResponse(providerDetails, { data: [] });

    expect(mapped.photos).toEqual([]);
    expect(mapped.rooms).toEqual([
      { id: 503, name: "Basic Room", photos: [] },
    ]);
    expect(hotelDetailsResponseSchema.safeParse(mapped).success).toBe(true);
  });
});

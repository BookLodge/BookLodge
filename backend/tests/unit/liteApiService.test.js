import { describe, it, expect, vi } from "vitest";
import { createRequire } from "node:module";

// Source modules are CommonJS. Loading them through Node instead of `import`
// keeps one instance of each class, so instanceof checks hold across the boundary.
const require = createRequire(import.meta.url);
const { LiteApiService } = require("../../src/services/liteApiService.js");
const { AppError, ExternalAPIError } = require("../../src/errors.js");

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

const setup = (providerBody) => {
  const client = { post: vi.fn().mockResolvedValue({ data: providerBody }) };
  return { client, service: new LiteApiService(client) };
};

const sentBody = (client) => {
  expect(client.post).toHaveBeenCalledTimes(1);
  return client.post.mock.calls[0][1];
};

describe("LiteApiService.searchHotels", () => {
  it("returns the expected BookLodge response for a valid search", async () => {
    const { service } = setup(
      liteApiResponse([{ hotel: liteApiHotel(), roomTypes: [roomType()] }])
    );

    const result = await service.searchHotels(searchRequest());

    expect(result).toEqual({
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

  it("sends the correct LiteAPI request", async () => {
    const { client, service } = setup(
      liteApiResponse([{ hotel: liteApiHotel(), roomTypes: [roomType()] }])
    );

    await service.searchHotels(searchRequest());

    expect(sentBody(client)).toEqual({
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

  it("rejects an invalid BookLodge request with an AppError before calling LiteAPI", async () => {
    const { client, service } = setup(
      liteApiResponse([{ hotel: liteApiHotel(), roomTypes: [roomType()] }])
    );

    await expect(
      service.searchHotels({ ...searchRequest(), checkin: "20-10-2026" })
    ).rejects.toBeInstanceOf(AppError);

    expect(client.post).not.toHaveBeenCalled();
  });

  it("returns both hotels when LiteAPI returns two with different rates", async () => {
    const first = liteApiHotel({ id: "hotel-123", name: "Example Hotel" });
    const second = liteApiHotel({
      id: "hotel-456",
      name: "Second Hotel",
      main_photo: "https://cdn.example.com/hotel-456.jpg",
      address: "456 Example Avenue",
      rating: 9.1,
    });

    const { service } = setup(
      liteApiResponse([
        { hotel: first, roomTypes: [roomType()] },
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
      ])
    );

    const result = await service.searchHotels(searchRequest());

    expect(result.hotels).toHaveLength(2);
    expect(result.hotels.map((hotel) => hotel.id)).toEqual(["hotel-123", "hotel-456"]);
    expect(result.hotels[0].startingRate).toEqual({
      offerId: "offer-abc",
      roomName: "Deluxe King Room",
      boardName: "Breakfast Included",
      amount: 412.76,
      currency: "USD",
      refundable: true,
    });
    expect(result.hotels[1]).toEqual({
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
    });
  });

  it("excludes a hotel that has no room types", async () => {
    const priced = liteApiHotel({ id: "hotel-123", name: "Example Hotel" });
    const unpriced = liteApiHotel({
      id: "hotel-456",
      name: "Second Hotel",
      main_photo: "https://cdn.example.com/hotel-456.jpg",
      address: "456 Example Avenue",
      rating: 9.1,
    });

    const { service } = setup(
      liteApiResponse([
        { hotel: priced, roomTypes: [roomType()] },
        { hotel: unpriced, roomTypes: [] },
      ])
    );

    const result = await service.searchHotels(searchRequest());

    expect(result.hotels).toHaveLength(1);
    expect(result.hotels[0].id).toBe("hotel-123");
  });

  it("excludes a hotel whose room types carry no rates", async () => {
    const priced = liteApiHotel({ id: "hotel-123", name: "Example Hotel" });
    const unpriced = liteApiHotel({
      id: "hotel-456",
      name: "Second Hotel",
      main_photo: "https://cdn.example.com/hotel-456.jpg",
      address: "456 Example Avenue",
      rating: 9.1,
    });

    const { service } = setup(
      liteApiResponse([
        { hotel: priced, roomTypes: [roomType()] },
        { hotel: unpriced, roomTypes: [roomType({ rates: [] })] },
      ])
    );

    const result = await service.searchHotels(searchRequest());

    expect(result.hotels).toHaveLength(1);
    expect(result.hotels[0].id).toBe("hotel-123");
  });

  it("rejects a LiteAPI response that does not satisfy the provider schema", async () => {
    const { service } = setup({
      data: [{ hotelId: "hotel-123" }],
      hotels: [{ id: "hotel-123" }],
    });

    await expect(service.searchHotels(searchRequest())).rejects.toBeInstanceOf(ExternalAPIError);
  });

  it("converts an HTTP failure into an ExternalAPIError", async () => {
    const httpError = Object.assign(new Error("Request failed with status code 500"), {
      isAxiosError: true,
      response: { status: 500, data: {} },
    });
    const service = new LiteApiService({ post: vi.fn().mockRejectedValue(httpError) });

    await expect(service.searchHotels(searchRequest())).rejects.toBeInstanceOf(ExternalAPIError);
  });

  it("maps a LiteAPI 404 to a 404 response", async () => {
    const notFound = Object.assign(new Error("Request failed with status code 404"), {
      isAxiosError: true,
      response: { status: 404, data: { error: { code: 404, message: "Hotel not found" } } },
    });
    const service = new LiteApiService({ post: vi.fn().mockRejectedValue(notFound) });

    await expect(service.searchHotels(searchRequest())).rejects.toMatchObject({
      statusCode: 404,
      message: "Hotel search failed",
    });
  });

  it("keeps other LiteAPI failures at 502", async () => {
    const httpError = Object.assign(new Error("Request failed with status code 500"), {
      isAxiosError: true,
      response: { status: 500, data: {} },
    });
    const service = new LiteApiService({ post: vi.fn().mockRejectedValue(httpError) });

    await expect(service.searchHotels(searchRequest())).rejects.toMatchObject({
      statusCode: 502,
      message: "Hotel search failed",
    });
  });

  it("converts a LiteAPI API-level error into an ExternalAPIError", async () => {
    const { service } = setup({ error: { code: 401, message: "Invalid API key" } });

    const error = await service.searchHotels(searchRequest()).catch((err) => err);

    expect(error).toBeInstanceOf(ExternalAPIError);
    expect(error).toMatchObject({ statusCode: 502, message: "Hotel search failed" });
  });
});

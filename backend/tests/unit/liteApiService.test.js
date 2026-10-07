import { describe, it, expect, vi } from "vitest";
import { createRequire } from "node:module";

// Source modules are CommonJS. Loading them through Node instead of `import`
// keeps one instance of each class, so instanceof checks hold across the boundary.
const require = createRequire(import.meta.url);
const { LiteApiService } = require("../../src/services/liteapi/liteApiService.js");
const { AppError, ExternalAPIError } = require("../../src/errors.js");
const { mapLocationSearchResponse } = require("../../src/services/liteapi/mappers/locationSearchMapper.js");
const { locationSearchResponseSchema } = require("../../src/services/liteapi/schemas/locationSearchSchema.js");

const searchRequest = () => ({
  placeId: "ChIJ...",
  checkin: "2026-10-20",
  checkout: "2026-10-23",
  occupancies: [{ adults: 2, children: [7, 12] }],
  currency: "USD",
  guestNationality: "NG",
});

const rate = (overrides = {}) => ({
  occupancyNumber: 1,
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

const rateCriteria = () => ({
  checkin: "2026-10-20",
  checkout: "2026-10-23",
  occupancies: [{ adults: 2, children: [7, 12] }],
  currency: "USD",
  guestNationality: "NG",
});

const hotelDetails = (overrides = {}) => ({
  data: {
    id: "hotel-123",
    name: "Example Hotel",
    hotelDescription: "<p>A comfortable hotel...</p>",
    main_photo: "https://cdn.example.com/hotel-123.jpg",
    address: "123 Example Street",
    city: "Lagos",
    country: "NG",
    starRating: 4,
    location: { latitude: 6.5244, longitude: 3.3792 },
    hotelFacilities: ["Swimming Pool", "Free WiFi"],
    checkinCheckoutTimes: { checkin_start: "03:00 PM", checkout: "11:00 AM" },
    ...overrides,
  },
});

const hotelRates = (entries) =>
  liteApiResponse(entries ?? [{ hotel: liteApiHotel(), roomTypes: [roomType()] }]);

const setupDetails = ({ details = hotelDetails(), rates = hotelRates() } = {}) => {
  const client = {
    get: vi.fn().mockResolvedValue({ data: details }),
    post: vi.fn().mockResolvedValue({ data: rates }),
  };
  return { client, service: new LiteApiService(client) };
};

const bookLodgeHotel = () => ({
  id: "hotel-123",
  name: "Example Hotel",
  description: "<p>A comfortable hotel...</p>",
  photo: "https://cdn.example.com/hotel-123.jpg",
  address: "123 Example Street",
  city: "Lagos",
  country: "NG",
  rating: 4,
  location: { latitude: 6.5244, longitude: 3.3792 },
  facilities: ["Swimming Pool", "Free WiFi"],
  checkin: "03:00 PM",
  checkout: "11:00 AM",
  rates: [
    {
      offerId: "offer-abc",
      occupancyNumber: 1,
      roomName: "Deluxe King Room",
      boardName: "Breakfast Included",
      amount: 412.76,
      currency: "USD",
      refundable: true,
    },
  ],
});

const httpError = (status) =>
  Object.assign(new Error(`Request failed with status code ${status}`), {
    isAxiosError: true,
    response: { status, data: {} },
  });

describe("LiteApiService.getHotelDetails", () => {
  it("calls the hotel details and hotel rates endpoints", async () => {
    const { client, service } = setupDetails();

    await service.getHotelDetails("hotel-123", rateCriteria());

    expect(client.get).toHaveBeenCalledTimes(1);
    expect(client.post).toHaveBeenCalledTimes(1);
  });

  it("requests the hotel details with the hotel id", async () => {
    const { client, service } = setupDetails();

    await service.getHotelDetails("hotel-123", rateCriteria());

    expect(client.get).toHaveBeenCalledWith("/data/hotel", { params: { hotelId: "hotel-123" } });
  });

  it("posts the rates request to the hotel rates endpoint", async () => {
    const { client, service } = setupDetails();

    await service.getHotelDetails("hotel-123", rateCriteria());

    expect(client.post.mock.calls[0][0]).toBe("/hotels/rates");
  });

  it("sends the hotel id as a hotelIds array", async () => {
    const { client, service } = setupDetails();

    await service.getHotelDetails("hotel-123", rateCriteria());

    expect(sentBody(client).hotelIds).toEqual(["hotel-123"]);
    expect(sentBody(client)).not.toHaveProperty("hotelId");
  });

  it("sends the rate criteria to the rates endpoint", async () => {
    const { client, service } = setupDetails();

    await service.getHotelDetails("hotel-123", rateCriteria());

    expect(sentBody(client)).toMatchObject(rateCriteria());
  });

  it("includes hotel data in the rates request", async () => {
    const { client, service } = setupDetails();

    await service.getHotelDetails("hotel-123", rateCriteria());

    expect(sentBody(client).includeHotelData).toBe(true);
  });

  it("does not cap the rates per hotel", async () => {
    const { client, service } = setupDetails();

    await service.getHotelDetails("hotel-123", rateCriteria());

    expect(sentBody(client)).not.toHaveProperty("maxRatesPerHotel");
  });

  it("rejects invalid rate criteria with an AppError before calling LiteAPI", async () => {
    const { client, service } = setupDetails();

    await expect(
      service.getHotelDetails("hotel-123", { ...rateCriteria(), checkin: "20-10-2026" })
    ).rejects.toMatchObject({ statusCode: 400, message: "Invalid hotel details request" });

    expect(client.get).not.toHaveBeenCalled();
    expect(client.post).not.toHaveBeenCalled();
  });

  it("converts a hotel details HTTP failure into an ExternalAPIError", async () => {
    const client = { get: vi.fn().mockRejectedValue(httpError(500)), post: vi.fn() };
    const service = new LiteApiService(client);

    await expect(service.getHotelDetails("hotel-123", rateCriteria())).rejects.toBeInstanceOf(
      ExternalAPIError
    );
    expect(client.post).not.toHaveBeenCalled();
  });

  it("converts a LiteAPI hotel details error into an ExternalAPIError", async () => {
    const { service } = setupDetails({
      details: { error: { code: 401, message: "Invalid API key" } },
    });

    await expect(service.getHotelDetails("hotel-123", rateCriteria())).rejects.toMatchObject({
      statusCode: 502,
      message: "Hotel details failed",
    });
  });

  it("rejects a hotel details response that does not satisfy the provider schema", async () => {
    const { client, service } = setupDetails({ details: { data: { id: "hotel-123" } } });

    await expect(service.getHotelDetails("hotel-123", rateCriteria())).rejects.toMatchObject({
      statusCode: 502,
      message: "Hotel details failed",
    });
    expect(client.post).not.toHaveBeenCalled();
  });

  it("converts a hotel rates HTTP failure into an ExternalAPIError", async () => {
    const client = {
      get: vi.fn().mockResolvedValue({ data: hotelDetails() }),
      post: vi.fn().mockRejectedValue(httpError(500)),
    };
    const service = new LiteApiService(client);

    await expect(service.getHotelDetails("hotel-123", rateCriteria())).rejects.toBeInstanceOf(
      ExternalAPIError
    );
  });

  it("converts a LiteAPI hotel rates error into an ExternalAPIError", async () => {
    const { service } = setupDetails({
      rates: { error: { code: 500, message: "Internal error" } },
    });

    await expect(service.getHotelDetails("hotel-123", rateCriteria())).rejects.toMatchObject({
      statusCode: 502,
      message: "Hotel details failed",
    });
  });

  it("rejects a hotel rates response that does not satisfy the provider schema", async () => {
    const { service } = setupDetails({ rates: { data: [], hotels: [{ id: "hotel-123" }] } });

    await expect(service.getHotelDetails("hotel-123", rateCriteria())).rejects.toMatchObject({
      statusCode: 502,
      message: "Hotel details failed",
    });
  });

  it("maps the hotel details and hotel rates responses together", async () => {
    const { service } = setupDetails({
      rates: hotelRates([
        {
          hotel: liteApiHotel({ id: "hotel-999", name: "Other Hotel" }),
          roomTypes: [roomType({ offerId: "offer-other" })],
        },
        { hotel: liteApiHotel(), roomTypes: [roomType()] },
      ]),
    });

    const result = await service.getHotelDetails("hotel-123", rateCriteria());

    expect(result).toEqual(bookLodgeHotel());
  });

  it("throws an AppError when the mapped BookLodge response is invalid", async () => {
    // The mapper only produces an invalid response for provider data that cannot occur,
    // so it is swapped for a broken one to reach the service's own guard.
    const mapper = require("../../src/services/liteapi/mappers/hotelDetailsMapper.js");
    const servicePath = require.resolve("../../src/services/liteapi/liteApiService.js");
    const original = mapper.mapHotelDetailsResponse;

    mapper.mapHotelDetailsResponse = () => ({ id: 1 });
    delete require.cache[servicePath];
    const { LiteApiService: LiteApiServiceWithBrokenMapper } = require(servicePath);

    try {
      const client = {
        get: vi.fn().mockResolvedValue({ data: hotelDetails() }),
        post: vi.fn().mockResolvedValue({ data: hotelRates() }),
      };
      const service = new LiteApiServiceWithBrokenMapper(client);

      const error = await service
        .getHotelDetails("hotel-123", rateCriteria())
        .catch((err) => err);

      expect(error).toBeInstanceOf(AppError);
      expect(error).toMatchObject({
        statusCode: 500,
        message: "Failed to build the hotel details response",
      });
    } finally {
      mapper.mapHotelDetailsResponse = original;
      delete require.cache[servicePath];
    }
  });

  it("returns the mapped BookLodge response", async () => {
    const { service } = setupDetails();

    const result = await service.getHotelDetails("hotel-123", rateCriteria());

    expect(result).toEqual(bookLodgeHotel());
  });
});

const liteApiPlace = (overrides = {}) => ({
  placeId: "ChIJdd4hrwug2EcRmSrV3Vo6llI",
  displayName: "London",
  formattedAddress: "UK",
  ...overrides,
});

const liteApiPlaces = (places = [liteApiPlace()]) => ({ data: places });

const setupLocations = (providerBody = liteApiPlaces()) => {
  const client = { get: vi.fn().mockResolvedValue({ data: providerBody }) };
  return { client, service: new LiteApiService(client) };
};

describe("LiteApiService.searchLocations", () => {
  it("calls the LiteAPI places endpoint", async () => {
    const { client, service } = setupLocations();

    await service.searchLocations("London");

    expect(client.get).toHaveBeenCalledWith("/data/places", { params: { textQuery: "London" } });
  });

  it("sends the query as the textQuery parameter", async () => {
    const { client, service } = setupLocations();

    await service.searchLocations("London");

    expect(client.get.mock.calls[0][1].params.textQuery).toBe("London");
  });

  it("rejects invalid input with an AppError before calling LiteAPI", async () => {
    const { client, service } = setupLocations();

    await expect(service.searchLocations(42)).rejects.toMatchObject({
      statusCode: 400,
      message: "Invalid location search request",
    });

    expect(client.get).not.toHaveBeenCalled();
  });

  it("converts an HTTP failure into an ExternalAPIError", async () => {
    const service = new LiteApiService({ get: vi.fn().mockRejectedValue(httpError(500)) });

    await expect(service.searchLocations("London")).rejects.toBeInstanceOf(ExternalAPIError);
  });

  it("converts a LiteAPI error response into an ExternalAPIError", async () => {
    const { service } = setupLocations({ error: { code: 429, message: "Too many requests" } });

    await expect(service.searchLocations("London")).rejects.toMatchObject({
      statusCode: 502,
      message: "Location search failed",
    });
  });

  it("rejects a response that does not satisfy the provider schema", async () => {
    const { service } = setupLocations({ data: [{ placeId: "ChIJdd4hrwug2EcRmSrV3Vo6llI" }] });

    await expect(service.searchLocations("London")).rejects.toMatchObject({
      statusCode: 502,
      message: "Location search failed",
    });
  });

  it("passes the validated provider response to the mapper", async () => {
    const providerBody = liteApiPlaces([
      liteApiPlace(),
      liteApiPlace({
        placeId: "ChIJhRwB-yFawokR5TLuyM-8LmY",
        displayName: "Paris",
        formattedAddress: "France",
      }),
    ]);
    const { service } = setupLocations(providerBody);

    const result = await service.searchLocations("London");

    expect(result).toEqual(mapLocationSearchResponse(providerBody));
  });

  it("validates the mapped BookLodge response", async () => {
    const { service } = setupLocations();

    const result = await service.searchLocations("London");

    expect(locationSearchResponseSchema.safeParse(result).success).toBe(true);
  });

  it("returns the normalized BookLodge response", async () => {
    const { service } = setupLocations();

    const result = await service.searchLocations("London");

    expect(result).toEqual({
      locations: [
        {
          placeId: "ChIJdd4hrwug2EcRmSrV3Vo6llI",
          name: "London",
          address: "UK",
        },
      ],
    });
  });
});

const prebookRequest = () => ({ offerId: "offer-abc123" });

const liteApiPrebook = () => ({
  data: {
    prebookId: "prebook-xyz789",
    offerId: "offer-abc123",
    hotelId: "hotel-123",
    price: 690.21,
    currency: "USD",
    transactionId: "tr_9f8c7b6a",
    secretKey: "sk_live_abc123",
  },
});

const bookLodgePrebook = () => ({
  prebookId: "prebook-xyz789",
  offerId: "offer-abc123",
  hotelId: "hotel-123",
  price: { amount: 690.21, currency: "USD" },
  transactionId: "tr_9f8c7b6a",
  secretKey: "sk_live_abc123",
});

const setupPrebook = (providerBody = liteApiPrebook()) => {
  const client = { post: vi.fn().mockResolvedValue({ data: providerBody }) };
  return { client, service: new LiteApiService(client) };
};

describe("LiteApiService.prebook", () => {
  it("posts the prebook request to the LiteAPI prebook endpoint", async () => {
    const { client, service } = setupPrebook();

    await service.prebook(prebookRequest());

    expect(client.post).toHaveBeenCalledTimes(1);
    expect(client.post.mock.calls[0][0]).toBe("/rates/prebook");
  });

  it("sends the exact LiteAPI prebook request body", async () => {
    const { client, service } = setupPrebook();

    await service.prebook(prebookRequest());

    expect(sentBody(client)).toEqual({ offerId: "offer-abc123", usePaymentSdk: true });
  });

  it("keeps the payment sdk flag and occupancy data out of the caller's hands", async () => {
    const { client, service } = setupPrebook();

    await service.prebook({ ...prebookRequest(), usePaymentSdk: false, occupancies: [] });

    expect(sentBody(client)).toEqual({ offerId: "offer-abc123", usePaymentSdk: true });
  });

  it("rejects a request without an offer id with an AppError", async () => {
    const { service } = setupPrebook();

    await expect(service.prebook({})).rejects.toMatchObject({
      statusCode: 400,
      message: "Invalid prebook request",
    });
  });

  it("rejects an offer id that is not a string with an AppError", async () => {
    const { service } = setupPrebook();

    await expect(service.prebook({ offerId: 42 })).rejects.toMatchObject({
      statusCode: 400,
      message: "Invalid prebook request",
    });
  });

  it("does not call LiteAPI for an invalid request", async () => {
    const { client, service } = setupPrebook();

    await service.prebook({ offerId: 42 }).catch(() => {});

    expect(client.post).not.toHaveBeenCalled();
  });

  it("converts an HTTP failure into an ExternalAPIError", async () => {
    const service = new LiteApiService({ post: vi.fn().mockRejectedValue(httpError(500)) });

    await expect(service.prebook(prebookRequest())).rejects.toMatchObject({
      statusCode: 502,
      message: "Prebooking failed",
    });
  });

  it("keeps the provider status when LiteAPI answers 404", async () => {
    const service = new LiteApiService({ post: vi.fn().mockRejectedValue(httpError(404)) });

    await expect(service.prebook(prebookRequest())).rejects.toMatchObject({
      statusCode: 404,
      message: "Prebooking failed",
    });
  });

  it("converts a LiteAPI error response into an ExternalAPIError", async () => {
    const { service } = setupPrebook({ error: { code: 429, message: "Too many requests" } });

    await expect(service.prebook(prebookRequest())).rejects.toMatchObject({
      statusCode: 502,
      message: "Prebooking failed",
    });
  });

  it("rejects an invalid LiteAPI response before mapping it", async () => {
    // An incomplete provider response would map into a BookLodge response that fails
    // validation with its own 500, so the 502 here proves the mapper never ran.
    const { service } = setupPrebook({ data: { prebookId: "prebook-xyz789" } });

    await expect(service.prebook(prebookRequest())).rejects.toMatchObject({
      statusCode: 502,
      message: "Prebooking failed",
    });
  });

  it("throws an AppError when the mapped BookLodge response is invalid", async () => {
    // The mapper only produces an invalid response for provider data that cannot occur,
    // so it is swapped for a broken one to reach the service's own guard.
    const mapper = require("../../src/services/liteapi/mappers/prebookMapper.js");
    const servicePath = require.resolve("../../src/services/liteapi/liteApiService.js");
    const original = mapper.mapPrebookResponse;

    mapper.mapPrebookResponse = () => ({ prebookId: 1 });
    delete require.cache[servicePath];
    const { LiteApiService: LiteApiServiceWithBrokenMapper } = require(servicePath);

    try {
      const client = { post: vi.fn().mockResolvedValue({ data: liteApiPrebook() }) };
      const service = new LiteApiServiceWithBrokenMapper(client);

      const error = await service.prebook(prebookRequest()).catch((err) => err);

      expect(error).toBeInstanceOf(AppError);
      expect(error).toMatchObject({
        statusCode: 500,
        message: "Failed to build the prebook response",
      });
    } finally {
      mapper.mapPrebookResponse = original;
      delete require.cache[servicePath];
    }
  });

  it("rejects a provider response whose price is nested", async () => {
    const body = {
      data: {
        ...liteApiPrebook().data,
        price: { amount: 690.21, currency: "USD" },
      },
    };
    const { service } = setupPrebook(body);

    await expect(service.prebook(prebookRequest())).rejects.toMatchObject({
      statusCode: 502,
      message: "Prebooking failed",
    });
  });

  it("returns the validated BookLodge prebook response", async () => {
    const { service } = setupPrebook();

    const result = await service.prebook(prebookRequest());

    expect(result).toEqual(bookLodgePrebook());
    expect(result).not.toHaveProperty("data");
  });
});

const bookRateRequest = () => ({
  prebookId: "prebook-xyz789",
  clientReference: "BL-2f1c9a4e-7d3b-4f8a-9c1e-5a6b7c8d9e0f",
  holder: { firstName: "Ada", lastName: "Lovelace", email: "ada@example.com" },
  guests: [
    { occupancyNumber: 1, firstName: "Ada", lastName: "Lovelace", email: "ada@example.com" },
    { occupancyNumber: 2, firstName: "Grace", lastName: "Hopper", email: "grace@example.com" },
  ],
  transactionId: "tr_9f8c7b6a",
});

const liteApiBookRateRequest = () => ({
  prebookId: "prebook-xyz789",
  clientReference: "BL-2f1c9a4e-7d3b-4f8a-9c1e-5a6b7c8d9e0f",
  holder: { firstName: "Ada", lastName: "Lovelace", email: "ada@example.com" },
  guests: [
    { occupancyNumber: 1, firstName: "Ada", lastName: "Lovelace", email: "ada@example.com" },
    { occupancyNumber: 2, firstName: "Grace", lastName: "Hopper", email: "grace@example.com" },
  ],
  payment: { method: "TRANSACTION_ID", transactionId: "tr_9f8c7b6a" },
});

const liteApiBookRateResponse = () => ({
  data: {
    bookingId: "b_7f3d9c2a",
    clientReference: "BL-2f1c9a4e-7d3b-4f8a-9c1e-5a6b7c8d9e0f",
    status: "CONFIRMED",
    hotelConfirmationCode: "HC-1234",
  },
});

const bookLodgeBookRate = () => ({ bookingId: "b_7f3d9c2a" });

const setupBookRate = (providerBody = liteApiBookRateResponse()) => {
  const client = { post: vi.fn().mockResolvedValue({ data: providerBody }) };
  return { client, service: new LiteApiService(client) };
};

describe("LiteApiService.bookRate", () => {
  it("posts the booking request to the LiteAPI book endpoint", async () => {
    const { client, service } = setupBookRate();

    await service.bookRate(bookRateRequest());

    expect(client.post).toHaveBeenCalledTimes(1);
    expect(client.post.mock.calls[0][0]).toBe("/rates/book");
  });

  it("sends the exact mapped LiteAPI request", async () => {
    const { client, service } = setupBookRate();

    await service.bookRate(bookRateRequest());

    expect(sentBody(client)).toEqual(liteApiBookRateRequest());
  });

  it("pays with the prebook transaction id", async () => {
    const { client, service } = setupBookRate();

    await service.bookRate(bookRateRequest());

    expect(sentBody(client).payment).toEqual({
      method: "TRANSACTION_ID",
      transactionId: "tr_9f8c7b6a",
    });
  });

  it("passes the caller's client reference through untouched", async () => {
    const { client, service } = setupBookRate();

    await service.bookRate(bookRateRequest());

    expect(sentBody(client).clientReference).toBe(bookRateRequest().clientReference);
  });

  it("drops fields the BookLodge contract does not define", async () => {
    const { client, service } = setupBookRate();

    await service.bookRate({
      ...bookRateRequest(),
      secretKey: "sk_live_abc123",
      payment: { method: "CASH", transactionId: "tr_other" },
      hotelConfirmationCode: "HC-1",
    });

    expect(sentBody(client)).toEqual(liteApiBookRateRequest());
    expect(sentBody(client)).not.toHaveProperty("secretKey");
  });

  it.each([
    ["a missing prebook id", ({ prebookId, ...rest }) => rest],
    ["a missing client reference", ({ clientReference, ...rest }) => rest],
    ["a missing transaction id", ({ transactionId, ...rest }) => rest],
    [
      "an invalid holder email",
      () => ({
        ...bookRateRequest(),
        holder: { ...bookRateRequest().holder, email: "not-an-email" },
      }),
    ],
    [
      "guest data that is not valid",
      () => ({
        ...bookRateRequest(),
        guests: [{ ...bookRateRequest().guests[0], occupancyNumber: "1" }],
      }),
    ],
  ])("rejects %s with an AppError before calling LiteAPI", async (label, broken) => {
    const { client, service } = setupBookRate();

    await expect(service.bookRate(broken(bookRateRequest()))).rejects.toMatchObject({
      statusCode: 400,
      message: "Invalid book rate request",
    });

    expect(client.post).not.toHaveBeenCalled();
  });

  it("throws an AppError when the mapped provider request is invalid", async () => {
    // The mapper only produces an invalid provider request if it is broken, so it is
    // swapped for one to reach the service's own guard.
    const mapper = require("../../src/services/liteapi/mappers/bookRateMapper.js");
    const servicePath = require.resolve("../../src/services/liteapi/liteApiService.js");
    const original = mapper.mapBookRateRequest;

    mapper.mapBookRateRequest = () => ({ prebookId: "prebook-xyz789" });
    delete require.cache[servicePath];
    const { LiteApiService: LiteApiServiceWithBrokenMapper } = require(servicePath);

    try {
      const client = { post: vi.fn().mockResolvedValue({ data: liteApiBookRateResponse() }) };
      const service = new LiteApiServiceWithBrokenMapper(client);

      const error = await service.bookRate(bookRateRequest()).catch((err) => err);

      expect(error).toBeInstanceOf(AppError);
      expect(error).toMatchObject({ statusCode: 400, message: "Invalid book rate request" });
      expect(client.post).not.toHaveBeenCalled();
    } finally {
      mapper.mapBookRateRequest = original;
      delete require.cache[servicePath];
    }
  });

  it("converts an HTTP failure into an ExternalAPIError", async () => {
    const service = new LiteApiService({ post: vi.fn().mockRejectedValue(httpError(500)) });

    await expect(service.bookRate(bookRateRequest())).rejects.toMatchObject({
      statusCode: 502,
      message: "Booking failed",
    });
  });

  it("keeps the provider status when LiteAPI answers 404", async () => {
    const service = new LiteApiService({ post: vi.fn().mockRejectedValue(httpError(404)) });

    await expect(service.bookRate(bookRateRequest())).rejects.toMatchObject({
      statusCode: 404,
      message: "Booking failed",
    });
  });

  it("keeps credentials and provider detail out of the client error", async () => {
    const axiosError = Object.assign(new Error("Request failed with status code 500"), {
      isAxiosError: true,
      config: { headers: { "X-API-Key": "test-api-key" } },
      response: { status: 500, data: { error: "internal provider detail" } },
    });
    const service = new LiteApiService({ post: vi.fn().mockRejectedValue(axiosError) });

    const error = await service.bookRate(bookRateRequest()).catch((err) => err);

    expect(error).toBeInstanceOf(ExternalAPIError);
    expect(error.message).toBe("Booking failed");
    expect(error.message).not.toMatch(/test-api-key|internal provider detail/);
  });

  it("converts a LiteAPI error response into an ExternalAPIError", async () => {
    const { service } = setupBookRate({
      error: { code: 409, message: "Offer is no longer available" },
    });

    await expect(service.bookRate(bookRateRequest())).rejects.toMatchObject({
      statusCode: 502,
      message: "Booking failed",
    });
  });

  it("rejects a provider response that does not satisfy the schema", async () => {
    const { service } = setupBookRate({ data: { status: "CONFIRMED" } });

    await expect(service.bookRate(bookRateRequest())).rejects.toMatchObject({
      statusCode: 502,
      message: "Booking failed",
    });
  });

  it("throws an AppError when the mapped BookLodge response is invalid", async () => {
    const mapper = require("../../src/services/liteapi/mappers/bookRateMapper.js");
    const servicePath = require.resolve("../../src/services/liteapi/liteApiService.js");
    const original = mapper.mapBookRateResponse;

    mapper.mapBookRateResponse = () => ({ bookingId: 1 });
    delete require.cache[servicePath];
    const { LiteApiService: LiteApiServiceWithBrokenMapper } = require(servicePath);

    try {
      const client = { post: vi.fn().mockResolvedValue({ data: liteApiBookRateResponse() }) };
      const service = new LiteApiServiceWithBrokenMapper(client);

      const error = await service.bookRate(bookRateRequest()).catch((err) => err);

      expect(error).toBeInstanceOf(AppError);
      expect(error).toMatchObject({
        statusCode: 500,
        message: "Failed to build the booking response",
      });
    } finally {
      mapper.mapBookRateResponse = original;
      delete require.cache[servicePath];
    }
  });

  it("returns the validated BookLodge booking response", async () => {
    const { service } = setupBookRate();

    const result = await service.bookRate(bookRateRequest());

    expect(result).toEqual(bookLodgeBookRate());
    expect(result).not.toHaveProperty("hotelConfirmationCode");
    expect(result).not.toHaveProperty("data");
  });
});

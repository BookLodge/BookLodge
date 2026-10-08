import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from "vitest";
import { createRequire } from "node:module";

// Source modules are CommonJS; loading them through Node keeps one instance of each module.
const require = createRequire(import.meta.url);
const app = require("../../src/app.js");
const { liteApiService } = require("../../src/services/liteapi/liteApiService.js");
const { ExternalAPIError } = require("../../src/errors.js");

const rateCriteria = {
  checkin: "2026-11-01",
  checkout: "2026-11-05",
  occupancies: [{ adults: 2, children: [] }],
  currency: "EUR",
  guestNationality: "FR",
};

const hotelDetails = {
  id: "lp1899",
  name: "Hôtel Le Meurice",
  description: "A palace hotel on the Rue de Rivoli.",
  photo: "https://images.liteapi.travel/lp1899.jpg",
  address: "228 Rue de Rivoli, 75001 Paris",
  city: "Paris",
  country: "fr",
  rating: 5,
  location: { latitude: 48.8651, longitude: 2.3287 },
  facilities: ["wifi", "spa"],
  checkin: "15:00",
  checkout: "12:00",
  rates: [
    {
      offerId: "offer-1",
      occupancyNumber: 1,
      roomName: "Classic Room",
      boardName: "Room Only",
      amount: 402.29,
      currency: "EUR",
      refundable: true,
    },
  ],
};

let server;
let base;

beforeAll(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

afterAll(() => new Promise((resolve) => server.close(resolve)));

afterEach(() => vi.restoreAllMocks());

const details = (hotelId, body) =>
  fetch(`${base}/api/hotels/${hotelId}/details`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

describe("POST /api/hotels/:hotelId/details", () => {
  it("returns the hotel details with the rates attached", async () => {
    const spy = vi.spyOn(liteApiService, "getHotelDetails").mockResolvedValue(hotelDetails);

    const response = await details("lp1899", rateCriteria);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      success: true,
      message: "Hotel details retrieved successfully",
      data: hotelDetails,
    });
    expect(spy).toHaveBeenCalledWith("lp1899", rateCriteria);
  });

  it("hands the service the rate criteria flat rather than nested under a wrapper", async () => {
    const spy = vi.spyOn(liteApiService, "getHotelDetails").mockResolvedValue(hotelDetails);

    await details("lp1899", { ...rateCriteria, rateCriteria });

    expect(spy).toHaveBeenCalledWith("lp1899", rateCriteria);
  });

  it("takes the hotel id from the path", async () => {
    const spy = vi.spyOn(liteApiService, "getHotelDetails").mockResolvedValue(hotelDetails);

    await details("lp1899", rateCriteria);

    expect(spy).toHaveBeenCalledWith("lp1899", expect.anything());
  });

  it("rejects malformed rate criteria without reaching the provider", async () => {
    const spy = vi.spyOn(liteApiService, "getHotelDetails");

    const response = await details("lp1899", { ...rateCriteria, checkin: "01/11/2026" });

    expect(response.status).toBe(400);
    expect(spy).not.toHaveBeenCalled();
  });

  it("rejects a request with no body without reaching the provider", async () => {
    const spy = vi.spyOn(liteApiService, "getHotelDetails");

    const response = await fetch(`${base}/api/hotels/lp1899/details`, { method: "POST" });

    expect(response.status).toBe(400);
    expect(spy).not.toHaveBeenCalled();
  });

  it("reports an unknown hotel as not found", async () => {
    vi.spyOn(liteApiService, "getHotelDetails").mockRejectedValue(
      new ExternalAPIError("Hotel details failed", 404)
    );

    const response = await details("nope", rateCriteria);

    expect(response.status).toBe(404);
    expect(await response.json()).toMatchObject({
      success: false,
      message: "Hotel details failed",
    });
  });

  it("reports a provider failure with the provider's status", async () => {
    vi.spyOn(liteApiService, "getHotelDetails").mockRejectedValue(
      new ExternalAPIError("Hotel details failed", 502)
    );

    const response = await details("lp1899", rateCriteria);

    expect(response.status).toBe(502);
    expect(await response.json()).toMatchObject({
      success: false,
      message: "Hotel details failed",
    });
  });
});

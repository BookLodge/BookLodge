import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from "vitest";
import { createRequire } from "node:module";

// Source modules are CommonJS; loading them through Node keeps one instance of each module.
const require = createRequire(import.meta.url);
const app = require("../../src/app.js");
const { liteApiService } = require("../../src/services/liteapi/liteApiService.js");
const { ExternalAPIError } = require("../../src/errors.js");

const searchBody = {
  placeId: "ChIJD7fiBh9u5kcRYJSMaMOCCwQ",
  checkin: "2026-11-01",
  checkout: "2026-11-05",
  occupancies: [{ adults: 2, children: [] }],
  currency: "EUR",
  guestNationality: "FR",
};

const hotels = {
  hotels: [
    {
      id: "lp1899",
      name: "Hôtel Le Meurice",
      photo: "https://images.liteapi.travel/lp1899.jpg",
      address: "228 Rue de Rivoli, 75001 Paris",
      rating: 5,
      startingRate: {
        offerId: "offer-1",
        roomName: "Classic Room",
        boardName: "Room Only",
        amount: 402.29,
        currency: "EUR",
        refundable: true,
      },
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

const search = (body) =>
  fetch(`${base}/api/hotels/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

describe("POST /api/hotels/search", () => {
  it("returns the mapped hotels for a valid body", async () => {
    const spy = vi.spyOn(liteApiService, "searchHotels").mockResolvedValue(hotels);

    const response = await search(searchBody);

    expect(response.status).toBe(200);
    expect(spy).toHaveBeenCalledWith(searchBody);
    expect(await response.json()).toEqual({
      success: true,
      message: "Hotels retrieved successfully",
      data: hotels,
    });
  });

  it("hands the service the validated body rather than the raw one", async () => {
    const spy = vi.spyOn(liteApiService, "searchHotels").mockResolvedValue(hotels);

    await search({ ...searchBody, unexpected: "ignored" });

    expect(spy).toHaveBeenCalledWith(searchBody);
  });

  it("rejects a body missing a required field and never reaches the provider", async () => {
    const spy = vi.spyOn(liteApiService, "searchHotels");

    const { placeId, ...withoutPlaceId } = searchBody;
    const response = await search(withoutPlaceId);

    expect(response.status).toBe(400);
    expect((await response.json()).success).toBe(false);
    expect(spy).not.toHaveBeenCalled();
  });

  it("rejects a malformed date without reaching the provider", async () => {
    const spy = vi.spyOn(liteApiService, "searchHotels");

    const response = await search({ ...searchBody, checkin: "01/11/2026" });

    expect(response.status).toBe(400);
    expect(spy).not.toHaveBeenCalled();
  });

  it("rejects a request with no body without reaching the provider", async () => {
    const spy = vi.spyOn(liteApiService, "searchHotels");

    const response = await fetch(`${base}/api/hotels/search`, { method: "POST" });

    expect(response.status).toBe(400);
    expect(spy).not.toHaveBeenCalled();
  });

  it("reports a provider failure with the provider's status", async () => {
    vi.spyOn(liteApiService, "searchHotels").mockRejectedValue(
      new ExternalAPIError("Hotel search failed", 502)
    );

    const response = await search(searchBody);

    expect(response.status).toBe(502);
    expect(await response.json()).toMatchObject({
      success: false,
      message: "Hotel search failed",
    });
  });
});

import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from "vitest";
import { createRequire } from "node:module";

// Source modules are CommonJS; loading them through Node keeps one instance of each module.
const require = createRequire(import.meta.url);
const app = require("../../src/app.js");
const { liteApiService } = require("../../src/services/liteapi/liteApiService.js");
const { ExternalAPIError } = require("../../src/errors.js");

const locations = {
  locations: [{ placeId: "ChIJD7fiBh9u5kcRYJSMaMOCCwQ", name: "Paris", address: "Paris, France" }],
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

const search = (path) => fetch(`${base}${path}`);

describe("GET /api/hotels/location-search", () => {
  it("returns the mapped locations for a query", async () => {
    const spy = vi.spyOn(liteApiService, "searchLocations").mockResolvedValue(locations);

    const response = await search("/api/hotels/location-search?query=Paris");

    expect(response.status).toBe(200);
    expect(spy).toHaveBeenCalledWith("Paris");
    expect(await response.json()).toEqual({
      success: true,
      message: "Locations retrieved successfully",
      data: locations,
    });
  });

  it("hands the service the query string rather than the query object", async () => {
    const spy = vi.spyOn(liteApiService, "searchLocations").mockResolvedValue(locations);

    await search("/api/hotels/location-search?query=Paris&unexpected=1");

    expect(spy).toHaveBeenCalledWith("Paris");
  });

  it("rejects a request with no query and never reaches the provider", async () => {
    const spy = vi.spyOn(liteApiService, "searchLocations");

    const response = await search("/api/hotels/location-search");

    expect(response.status).toBe(400);
    expect((await response.json()).success).toBe(false);
    expect(spy).not.toHaveBeenCalled();
  });

  it("rejects an empty query without reaching the provider", async () => {
    const spy = vi.spyOn(liteApiService, "searchLocations");

    const response = await search("/api/hotels/location-search?query=");

    expect(response.status).toBe(400);
    expect((await response.json()).message).toBe("Query is required");
    expect(spy).not.toHaveBeenCalled();
  });

  it("reports a provider failure with the provider's status", async () => {
    vi.spyOn(liteApiService, "searchLocations").mockRejectedValue(
      new ExternalAPIError("Location search failed", 502)
    );

    const response = await search("/api/hotels/location-search?query=Paris");

    expect(response.status).toBe(502);
    expect(await response.json()).toMatchObject({
      success: false,
      message: "Location search failed",
    });
  });
});

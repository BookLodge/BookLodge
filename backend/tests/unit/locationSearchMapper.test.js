import { describe, it, expect } from "vitest";
import { createRequire } from "node:module";

// Source modules are CommonJS; loading them through Node keeps one instance of each module.
const require = createRequire(import.meta.url);
const { mapLocationSearchResponse } = require("../../src/services/liteapi/mappers/locationSearchMapper.js");

const place = (overrides = {}) => ({
  placeId: "ChIJdd4hrwug2EcRmSrV3Vo6llI",
  displayName: "London",
  formattedAddress: "UK",
  ...overrides,
});

const liteApiPlaces = (places) => ({ data: places });

describe("mapLocationSearchResponse", () => {
  it("maps a LiteAPI place into a BookLodge location", () => {
    expect(mapLocationSearchResponse(liteApiPlaces([place()]))).toEqual({
      locations: [
        {
          placeId: "ChIJdd4hrwug2EcRmSrV3Vo6llI",
          name: "London",
          address: "UK",
        },
      ],
    });
  });

  it("maps every place returned by LiteAPI", () => {
    const response = liteApiPlaces([
      place(),
      place({
        placeId: "ChIJhRwB-yFawokR5TLuyM-8LmY",
        displayName: "Paris",
        formattedAddress: "France",
      }),
    ]);

    const { locations } = mapLocationSearchResponse(response);

    expect(locations).toHaveLength(2);
    expect(locations[1]).toEqual({
      placeId: "ChIJhRwB-yFawokR5TLuyM-8LmY",
      name: "Paris",
      address: "France",
    });
  });

  it("preserves the order returned by LiteAPI", () => {
    const response = liteApiPlaces([
      place({ displayName: "Zaria" }),
      place({ displayName: "Abuja" }),
      place({ displayName: "Lagos" }),
    ]);

    expect(mapLocationSearchResponse(response).locations.map((item) => item.name)).toEqual([
      "Zaria",
      "Abuja",
      "Lagos",
    ]);
  });

  it("returns no locations when LiteAPI returns none", () => {
    expect(mapLocationSearchResponse(liteApiPlaces([]))).toEqual({ locations: [] });
  });
});

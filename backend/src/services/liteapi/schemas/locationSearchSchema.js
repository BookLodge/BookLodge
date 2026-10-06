const { z } = require("zod");

const liteApiPlacesResponseSchema = z.object({
  data: z.array(
    z.object({
      placeId: z.string(),
      displayName: z.string(),
      formattedAddress: z.string(),
    })
  ),
});

const locationSearchResponseSchema = z.object({
  locations: z.array(
    z.object({
      placeId: z.string(),
      name: z.string(),
      address: z.string(),
    })
  ),
});

module.exports = {
  liteApiPlacesResponseSchema,
  locationSearchResponseSchema,
};

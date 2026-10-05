const { z } = require("zod");
const { hotelSearchSchema, ratePriceSchema } = require("./hotelSearchSchema");

const hotelDetailsRequestSchema = hotelSearchSchema.omit({ placeId: true });

const hotelDetailsRateSchema = ratePriceSchema.extend({
  offerId: z.string(),
  roomName: z.string(),
  boardName: z.string(),
  refundable: z.boolean(),
});

const liteApiHotelDetailsResponseSchema = z.object({
  data: z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    main_photo: z.string(),
    address: z.string(),
    city: z.string(),
    country: z.string(),
    starRating: z.number(),
    location: z.object({
      latitude: z.number(),
      longitude: z.number(),
    }),
    facilities: z.array(z.string()),
    checkin: z.string(),
    checkout: z.string(),
  }),
});

const hotelDetailsResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  photo: z.string(),
  address: z.string(),
  city: z.string(),
  country: z.string(),
  rating: z.number(),
  location: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }),
  facilities: z.array(z.string()),
  checkin: z.string(),
  checkout: z.string(),
  rates: z.array(hotelDetailsRateSchema),
});

module.exports = {
  hotelDetailsRequestSchema,
  liteApiHotelDetailsResponseSchema,
  hotelDetailsResponseSchema,
};

const { z } = require("zod");
const { ratePriceSchema } = require("./hotelSearchSchema");

const hotelDetailsRateSchema = ratePriceSchema.extend({
  offerId: z.string(),
  occupancyNumber: z.number().int(),
  roomName: z.string(),
  boardName: z.string(),
  refundable: z.boolean(),
});

const liteApiHotelDetailsResponseSchema = z.object({
  data: z.object({
    id: z.string(),
    name: z.string(),
    hotelDescription: z.string(),
    main_photo: z.string(),
    address: z.string(),
    city: z.string(),
    country: z.string(),
    starRating: z.number(),
    location: z.object({
      latitude: z.number(),
      longitude: z.number(),
    }),
    hotelFacilities: z.array(z.string()),
    checkinCheckoutTimes: z.object({
      checkin_start: z.string(),
      checkout: z.string(),
    }),
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
  liteApiHotelDetailsResponseSchema,
  hotelDetailsResponseSchema,
};

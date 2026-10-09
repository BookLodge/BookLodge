const { z } = require("zod");
const { ratePriceSchema } = require("./hotelSearchSchema");

const photoSchema = z.object({
  url: z.string(),
  caption: z.string().optional(),
  imageDescription: z.string().optional(),
  mainPhoto: z.boolean().optional(),
  hd_url: z.string().optional(),
  urlHd: z.string().optional(),
  defaultImage: z.boolean().optional(),
}).passthrough();

const hotelRoomSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  roomName: z.string().optional(),
  name: z.string().optional(),
  description: z.string().optional(),
  photos: z.array(photoSchema).optional().default([]),
}).passthrough();

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
    hotelImages: z.array(photoSchema).optional().default([]),
    rooms: z.array(hotelRoomSchema).optional().default([]),
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
  }).passthrough(),
});

const bookLodgePhotoSchema = z.object({
  url: z.string(),
  caption: z.string().optional(),
  imageDescription: z.string().optional(),
  mainPhoto: z.boolean().optional(),
  hd_url: z.string().optional(),
});

const bookLodgeRoomSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  name: z.string(),
  description: z.string().optional(),
  photos: z.array(bookLodgePhotoSchema),
});

const hotelDetailsResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  photo: z.string(),
  photos: z.array(bookLodgePhotoSchema),
  rooms: z.array(bookLodgeRoomSchema),
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

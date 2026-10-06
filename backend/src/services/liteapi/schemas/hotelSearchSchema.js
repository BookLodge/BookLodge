const { z } = require("zod");

const occupancySchema = z.object({
  adults: z.number().int(),
  children: z.array(z.number().int()),
});

const hotelSearchSchema = z.object({
  placeId: z.string(),
  checkin: z.iso.date(),
  checkout: z.iso.date(),
  occupancies: z.array(occupancySchema),
  currency: z.string(),
  guestNationality: z.string(),
});

const liteApiHotelSearchRequestSchema = hotelSearchSchema.extend({
  maxRatesPerHotel: z.number().int(),
  includeHotelData: z.boolean(),
});

const liteApiHotelSearchResponseSchema = z.object({
  data: z.array(
    z.object({
      hotelId: z.string(),
      roomTypes: z.array(
        z.object({
          offerId: z.string(),
          rates: z.array(
            z.object({
              name: z.string(),
              boardName: z.string(),
              retailRate: z.object({
                total: z.array(
                  z.object({
                    amount: z.number(),
                    currency: z.string(),
                  })
                ),
              }),
              cancellationPolicies: z.object({
                refundableTag: z.string(),
              }),
            })
          ),
        })
      ),
    })
  ),
  hotels: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      main_photo: z.string(),
      address: z.string(),
      rating: z.number(),
    })
  ),
});

const ratePriceSchema = z.object({
  amount: z.number(),
  currency: z.string(),
});

const hotelStartingRateSchema = ratePriceSchema.extend({
  offerId: z.string(),
  roomName: z.string(),
  boardName: z.string(),
  refundable: z.boolean(),
});

const hotelSearchResponseSchema = z.object({
  hotels: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      photo: z.string(),
      address: z.string(),
      rating: z.number(),
      startingRate: hotelStartingRateSchema,
    })
  ),
});

module.exports = {
  hotelSearchSchema,
  ratePriceSchema,
  liteApiHotelSearchRequestSchema,
  liteApiHotelSearchResponseSchema,
  hotelSearchResponseSchema,
};

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

module.exports = { hotelSearchSchema };

const { z } = require("zod");

const hotelSearchSchema = z.object({
  checkin: z.string().min(1, "Check-in date is required"),
  checkout: z.string().min(1, "Check-out date is required"),
  currency: z.string().optional(),
  guestNationality: z.string().optional(),
  occupancies: z
    .array(
      z.object({
        adults: z.number().int().min(1),
        children: z.number().int().min(0).optional(),
      })
    )
    .min(1, "At least one occupancy is required"),
  cityId: z.string().optional(),
  countryCode: z.string().optional(),
  hotelIds: z.array(z.string()).optional(),
});

module.exports = {
  hotelSearchSchema,
};
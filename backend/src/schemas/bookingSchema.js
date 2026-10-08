const { z } = require("zod");

const bookingIdParamsSchema = z.object({
  bookingId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Booking ID must be a valid id"),
});

module.exports = {
  bookingIdParamsSchema,
};

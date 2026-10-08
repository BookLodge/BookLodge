const { z } = require("zod");

const bookingIdParamsSchema = z.object({
  bookingId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Booking ID must be a valid id"),
});

const bookingListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

module.exports = {
  bookingIdParamsSchema,
  bookingListQuerySchema,
};

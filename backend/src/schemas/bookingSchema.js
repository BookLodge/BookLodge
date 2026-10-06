const { z } = require("zod");

const bookingIdParamsSchema = z.object({
  bookingId: z
    .string()
    .regex(/^[a-fA-F0-9]{24}$/, "Invalid booking ID")
});

 module.exports = {
   bookingIdParamsSchema
 };

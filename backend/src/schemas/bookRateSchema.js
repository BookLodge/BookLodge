const { z } = require("zod");

const bookRateGuestSchema = z.object({
  occupancyNumber: z.number().int(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email(),
});

const bookRateRequestSchema = z.object({
  prebookId: z.string(),
  clientReference: z.string(),
  holder: z.object({
    firstName: z.string(),
    lastName: z.string(),
    email: z.string().email(),
  }),
  guests: z.array(bookRateGuestSchema),
  transactionId: z.string(),
});

// clientReference is minted server-side, so the client-facing schema omits it
const bookHotelRequestSchema = bookRateRequestSchema.omit({ clientReference: true });

module.exports = { bookHotelRequestSchema, bookRateRequestSchema };

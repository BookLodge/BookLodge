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

// clientReference and transactionId are minted server-side and held in the booking attempt, so the
// client-facing schema omits both: payment details never travel from the client to /rates/book.
const bookHotelRequestSchema = bookRateRequestSchema.omit({
  clientReference: true,
  transactionId: true,
});

module.exports = { bookHotelRequestSchema, bookRateRequestSchema };

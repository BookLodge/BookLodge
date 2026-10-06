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

module.exports = { bookRateRequestSchema };

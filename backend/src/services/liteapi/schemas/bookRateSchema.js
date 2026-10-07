const { z } = require("zod");

const liteApiBookRateRequestSchema = z.object({
  prebookId: z.string(),
  clientReference: z.string(),
  holder: z.object({
    firstName: z.string(),
    lastName: z.string(),
    email: z.string().email(),
  }),
  guests: z.array(
    z.object({
      occupancyNumber: z.number().int(),
      firstName: z.string(),
      lastName: z.string(),
      email: z.string().email(),
    })
  ),
  payment: z.object({
    method: z.literal("TRANSACTION_ID"),
    transactionId: z.string(),
  }),
});

const liteApiBookRateResponseSchema = z.object({
  data: z.object({
    bookingId: z.string(),
  }),
});

const bookRateResponseSchema = z.object({
  bookingId: z.string(),
});

module.exports = {
  liteApiBookRateRequestSchema,
  liteApiBookRateResponseSchema,
  bookRateResponseSchema,
};

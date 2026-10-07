const { z } = require("zod");
const { ratePriceSchema } = require("./hotelSearchSchema");

const liteApiPrebookResponseSchema = z.object({
  data: z.object({
    prebookId: z.string(),
    offerId: z.string(),
    hotelId: z.string(),
    price: z.number(),
    currency: z.string(),
    transactionId: z.string(),
    secretKey: z.string(),
  }),
});

const prebookResponseSchema = z.object({
  prebookId: z.string(),
  offerId: z.string(),
  hotelId: z.string(),
  price: ratePriceSchema,
  transactionId: z.string(),
  secretKey: z.string(),
});

module.exports = {
  liteApiPrebookResponseSchema,
  prebookResponseSchema,
};

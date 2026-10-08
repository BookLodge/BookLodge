const { z } = require("zod");

const liteApiCancelBookingResponseSchema = z.object({
  data: z.object({
    bookingId: z.string(),
    status: z.string(),
    cancellation_fee: z.number().nullish(),
    refund_amount: z.number().nullish(),
    currency: z.string().nullish(),
  }),
});

const cancelBookingResponseSchema = z.object({
  bookingId: z.string(),
  status: z.enum(["CANCELLED"]),
  cancellationFee: z.number().nullable(),
  refundAmount: z.number().nullable(),
  currency: z.string().nullable(),
});

module.exports = {
  liteApiCancelBookingResponseSchema,
  cancelBookingResponseSchema,
};

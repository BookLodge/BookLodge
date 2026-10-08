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
    clientReference: z.string(),
    status: z.string(),
    checkin: z.string(),
    checkout: z.string(),
    hotel: z.object({
      hotelId: z.string(),
      name: z.string(),
    }),
    bookedRooms: z.array(
      z.object({
        occupancy_number: z.number().int(),
        roomType: z.object({ name: z.string() }).nullish(),
        boardName: z.string().nullish(),
      })
    ),
    holder: z.object({
      firstName: z.string(),
      lastName: z.string(),
      email: z.string().email(),
    }),
    price: z.number(),
    currency: z.string(),
  }),
});

const bookRateResponseSchema = z.object({
  clientReference: z.string(),
  status: z.enum(["CONFIRMED", "CANCELLED"]),
  hotel: z.object({
    hotelId: z.string(),
    name: z.string(),
  }),
  stay: z.object({
    checkin: z.string(),
    checkout: z.string(),
  }),
  rooms: z.array(
    z.object({
      occupancyNumber: z.number().int(),
      roomName: z.string().nullable(),
      boardName: z.string().nullable(),
    })
  ),
  holder: z.object({
    firstName: z.string(),
    lastName: z.string(),
    email: z.string().email(),
  }),
  price: z.object({
    amount: z.number(),
    currency: z.string(),
  }),
  liteApi: z.object({
    bookingId: z.string(),
  }),
});

module.exports = {
  liteApiBookRateRequestSchema,
  liteApiBookRateResponseSchema,
  bookRateResponseSchema,
};

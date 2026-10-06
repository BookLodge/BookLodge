const { z } = require("zod");

const hotelDetailsParamsSchema = z.object({
  hotelId: z.string().min(1, "Hotel ID is required"),
});

const hotelDetailsRequestSchema = z.object({}).passthrough();

module.exports = {
  hotelDetailsParamsSchema,
  hotelDetailsRequestSchema,
};
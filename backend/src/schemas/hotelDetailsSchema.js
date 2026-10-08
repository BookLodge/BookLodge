const { z } = require("zod");
const { hotelSearchSchema } = require("./hotelSearchSchema");

const hotelDetailsParamsSchema = z.object({
  hotelId: z.string().min(1, "Hotel ID is required"),
});

const hotelDetailsRequestSchema = hotelSearchSchema.omit({ placeId: true });

module.exports = {
  hotelDetailsParamsSchema,
  hotelDetailsRequestSchema,
};

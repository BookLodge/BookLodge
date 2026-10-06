const { hotelSearchSchema } = require("./hotelSearchSchema");

const hotelDetailsRequestSchema = hotelSearchSchema.omit({ placeId: true });

module.exports = { hotelDetailsRequestSchema };

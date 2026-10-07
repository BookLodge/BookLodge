const { z } = require("zod");

const prebookSchema = z.object({
  offerId: z.string(),
});

module.exports = { prebookSchema };

const { z } = require("zod");

const locationSearchRequestSchema = z.object({
  query: z.string(),
});

module.exports = { locationSearchRequestSchema };

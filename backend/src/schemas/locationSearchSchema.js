const { z } = require("zod");

const locationSearchRequestSchema = z.object({
  query: z.string().min(1, "Query is required"),
});

module.exports = { locationSearchRequestSchema };

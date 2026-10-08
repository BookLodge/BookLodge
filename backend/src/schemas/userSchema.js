const { z } = require("zod");

const getUserParams = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid user id"),
});

module.exports = getUserParams;

const { z } = require("zod");

const getUserParams = z.coerce.number( ).int( );

module.exports = getUserParams;

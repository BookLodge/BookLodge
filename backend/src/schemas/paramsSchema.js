const { z } = require("zod");

const userParams = z.coerce( ).number( ).int( ).optional( );

module.exports = userParams;

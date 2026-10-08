const { randomUUID } = require("node:crypto");

const generateClientReference = () => `BL-${randomUUID()}`;

module.exports = { generateClientReference };

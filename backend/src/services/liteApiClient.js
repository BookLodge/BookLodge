const axios = require("axios");
const env = require("../config/env");

const liteApiClient = axios.create({
  baseURL: env.LITEAPI_BASE_URL,
  headers: {
    "X-API-Key": env.LITEAPI_KEY,
  },
});

module.exports = liteApiClient;

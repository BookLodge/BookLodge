const liteApiClient = require("./liteApiClient");

/**
 * BookLodge-facing boundary for LiteAPI. Everything provider-specific stays
 * here, so callers never touch LiteAPI endpoints, formats or credentials.
 */
class LiteApiService {
  constructor(client = liteApiClient) {
    this.http = client;
  }
}

const liteApiService = new LiteApiService();

module.exports = { LiteApiService, liteApiService };

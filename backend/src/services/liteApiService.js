const liteApiClient = require("./liteApiClient");
const { mapHotelSearchRequest, mapHotelSearchResponse } = require("./hotelSearchMapper");
const { AppError, ExternalAPIError } = require("../errors");
const {
  liteApiHotelSearchRequestSchema,
  liteApiHotelSearchResponseSchema,
  hotelSearchResponseSchema,
} = require("../schemas/hotelSearchSchema");

const toClientStatus = (providerStatus) => (providerStatus === 404 ? 404 : 502);

/**
 * BookLodge-facing boundary for LiteAPI. Everything provider-specific stays
 * here, so callers never touch LiteAPI endpoints, formats or credentials.
 */
class LiteApiService {
  constructor(client = liteApiClient) {
    this.http = client;
  }

  async searchHotels(search) {
    const requestResult = liteApiHotelSearchRequestSchema.safeParse(mapHotelSearchRequest(search));
    if (!requestResult.success) {
      throw new AppError("Invalid hotel search request", 400);
    }

    let response;
    try {
      response = await this.http.post("/hotels/rates", requestResult.data);
    } catch (err) {
      const providerStatus = err.response?.status;
      console.error(
        "[liteApi] Hotel search request failed:",
        err.message,
        providerStatus,
        err.response?.data?.error
      );
      throw new ExternalAPIError("Hotel search failed", toClientStatus(providerStatus));
    }

    if (response.data?.error) {
      console.error("[liteApi] LiteAPI rejected the hotel search request:", response.data.error);
      throw new ExternalAPIError(
        "Hotel search failed",
        toClientStatus(response.status ?? response.data.error.code)
      );
    }

    const responseResult = liteApiHotelSearchResponseSchema.safeParse(response.data);
    if (!responseResult.success) {
      throw new ExternalAPIError("Hotel search failed");
    }

    const mappedResult = hotelSearchResponseSchema.safeParse(
      mapHotelSearchResponse(responseResult.data)
    );
    if (!mappedResult.success) {
      throw new AppError("Failed to build the hotel search response", 500);
    }

    return mappedResult.data;
  }
}

const liteApiService = new LiteApiService();

module.exports = { LiteApiService, liteApiService };

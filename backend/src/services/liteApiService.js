const liteApiClient = require("./liteApiClient");
const { mapHotelSearchRequest, mapHotelSearchResponse } = require("./hotelSearchMapper");
const { mapHotelDetailsResponse } = require("./hotelDetailsMapper");
const { AppError, ExternalAPIError } = require("../errors");
const {
  liteApiHotelSearchRequestSchema,
  liteApiHotelSearchResponseSchema,
  hotelSearchResponseSchema,
} = require("../schemas/hotelSearchSchema");
const {
  hotelDetailsRequestSchema,
  liteApiHotelDetailsResponseSchema,
  hotelDetailsResponseSchema,
} = require("../schemas/hotelDetailsSchema");

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

  async getHotelDetails(hotelId, rateCriteria) {
    const criteriaResult = hotelDetailsRequestSchema.safeParse(rateCriteria);
    if (!criteriaResult.success) {
      throw new AppError("Invalid hotel details request", 400);
    }

    let detailsResponse;
    try {
      detailsResponse = await this.http.get("/data/hotel", { params: { hotelId } });
    } catch (err) {
      const providerStatus = err.response?.status;
      console.error(
        "[liteApi] Hotel details request failed:",
        err.message,
        providerStatus,
        err.response?.data?.error
      );
      throw new ExternalAPIError("Hotel details failed", toClientStatus(providerStatus));
    }

    if (detailsResponse.data?.error) {
      console.error("[liteApi] LiteAPI rejected the hotel details request:", detailsResponse.data.error);
      throw new ExternalAPIError(
        "Hotel details failed",
        toClientStatus(detailsResponse.status ?? detailsResponse.data.error.code)
      );
    }

    const detailsResult = liteApiHotelDetailsResponseSchema.safeParse(detailsResponse.data);
    if (!detailsResult.success) {
      throw new ExternalAPIError("Hotel details failed");
    }

    const ratesRequest = {
      hotelIds: [hotelId],
      checkin: criteriaResult.data.checkin,
      checkout: criteriaResult.data.checkout,
      occupancies: criteriaResult.data.occupancies,
      currency: criteriaResult.data.currency,
      guestNationality: criteriaResult.data.guestNationality,
      includeHotelData: true,
    };

    let ratesResponse;
    try {
      ratesResponse = await this.http.post("/hotels/rates", ratesRequest);
    } catch (err) {
      const providerStatus = err.response?.status;
      console.error(
        "[liteApi] Hotel rates request failed:",
        err.message,
        providerStatus,
        err.response?.data?.error
      );
      throw new ExternalAPIError("Hotel details failed", toClientStatus(providerStatus));
    }

    if (ratesResponse.data?.error) {
      console.error("[liteApi] LiteAPI rejected the hotel rates request:", ratesResponse.data.error);
      throw new ExternalAPIError(
        "Hotel details failed",
        toClientStatus(ratesResponse.status ?? ratesResponse.data.error.code)
      );
    }

    const ratesResult = liteApiHotelSearchResponseSchema.safeParse(ratesResponse.data);
    if (!ratesResult.success) {
      throw new ExternalAPIError("Hotel details failed");
    }

    const mappedResult = hotelDetailsResponseSchema.safeParse(
      mapHotelDetailsResponse(detailsResult.data, ratesResult.data)
    );
    if (!mappedResult.success) {
      throw new AppError("Failed to build the hotel details response", 500);
    }

    return mappedResult.data;
  }
}

const liteApiService = new LiteApiService();

module.exports = { LiteApiService, liteApiService };

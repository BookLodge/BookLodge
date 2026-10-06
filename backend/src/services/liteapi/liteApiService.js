const liteApiClient = require("./liteApiClient");
const { mapHotelSearchRequest, mapHotelSearchResponse } = require("./mappers/hotelSearchMapper");
const { mapHotelDetailsResponse } = require("./mappers/hotelDetailsMapper");
const { mapLocationSearchResponse } = require("./mappers/locationSearchMapper");
const { mapPrebookResponse } = require("./mappers/prebookMapper");
const { mapBookRateRequest, mapBookRateResponse } = require("./mappers/bookRateMapper");
const { AppError, ExternalAPIError } = require("../../errors");
const { bookRateRequestSchema } = require("../../schemas/bookRateSchema");
const { hotelDetailsRequestSchema } = require("../../schemas/hotelDetailsSchema");
const { locationSearchRequestSchema } = require("../../schemas/locationSearchSchema");
const { prebookSchema } = require("../../schemas/prebookSchema");
const {
  liteApiHotelSearchRequestSchema,
  liteApiHotelSearchResponseSchema,
  hotelSearchResponseSchema,
} = require("./schemas/hotelSearchSchema");
const {
  liteApiHotelDetailsResponseSchema,
  hotelDetailsResponseSchema,
} = require("./schemas/hotelDetailsSchema");
const {
  liteApiPlacesResponseSchema,
  locationSearchResponseSchema,
} = require("./schemas/locationSearchSchema");
const {
  liteApiPrebookResponseSchema,
  prebookResponseSchema,
} = require("./schemas/prebookSchema");
const {
  liteApiBookRateRequestSchema,
  liteApiBookRateResponseSchema,
  bookRateResponseSchema,
} = require("./schemas/bookRateSchema");

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

  async searchLocations(query) {
    const requestResult = locationSearchRequestSchema.safeParse({ query });
    if (!requestResult.success) {
      throw new AppError("Invalid location search request", 400);
    }

    let response;
    try {
      response = await this.http.get("/data/places", {
        params: { textQuery: requestResult.data.query },
      });
    } catch (err) {
      const providerStatus = err.response?.status;
      console.error(
        "[liteApi] Location search request failed:",
        err.message,
        providerStatus,
        err.response?.data?.error
      );
      throw new ExternalAPIError("Location search failed", toClientStatus(providerStatus));
    }

    if (response.data?.error) {
      console.error("[liteApi] LiteAPI rejected the location search request:", response.data.error);
      throw new ExternalAPIError(
        "Location search failed",
        toClientStatus(response.status ?? response.data.error.code)
      );
    }

    const responseResult = liteApiPlacesResponseSchema.safeParse(response.data);
    if (!responseResult.success) {
      throw new ExternalAPIError("Location search failed");
    }

    const mappedResult = locationSearchResponseSchema.safeParse(
      mapLocationSearchResponse(responseResult.data)
    );
    if (!mappedResult.success) {
      throw new AppError("Failed to build the location search response", 500);
    }

    return mappedResult.data;
  }

  async prebook(request) {
    const requestResult = prebookSchema.safeParse(request);
    if (!requestResult.success) {
      throw new AppError("Invalid prebook request", 400);
    }

    let response;
    try {
      response = await this.http.post("/rates/prebook", {
        offerId: requestResult.data.offerId,
        usePaymentSdk: true,
      });
    } catch (err) {
      const providerStatus = err.response?.status;
      console.error(
        "[liteApi] Prebook request failed:",
        err.message,
        providerStatus,
        err.response?.data?.error
      );
      throw new ExternalAPIError("Prebooking failed", toClientStatus(providerStatus));
    }

    if (response.data?.error) {
      console.error("[liteApi] LiteAPI rejected the prebook request:", response.data.error);
      throw new ExternalAPIError(
        "Prebooking failed",
        toClientStatus(response.status ?? response.data.error.code)
      );
    }

    const responseResult = liteApiPrebookResponseSchema.safeParse(response.data);
    if (!responseResult.success) {
      throw new ExternalAPIError("Prebooking failed");
    }

    const mappedResult = prebookResponseSchema.safeParse(mapPrebookResponse(responseResult.data));
    if (!mappedResult.success) {
      throw new AppError("Failed to build the prebook response", 500);
    }

    return mappedResult.data;
  }

  async bookRate(params) {
    const requestResult = bookRateRequestSchema.safeParse(params);
    if (!requestResult.success) {
      throw new AppError("Invalid book rate request", 400);
    }

    const providerRequestResult = liteApiBookRateRequestSchema.safeParse(
      mapBookRateRequest(requestResult.data)
    );
    if (!providerRequestResult.success) {
      throw new AppError("Invalid book rate request", 400);
    }

    let response;
    try {
      response = await this.http.post("/rates/book", providerRequestResult.data);
    } catch (err) {
      const providerStatus = err.response?.status;
      console.error(
        "[liteApi] Book rate request failed:",
        err.message,
        providerStatus,
        err.response?.data?.error
      );
      throw new ExternalAPIError("Booking failed", toClientStatus(providerStatus));
    }

    if (response.data?.error) {
      console.error("[liteApi] LiteAPI rejected the book rate request:", response.data.error);
      throw new ExternalAPIError(
        "Booking failed",
        toClientStatus(response.status ?? response.data.error.code)
      );
    }

    const responseResult = liteApiBookRateResponseSchema.safeParse(response.data);
    if (!responseResult.success) {
      throw new ExternalAPIError("Booking failed");
    }

    const mappedResult = bookRateResponseSchema.safeParse(mapBookRateResponse(responseResult.data));
    if (!mappedResult.success) {
      throw new AppError("Failed to build the booking response", 500);
    }

    return mappedResult.data;
  }
}

const liteApiService = new LiteApiService();

module.exports = { LiteApiService, liteApiService };

const liteApiClient = require("./liteApiClient");
const { mapHotelSearchRequest, mapHotelSearchResponse } = require("./mappers/hotelSearchMapper");
const { mapHotelDetailsResponse } = require("./mappers/hotelDetailsMapper");
const { mapLocationSearchResponse } = require("./mappers/locationSearchMapper");
const { mapPrebookResponse } = require("./mappers/prebookMapper");
const { mapBookRateRequest, mapBookRateResponse } = require("./mappers/bookRateMapper");
const { mapCancelBookingResponse } = require("./mappers/cancelBookingMapper");
const { AppError, ExternalAPIError } = require("../../errors");
const { buildProviderInfo, isAmbiguous, toClientStatus } = require("./errors");
const { planRetry, retryAfterMs } = require("./retryPolicy");
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
const {
  liteApiCancelBookingResponseSchema,
  cancelBookingResponseSchema,
} = require("./schemas/cancelBookingSchema");

/**
 * BookLodge-facing boundary for LiteAPI. Everything provider-specific stays
 * here, so callers never touch LiteAPI endpoints, formats or credentials.
 */
class LiteApiService {
  constructor(client = liteApiClient, { sleep } = {}) {
    this.http = client;
    this.sleep = sleep ?? ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
  }

  /**
   * The single place a LiteAPI call is made and a LiteAPI failure is translated. `operation`
   * names the call for the retry and ambiguity policy; `send` is the actual HTTP call.
   */
  async callProvider(operation, message, send) {
    for (let attempt = 1; ; attempt += 1) {
      try {
        const response = await send();

        if (!response.data?.error) {
          return response.data;
        }

        const provider = buildProviderInfo(response.data, response.status);
        const plan = planRetry({ operation, transportFailure: false, provider, attempt });

        if (plan.retry) {
          console.error(`[liteApi] retrying ${operation} after ${plan.reason}, in ${plan.delayMs}ms`);
          await this.sleep(plan.delayMs);
          continue;
        }

        console.error(`[liteApi] LiteAPI rejected the ${operation} request:`, provider);

        throw new ExternalAPIError(message, toClientStatus(response.status), {
          provider,
          ambiguous: isAmbiguous(operation, false, provider),
        });
      } catch (err) {
        if (err instanceof ExternalAPIError) {
          throw err;
        }

        const httpStatus = err.response?.status;
        const provider = buildProviderInfo(err.response?.data, httpStatus);
        // Axios rejects on any non-2xx, so a response present means the provider did answer:
        // only the absence of one is a transport failure.
        const transportFailure = !err.response;
        const plan = planRetry({
          operation,
          transportFailure,
          provider,
          attempt,
          retryAfter: retryAfterMs(err.response?.headers),
        });

        if (plan.retry) {
          console.error(`[liteApi] retrying ${operation} after ${plan.reason}, in ${plan.delayMs}ms`);
          await this.sleep(plan.delayMs);
          continue;
        }

        console.error(`[liteApi] ${message}:`, err.message, httpStatus, provider);

        throw new ExternalAPIError(message, toClientStatus(httpStatus), {
          provider,
          ambiguous: isAmbiguous(operation, transportFailure, provider),
        });
      }
    }
  }

  async searchHotels(search) {
    const requestResult = liteApiHotelSearchRequestSchema.safeParse(mapHotelSearchRequest(search));
    if (!requestResult.success) {
      throw new AppError("Invalid hotel search request", 400);
    }

    const response = await this.callProvider("hotelSearch", "Hotel search failed", () =>
      this.http.post("/hotels/rates", requestResult.data)
    );

    const responseResult = liteApiHotelSearchResponseSchema.safeParse(response);
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

    const details = await this.callProvider("hotelDetails", "Hotel details failed", () =>
      this.http.get("/data/hotel", { params: { hotelId } })
    );

    const detailsResult = liteApiHotelDetailsResponseSchema.safeParse(details);
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

    const rates = await this.callProvider("hotelDetails", "Hotel details failed", () =>
      this.http.post("/hotels/rates", ratesRequest)
    );

    const ratesResult = liteApiHotelSearchResponseSchema.safeParse(rates);
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

    const response = await this.callProvider("locationSearch", "Location search failed", () =>
      this.http.get("/data/places", { params: { textQuery: requestResult.data.query } })
    );

    const responseResult = liteApiPlacesResponseSchema.safeParse(response);
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

    const response = await this.callProvider("prebook", "Prebooking failed", () =>
      this.http.post("/rates/prebook", {
        offerId: requestResult.data.offerId,
        usePaymentSdk: true,
      })
    );

    const responseResult = liteApiPrebookResponseSchema.safeParse(response);
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

    const response = await this.callProvider("bookRate", "Booking failed", () =>
      this.http.post("/rates/book", providerRequestResult.data)
    );

    const responseResult = liteApiBookRateResponseSchema.safeParse(response);
    if (!responseResult.success) {
      throw new ExternalAPIError("Booking failed");
    }

    const mappedResult = bookRateResponseSchema.safeParse(mapBookRateResponse(responseResult.data));
    if (!mappedResult.success) {
      throw new AppError("Failed to build the booking response", 500);
    }

    return mappedResult.data;
  }

  async cancelBooking(bookingId) {
    const response = await this.callProvider("cancelBooking", "Cancelling the booking failed", () =>
      this.http.put(`/bookings/${bookingId}`)
    );

    const responseResult = liteApiCancelBookingResponseSchema.safeParse(response);
    if (!responseResult.success) {
      throw new ExternalAPIError("Cancelling the booking failed");
    }

    const mappedResult = cancelBookingResponseSchema.safeParse(
      mapCancelBookingResponse(responseResult.data)
    );
    if (!mappedResult.success) {
      throw new AppError("Failed to build the cancel booking response", 500);
    }

    return mappedResult.data;
  }
}

const liteApiService = new LiteApiService();

module.exports = { LiteApiService, liteApiService };

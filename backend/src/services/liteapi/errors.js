// LiteAPI answers a rejected request with { error: { code, message, description } } in the body.
const buildProviderInfo = (data, httpStatus) => {
  const error = data?.error;

  if (!error) {
    return null;
  }

  return {
    code: error.code ?? null,
    message: error.message ?? null,
    description: error.description ?? null,
    httpStatus: httpStatus ?? null,
  };
};

// LiteAPI's error codes are not HTTP statuses: the docs say to match on `code`, and the two
// numbers mean different things. Only a real 404 stays a 404.
const toClientStatus = (httpStatus) => (httpStatus === 404 ? 404 : 502);

const OPERATION_CLASS = {
  hotelSearch: "READ",
  hotelDetails: "READ",
  locationSearch: "READ",
  prebook: "EXPIRING_WRITE",
  bookRate: "STATE_CHANGING",
  cancelBooking: "STATE_CHANGING",
};

// The provider gave up without telling us whether the booking went through.
const AMBIGUOUS_CODES = new Set([2013, 2014, 5000]);

const isAmbiguous = (operation, transportFailure, provider) => {
  const operationClass = OPERATION_CLASS[operation];

  if (transportFailure) {
    return operationClass !== "READ";
  }

  return operationClass === "STATE_CHANGING" && AMBIGUOUS_CODES.has(provider?.code);
};

module.exports = { buildProviderInfo, isAmbiguous, toClientStatus, OPERATION_CLASS };

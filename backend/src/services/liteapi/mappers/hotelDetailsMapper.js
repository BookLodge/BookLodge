const toBookLodgeRate = (offerId, rate) => ({
  offerId,
  occupancyNumber: rate.occupancyNumber,
  roomName: rate.name,
  boardName: rate.boardName,
  amount: rate.retailRate.total[0].amount,
  currency: rate.retailRate.total[0].currency,
  refundable: rate.cancellationPolicies.refundableTag === "RFN",
});

const mapRates = (entry) => {
  const rates = [];

  for (const roomType of entry.roomTypes) {
    for (const rate of roomType.rates) {
      if (rate.retailRate.total.length === 0) continue;
      rates.push(toBookLodgeRate(roomType.offerId, rate));
    }
  }

  return rates;
};

const mapHotelDetailsResponse = (hotelDetailsResponse, hotelRatesResponse) => {
  const { data } = hotelDetailsResponse;
  const ratesEntry = hotelRatesResponse.data.find((entry) => entry.hotelId === data.id);

  return {
    id: data.id,
    name: data.name,
    description: data.hotelDescription,
    photo: data.main_photo,
    address: data.address,
    city: data.city,
    country: data.country,
    rating: data.starRating,
    location: {
      latitude: data.location.latitude,
      longitude: data.location.longitude,
    },
    facilities: data.hotelFacilities,
    checkin: data.checkinCheckoutTimes.checkin_start,
    checkout: data.checkinCheckoutTimes.checkout,
    rates: ratesEntry ? mapRates(ratesEntry) : [],
  };
};

module.exports = { mapHotelDetailsResponse };
